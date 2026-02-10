import { execSync, ExecSyncOptions } from 'child_process';

export interface ShellResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
}

/**
 * Execute a shell command and return structured result.
 */
export function exec(cmd: string, options?: ExecSyncOptions): ShellResult {
  try {
    const result = execSync(cmd, {
      encoding: 'utf-8',
      timeout: 30000,
      stdio: ['pipe', 'pipe', 'pipe'],
      ...options,
    });
    const stdout = String(result).trim();
    return { success: true, stdout, stderr: '', exitCode: 0 };
  } catch (err: any) {
    return {
      success: false,
      stdout: (err.stdout || '').trim(),
      stderr: (err.stderr || '').trim(),
      exitCode: err.status ?? 1,
    };
  }
}

/**
 * Check if a CLI tool is available via `command -v`.
 */
export function isCommandAvailable(cmd: string): boolean {
  return exec(`command -v ${cmd}`).success;
}

/**
 * Execute a command with real-time output to stdout/stderr.
 */
export function execLive(cmd: string, cwd?: string): boolean {
  try {
    execSync(cmd, {
      cwd,
      stdio: 'inherit',
      timeout: 120000,
    });
    return true;
  } catch {
    return false;
  }
}
