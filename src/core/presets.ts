import { join } from 'path';
import { exists } from '../utils/fs.js';

// ─── Types ───────────────────────────────────────────────

export type ProjectType = 'nodejs' | 'python' | 'rust' | 'general';
export type PermissionScope = 'project' | 'user' | 'both';

export interface PermissionPreset {
  id: string;
  label: string;
  description: string;
  permissions: readonly string[];
  isBase?: boolean;
}

export interface PermissionSelection {
  presetIds: string[];
  customPermissions: string[];
  scope: PermissionScope;
  /** Final resolved list for project-level settings */
  projectScope: string[];
  /** Final resolved list for user-level settings */
  userScope: string[];
}

// ─── Base Preset (always included) ──────────────────────

const BASE_PRESET: PermissionPreset = {
  id: 'base',
  label: '基础',
  description: '搜索、文件操作、Git 基础、MCP 通配符',
  isBase: true,
  permissions: [
    // Web & MCP
    'WebSearch',
    'mcp__open-websearch__*',
    'mcp__context7__*',
    'mcp__sequential-thinking__*',
    // Bash basics
    'Bash(ls:*)',
    'Bash(cat:*)',
    'Bash(head:*)',
    'Bash(tail:*)',
    'Bash(find:*)',
    'Bash(grep:*)',
    'Bash(chmod:*)',
    'Bash(bash:*)',
    'Bash(curl:*)',
    'Bash(which:*)',
    'Bash(echo:*)',
    'Bash(mkdir:*)',
    'Bash(cp:*)',
    'Bash(mv:*)',
    'Bash(rm:*)',
    'Bash(touch:*)',
    'Bash(wc:*)',
    'Bash(sort:*)',
    'Bash(diff:*)',
    // Claude CLI
    'Bash(claude mcp:*)',
    // Git basics
    'Bash(git status:*)',
    'Bash(git diff:*)',
    'Bash(git log:*)',
    'Bash(git add:*)',
    'Bash(git commit:*)',
    'Bash(git branch:*)',
    'Bash(git checkout:*)',
    'Bash(git stash:*)',
    'Bash(git show:*)',
    'Bash(git rev-parse:*)',
    'Bash(git remote:*)',
    // WebFetch domains
    'WebFetch(domain:github.com)',
    'WebFetch(domain:deepwiki.com)',
    'WebFetch(domain:npmjs.com)',
    'WebFetch(domain:pypi.org)',
    'WebFetch(domain:crates.io)',
  ],
} as const;

// ─── Project-Type Presets ───────────────────────────────

const NODEJS_PRESET: PermissionPreset = {
  id: 'nodejs',
  label: 'Node.js',
  description: 'npm, yarn, pnpm, npx, tsc, eslint, prettier, vitest, jest, playwright, next, vite 等',
  permissions: [
    'Bash(npm:*)',
    'Bash(npx:*)',
    'Bash(yarn:*)',
    'Bash(pnpm:*)',
    'Bash(pnpx:*)',
    'Bash(node:*)',
    'Bash(tsc:*)',
    'Bash(tsx:*)',
    'Bash(ts-node:*)',
    'Bash(eslint:*)',
    'Bash(prettier:*)',
    'Bash(vitest:*)',
    'Bash(jest:*)',
    'Bash(playwright:*)',
    'Bash(next:*)',
    'Bash(vite:*)',
    'Bash(rollup:*)',
    'Bash(webpack:*)',
    'Bash(esbuild:*)',
    'Bash(turbo:*)',
    'Bash(biome:*)',
  ],
} as const;

const PYTHON_PRESET: PermissionPreset = {
  id: 'python',
  label: 'Python',
  description: 'pip, poetry, uv, pytest, ruff, mypy, black, python3, specify 等',
  permissions: [
    'Bash(python3:*)',
    'Bash(python:*)',
    'Bash(pip:*)',
    'Bash(pip3:*)',
    'Bash(poetry:*)',
    'Bash(uv:*)',
    'Bash(uvx:*)',
    'Bash(pytest:*)',
    'Bash(ruff:*)',
    'Bash(mypy:*)',
    'Bash(black:*)',
    'Bash(isort:*)',
    'Bash(flake8:*)',
    'Bash(pylint:*)',
    'Bash(specify:*)',
    'Bash(openspec:*)',
    'Bash(pdm:*)',
    'Bash(hatch:*)',
  ],
} as const;

const RUST_PRESET: PermissionPreset = {
  id: 'rust',
  label: 'Rust',
  description: 'cargo, rustc, rustup, rustfmt, clippy, rust-analyzer 等',
  permissions: [
    'Bash(cargo:*)',
    'Bash(rustc:*)',
    'Bash(rustup:*)',
    'Bash(rustfmt:*)',
    'Bash(cargo clippy:*)',
    'Bash(cargo test:*)',
    'Bash(cargo build:*)',
    'Bash(cargo run:*)',
    'Bash(cargo fmt:*)',
    'Bash(cargo check:*)',
    'Bash(cargo bench:*)',
    'Bash(cargo doc:*)',
    'Bash(cargo add:*)',
    'Bash(cargo remove:*)',
  ],
} as const;

const GENERAL_PRESET: PermissionPreset = {
  id: 'general',
  label: '通用工具',
  description: 'docker, make, cmake, ssh, wget, tar, zip, unzip, jq 等',
  permissions: [
    'Bash(docker:*)',
    'Bash(docker-compose:*)',
    'Bash(docker compose:*)',
    'Bash(make:*)',
    'Bash(cmake:*)',
    'Bash(ssh:*)',
    'Bash(scp:*)',
    'Bash(wget:*)',
    'Bash(tar:*)',
    'Bash(zip:*)',
    'Bash(unzip:*)',
    'Bash(jq:*)',
    'Bash(yq:*)',
    'Bash(sed:*)',
    'Bash(awk:*)',
    'Bash(xargs:*)',
    'Bash(env:*)',
  ],
} as const;

/** All project-type presets (excludes base) */
const PROJECT_PRESETS: readonly PermissionPreset[] = [
  NODEJS_PRESET,
  PYTHON_PRESET,
  RUST_PRESET,
  GENERAL_PRESET,
] as const;

// ─── Detection Signatures ───────────────────────────────

interface DetectionSignature {
  type: ProjectType;
  files: string[];
  label: string;
}

const DETECTION_SIGNATURES: readonly DetectionSignature[] = [
  { type: 'nodejs', files: ['package.json', 'node_modules'], label: 'package.json' },
  { type: 'python', files: ['pyproject.toml', 'setup.py', 'setup.cfg', 'Pipfile', 'requirements.txt'], label: 'pyproject.toml / setup.py' },
  { type: 'rust', files: ['Cargo.toml'], label: 'Cargo.toml' },
  { type: 'general', files: ['Makefile', 'Dockerfile', 'docker-compose.yml', 'docker-compose.yaml', 'CMakeLists.txt'], label: 'Makefile / Dockerfile' },
] as const;

// ─── Public API ─────────────────────────────────────────

/**
 * Detect project types by checking for characteristic files.
 * Returns a list of detected types with the triggering file name.
 */
export function detectProjectTypes(projectDir: string): { type: ProjectType; detectedBy: string }[] {
  const results: { type: ProjectType; detectedBy: string }[] = [];

  for (const sig of DETECTION_SIGNATURES) {
    for (const file of sig.files) {
      if (exists(join(projectDir, file))) {
        results.push({ type: sig.type, detectedBy: file });
        break; // one match per type is enough
      }
    }
  }

  return results;
}

/**
 * Get the base preset (always included).
 */
export function getBasePreset(): PermissionPreset {
  return BASE_PRESET;
}

/**
 * Get all project-type presets.
 */
export function getAllProjectPresets(): readonly PermissionPreset[] {
  return PROJECT_PRESETS;
}

/**
 * Get a preset by its ID.
 */
export function getPresetById(id: string): PermissionPreset | undefined {
  if (id === 'base') return BASE_PRESET;
  return PROJECT_PRESETS.find(p => p.id === id);
}

/**
 * Resolve the final permission list from selected presets + custom entries.
 * Always includes the base preset.
 */
export function resolvePermissions(
  presetIds: string[],
  customPermissions: string[] = [],
): string[] {
  const all = new Set<string>();

  // Always include base
  for (const perm of BASE_PRESET.permissions) {
    all.add(perm);
  }

  // Add selected project presets
  for (const id of presetIds) {
    const preset = getPresetById(id);
    if (preset) {
      for (const perm of preset.permissions) {
        all.add(perm);
      }
    }
  }

  // Add custom entries
  for (const perm of customPermissions) {
    const trimmed = perm.trim();
    if (trimmed) all.add(trimmed);
  }

  return Array.from(all);
}

/**
 * Collect all possible permissions across all presets.
 * Used during uninstall to ensure complete cleanup.
 */
export function getAllPresetPermissions(): string[] {
  const all = new Set<string>();

  for (const perm of BASE_PRESET.permissions) {
    all.add(perm);
  }

  for (const preset of PROJECT_PRESETS) {
    for (const perm of preset.permissions) {
      all.add(perm);
    }
  }

  return Array.from(all);
}
