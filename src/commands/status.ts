import { join } from 'path';
import chalk from 'chalk';
import { log } from '../utils/logger.js';
import { exists } from '../utils/fs.js';
import { isInstalled, readManifest, getPackageVersion } from '../core/version.js';
import { readJson } from '../utils/json.js';
import { exec } from '../utils/shell.js';

interface StatusOptions {
  checkUpdate?: boolean;
  verify?: boolean;
}

export async function statusCommand(options: StatusOptions): Promise<void> {
  const projectDir = process.cwd();

  log.header('Maestro — 状态');

  if (!isInstalled(projectDir)) {
    log.error('Maestro 未在此项目中安装。');
    log.info('请运行 `maestro init` 安装。');
    process.exit(1);
  }

  const manifest = readManifest(projectDir)!;
  const cliVersion = getPackageVersion();

  // Version info
  console.log(chalk.bold('  版本：'));
  console.log(`    已安装：${chalk.green(manifest.version)}`);
  console.log(`    CLI：  ${chalk.cyan(cliVersion)}`);
  if (manifest.version !== cliVersion) {
    log.warn('版本不匹配 — 请运行 `maestro update`');
  }

  // Installation dates
  console.log('');
  console.log(chalk.bold('  时间线：'));
  console.log(`    安装于：${manifest.installedAt}`);
  console.log(`    更新于：${manifest.updatedAt}`);

  // File counts
  console.log('');
  console.log(chalk.bold('  托管文件：'));
  console.log(`    技能：  ${manifest.files.skills.length}`);
  console.log(`    智能体：${manifest.files.agents.length}`);
  console.log(`    钩子：  ${manifest.files.hooks.length}`);
  if (manifest.files.rules) {
    console.log(`    规则：  ${manifest.files.rules.length}`);
  }

  // Config info
  const config = readJson(join(projectDir, '.maestro', 'config.json'));
  if (config) {
    console.log('');
    console.log(chalk.bold('  配置：'));
    console.log(`    策略：${config.policy?.preset || '未知'}`);
    console.log(`    Codex：${config.tools?.codex ? chalk.green('已启用') : chalk.dim('已禁用')}`);
    console.log(`    Gemini：${config.tools?.gemini ? chalk.green('已启用') : chalk.dim('已禁用')}`);
  }

  // Verify file integrity
  if (options.verify) {
    console.log('');
    console.log(chalk.bold('  文件完整性：'));
    let missing = 0;
    const allFiles = [
      ...manifest.files.skills,
      ...manifest.files.agents,
      ...manifest.files.hooks,
      ...(manifest.files.rules || []),
    ];
    for (const file of allFiles) {
      if (!exists(join(projectDir, file))) {
        log.error(`  缺失：${file}`);
        missing++;
      }
    }
    if (missing === 0) {
      log.success(`全部 ${allFiles.length} 个托管文件完好`);
    } else {
      log.warn(`缺少 ${missing} 个文件 — 请运行 \`maestro update --force\``);
    }
  }

  // Check for npm updates
  if (options.checkUpdate) {
    console.log('');
    log.info('正在检查更新...');
    const result = exec('npm view @zippercode/maestro version --registry=https://npm.pkg.github.com 2>/dev/null');
    if (result.success && result.stdout) {
      const latest = result.stdout.trim();
      if (latest !== cliVersion) {
        log.warn(`发现新版本：${chalk.green(latest)}（当前：${cliVersion}）`);
        console.log(chalk.dim('  运行：npm update -g @zippercode/maestro'));
      } else {
        log.success('CLI 已是最新版本');
      }
    } else {
      log.dim('  无法检查更新');
    }
  }
}
