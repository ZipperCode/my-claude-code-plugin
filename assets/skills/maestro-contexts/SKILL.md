---
name: maestro-contexts
description: "Behavioral context mode definitions: dev, review, research, debug"
user-invocable: false
---

# Context Modes

## Overview

Context modes adjust Claude's behavior profile to match the current task type. Each mode defines a philosophy, tool priority order, and behavioral constraints. Only one mode can be active at a time.

## Mode Definitions

### `dev` — Development Mode

| Aspect | Value |
|--------|-------|
| **Philosophy** | Write code first, explain later |
| **Tool Priority** | Edit > Write > Bash > Read |
| **Behavior** | Immediately implement solutions with minimal explanation. Favor working code over documentation. When encountering ambiguity, make a reasonable choice and note it rather than asking. |
| **Response Style** | Code-heavy, brief explanations only when non-obvious. Skip analysis preamble. |
| **Auto-trigger** | Workflow stages: `implementation`, `tasks`, `apply` |

### `review` — Review Mode

| Aspect | Value |
|--------|-------|
| **Philosophy** | Read first, critique second, never modify |
| **Tool Priority** | Read > Grep > Glob |
| **Behavior** | Thoroughly read all relevant code before commenting. Classify findings by severity. Never edit files unless explicitly asked. Focus on correctness, security, performance, and maintainability. |
| **Response Style** | Structured issue lists with severity badges. Cite file:line for every finding. |
| **Auto-trigger** | Workflow stages: `review`, `clarify` |

### `research` — Research Mode

| Aspect | Value |
|--------|-------|
| **Philosophy** | Understand deeply before acting |
| **Tool Priority** | Read > WebSearch > Grep > Glob |
| **Behavior** | Explore the codebase and external resources comprehensively. Build a mental model of architecture before suggesting changes. Defer implementation until understanding is solid. Produce summaries and diagrams. |
| **Response Style** | Explanatory, with architecture descriptions and trade-off analysis. Avoid code generation unless specifically asked. |
| **Auto-trigger** | Workflow stages: `constitution`, `specify`, `routing-complete` |

### `debug` — Debug Mode

| Aspect | Value |
|--------|-------|
| **Philosophy** | Hypothesis-driven investigation |
| **Tool Priority** | Grep > Bash > Read > Glob |
| **Behavior** | Form hypotheses about root causes and systematically verify them. Use grep to find patterns, bash to run diagnostic commands, and read to examine specific code. Maintain a structured hypothesis list with status (confirmed/rejected/pending). |
| **Response Style** | Hypothesis list format with evidence for each. Step-by-step diagnostic commands. |
| **Auto-trigger** | Workflow stages: `debug` |

## Auto-Detection Mapping

When `--auto` flag is used, the context mode is determined from `state.json` → `currentStage`:

| `currentStage` | Context Mode |
|----------------|-------------|
| `routing-complete` | research |
| `planning-complete` | research |
| `constitution` | research |
| `specify` | research |
| `clarify` | review |
| `plan` | research |
| `tasks` | dev |
| `implementation` | dev |
| `apply` | dev |
| `review` | review |
| `debug` | debug |
| `execution-started` | dev |
| `null` or missing | dev (default) |

## State Integration

When a context mode is activated, update `state.json`:

```json
{
  "activeContext": "dev|review|research|debug",
  "contextSetAt": "<ISO timestamp>",
  "contextSetBy": "manual|auto"
}
```

## Usage in Commands

Commands should check `state.json` → `activeContext` and adjust behavior:

1. **Tool selection**: Prefer tools higher in the mode's priority list
2. **Response verbosity**: `dev` = terse, `research` = detailed, `review` = structured, `debug` = step-by-step
3. **Proactive actions**: `dev` mode may auto-edit; other modes should ask before modifying files
