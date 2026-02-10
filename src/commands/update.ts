import { join } from 'path';
import chalk from 'chalk';
import { log } from '../utils/logger.js';
import { exists, remove } from '../utils/fs.js';
import { isInstalled, readManifest, updateManifest, writeManifest, getPackageVersion } from '../core/version.js';
import { installFiles } from '../core/installer.js';

interface UpdateOptions {
  force?: boolean;
  dryRun?: boolean;
}

export async function updateCommand(options: UpdateOptions): Promise<void> {
  const projectDir = process.cwd();

  log.header('Maestro — 更新');

  if (!isInstalled(projectDir)) {
    log.error('Maestro 未在此项目中安装。请先运行 `maestro init`。');
    process.exit(1);
  }

  const manifest = readManifest(projectDir)!;
  const newVersion = getPackageVersion();

  log.info(`当前版本：${chalk.bold(manifest.version)}`);
  log.info(`包版本：${chalk.bold(newVersion)}`);

  if (manifest.version === newVersion && !options.force) {
    log.success('已是最新版本。');
    log.info('使用 --force 强制更新。');
    return;
  }

  // Remove old managed files (but preserve user data)
  log.step(1, '正在移除旧的托管文件...');
  if (!options.dryRun) {
    for (const file of [...manifest.files.skills, ...manifest.files.agents, ...manifest.files.hooks, ...(manifest.files.rules || [])]) {
      const fullPath = join(projectDir, file);
      if (exists(fullPath)) {
        remove(fullPath);
      }
    }
  }

  // Reinstall
  log.step(2, '正在安装新文件...');
  const result = installFiles({
    projectDir,
    withRules: (manifest.files.rules?.length ?? 0) > 0,
    dryRun: options.dryRun ?? false,
    force: true,
  });

  if (result.errors.length > 0) {
    log.report('警告：', result.errors);
  }

  // Update manifest
  if (!options.dryRun && result.manifest) {
    const updated = updateManifest(manifest, newVersion, result.manifest.files);
    writeManifest(projectDir, updated);
  }

  console.log('');
  if (options.dryRun) {
    log.warn('预演完成 — 未修改任何文件。');
  } else {
    log.success(`Maestro 已更新到 v${newVersion}`);
    console.log(chalk.dim('  请重启 Claude Code 以加载更改。'));
  }
}
