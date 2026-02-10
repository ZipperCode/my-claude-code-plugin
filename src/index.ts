#!/usr/bin/env node

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initCommand } from './commands/init.js';
import { updateCommand } from './commands/update.js';
import { uninstallCommand } from './commands/uninstall.js';
import { statusCommand } from './commands/status.js';
import { doctorCommand } from './commands/doctor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'));

const program = new Command();

program
  .name('maestro')
  .description('Maestro CLI — 为任何项目注入 AI 驱动的工作流编排（基于 Claude Code）')
  .version(pkg.version);

program
  .command('init')
  .description('在当前项目初始化 Maestro（交互式工具配置 + 文件注入）')
  .option('--force', '覆盖已有安装')
  .option('--with-rules', '同时安装语言特定编码规则')
  .option('--lang <language>', '指定规则语言 (ts|py|rust)')
  .option('--skip-tools', '跳过工具安装，仅注入 Maestro 文件')
  .option('--dry-run', '预览操作内容，不实际修改')
  .action(initCommand);

program
  .command('update')
  .description('更新 Maestro 到最新版本')
  .option('--force', '即使版本相同也强制更新')
  .option('--dry-run', '预览变更内容，不实际修改')
  .action(updateCommand);

program
  .command('uninstall')
  .description('从当前项目移除 Maestro')
  .option('--purge', '同时移除 .maestro/ 运行时数据')
  .option('--force', '跳过确认提示')
  .action(uninstallCommand);

program
  .command('status')
  .description('显示 Maestro 安装状态')
  .option('--check-update', '检查 npm 新版本')
  .option('--verify', '验证文件完整性')
  .action(statusCommand);

program
  .command('doctor')
  .description('运行环境诊断（独立于 Maestro 安装）')
  .action(doctorCommand);

program.parse();
