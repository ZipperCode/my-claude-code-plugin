import { join, dirname } from 'path';
import { homedir } from 'os';
import { fileURLToPath } from 'url';
import { readJson, writeJson } from '../utils/json.js';
import { readText, writeText, exists, ensureDir } from '../utils/fs.js';
import { CLAUDE_MD_BEGIN, CLAUDE_MD_END, PERMISSIONS } from './constants.js';

const __filename_merger = fileURLToPath(import.meta.url);
const __dirname_merger = dirname(__filename_merger);

/**
 * Merge Maestro hooks into .claude/settings.json.
 */
export function mergeHooks(projectDir: string, dryRun = false): string[] {
  const settingsPath = join(projectDir, '.claude', 'settings.json');
  const settings = readJson<any>(settingsPath) || {};
  const actions: string[] = [];

  if (!settings.hooks) settings.hooks = {};

  const maestroHooks = buildMaestroHooks();

  // For each hook event, remove old Maestro entries and add new ones
  for (const [event, entries] of Object.entries(maestroHooks) as [string, any[]][]) {
    if (!settings.hooks[event]) settings.hooks[event] = [];

    // Remove existing Maestro hook entries (identified by .claude/hooks/maestro/ in command)
    const existingEntries = settings.hooks[event] as any[];
    settings.hooks[event] = existingEntries.filter((entry: any) => {
      if (entry.hooks) {
        // Filter out hooks that reference maestro
        const nonMaestro = entry.hooks.filter((h: any) =>
          !h.command?.includes('.claude/hooks/maestro/') &&
          !h.command?.includes('maestro/state.json') &&
          !h.command?.includes('maestro/learnings/')
        );
        if (nonMaestro.length === 0) return false;
        entry.hooks = nonMaestro;
      }
      return true;
    });

    // Add new Maestro entries
    settings.hooks[event].push(...entries);
    actions.push(`已合并 ${entries.length} 个 ${event} 钩子`);
  }

  if (!dryRun) {
    ensureDir(join(projectDir, '.claude'));
    writeJson(settingsPath, settings);
  }

  return actions;
}

/**
 * Remove Maestro hooks from .claude/settings.json.
 */
export function removeHooks(projectDir: string): void {
  const settingsPath = join(projectDir, '.claude', 'settings.json');
  const settings = readJson<any>(settingsPath);
  if (!settings?.hooks) return;

  for (const event of Object.keys(settings.hooks)) {
    const entries = settings.hooks[event] as any[];
    settings.hooks[event] = entries.filter((entry: any) => {
      if (entry.hooks) {
        const nonMaestro = entry.hooks.filter((h: any) =>
          !h.command?.includes('.claude/hooks/maestro/') &&
          !h.command?.includes('maestro/state.json') &&
          !h.command?.includes('maestro/learnings/')
        );
        if (nonMaestro.length === 0) return false;
        entry.hooks = nonMaestro;
      }
      return true;
    });
    // Remove empty event arrays
    if (settings.hooks[event].length === 0) {
      delete settings.hooks[event];
    }
  }

  writeJson(settingsPath, settings);
}

/**
 * Merge Maestro permissions into .claude/settings.local.json.
 */
export function mergePermissions(projectDir: string, dryRun = false): string[] {
  const localPath = join(projectDir, '.claude', 'settings.local.json');
  const settings = readJson<any>(localPath) || {};
  const actions: string[] = [];

  if (!settings.permissions) settings.permissions = {};
  if (!settings.permissions.allow) settings.permissions.allow = [];

  const allowList = settings.permissions.allow as string[];
  let added = 0;

  for (const perm of PERMISSIONS) {
    if (!allowList.includes(perm)) {
      allowList.push(perm);
      added++;
    }
  }

  if (added > 0) {
    actions.push(`已添加 ${added} 个权限到 settings.local.json`);
    if (!dryRun) {
      ensureDir(join(projectDir, '.claude'));
      writeJson(localPath, settings);
    }
  }

  return actions;
}

/**
 * Remove Maestro permissions from .claude/settings.local.json.
 */
export function removePermissions(projectDir: string): void {
  const localPath = join(projectDir, '.claude', 'settings.local.json');
  const settings = readJson<any>(localPath);
  if (!settings?.permissions?.allow) return;

  const permSet = new Set(PERMISSIONS as readonly string[]);
  settings.permissions.allow = (settings.permissions.allow as string[]).filter(
    (p: string) => !permSet.has(p)
  );

  writeJson(localPath, settings);
}

/**
 * Merge a dynamic permission list into project-level .claude/settings.local.json.
 * Unlike `mergePermissions()` which uses the hardcoded PERMISSIONS constant,
 * this accepts a custom list — used by the preset system in `init`.
 */
export function mergePermissionsWithList(
  projectDir: string,
  permissions: string[],
  dryRun = false,
): string[] {
  const localPath = join(projectDir, '.claude', 'settings.local.json');
  const settings = readJson<any>(localPath) || {};
  const actions: string[] = [];

  if (!settings.permissions) settings.permissions = {};
  if (!settings.permissions.allow) settings.permissions.allow = [];

  const allowList = settings.permissions.allow as string[];
  let added = 0;

  for (const perm of permissions) {
    if (!allowList.includes(perm)) {
      allowList.push(perm);
      added++;
    }
  }

  if (added > 0) {
    actions.push(`已添加 ${added} 个权限到项目级 settings.local.json`);
    if (!dryRun) {
      ensureDir(join(projectDir, '.claude'));
      writeJson(localPath, settings);
    }
  }

  return actions;
}

/**
 * Merge permissions into user-level ~/.claude/settings.local.json.
 */
export function mergeUserLevelPermissions(
  permissions: string[],
  dryRun = false,
): string[] {
  const home = homedir();
  const claudeDir = join(home, '.claude');
  const localPath = join(claudeDir, 'settings.local.json');
  const settings = readJson<any>(localPath) || {};
  const actions: string[] = [];

  if (!settings.permissions) settings.permissions = {};
  if (!settings.permissions.allow) settings.permissions.allow = [];

  const allowList = settings.permissions.allow as string[];
  let added = 0;

  for (const perm of permissions) {
    if (!allowList.includes(perm)) {
      allowList.push(perm);
      added++;
    }
  }

  if (added > 0) {
    actions.push(`已添加 ${added} 个权限到用户级 ~/.claude/settings.local.json`);
    if (!dryRun) {
      ensureDir(claudeDir);
      writeJson(localPath, settings);
    }
  }

  return actions;
}

/**
 * Remove specified permissions from user-level ~/.claude/settings.local.json.
 */
export function removeUserLevelPermissions(permissions: string[]): void {
  const home = homedir();
  const localPath = join(home, '.claude', 'settings.local.json');
  const settings = readJson<any>(localPath);
  if (!settings?.permissions?.allow) return;

  const permSet = new Set(permissions);
  settings.permissions.allow = (settings.permissions.allow as string[]).filter(
    (p: string) => !permSet.has(p),
  );

  writeJson(localPath, settings);
}

/**
 * Inject Maestro section into CLAUDE.md.
 */
export function injectClaudeMd(projectDir: string, version: string, dryRun = false): string[] {
  const claudeMdPath = join(projectDir, 'CLAUDE.md');
  const sectionPath = join(getAssetsDir(), 'claudemd-section.md');
  const actions: string[] = [];

  const sectionContent = readText(sectionPath);
  if (!sectionContent) {
    actions.push('警告：在 assets 中未找到 claudemd-section.md');
    return actions;
  }

  const wrappedContent = `${CLAUDE_MD_BEGIN} v${version} -->\n${sectionContent}\n${CLAUDE_MD_END}`;

  const existing = readText(claudeMdPath);

  if (existing) {
    const beginIdx = existing.indexOf(CLAUDE_MD_BEGIN);
    const endIdx = existing.indexOf(CLAUDE_MD_END);

    if (beginIdx !== -1 && endIdx !== -1) {
      // Replace existing section
      const before = existing.substring(0, beginIdx);
      const after = existing.substring(endIdx + CLAUDE_MD_END.length);
      const newContent = before + wrappedContent + after;
      if (!dryRun) writeText(claudeMdPath, newContent);
      actions.push('已更新 CLAUDE.md 中的 Maestro 章节');
    } else {
      // Append
      const newContent = existing.trimEnd() + '\n\n' + wrappedContent + '\n';
      if (!dryRun) writeText(claudeMdPath, newContent);
      actions.push('已追加 Maestro 章节到 CLAUDE.md');
    }
  } else {
    // Create new
    if (!dryRun) writeText(claudeMdPath, wrappedContent + '\n');
    actions.push('已创建包含 Maestro 章节的 CLAUDE.md');
  }

  return actions;
}

/**
 * Remove Maestro section from CLAUDE.md.
 */
export function removeClaudeMd(projectDir: string): void {
  const claudeMdPath = join(projectDir, 'CLAUDE.md');
  const existing = readText(claudeMdPath);
  if (!existing) return;

  const beginIdx = existing.indexOf(CLAUDE_MD_BEGIN);
  const endIdx = existing.indexOf(CLAUDE_MD_END);

  if (beginIdx !== -1 && endIdx !== -1) {
    const before = existing.substring(0, beginIdx).trimEnd();
    const after = existing.substring(endIdx + CLAUDE_MD_END.length).trimStart();
    const newContent = before + (after ? '\n\n' + after : '') + '\n';
    writeText(claudeMdPath, newContent);
  }
}

/**
 * Update .gitignore with Maestro entries.
 */
export function updateGitignore(projectDir: string, dryRun = false): string[] {
  const gitignorePath = join(projectDir, '.gitignore');
  const actions: string[] = [];

  const entries = [
    '',
    '# Maestro runtime (auto-managed)',
    '.maestro/state.json',
    '.maestro/consultations/',
    '.maestro/learnings/',
    '.maestro/*.snapshot-*.json',
  ];

  const existing = readText(gitignorePath) || '';
  const marker = '# Maestro runtime (auto-managed)';

  if (existing.includes(marker)) {
    actions.push('.gitignore 已包含 Maestro 条目');
    return actions;
  }

  const newContent = existing.trimEnd() + '\n' + entries.join('\n') + '\n';
  if (!dryRun) writeText(gitignorePath, newContent);
  actions.push('已添加 Maestro 条目到 .gitignore');

  return actions;
}

/**
 * Remove Maestro entries from .gitignore.
 */
export function removeGitignore(projectDir: string): void {
  const gitignorePath = join(projectDir, '.gitignore');
  const existing = readText(gitignorePath);
  if (!existing) return;

  const lines = existing.split('\n');
  const maestroLines = new Set([
    '# Maestro runtime (auto-managed)',
    '.maestro/state.json',
    '.maestro/consultations/',
    '.maestro/learnings/',
    '.maestro/*.snapshot-*.json',
  ]);

  const filtered = lines.filter(line => !maestroLines.has(line.trim()));
  writeText(gitignorePath, filtered.join('\n'));
}

// --- Internal helpers ---

function getAssetsDir(): string {
  // Assets are at package-root/assets/
  return join(__dirname_merger, '..', '..', 'assets');
}

function buildMaestroHooks(): Record<string, any[]> {
  const hooksDir = '"$CLAUDE_PROJECT_DIR"/.claude/hooks/maestro';

  return {
    SessionStart: [
      {
        hooks: [
          {
            type: 'command',
            command: 'cat .maestro/state.json 2>/dev/null || echo \'{"activeWorkflow":null}\'',
            timeout: 5,
          },
          {
            type: 'command',
            command: 'for f in .maestro/learnings/conventions.md .maestro/learnings/decisions.md .maestro/learnings/patterns.md; do [ -f "$f" ] && echo "--- $(basename $f) ---" && tail -20 "$f"; done 2>/dev/null || true',
            timeout: 5,
          },
        ],
      },
    ],
    PreToolUse: [
      {
        matcher: 'Bash',
        hooks: [
          {
            type: 'command',
            command: `bash ${hooksDir}/detect-debug-statements.sh`,
            timeout: 5,
          },
        ],
      },
    ],
    PostToolUse: [
      {
        matcher: 'Edit|Write',
        hooks: [
          {
            type: 'command',
            command: `bash ${hooksDir}/auto-format.sh`,
            timeout: 10,
          },
          {
            type: 'command',
            command: `bash ${hooksDir}/typecheck-after-edit.sh`,
            timeout: 10,
          },
        ],
      },
    ],
    PreCompact: [
      {
        hooks: [
          {
            type: 'command',
            command: `bash ${hooksDir}/save-state-snapshot.sh`,
            timeout: 5,
          },
        ],
      },
    ],
    Stop: [
      {
        hooks: [
          {
            type: 'command',
            command: 'if [ -f .maestro/state.json ]; then echo \'Maestro 会话已结束。可使用 maestro-learning-extractor 智能体提取学习内容。\' >&2; fi',
            timeout: 3,
          },
        ],
      },
    ],
  };
}
