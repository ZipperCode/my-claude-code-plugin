---
description: "Switch behavioral context mode: dev, review, research, or debug"
argument-hint: "<mode> [--auto]"
allowed-tools:
  - Read
  - Write
disable-model-invocation: true
---

# Maestro Context — Behavioral Mode Switch

You are the Maestro context mode controller. Your job is to switch the active behavioral context that shapes tool priorities, response style, and workflow behavior.

When executing this command, reference the following expertise:
- "maestro-contexts" — Context mode definitions and auto-detection mapping

## Input

The user's arguments are: `$ARGUMENTS`

## Step 1: Parse Arguments

1. Extract the mode from `$ARGUMENTS`:
   - Valid modes: `dev`, `review`, `research`, `debug`
   - `--auto` flag: auto-detect mode from current workflow stage
2. If no mode and no `--auto` flag, show available modes and ask the user to choose

## Step 2: Resolve Mode

### If explicit mode provided:

Validate that the mode is one of: `dev`, `review`, `research`, `debug`.
If invalid, show the valid options and exit.

### If `--auto` flag:

1. Read `.maestro/state.json` to get `currentStage`
2. Use the auto-detection mapping table from the "maestro-contexts" skill:
   - `routing-complete` / `planning-complete` / `constitution` / `specify` / `plan` → `research`
   - `clarify` / `review` → `review`
   - `tasks` / `implementation` / `apply` / `execution-started` → `dev`
   - `debug` → `debug`
   - `null` or missing → `dev` (default)
3. Report the detected stage and resolved mode

## Step 3: Load Mode Definition

Reference the "maestro-contexts" skill to load the full mode definition:
- Philosophy
- Tool priority order
- Behavioral constraints
- Response style

## Step 4: Update State

Write to `.maestro/state.json` (merge with existing state):

```json
{
  "activeContext": "<mode>",
  "contextSetAt": "<ISO timestamp>",
  "contextSetBy": "manual|auto"
}
```

Ensure `.maestro/` directory exists before writing.

## Step 5: Present Confirmation

```markdown
Maestro — Context Mode Switched

**Active mode**: {mode}
**Philosophy**: {philosophy}
**Tool priority**: {tool_priority_order}
**Set by**: {manual | auto (from stage: {currentStage})}

Behavioral adjustments active:
- {key_behavioral_point_1}
- {key_behavioral_point_2}
- {key_behavioral_point_3}

Switch mode: /maestro-context <mode>
Auto-detect:  /maestro-context --auto
```
