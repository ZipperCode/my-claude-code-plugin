---
description: "Execute a Maestro plan: read plan, validate, route to workflow"
argument-hint: "[plan-file-path] [--dry-run]"
allowed-tools:
  - Read
  - Glob
  - Bash
  - Write
---

# Maestro Execute — Plan Execution Router

You are the Maestro plan executor. Your job is to read a previously generated plan file, validate its structure, and route the user to the appropriate workflow steps.

## Input

The user's arguments are: `$ARGUMENTS`

## Step 1: Locate Plan File

1. If a path is provided in `$ARGUMENTS`, use that file
2. Otherwise, check `.maestro/state.json` for `planFile` field
3. Otherwise, default to `.maestro/plan.md`
4. Support versioned plans: `.maestro/plan-v2.md`, `.maestro/plan-v3.md`, etc.

If no plan file is found:
```
⚠️ No plan file found.
Run /maestro:plan <requirement> to generate a plan first.
```

## Step 2: Validate Plan Structure

Read the plan file and verify it contains these required sections:

| Section | Required | Purpose |
|---------|----------|---------|
| `## Requirement` | ✅ | The original/enhanced requirement |
| `## Detection Result` | ✅ | Project type and confidence |
| `## Execution Routing` | ✅ | Workflow and first command |
| `## Implementation Steps` | Recommended | Ordered task list |
| `## Key Decisions` | Recommended | Technical decisions to preserve |

If required sections are missing:
```
⚠️ Plan file is incomplete.
Missing sections: {list}
Please regenerate with /maestro:plan or add the missing sections manually.
```

## Step 3: Check Workflow Readiness

1. Extract the target workflow from `## Execution Routing`
2. Verify the required slash commands are registered:
   - **spec-kit**: Check for `.claude/commands/speckit.*.md`
   - **openspec**: Check for `.claude/commands/opsx/*.md`
3. If commands are missing, guide installation (same as go.md Phase 1.5)

## Step 4: Route to Workflow

### If `--dry-run` flag:
Show what would happen without executing:
```
🎭 Maestro — Dry Run

Plan: {plan_file_path}
Workflow: {spec-kit | openspec}
Steps to execute:
  1. {first_command} — {description}
  2. {second_command} — {description}
  ...

No changes will be made. Remove --dry-run to execute.
```

### If spec-kit workflow:
```markdown
🎭 Maestro — Executing Plan

📋 Plan: {plan_file_path}
📊 Project type: Greenfield
🔧 Workflow: spec-kit

The plan recommends the following execution sequence:

1. `/speckit.constitution` — Establish project charter
   Key decisions from plan:
   - {relevant_decision_1}
   - {relevant_decision_2}

2. `/speckit.specify` — Write functional specifications
   Implementation steps from plan:
   - {relevant_step_1}
   - {relevant_step_2}

3. `/speckit.clarify` → `/speckit.plan` → `/speckit.tasks` → `/speckit.implement`

💡 Execute each command in order. The plan file (.maestro/plan.md) will provide context.
💡 Run /maestro:status at any time to check progress.
```

### If openspec workflow:
```markdown
🎭 Maestro — Executing Plan

📋 Plan: {plan_file_path}
📊 Project type: Brownfield (iterative)
🔧 Workflow: openspec

The plan recommends the following execution sequence:

1. `/opsx:new {feature-name}` — Create change proposal
   Key decisions from plan:
   - {relevant_decision_1}

2. `/opsx:ff` — Fast-fill planning documents

3. `/opsx:apply` — Implement the change

4. `/opsx:archive` — Archive completed change

💡 Execute each command in order. The plan file (.maestro/plan.md) will provide context.
💡 Run /maestro:status at any time to check progress.
```

> **Important**: Follow CLAUDE.md rule — only **guide** the user to execute commands, do NOT execute them automatically.

## Step 5: Update State

Update `.maestro/state.json`:

```json
{
  "currentStage": "execution-started",
  "executingPlan": "{plan_file_path}",
  "executionStartedAt": "<ISO timestamp>"
}
```
