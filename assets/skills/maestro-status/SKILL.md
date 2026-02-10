---
description: "Workflow status report: state, config, and next-step suggestions"
allowed-tools:
  - Read
  - Glob
  - Grep
disable-model-invocation: true
---

# Maestro Status — Workflow State Report

You are the Maestro status reporter. Your job is to read the current workflow state and present a clear progress report to the user.

## Input

The user's arguments are: `$ARGUMENTS`

Parse `$ARGUMENTS` for the `--detail` flag. If present, enable detailed output mode.

## Step 1: Load State

1. Read `.maestro/state.json` from the current working directory
2. If found and `targetProject` points to a path different from CWD:
   - Inform the user: "Note: The workflow target project is located at `<targetProject>`"
   - If `<targetProject>/.maestro/state.json` also exists, offer the option to load state from the target project instead
3. If not found in CWD, report that no active workflow is found

## Step 2: Load Config

Read `.maestro/config.json` if it exists, to report tool availability.

### Slash Commands Detection

Check slash command registration status for the status report:

1. **From config**: If `config.json` has a `slashCommands` section, use those values
2. **Fallback to filesystem**: If `slashCommands` is not in config, check directly:
   - spec-kit: Look for files matching `.claude/commands/speckit.*.md` in the target project
   - openspec: Look for directory `.claude/commands/opsx/` containing `.md` files in the target project
3. Report the status in the output (see Step 3 format)
4. If the **active workflow's** slash commands are not registered, highlight this prominently with initialization guidance

## Step 3: Present Report

Format the output as:

```
Maestro — Workflow Status

Target project: <path>
Active workflow: <spec-kit | openspec | none>
Current stage: <stage name>
Requirement: <brief summary>

Key Decisions:
  - <stage>: <decision> (<reason>)
  ...
  {N} older decisions archived  (only if archivedDecisionsCount > 0)

Slash Commands:
  spec-kit (/speckit.*): Registered / Not initialized -> Run: specify init --here --ai claude
  openspec (/opsx:*): Registered / Not initialized -> Run: openspec init --tools claude

Multi-model: <Available / Degraded / Unavailable>
  - codex: available / unavailable
  - gemini: available / unavailable

Last activity: <timestamp>

Next step: <recommended next command to run>
```

## Step 4: Suggest Next Action

Based on the current stage, suggest what the user should do next:

| Current Stage | Workflow | Suggested Next |
|--------------|----------|---------------|
| routing-complete | spec-kit | `/speckit.constitution` |
| constitution | spec-kit | `/speckit.specify` |
| specify | spec-kit | `/speckit.clarify` |
| clarify | spec-kit | `/speckit.plan` |
| plan | spec-kit | `/speckit.tasks` |
| tasks | spec-kit | `/speckit.implement` |
| routing-complete | openspec | `/opsx:new <feature>` |
| new | openspec | `/opsx:ff` |
| ff | openspec | `/opsx:apply` |
| apply | openspec | `/opsx:archive` |

If no active workflow, suggest `/maestro-go <requirement>` to start.

## Step 5: Detail Mode (only if `--detail` flag is present)

When `--detail` is enabled, append the following additional sections to the report:

### Score Breakdown Table

If `routingResult.scoreBreakdown` exists in state.json, display a table:

```
Score Breakdown:
  Factor          | Value | Greenfield | Brownfield
  ----------------|-------|------------|----------
  sourceFiles     | 3     | +2         | 0
  gitCommits      | 15    | 0          | +2
  configFiles     | 1     | 0          | +1
  sourceDirs      | 1     | 0          | +1
  readme          | 1     | 0          | +1
```

### Semantic Signal Matches

If `routingResult.semanticMatches` exists, display:

```
Semantic Signals:
  Greenfield matches: "from scratch", "new project"
  Brownfield matches: (none)
```

### Consultation Records

List files in `.maestro/consultations/` directory:

```
Consultation Records:
  - codex-2024-01-15T10:30:00.md
  - gemini-2024-01-15T10:31:00.md
```

### Key Decisions Timeline

Display `keyDecisions` as a timeline:

```
Decision Timeline:
  [2024-01-15 10:30] routing-complete: Detected greenfield project (auto-detect, confidence: high)
  [2024-01-15 10:35] consultation: Multi-model consultation on architecture design
```

If `archivedDecisionsCount > 0` in state.json, also read `.maestro/summaries/decisions-archive.md` and prepend archived decisions to the timeline to show the complete chronological history. Mark archived entries with a `[archived]` prefix:

```
Decision Timeline (including 5 archived):
  [archived] [2024-01-14 09:00] routing-complete: Initial routing decision (archived)
  [archived] [2024-01-14 09:15] consultation: Early architecture review (archived)
  ...
  [2024-01-15 10:30] routing-complete: Detected greenfield project (auto-detect, confidence: high)
  [2024-01-15 10:35] consultation: Multi-model consultation on architecture design
```

If `decisions-archive.md` does not exist despite `archivedDecisionsCount > 0`, display:
```
  {N} decisions were archived (archive file not found)
```
