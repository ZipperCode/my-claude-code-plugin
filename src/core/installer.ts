import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  ensureDir,
  copyFile,
  copyDir,
  makeExecutable,
  exists,
  listFiles,
} from '../utils/fs.js';
import { writeJson } from '../utils/json.js';
import { log } from '../utils/logger.js';
import {
  ALL_SKILLS,
  AGENTS,
  HOOKS,
  DIRS,
  RULE_LANGS,
  type RuleLang,
} from './constants.js';
import { Manifest, createManifest, writeManifest, getPackageVersion } from './version.js';
import {
  mergeHooks,
  mergePermissions,
  mergePermissionsWithList,
  mergeUserLevelPermissions,
  injectClaudeMd,
  updateGitignore,
} from './merger.js';
import type { PermissionSelection } from './presets.js';

const __filename_installer = fileURLToPath(import.meta.url);
const __dirname_installer = dirname(__filename_installer);

/**
 * Get the assets directory path (relative to compiled output).
 */
export function getAssetsDir(): string {
  return join(__dirname_installer, '..', '..', 'assets');
}

export interface InstallOptions {
  projectDir: string;
  withRules: boolean;
  lang?: RuleLang;
  dryRun: boolean;
  force: boolean;
  /** Permission selection from preset flow; null/undefined = use legacy PERMISSIONS constant */
  permissionSelection?: PermissionSelection | null;
}

export interface InstallResult {
  success: boolean;
  actions: string[];
  errors: string[];
  manifest: Manifest | null;
}

/**
 * Install Maestro files into the project directory.
 * This is Phase B of the init command.
 */
export function installFiles(opts: InstallOptions): InstallResult {
  const { projectDir, withRules, lang, dryRun } = opts;
  const assetsDir = getAssetsDir();
  const actions: string[] = [];
  const errors: string[] = [];
  const installedFiles: Manifest['files'] = {
    skills: [],
    agents: [],
    hooks: [],
  };

  // Step B2: Create directory structure
  log.step(2, '正在创建目录结构...');
  const dirsToCreate = [
    join(projectDir, DIRS.skills),
    join(projectDir, DIRS.agents),
    join(projectDir, DIRS.hooks),
    join(projectDir, DIRS.runtime),
    join(projectDir, DIRS.summaries),
    join(projectDir, DIRS.consultations),
    join(projectDir, DIRS.learnings),
    join(projectDir, DIRS.templates),
  ];

  for (const dir of dirsToCreate) {
    if (!dryRun) {
      ensureDir(dir);
    } else {
      log.dryRun(`mkdir -p ${dir}`);
    }
  }
  actions.push(`已创建 ${dirsToCreate.length} 个目录`);

  // Step B3: Copy skills
  log.step(3, '正在安装技能...');
  for (const skill of ALL_SKILLS) {
    const srcDir = join(assetsDir, 'skills', skill);
    const destDir = join(projectDir, DIRS.skills, skill);
    const srcFile = join(srcDir, 'SKILL.md');

    if (!exists(srcFile)) {
      errors.push(`缺少技能源文件：${skill}/SKILL.md`);
      continue;
    }

    if (!dryRun) {
      ensureDir(destDir);
      copyFile(srcFile, join(destDir, 'SKILL.md'));
    } else {
      log.dryRun(`Copy ${skill}/SKILL.md`);
    }
    installedFiles.skills.push(join(DIRS.skills, skill, 'SKILL.md'));
  }
  actions.push(`已安装 ${ALL_SKILLS.length} 个技能`);

  // Step B4: Copy agents
  log.step(4, '正在安装智能体...');
  for (const agent of AGENTS) {
    const srcFile = join(assetsDir, 'agents', `${agent}.md`);
    const destFile = join(projectDir, DIRS.agents, `${agent}.md`);

    if (!exists(srcFile)) {
      errors.push(`缺少智能体源文件：${agent}.md`);
      continue;
    }

    if (!dryRun) {
      ensureDir(join(projectDir, DIRS.agents));
      copyFile(srcFile, destFile);
    } else {
      log.dryRun(`Copy ${agent}.md`);
    }
    installedFiles.agents.push(join(DIRS.agents, `${agent}.md`));
  }
  actions.push(`已安装 ${AGENTS.length} 个智能体`);

  // Step B5: Copy hook scripts
  log.step(5, '正在安装钩子脚本...');
  for (const hook of HOOKS) {
    const srcFile = join(assetsDir, 'hooks', hook);
    const destFile = join(projectDir, DIRS.hooks, hook);

    if (!exists(srcFile)) {
      errors.push(`缺少钩子源文件：${hook}`);
      continue;
    }

    if (!dryRun) {
      copyFile(srcFile, destFile);
      makeExecutable(destFile);
    } else {
      log.dryRun(`Copy + chmod +x ${hook}`);
    }
    installedFiles.hooks.push(join(DIRS.hooks, hook));
  }
  actions.push(`已安装 ${HOOKS.length} 个钩子脚本`);

  // Step B6: Merge hooks into .claude/settings.json
  log.step(6, '正在合并钩子配置...');
  const hookActions = mergeHooks(projectDir, dryRun);
  actions.push(...hookActions);

  // Step B7: Merge permissions into settings
  log.step(7, '正在合并权限配置...');
  if (opts.permissionSelection) {
    // New preset-based flow: use dynamic permission lists
    const selection = opts.permissionSelection;
    const scope = selection.scope;

    if (scope === 'project' || scope === 'both') {
      const projectActions = mergePermissionsWithList(projectDir, selection.projectScope, dryRun);
      actions.push(...projectActions);
    }
    if (scope === 'user' || scope === 'both') {
      const userActions = mergeUserLevelPermissions(selection.userScope, dryRun);
      actions.push(...userActions);
    }
  } else {
    // Legacy fallback: use hardcoded PERMISSIONS constant (update/skip-tools path)
    const permActions = mergePermissions(projectDir, dryRun);
    actions.push(...permActions);
  }

  // Step B8: Inject CLAUDE.md section
  log.step(8, '正在注入 CLAUDE.md 章节...');
  const version = getPackageVersion();
  const claudeActions = injectClaudeMd(projectDir, version, dryRun);
  actions.push(...claudeActions);

  // Step B9: Optional rules
  if (withRules) {
    log.step(9, '正在安装编码规则...');
    const rulesResult = installRules(assetsDir, projectDir, lang, dryRun);
    actions.push(...rulesResult.actions);
    errors.push(...rulesResult.errors);
    if (rulesResult.files.length > 0) {
      installedFiles.rules = rulesResult.files;
    }
  }

  // Step B10: Copy templates
  log.step(10, '正在安装模板...');
  const templatesSrc = join(assetsDir, 'templates');
  if (exists(templatesSrc)) {
    if (!dryRun) {
      copyDir(templatesSrc, join(projectDir, DIRS.templates));
    }
    actions.push('已安装模板');
  }

  // Step B11: Generate default config.json (if not exists)
  log.step(11, '正在生成配置...');
  const configPath = join(projectDir, DIRS.runtime, 'config.json');
  if (!exists(configPath)) {
    if (!dryRun) {
      writeJson(configPath, buildDefaultConfig());
    }
    actions.push('已生成默认 config.json');
  } else {
    actions.push('config.json 已存在，已保留');
  }

  // Step B12: Write manifest
  log.step(12, '正在写入清单...');
  const manifest = createManifest(version, installedFiles);
  if (!dryRun) {
    writeManifest(projectDir, manifest);
  }
  actions.push(`已写入清单（v${version}）`);

  // Step B13: Update .gitignore
  log.step(13, '正在更新 .gitignore...');
  const gitignoreActions = updateGitignore(projectDir, dryRun);
  actions.push(...gitignoreActions);

  return {
    success: errors.length === 0,
    actions,
    errors,
    manifest: dryRun ? null : manifest,
  };
}

/**
 * Install language-specific rules.
 */
function installRules(
  assetsDir: string,
  projectDir: string,
  lang: RuleLang | undefined,
  dryRun: boolean
): { actions: string[]; errors: string[]; files: string[] } {
  const actions: string[] = [];
  const errors: string[] = [];
  const files: string[] = [];

  // Always install common rules
  const commonSrc = join(assetsDir, 'rules', 'common');
  const commonDest = join(projectDir, DIRS.rules, 'common');
  if (exists(commonSrc)) {
    if (!dryRun) copyDir(commonSrc, commonDest);
    const commonFiles = listFiles(commonSrc);
    for (const f of commonFiles) {
      files.push(join(DIRS.rules, 'common', f));
    }
    actions.push(`已安装 ${commonFiles.length} 个通用规则`);
  }

  // Install language-specific rules
  const langsToInstall = lang ? [lang] : RULE_LANGS;
  for (const l of langsToInstall) {
    const langSrc = join(assetsDir, 'rules', l);
    const langDest = join(projectDir, DIRS.rules, l);
    if (exists(langSrc)) {
      if (!dryRun) copyDir(langSrc, langDest);
      const langFiles = listFiles(langSrc);
      for (const f of langFiles) {
        files.push(join(DIRS.rules, l, f));
      }
      actions.push(`已安装 ${langFiles.length} 个 ${l} 规则`);
    }
  }

  return { actions, errors, files };
}

/**
 * Build default Maestro config.
 */
function buildDefaultConfig(): Record<string, any> {
  return {
    version: '1.0',
    policy: {
      preset: 'balanced',
      mcp: {
        maxCalls: 10,
        sessionFollowUp: 'balanced',
        outputGuidance: true,
      },
      storage: {
        summaryMaxLines: { index: 15, detailed: 150 },
        keyDecisions: { maxInState: 10 },
        consultations: { maxAge: '24h', maxCount: 20 },
      },
    },
    tools: {
      codex: false,
      gemini: false,
      specKit: false,
      openspec: false,
    },
    mcpServers: {
      sequentialThinking: false,
      context7: false,
      openWebsearch: false,
      serena: false,
    },
  };
}
