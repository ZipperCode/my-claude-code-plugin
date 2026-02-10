import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import { readJson, writeJson } from '../utils/json.js';
import { exists } from '../utils/fs.js';

const __filename_version = fileURLToPath(import.meta.url);
const __dirname_version = dirname(__filename_version);

export interface Manifest {
  version: string;
  installedAt: string;
  updatedAt: string;
  files: {
    skills: string[];
    agents: string[];
    hooks: string[];
    rules?: string[];
  };
}

const MANIFEST_PATH = '.maestro/manifest.json';

/**
 * Read the current manifest from project directory.
 */
export function readManifest(projectDir: string): Manifest | null {
  return readJson<Manifest>(join(projectDir, MANIFEST_PATH));
}

/**
 * Write manifest to project directory.
 */
export function writeManifest(projectDir: string, manifest: Manifest): void {
  writeJson(join(projectDir, MANIFEST_PATH), manifest);
}

/**
 * Check if Maestro is already installed.
 */
export function isInstalled(projectDir: string): boolean {
  return exists(join(projectDir, MANIFEST_PATH));
}

/**
 * Create a new manifest for fresh installation.
 */
export function createManifest(version: string, files: Manifest['files']): Manifest {
  const now = new Date().toISOString();
  return {
    version,
    installedAt: now,
    updatedAt: now,
    files,
  };
}

/**
 * Update manifest for an update operation.
 */
export function updateManifest(existing: Manifest, version: string, files: Manifest['files']): Manifest {
  return {
    ...existing,
    version,
    updatedAt: new Date().toISOString(),
    files,
  };
}

/**
 * Get the package version from the CLI's own package.json.
 */
export function getPackageVersion(): string {
  try {
    const pkg = JSON.parse(readFileSync(join(__dirname_version, '..', '..', 'package.json'), 'utf-8'));
    return pkg.version;
  } catch {
    return '0.0.0';
  }
}
