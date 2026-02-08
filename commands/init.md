---
description: "Detect all dependencies, fix configuration issues, and guide through initial setup"
allowed-tools:
  - Bash
  - Read
  - Write
---

# Maestro Init — Dependency Detection & Environment Setup

You are the Maestro initialization assistant. Your job is to verify that all required tools and MCP servers are properly configured for the Maestro workflow orchestrator.

When executing this command, reference the following expertise:
- "mcp protocols" — MCP invocation conventions and configuration

## Step 1: Locate Plugin & Run Dependency Detection

1. Use Glob to locate the Maestro plugin directory:
   - Pattern: `**/scripts/check-deps.sh` — filter results for a path containing `maestro` or `my-claude-plugin`
   - Record the resolved plugin directory (the parent of `scripts/`) as `PLUGIN_DIR`

2. If found, run:
   ```bash
   bash "<PLUGIN_DIR>/scripts/check-deps.sh" "$(pwd)"
   ```

3. If not found via Glob, perform manual checks as described below.

## Step 2: Prerequisite Tool Detection

First check that `uv`/`uvx` is installed (required for codex-mcp and gemini-mcp):

| Tool | Check Command | Install Instruction |
|------|--------------|-------------------|
| `uv` | `which uv` | Linux/macOS: `curl -LsSf https://astral.sh/uv/install.sh \| sh` |

If `uv` is missing and user wants multi-model collaboration, it must be installed first.

## Step 3: CLI Tool Detection

Check each CLI tool and report status:

| Tool | Check Command | Install Instruction | Required |
|------|--------------|-------------------|----------|
| `specify` | `which specify` | `pip install spec-kit` | **Required** |
| `openspec` | `which openspec` | `npm i -g @fission-ai/openspec` | **Required** |
| `codex` | `which codex` | `npm i -g @openai/codex` | Optional (multi-model backend) |
| `gemini` | `which gemini` | `npm i -g @google/gemini-cli` | Optional (multi-model frontend) |

- `specify` and `openspec` are **required** for core workflow functionality
- `codex` and `gemini` are **optional** — if unavailable, mark multi-model collaboration as degraded

## Step 3.5: Slash Command Registration Detection

After CLI detection, check whether spec-kit and openspec have been **initialized in the target project** (i.e., their slash commands are registered under `.claude/commands/`).

This is a separate concern from CLI installation — the CLI tools register project-level slash commands via initialization commands (`specify init`, `openspec init`), and these commands won't exist until that step is performed.

### Detection logic:

1. **spec-kit commands**: Check for files matching `.claude/commands/speckit.*.md` in the current working directory
2. **openspec commands**: Check for `.claude/commands/opsx/` directory containing `.md` files in the current working directory

### Status reporting (three states per tool):

| CLI Installed | Commands Registered | Status | Action |
|:---:|:---:|---|---|
| ✅ | ✅ | Fully ready | None |
| ✅ | ❌ | CLI installed but not initialized in project | Guide user to run init command |
| ❌ | — | CLI not installed | Guide user to install CLI first |

### Guidance (do NOT execute automatically):

- **spec-kit not initialized**: Instruct the user to run `specify init --here --ai claude` in the target project directory
- **openspec not initialized**: Instruct the user to run `openspec init --tools claude` in the target project directory
- **After initialization**: Remind the user to restart Claude Code so the new slash commands are recognized

> **Important**: Follow CLAUDE.md rule — only **guide** the user to execute initialization commands, do NOT execute them automatically.

## Step 4: MCP Server Detection

Check each MCP server by running `claude mcp list` and verifying presence:

| MCP Server | Check Pattern | Required | Install Command (if missing) |
|-----------|--------------|----------|------------------------------|
| codex-mcp | `grep codex` in mcp list | Optional | `claude mcp add codex -s user --transport stdio -- uvx --from git+https://github.com/GuDaStudio/codexmcp.git codexmcp` |
| gemini-mcp | `grep gemini` in mcp list | Optional | `claude mcp add gemini -s user --transport stdio -- uvx --from git+https://github.com/GuDaStudio/geminimcp.git geminimcp` |
| sequential-thinking | `grep sequential-thinking` in mcp list | Recommended | `claude mcp add sequential-thinking -- npx -y @modelcontextprotocol/server-sequential-thinking` |
| serena | `grep serena` in mcp list | Optional | Refer to https://github.com/oraios/serena |
| context7 | `grep context7` in mcp list | Recommended | Refer to https://github.com/upstash/context7 |
| open-websearch | `grep websearch` in mcp list | Recommended | Refer to open-websearch npm package |
| ace-tool | `grep ace` in mcp list | Optional | Refer to https://github.com/eastxiaodong/ace-tool |

**Important**: codex-mcp and gemini-mcp both require `uv`/`uvx` to be installed first.

## Step 5: Sequential-Thinking Fix

If `sequential-thinking` MCP is detected but uses `cmd /c` prefix (Windows artifact on WSL), fix it:

```bash
claude mcp remove sequential-thinking
claude mcp add sequential-thinking -- npx -y @modelcontextprotocol/server-sequential-thinking
```

## Step 6: Generate Configuration

Create `.maestro/config.json` with the detection results and default policy:

```json
{
  "pluginDir": "<PLUGIN_DIR>",
  "detectedAt": "<ISO timestamp>",
  "cli": {
    "specify": true|false,
    "openspec": true|false,
    "codex": true|false,
    "gemini": true|false
  },
  "slashCommands": {
    "speckit": true|false,
    "openspec": true|false
  },
  "mcp": {
    "codex": true|false,
    "gemini": true|false,
    "sequential-thinking": true|false,
    "serena": true|false,
    "context7": true|false,
    "open-websearch": true|false,
    "ace-tool": true|false
  },
  "multiModelAvailable": true|false,
  "degradationMode": "none|codex-only|gemini-only|claude-solo",
  "policy": {
    "preset": "balanced",
    "custom": {}
  }
}
```

**Policy explanation**:
- `preset`: One of `"conservative"`, `"balanced"` (default), or `"unrestricted"`. Controls MCP output guidance, SESSION_ID follow-up rules, call limits, and summary lengths.
- `custom`: User can override any preset field here. See `skills/token-management/SKILL.md` for available fields.

Ensure `.maestro/` directory exists before writing. Also create `.maestro/summaries/` and `.maestro/consultations/` directories.

## Step 7: Report Summary

Present results in a clear table format:

```
🎭 Maestro Environment Check

✅ / ❌ specify CLI
✅ / ❌ openspec CLI
✅ / ⚠️ codex CLI (optional)
✅ / ⚠️ gemini CLI (optional)

Slash Commands:
✅ / ⚠️ spec-kit (/speckit.*)
  ⚠️ → Run: specify init --here --ai claude
✅ / ⚠️ openspec (/opsx:*)
  ⚠️ → Run: openspec init --tools claude
  ℹ️ Restart Claude Code after initialization

MCP Servers:
✅ / ❌ sequential-thinking
✅ / ❌ serena
...

Multi-model collaboration: ✅ Full / ⚠️ Degraded (reason) / ❌ Unavailable

Policy preset: balanced (default)
  ℹ️ Edit .maestro/config.json → policy to change limits.
  Available presets: conservative | balanced | unrestricted

Storage lifecycle: ✅ Active
  📦 keyDecisions: keep latest 10 in state.json (overflow archived)
  🗑️ consultations: max 20 files, expire after 7d
  ℹ️ Controlled by policy.storage.* — see token-management skill for details

Config saved to .maestro/config.json
```

If any **required** tool is missing, provide the exact install command. If **optional** tools are missing, note the degraded capabilities but do not block initialization.
