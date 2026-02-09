---
name: prompt-enhance
description: "This skill provides requirement enhancement templates that enrich brief user requirements with technical and quality dimensions. Reference this during the Phase 1.8 of /maestro:go and /maestro:plan."
---

# Prompt Enhancement

## Overview

When users provide brief or high-level requirements, this skill enriches them with context from the project environment, technical dimensions, and quality considerations — without changing the user's original intent.

## Enhancement Rules

1. **Preserve original intent** — never alter what the user asked for
2. **Auto-fill from project context** — use config files to add implicit details
3. **Minimize questions** — max 3 clarifying questions, only when truly ambiguous
4. **Skip when unnecessary** — if requirement is already detailed (>200 chars + contains technical keywords), apply minimal enhancement

## Technical Dimensions

Check the requirement against these dimensions and auto-fill or ask when missing:

| Dimension | Auto-fill Source | Ask When |
|-----------|-----------------|----------|
| **Tech stack** | `package.json`, `pyproject.toml`, `Cargo.toml` | Not determinable from files |
| **Authentication** | Existing auth middleware / config files | Requirement mentions users/accounts but no auth specified |
| **Database** | Existing DB config / ORM setup | Requirement implies data persistence but no DB mentioned |
| **API style** | Existing API routes / OpenAPI spec | Requirement involves API but style unclear |
| **Deployment target** | Dockerfile, CI config, serverless config | Architecture-sensitive requirement with no deployment context |

## Quality Dimensions

| Dimension | Auto-fill Source | Ask When |
|-----------|-----------------|----------|
| **Performance** | Existing benchmarks, load test config | Requirement involves data processing / high traffic |
| **Scale** | Current user count, data volume | Requirement mentions growth or multi-tenancy |
| **Monitoring** | Existing logging / metrics setup | Requirement is production-critical |
| **Testing** | Existing test framework, coverage config | Not determinable but implementation is complex |

## Context Auto-Fill

### From `package.json`
```
- Runtime: Node.js
- Framework: {dependencies.express || dependencies.fastify || dependencies.next || ...}
- Language: {devDependencies.typescript ? "TypeScript" : "JavaScript"}
- Test framework: {devDependencies.vitest || devDependencies.jest || ...}
- Build tool: {devDependencies.vite || devDependencies.webpack || ...}
```

### From `pyproject.toml`
```
- Runtime: Python {requires-python}
- Framework: {dependencies containing django || fastapi || flask || ...}
- Test framework: {dev-dependencies containing pytest || ...}
```

### From `Cargo.toml`
```
- Runtime: Rust {edition}
- Framework: {dependencies containing actix || axum || rocket || ...}
```

### From `.maestro/state.json`
```
- Active workflow: {activeWorkflow}
- Current stage: {currentStage}
- Previous decisions: {keyDecisions}
```

### From `.maestro/config.json`
```
- Available models: codex={mcp.codex}, gemini={mcp.gemini}
- Policy preset: {policy.preset}
```

## Enhancement Output Format

```markdown
### Original Requirement
{user's original text, unchanged}

### Project Context (auto-detected)
- **Tech stack**: {detected tech stack}
- **Existing patterns**: {relevant patterns from codebase}
- **Active workflow**: {from state.json if any}

### Enhanced Requirement
{original requirement + injected context}

### Clarifying Questions (if any)
1. {question about ambiguous dimension}
2. {question about missing but important dimension}
```

## Skip Conditions

Apply minimal enhancement (just add project context, no questions) when:
- Requirement length > 200 characters
- Requirement contains ≥ 3 technical keywords (API, database, auth, component, endpoint, schema, migration, deploy, test, etc.)
- Requirement references specific files or functions
- User has used `--no-enhance` flag (if supported by the calling command)

## Examples

### Brief requirement → Full enhancement
**Input**: "Add user authentication"
**Enhancement**:
- Auto-fill: Detected Express.js + PostgreSQL from project
- Questions: "Which auth method? (JWT / Session / OAuth)" + "Should existing endpoints require auth?"

### Detailed requirement → Minimal enhancement
**Input**: "Add JWT-based authentication with refresh tokens using the existing PostgreSQL users table. Implement login, register, and token refresh endpoints. Use bcrypt for password hashing and include rate limiting on auth routes."
**Enhancement**:
- Auto-fill: Detected Express.js + PostgreSQL (confirmed matches requirement)
- No questions needed — requirement is already detailed
