import { join, dirname } from 'path';
import { readdirSync } from 'fs';
import { confirm } from '@inquirer/prompts';
import chalk from 'chalk';
import { log } from '../utils/logger.js';
import { exists, remove } from '../utils/fs.js';
import { readJson } from '../utils/json.js';
import { isInstalled, readManifest } from '../core/version.js';
import { removeHooks, removePermissions, removeClaudeMd, removeGitignore, removeUserLevelPermissions } from '../core/merger.js';
import { DIRS } from '../core/constants.js';
import { getAllPresetPermissions } from '../core/presets.js';

interface UninstallOptions {
  purge?: boolean;
  force?: boolean;
}

export async function uninstallCommand(options: UninstallOptions): Promise<void> {
  const projectDir = process.cwd();

  log.header('Maestro — 卸载');

  if (!isInstalled(projectDir)) {
    log.error('Maestro 未在此项目中安装。');
    process.exit(1);
  }

  const manifest = readManifest(projectDir)!;

  if (!options.force) {
    const proceed = await confirm({
      message: `确定从此项目移除 Maestro v${manifest.version}？`,
      default: false,
    });
    if (!proceed) {
      log.info('已取消卸载。');
      return;
    }
  }

  const actions: string[] = [];

  // Remove managed files (skills, agents, hooks)
  log.step(1, '正在移除托管文件...');
  let removed = 0;
  for (const file of [...manifest.files.skills, ...manifest.files.agents, ...manifest.files.hooks, ...(manifest.files.rules || [])]) {
    const fullPath = join(projectDir, file);
    if (exists(fullPath)) {
      remove(fullPath);
      removed++;
    }
  }
  actions.push(`已移除 ${removed} 个托管文件`);

  // Clean up empty skill directories
  for (const skillFile of manifest.files.skills) {
    const skillDir = dirname(join(projectDir, skillFile));
    try {
      if (exists(skillDir) && readdirSync(skillDir).length === 0) {
        remove(skillDir);
      }
    } catch { /* ignore */ }
  }

  // Remove hooks directory if empty
  const hooksDir = join(projectDir, DIRS.hooks);
  if (exists(hooksDir)) {
    try {
      if (readdirSync(hooksDir).length === 0) {
        remove(hooksDir);
      }
    } catch { /* ignore */ }
  }

  // Clean up empty parent directories (.claude/skills, .claude/agents, .claude/hooks)
  for (const dir of [
    join(projectDir, DIRS.skills),
    join(projectDir, DIRS.agents),
    join(projectDir, '.claude', 'hooks'),
    join(projectDir, '.claude'),
  ]) {
    try {
      if (exists(dir) && readdirSync(dir).length === 0) {
        remove(dir);
      }
    } catch { /* ignore */ }
  }

  // Remove hooks from settings.json
  log.step(2, '正在移除钩子配置...');
  removeHooks(projectDir);
  actions.push('已从 settings.json 移除 Maestro 钩子');

  // Remove permissions from settings.local.json
  log.step(3, '正在移除权限配置...');
  removePermissions(projectDir);
  actions.push('已从 settings.local.json 移除 Maestro 权限');

  // Step 3b: Optionally clean user-level permissions
  if (!options.force) {
    const cleanUserPerms = await confirm({
      message: '是否同时清理用户级权限？(~/.claude/settings.local.json)',
      default: false,
    });
    if (cleanUserPerms) {
      const allPerms = getAllPresetPermissions();
      removeUserLevelPermissions(allPerms);
      actions.push('已从用户级 ~/.claude/settings.local.json 移除 Maestro 权限');
    }
  }

  // Remove CLAUDE.md section
  log.step(4, '正在移除 CLAUDE.md 章节...');
  removeClaudeMd(projectDir);
  actions.push('已从 CLAUDE.md 移除 Maestro 章节');

  // Remove .gitignore entries
  log.step(5, '正在清理 .gitignore...');
  removeGitignore(projectDir);
  actions.push('已从 .gitignore 移除 Maestro 条目');

  // Remove manifest
  const manifestPath = join(projectDir, '.maestro', 'manifest.json');
  if (exists(manifestPath)) remove(manifestPath);

  // Purge option: remove all .maestro/ data
  if (options.purge) {
    log.step(6, '正在清除运行时数据...');
    const maestroDir = join(projectDir, '.maestro');
    if (exists(maestroDir)) {
      remove(maestroDir);
      actions.push('已清除 .maestro/ 目录');
    }
  }

  // Clean up empty .claude/ config files if they're empty/default
  cleanupEmptyConfigFiles(projectDir);

  console.log('');
  log.report('卸载摘要：', actions);
  console.log('');
  log.success('Maestro 已移除。');
  if (!options.purge) {
    console.log(chalk.dim('  运行时数据 (.maestro/) 已保留。使用 --purge 可一并移除。'));
  }
}

/**
 * Remove .claude/settings.json and settings.local.json if they contain
 * only empty structures after Maestro removal.
 */
function cleanupEmptyConfigFiles(projectDir: string): void {
  for (const file of ['settings.json', 'settings.local.json']) {
    const filePath = join(projectDir, '.claude', file);
    if (!exists(filePath)) continue;
    try {
      const content = readJson(filePath);
      if (!content) continue;
      // Check if file is effectively empty
      const isEmpty = Object.keys(content).every(key => {
        const val = content[key];
        if (val === null || val === undefined) return true;
        if (typeof val === 'object' && Object.keys(val).length === 0) return true;
        if (Array.isArray(val) && val.length === 0) return true;
        if (typeof val === 'object' && Object.values(val).every(
          v => (Array.isArray(v) && v.length === 0) || (typeof v === 'object' && v !== null && Object.keys(v).length === 0)
        )) return true;
        return false;
      });
      if (isEmpty) remove(filePath);
    } catch { /* ignore */ }
  }

  // Remove .claude/ if empty
  const claudeDir = join(projectDir, '.claude');
  try {
    if (exists(claudeDir) && readdirSync(claudeDir).length === 0) {
      remove(claudeDir);
    }
  } catch { /* ignore */ }
}
