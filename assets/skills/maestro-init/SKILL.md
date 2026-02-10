---
description: "Project-level initialization: config setup, language detection, rules recommendation"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
  - Write
disable-model-invocation: true
---

# Maestro Init — Project Configuration & Rules Setup

You are the Maestro initialization assistant. Your job is to set up project-level configuration, detect the primary language, and recommend coding rules. CLI tool installation and MCP server setup are handled by the CLI tool — this command focuses on project-level concerns only.

When executing this command, reference the following expertise:
- "maestro-mcp-protocols" — MCP invocation conventions and configuration

## Step 1: Read Configuration

1. Check if `.maestro/config.json` exists
2. If it exists, read and display the current configuration:
   ```
   Current Maestro Configuration

   Policy preset: {preset}
   Multi-model available: {yes/no}
   Degradation mode: {none|codex-only|gemini-only|claude-solo}
   ```
3. If it does not exist, create `.maestro/config.json` with default settings:
   ```json
   {
     "detectedAt": "<ISO timestamp>",
     "multiModelAvailable": false,
     "degradationMode": "claude-solo",
     "policy": {
       "preset": "balanced",
       "custom": {}
     }
   }
   ```
   Ensure `.maestro/` directory exists before writing. Also create `.maestro/summaries/` and `.maestro/consultations/` directories.

## Step 2: Language Detection

Detect the project's primary language by scanning for configuration files in the current working directory.

1. **Detect language indicators**:
   ```bash
   ls package.json tsconfig.json pyproject.toml setup.py Cargo.toml go.mod 2>/dev/null
   ```

2. **Map to language**:
   - `package.json` + `tsconfig.json` → TypeScript
   - `package.json` (no tsconfig) → JavaScript
   - `pyproject.toml` or `setup.py` → Python
   - `Cargo.toml` → Rust
   - `go.mod` → Go

## Step 3: Rules Recommendation

Reference the "maestro-rules-guide" skill for language detection and rules installation guidance.

Present recommended rules based on detected language:

```
Coding Rules Available

Detected: {language} project

Recommended rules to install:
  Common:
    rules/common/coding-style.md    → .claude/rules/coding-style.md
    rules/common/git-workflow.md    → .claude/rules/git-workflow.md
    rules/common/testing.md         → .claude/rules/testing.md
    rules/common/security.md        → .claude/rules/security.md
  {Language}-specific:
    rules/{lang}/patterns.md        → .claude/rules/{lang}-patterns.md
    rules/{lang}/tools.md           → .claude/rules/{lang}-tools.md

To install:
  mkdir -p .claude/rules
  cp "$CLAUDE_PROJECT_DIR"/.maestro/rules/common/*.md .claude/rules/
  cp "$CLAUDE_PROJECT_DIR"/.maestro/rules/{lang}/*.md .claude/rules/

Rules are reference templates — customize after copying.
```

**Do NOT auto-copy** — only guide the user on which rules to install and how.

## Step 4: Status Report

Present a simplified status report:

```
Maestro Project Setup

Configuration:
  Policy preset: {balanced} (default)
  Edit .maestro/config.json → policy to change limits.
  Available presets: conservative | balanced | unrestricted

Language Detection:
  Detected: {language}
  Rules available: {yes/no}

Storage:
  .maestro/config.json        — configuration
  .maestro/summaries/          — stage summaries
  .maestro/consultations/      — MCP consultation records

Config saved to .maestro/config.json
```
