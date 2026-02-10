import {
  existsSync,
  mkdirSync,
  copyFileSync,
  readFileSync,
  writeFileSync,
  rmSync,
  readdirSync,
  statSync,
  chmodSync,
} from 'fs';
import { join, dirname } from 'path';

/**
 * Ensure a directory exists, creating parent dirs as needed.
 */
export function ensureDir(dirPath: string): void {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Copy a file, creating parent directories as needed.
 */
export function copyFile(src: string, dest: string): void {
  ensureDir(dirname(dest));
  copyFileSync(src, dest);
}

/**
 * Read a text file. Returns null if not found.
 */
export function readText(filePath: string): string | null {
  try {
    if (!existsSync(filePath)) return null;
    return readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

/**
 * Write text to a file, creating parent directories as needed.
 */
export function writeText(filePath: string, content: string): void {
  ensureDir(dirname(filePath));
  writeFileSync(filePath, content, 'utf-8');
}

/**
 * Remove a file or directory.
 */
export function remove(path: string): void {
  if (existsSync(path)) {
    rmSync(path, { recursive: true, force: true });
  }
}

/**
 * Make a file executable (chmod +x).
 */
export function makeExecutable(filePath: string): void {
  chmodSync(filePath, 0o755);
}

/**
 * Recursively copy a directory.
 */
export function copyDir(src: string, dest: string): void {
  ensureDir(dest);
  const entries = readdirSync(src);
  for (const entry of entries) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    if (statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFile(srcPath, destPath);
    }
  }
}

/**
 * List files in a directory (non-recursive).
 */
export function listFiles(dirPath: string): string[] {
  if (!existsSync(dirPath)) return [];
  return readdirSync(dirPath).filter(f => statSync(join(dirPath, f)).isFile());
}

/**
 * Check if a path exists.
 */
export function exists(path: string): boolean {
  return existsSync(path);
}
