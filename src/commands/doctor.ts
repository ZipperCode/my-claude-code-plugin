import chalk from 'chalk';
import { log } from '../utils/logger.js';
import { detectTools, detectMcpServers } from '../core/detector.js';
import { isCommandAvailable, exec } from '../utils/shell.js';

export async function doctorCommand(): Promise<void> {
  log.header('Maestro — 环境诊断');

  let issues = 0;
  let warnings = 0;

  // 1. Node.js version
  console.log(chalk.bold('  运行时：'));
  const nodeVersion = process.version;
  const major = parseInt(nodeVersion.slice(1));
  if (major >= 18) {
    console.log(`    ${chalk.green('✅')} Node.js ${nodeVersion}`);
  } else {
    console.log(`    ${chalk.red('❌')} Node.js ${nodeVersion}（需要 >= 18）`);
    issues++;
  }

  // Claude Code
  if (isCommandAvailable('claude')) {
    const claudeV = exec('claude --version 2>/dev/null');
    console.log(`    ${chalk.green('✅')} Claude Code ${claudeV.success ? claudeV.stdout : ''}`);
  } else {
    console.log(`    ${chalk.red('❌')} 未找到 Claude Code`);
    issues++;
  }

  // 2. CLI Tools
  console.log('');
  console.log(chalk.bold('  CLI 工具：'));
  const tools = detectTools();
  for (const tool of tools) {
    const icon = tool.installed ? chalk.green('✅') : (tool.required ? chalk.red('❌') : chalk.yellow('⚠️ '));
    const status = tool.installed
      ? chalk.green(`已安装${tool.version ? `（${tool.version}）` : ''}`)
      : (tool.required ? chalk.red('未找到') : chalk.yellow('可选，未找到'));
    console.log(`    ${icon} ${tool.name.padEnd(15)} ${status}`);
    if (!tool.installed) {
      if (tool.required) issues++;
      else warnings++;
      console.log(chalk.dim(`       安装命令：${tool.installCmd}`));
    }
  }

  // 3. MCP Servers
  console.log('');
  console.log(chalk.bold('  MCP 服务器：'));
  const servers = detectMcpServers();
  for (const server of servers) {
    const icon = server.configured ? chalk.green('✅') : (server.recommended ? chalk.yellow('⚠️ ') : chalk.dim('○ '));
    const status = server.configured
      ? chalk.green('已配置')
      : (server.recommended ? chalk.yellow('未配置') : chalk.dim('可选'));
    console.log(`    ${icon} ${server.name.padEnd(25)} ${status}`);
    if (!server.configured && server.recommended) {
      warnings++;
      console.log(chalk.dim(`       添加命令：${server.addCmd}`));
    }
  }

  // 4. Git
  console.log('');
  console.log(chalk.bold('  Git：'));
  if (isCommandAvailable('git')) {
    const gitV = exec('git --version');
    console.log(`    ${chalk.green('✅')} ${gitV.stdout}`);
    const isRepo = exec('git rev-parse --is-inside-work-tree 2>/dev/null');
    if (isRepo.success) {
      console.log(`    ${chalk.green('✅')} 在 git 仓库内`);
    } else {
      console.log(`    ${chalk.yellow('⚠️ ')} 不在 git 仓库内`);
      warnings++;
    }
  } else {
    console.log(`    ${chalk.red('❌')} 未找到 git`);
    issues++;
  }

  // Summary
  console.log('');
  console.log(chalk.bold('─'.repeat(52)));
  if (issues === 0 && warnings === 0) {
    log.success('环境已完全就绪！');
  } else if (issues === 0) {
    log.warn(`${warnings} 个警告 — Maestro 可以工作，但部分功能可能受限。`);
  } else {
    log.error(`${issues} 个问题，${warnings} 个警告 — 请在使用 Maestro 前解决问题。`);
  }
}
