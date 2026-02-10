/**
 * Maestro file manifest — all files managed by the CLI.
 */

/** Command-type skills (user-invocable slash commands) */
export const COMMAND_SKILLS = [
  'maestro-go',
  'maestro-init',
  'maestro-plan',
  'maestro-execute',
  'maestro-consult',
  'maestro-status',
  'maestro-review',
  'maestro-debug',
  'maestro-verify',
  'maestro-context',
  'maestro-tools',
] as const;

/** Knowledge-type skills (auto-discovered by Claude) */
export const KNOWLEDGE_SKILLS = [
  'maestro-workflow-routing',
  'maestro-mcp-protocols',
  'maestro-token-management',
  'maestro-role-prompts',
  'maestro-contexts',
  'maestro-learning',
  'maestro-prompt-enhance',
  'maestro-rules-guide',
] as const;

/** All skills combined */
export const ALL_SKILLS = [...COMMAND_SKILLS, ...KNOWLEDGE_SKILLS] as const;

/** Agent files */
export const AGENTS = [
  'maestro-context-curator',
  'maestro-model-coordinator',
  'maestro-quality-gate',
  'maestro-workflow-detector',
  'maestro-verifier',
  'maestro-learning-extractor',
] as const;

/** Hook scripts */
export const HOOKS = [
  'auto-format.sh',
  'typecheck-after-edit.sh',
  'detect-debug-statements.sh',
  'save-state-snapshot.sh',
  'detect-project-state.sh',
  'check-deps.sh',
] as const;

/** Rule categories */
export const RULE_LANGS = ['typescript', 'python', 'rust'] as const;
export type RuleLang = typeof RULE_LANGS[number];

/** CLI tools that Maestro depends on */
export const CLI_TOOLS = {
  required: [
    { name: 'uv', installCmd: 'curl -LsSf https://astral.sh/uv/install.sh | sh', description: 'MCP 运行时（codex/gemini MCP 必需）' },
    { name: 'specify', installCmd: 'pip install spec-kit', description: 'spec-kit 工作流' },
    { name: 'openspec', installCmd: 'pip install openspec', description: 'openspec 工作流' },
  ],
  optional: [
    { name: 'codex', installCmd: 'npm i -g @openai/codex', description: '多模型后端分析' },
    { name: 'gemini', installCmd: 'npm i -g @google/gemini-cli', description: '多模型前端分析' },
  ],
} as const;

/** MCP servers that Maestro uses */
export const MCP_SERVERS = {
  recommended: [
    {
      name: 'context7',
      description: '库文档查询',
      addCmd: 'claude mcp add context7 -- npx -y @upstash/context7-mcp@latest',
    },
    {
      name: 'open-websearch',
      description: '网络搜索',
      addCmd: 'claude mcp add open-websearch -- npx -y open-websearch-mcp@latest',
    },
  ],
  optional: [
    {
      name: 'serena',
      description: 'LSP 代码理解（迭代项目）',
      addCmd: 'claude mcp add serena -- uvx serena-mcp',
    },
    {
      name: 'codex-mcp',
      description: 'Codex 多模型后端（需要 codex CLI）',
      addCmd: 'claude mcp add codex -- uvx codex-mcp',
    },
    {
      name: 'gemini-mcp',
      description: 'Gemini 多模型前端（需要 gemini CLI）',
      addCmd: 'claude mcp add gemini -- uvx gemini-mcp',
    },
  ],
  core: [
    {
      name: 'sequential-thinking',
      description: '结构化思维（核心）',
      addCmd: 'claude mcp add sequential-thinking -- npx -y @anthropic/sequential-thinking-mcp',
    },
  ],
} as const;

/** Directories managed by Maestro */
export const DIRS = {
  skills: '.claude/skills',
  agents: '.claude/agents',
  hooks: '.claude/hooks/maestro',
  rules: '.claude/rules',
  runtime: '.maestro',
  summaries: '.maestro/summaries',
  consultations: '.maestro/consultations',
  learnings: '.maestro/learnings',
  templates: '.maestro/templates',
} as const;

/** Files that should NOT be overwritten on update */
export const USER_DATA_FILES = [
  '.maestro/config.json',
  '.maestro/state.json',
  '.maestro/learnings/',
] as const;

/** CLAUDE.md markers */
export const CLAUDE_MD_BEGIN = '<!-- MAESTRO:BEGIN';
export const CLAUDE_MD_END = '<!-- MAESTRO:END -->';

/**
 * Permissions to add to settings.local.json.
 * @deprecated Legacy fallback — new installations use the preset system in presets.ts.
 * Kept for backward compatibility with `maestro update` and `--skip-tools` paths.
 */
export const PERMISSIONS = [
  'WebSearch',
  'mcp__open-websearch__*',
  'Bash(ls:*)',
  'Bash(claude mcp:*)',
  'Bash(chmod:*)',
  'Bash(bash:*)',
  'Bash(specify init:*)',
  'Bash(python3:*)',
  'Bash(git add:*)',
  'Bash(git commit:*)',
  'Bash(curl:*)',
  'WebFetch(domain:github.com)',
  'WebFetch(domain:deepwiki.com)',
] as const;

/** .gitignore entries */
export const GITIGNORE_ENTRIES = [
  '',
  '# Maestro runtime (auto-managed)',
  '.maestro/state.json',
  '.maestro/consultations/',
  '.maestro/learnings/',
  '.maestro/*.snapshot-*.json',
] as const;
