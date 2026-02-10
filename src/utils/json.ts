import { readFileSync, writeFileSync } from 'fs';
import { existsSync } from 'fs';

/**
 * Safely read and parse a JSON file. Returns null if not found or invalid.
 */
export function readJson<T = any>(filePath: string): T | null {
  try {
    if (!existsSync(filePath)) return null;
    const content = readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

/**
 * Write an object as formatted JSON to a file.
 */
export function writeJson(filePath: string, data: any, indent = 2): void {
  writeFileSync(filePath, JSON.stringify(data, null, indent) + '\n', 'utf-8');
}

/**
 * Deep merge two objects. Arrays are replaced, not merged.
 */
export function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target };
  for (const key of Object.keys(source) as Array<keyof T>) {
    const val = source[key];
    if (val && typeof val === 'object' && !Array.isArray(val) && typeof result[key] === 'object' && !Array.isArray(result[key])) {
      result[key] = deepMerge(result[key] as any, val as any);
    } else if (val !== undefined) {
      result[key] = val as T[keyof T];
    }
  }
  return result;
}
