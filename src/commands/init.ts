import { join } from 'path';
import { checkbox, confirm, select, input } from '@inquirer/prompts';
import chalk from 'chalk';
import { log } from '../utils/logger.js';
import { execLive } from '../utils/shell.js';
import { exists } from '../utils/fs.js';
import { detectTools, detectMcpServers, detectWorkflowCommands, type ToolStatus, type McpStatus } from '../core/detector.js';
import { isInstalled, readManifest } from '../core/version.js';
import { installFiles, type InstallOptions } from '../core/installer.js';
import type { RuleLang } from '../core/constants.js';
import {
  detectProjectTypes,
  getAllProjectPresets,
  getBasePreset,
  resolvePermissions,
  type PermissionSelection,
  type PermissionScope,
} from '../core/presets.js';

interface InitOptions {
  force?: boolean;
  withRules?: boolean;
  lang?: string;
  skipTools?: boolean;
  dryRun?: boolean;
}

export async function initCommand(options: InitOptions): Promise<void> {
  const projectDir = process.cwd();

  log.header('Maestro — 项目初始化');

  // Pre-check: already installed?
  if (isInstalled(projectDir) && !options.force) {
    const manifest = readManifest(projectDir);
    log.warn(`Maestro v${manifest?.version} 已在此项目中安装。`);
    log.info('使用 --force 覆盖安装，或运行 `maestro update` 更新。');
    process.exit(1);
  }

  // ─── Phase A: Tool Environment Setup ───
  let permissionSelection: PermissionSelection | null = null;
  if (!options.skipTools) {
    permissionSelection = await phaseA(projectDir, options.dryRun ?? false);
  } else {
    log.info('已跳过工具配置 (--skip-tools)');
  }

  // ─── Phase B: File Injection ───
  console.log('');
  log.header('Maestro — 文件安装');

  const installOpts: InstallOptions = {
    projectDir,
    withRules: options.withRules ?? false,
    lang: options.lang as RuleLang | undefined,
    dryRun: options.dryRun ?? false,
    force: options.force ?? false,
    permissionSelection,
  };

  log.step(1, '检查安装目标...');
  const result = installFiles(installOpts);

  // ─── Report ───
  console.log('');
  if (result.errors.length > 0) {
    log.report('⚠️  警告：', result.errors);
  }

  log.report('✅ 安装摘要：', result.actions);

  console.log('');
  if (options.dryRun) {
    log.warn('预演完成 — 未修改任何文件。');
  } else {
    log.success('Maestro 安装成功！');
    console.log('');
    console.log(chalk.dim('  后续步骤：'));
    console.log(chalk.dim('  1. 重启 Claude Code 以加载新的 skills/agents'));
    console.log(chalk.dim('  2. 输入 /maestro-go 开始工作流'));
    console.log(chalk.dim('  3. 输入 /maestro-init 进行项目级配置'));
  }
}

// ─────────────────────────────────────────────────────────
// Phase A: Interactive Tool Environment Setup
// ─────────────────────────────────────────────────────────

async function phaseA(projectDir: string, dryRun: boolean): Promise<PermissionSelection> {
  // Step A1: Detect installed tools
  log.step(1, '检测已安装的工具...');
  const tools = detectTools();

  // Step A2: Display results
  console.log('');
  console.log(chalk.bold('  CLI 工具：'));
  log.table(tools.map(t => ({
    label: t.name,
    status: t.installed ? 'ok' : (t.required ? 'missing' : 'optional'),
    detail: t.installed ? t.version : t.description,
  })));

  // Step A2b: Ask which tools to install
  const missingTools = tools.filter(t => !t.installed);
  if (missingTools.length > 0) {
    console.log('');
    const toInstall = await selectToolsToInstall(missingTools);

    // Step A3: Execute installations
    if (toInstall.length > 0) {
      console.log('');
      log.step(3, '正在安装选中的工具...');
      for (const tool of toInstall) {
        console.log('');
        log.info(`正在安装 ${tool.name}：${chalk.dim(tool.installCmd)}`);
        if (!dryRun) {
          const success = execLive(tool.installCmd);
          if (success) {
            log.success(`${tool.name} 安装完成`);
          } else {
            log.error(`安装 ${tool.name} 失败 — 继续执行`);
          }
        } else {
          log.dryRun(tool.installCmd);
        }
      }
    }
  } else {
    log.success('所有 CLI 工具已安装');
  }

  // Step A4: MCP Server detection and configuration
  console.log('');
  log.step(4, '检测 MCP 服务器...');
  const mcpServers = detectMcpServers();

  console.log('');
  console.log(chalk.bold('  MCP 服务器：'));
  log.table(mcpServers.map(s => ({
    label: s.name,
    status: s.configured ? 'configured' : (s.recommended ? 'missing' : 'optional'),
    detail: s.description,
  })));

  const unconfigured = mcpServers.filter(s => !s.configured);
  if (unconfigured.length > 0) {
    console.log('');
    const toConfig = await selectMcpServers(unconfigured);

    if (toConfig.length > 0) {
      console.log('');
      for (const server of toConfig) {
        log.info(`正在配置 ${server.name}...`);
        if (!dryRun) {
          const success = execLive(server.addCmd);
          if (success) {
            log.success(`${server.name} 配置完成`);
          } else {
            log.error(`配置 ${server.name} 失败`);
          }
        } else {
          log.dryRun(server.addCmd);
        }
      }
    }
  } else {
    log.success('所有 MCP 服务器已配置');
  }

  // Step A5: Workflow command registration
  console.log('');
  log.step(5, '检查工作流命令...');
  const wfCmds = detectWorkflowCommands(projectDir);

  if (!wfCmds.specKit) {
    log.warn('未找到 spec-kit 命令。请运行：specify init --here --ai claude');
  }
  if (!wfCmds.openspec) {
    log.warn('未找到 openspec 命令。请运行：openspec init --tools claude');
  }
  if (wfCmds.specKit && wfCmds.openspec) {
    log.success('工作流命令已注册');
  }

  // Step A6: Permission preset configuration
  console.log('');
  log.step(6, '配置权限预设...');
  const permSelection = await configurePermissionPresets(projectDir);
  return permSelection;
}

async function selectToolsToInstall(missing: ToolStatus[]): Promise<ToolStatus[]> {
  const choices = missing.map(t => ({
    name: `${t.name}  ${chalk.dim(`(${t.installCmd})`)}`,
    value: t.name,
    checked: t.required,
  }));

  const selected = await checkbox({
    message: '选择要安装的工具：',
    choices,
  });

  return missing.filter(t => selected.includes(t.name));
}

async function selectMcpServers(unconfigured: McpStatus[]): Promise<McpStatus[]> {
  const choices = unconfigured.map(s => ({
    name: `${s.name}  ${chalk.dim(`(${s.description})`)}`,
    value: s.name,
    checked: s.recommended,
  }));

  const selected = await checkbox({
    message: '选择要配置的 MCP 服务器：',
    choices,
  });

  return unconfigured.filter(s => selected.includes(s.name));
}

// ─────────────────────────────────────────────────────────
// Step A6: Permission Preset Configuration
// ─────────────────────────────────────────────────────────

async function configurePermissionPresets(projectDir: string): Promise<PermissionSelection> {
  // 1. Detect project types
  const detected = detectProjectTypes(projectDir);
  const detectedIds = detected.map(d => d.type);

  if (detected.length > 0) {
    console.log('');
    console.log(chalk.bold('  🔍 检测到项目类型：'));
    for (const d of detected) {
      console.log(`    ${chalk.green('✅')} ${getPresetLabel(d.type).padEnd(16)} ${chalk.dim(`(发现 ${d.detectedBy})`)}`);
    }
  } else {
    console.log('');
    console.log(chalk.dim('  未检测到特定项目类型'));
  }

  console.log('');
  console.log(chalk.dim('  ℹ 基础预设将自动包含（文件操作、搜索、Git、MCP 通配符等）'));

  // 2. Select project presets
  const presets = getAllProjectPresets();
  const presetChoices = presets.map(p => ({
    name: `${p.label.padEnd(10)} ${chalk.dim(`(${p.description})`)}`,
    value: p.id,
    checked: detectedIds.includes(p.id as any),
  }));

  console.log('');
  const selectedPresetIds = await checkbox({
    message: '选择要启用的项目权限预设：',
    choices: presetChoices,
  });

  // 3. Custom permissions
  const customPermissions: string[] = [];
  console.log('');
  const wantCustom = await confirm({
    message: '是否添加自定义权限条目？',
    default: false,
  });

  if (wantCustom) {
    console.log(chalk.dim('  输入权限条目（如 "Bash(go:*)"），留空结束：'));
    let entering = true;
    while (entering) {
      const entry = await input({
        message: '权限条目：',
      });
      const trimmed = entry.trim();
      if (!trimmed) {
        entering = false;
      } else {
        customPermissions.push(trimmed);
      }
    }
  }

  // 4. Select scope
  console.log('');
  const scope = await select<PermissionScope>({
    message: '选择权限作用域：',
    choices: [
      {
        name: `项目级别 ${chalk.dim('(.claude/settings.local.json — 仅当前项目)')}`,
        value: 'project' as PermissionScope,
      },
      {
        name: `用户级别 ${chalk.dim('(~/.claude/settings.local.json — 所有项目)')}`,
        value: 'user' as PermissionScope,
      },
      {
        name: `两者都设置`,
        value: 'both' as PermissionScope,
      },
    ],
  });

  // 5. Resolve final permission lists
  const resolved = resolvePermissions(selectedPresetIds, customPermissions);

  const projectScope = (scope === 'project' || scope === 'both') ? resolved : [];
  const userScope = (scope === 'user' || scope === 'both') ? resolved : [];

  // 6. Summary
  console.log('');
  const baseCount = getBasePreset().permissions.length;
  const totalCount = resolved.length;
  const scopeLabel = scope === 'project' ? '项目级' : scope === 'user' ? '用户级' : '项目级 + 用户级';
  console.log(chalk.dim(`  ℹ 共计 ${totalCount} 个权限条目（基础 ${baseCount} + 扩展 ${totalCount - baseCount}）将写入${scopeLabel}设置`));

  return {
    presetIds: selectedPresetIds,
    customPermissions,
    scope,
    projectScope,
    userScope,
  };
}

function getPresetLabel(type: string): string {
  const labels: Record<string, string> = {
    nodejs: 'Node.js',
    python: 'Python',
    rust: 'Rust',
    general: '通用工具',
  };
  return labels[type] || type;
}
