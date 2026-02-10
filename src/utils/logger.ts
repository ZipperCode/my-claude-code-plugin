import chalk from 'chalk';

export const log = {
  info: (msg: string) => console.log(chalk.blue('ℹ'), msg),
  success: (msg: string) => console.log(chalk.green('✅'), msg),
  warn: (msg: string) => console.log(chalk.yellow('⚠️'), msg),
  error: (msg: string) => console.error(chalk.red('❌'), msg),
  step: (num: number, msg: string) => console.log(chalk.cyan(`  步骤 ${num}：`), msg),
  dim: (msg: string) => console.log(chalk.dim(msg)),

  header: (title: string) => {
    const line = '─'.repeat(50);
    console.log('');
    console.log(chalk.bold.magenta(`┌${line}┐`));
    console.log(chalk.bold.magenta('│') + chalk.bold(` 🎭 ${title}`.padEnd(50)) + chalk.bold.magenta('│'));
    console.log(chalk.bold.magenta(`└${line}┘`));
    console.log('');
  },

  table: (rows: Array<{ label: string; status: 'ok' | 'missing' | 'optional' | 'configured'; detail?: string }>) => {
    for (const row of rows) {
      const icon =
        row.status === 'ok' ? chalk.green('✅') :
        row.status === 'configured' ? chalk.green('✅') :
        row.status === 'optional' ? chalk.yellow('⚠️ ') :
        chalk.red('❌');
      const statusText =
        row.status === 'ok' ? chalk.green('已安装') :
        row.status === 'configured' ? chalk.green('已配置') :
        row.status === 'optional' ? chalk.yellow('可选，未找到') :
        chalk.red('未找到');
      const detail = row.detail ? chalk.dim(` (${row.detail})`) : '';
      console.log(`  ${icon} ${row.label.padEnd(20)} ${statusText}${detail}`);
    }
  },

  report: (title: string, items: string[]) => {
    console.log('');
    console.log(chalk.bold(title));
    for (const item of items) {
      console.log(`  • ${item}`);
    }
  },

  dryRun: (action: string) => {
    console.log(chalk.dim(`  [预演] ${action}`));
  },
};
