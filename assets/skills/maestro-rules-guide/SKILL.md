---
name: maestro-rules-guide
description: "Coding rules installation guide and language detection"
user-invocable: false
---

# Rules Installation Guide

## Overview

The `rules/` directory contains curated coding rules organized by language. These files are **reference documents** — users copy the relevant ones into their project's `.claude/rules/` directory where Claude Code will automatically load them.

## Language Detection

Detect the project's primary language(s) by checking for configuration files:

| Indicator File | Language | Recommended Rules |
|---------------|----------|-------------------|
| `package.json` + `tsconfig.json` | TypeScript | `common/*` + `typescript/*` |
| `package.json` (no tsconfig) | JavaScript | `common/*` + `typescript/tools.md` (Prettier/ESLint) |
| `pyproject.toml` or `setup.py` or `requirements.txt` | Python | `common/*` + `python/*` |
| `Cargo.toml` | Rust | `common/*` + `rust/*` |
| `go.mod` | Go | `common/*` (Go-specific rules TBD) |

### Multi-language projects

If multiple language indicators are found, recommend all matching rule sets.

## Installation Steps

### 1. Detect language
```bash
# Check for language indicators in project root
ls package.json tsconfig.json pyproject.toml Cargo.toml go.mod 2>/dev/null
```

### 2. Recommend rules
Present the matching rules with file paths:
```
Detected: TypeScript project

Recommended rules to install:
  rules/common/coding-style.md    → .claude/rules/coding-style.md
  rules/common/git-workflow.md    → .claude/rules/git-workflow.md
  rules/common/testing.md         → .claude/rules/testing.md
  rules/common/security.md        → .claude/rules/security.md
  rules/typescript/patterns.md    → .claude/rules/ts-patterns.md
  rules/typescript/tools.md       → .claude/rules/ts-tools.md
```

### 3. Guide installation (do NOT auto-copy)
```bash
# User should run these commands:
mkdir -p .claude/rules
cp <plugin-dir>/rules/common/*.md .claude/rules/
cp <plugin-dir>/rules/typescript/*.md .claude/rules/
```

## Rule Categories

### Common rules (all languages)
- **coding-style.md** — KISS, YAGNI, DRY, SOLID principles + naming conventions
- **git-workflow.md** — Commit format, branch strategy, PR process
- **testing.md** — Coverage targets, test structure, best practices
- **security.md** — Input validation, auth, data protection, dependency security

### Language-specific rules
- **patterns.md** — Language idioms, type safety, error handling, code organization
- **tools.md** — Linter, formatter, type checker, test runner configuration

## Customization

Users can and should customize the copied rules:
- Add project-specific conventions
- Adjust coverage targets
- Modify linter/formatter settings
- Add team-specific naming conventions

The original files in `rules/` remain as templates for future projects.
