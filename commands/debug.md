---
description: "Multi-model collaborative debugging: accept error info/logs, invoke codex + gemini for parallel diagnosis from backend and frontend perspectives"
argument-hint: "<error description or log snippet> [--file <path>] [--backend-only | --frontend-only] [--log <log-file-path>]"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
  - Write
  - Task
---

# Maestro Debug — Multi-Model Collaborative Debugging

You are the Maestro debugging coordinator. Your job is to collect error context, invoke external models for multi-perspective diagnosis, and synthesize a unified debugging plan.

When executing this command, reference the following expertise:
- "role prompts" — Use the `debugger` role templates for codex/gemini
- "mcp protocols" — MCP invocation conventions for codex/gemini
- "token management" — Token control strategies

## Input

The user's arguments are: `$ARGUMENTS`

## Step 1: Parse Arguments

1. Extract the error description or log snippet from `$ARGUMENTS`
2. Check for flags:
   - `--file <path>` → the source file where the error occurs
   - `--backend-only` → only invoke codex for diagnosis
   - `--frontend-only` → only invoke gemini for diagnosis
   - `--log <path>` → read additional log file for context
   - Default: diagnose with both models

## Step 2: Collect Error Context

1. **Error description**: From the user's input
2. **Source file** (if `--file` specified):
   - Read the file content (focus on relevant sections)
   - If the error includes a line number, read surrounding context (±30 lines)
3. **Log file** (if `--log` specified):
   - Read the log file (last 200 lines if large)
   - Extract error stack traces and timestamps
4. **Project context**:
   - Read `package.json` / `pyproject.toml` for tech stack info
   - Read `.maestro/state.json` for workflow context if available
5. **Recent changes** (auto-collect):
   - Run `git log --oneline -10` to see recent commits
   - Run `git diff --stat` to see uncommitted changes
   - These may help correlate the error with recent modifications

## Step 3: Classify Error Domain

Analyze the error to determine primary domain:

| Signal | Domain | Primary Model |
|--------|--------|--------------|
| Stack trace with backend framework (Express, Django, Rails, etc.) | Backend | codex |
| Database error (SQL, ORM, connection) | Backend | codex |
| HTTP 5xx, server crash, memory leak | Backend | codex |
| Console error, DOM, CSS, rendering issue | Frontend | gemini |
| React/Vue/Angular error boundary, hydration mismatch | Frontend | gemini |
| Network error (CORS, 4xx, timeout) | Cross-cutting | Both |
| Build error (webpack, vite, compilation) | Cross-cutting | Both |
| Unknown or ambiguous | Cross-cutting | Both |

Even when one domain is primary, the other model may provide supplementary insights (e.g., a backend API change causing frontend errors). Always consult both unless explicitly restricted by flags.

## Step 4: Check Availability & Resolve Policy

Read `.maestro/config.json` to determine:
- Model availability: `mcp.codex`, `mcp.gemini`
- Policy settings: resolve from `policy.preset` + `policy.custom` overrides

## Step 5: Invoke Models (Parallel)

Use the `debugger` role templates from "role prompts" skill. Invoke both models **simultaneously in a single tool-call batch**.

### Backend Diagnosis (codex)

If codex is available and not `--frontend-only`:

Call `mcp__codex__codex` with the **debugger** role template:
```
PROMPT: "<debugger role template from role-prompts skill>

**Error/Symptom**: {error_description}

**Error Context**:
- Source file: {file_path_if_any}
- Stack trace: {stack_trace_if_any}
- Recent changes: {recent_git_changes}

**Project Context**: {project_summary}

Diagnostic approach:
1. **Symptom analysis** — what the error indicates, common causes for this pattern
2. **Root cause hypotheses** — ranked by likelihood, with evidence needed to confirm each
3. **Diagnostic steps** — specific commands, logs, or queries to run (in order)
4. **Fix recommendations** — for each hypothesis, the concrete fix approach
5. **Prevention** — how to avoid this class of error in the future

{resolved_output_hint}
Use structured format."

cd: "{project_dir}"
sandbox: "read-only"
```

### Frontend Diagnosis (gemini)

If gemini is available and not `--backend-only`:

Call `mcp__gemini__gemini` with the **debugger** role template (**in the same tool-call batch as codex**):
```
PROMPT: "<debugger role template from role-prompts skill>

**Error/Symptom**: {error_description}

**Error Context**:
- Source file: {file_path_if_any}
- Console output: {console_errors_if_any}
- Recent changes: {recent_git_changes}

**Project Context**: {project_summary}

Diagnostic approach:
1. **Symptom analysis** — visual bug? Console error? Performance issue? Expected vs actual behavior
2. **Root cause hypotheses** — ranked by likelihood (CSS? State? API timing? Browser compat?)
3. **Diagnostic steps** — DevTools panels, console commands, or test scenarios to isolate the cause
4. **Fix recommendations** — for each hypothesis, the concrete fix
5. **Prevention** — linting rules, test patterns, component patterns to avoid recurrence

{resolved_output_hint}
Use structured format."

sandbox: false
```

**⚠️ Note**: gemini's `sandbox` is a **boolean** (`false`), NOT a string. Gemini does NOT support `cd` parameter.

### Degradation

- codex unavailable → Claude performs backend diagnosis
- gemini unavailable → Claude performs frontend diagnosis
- Both unavailable → Claude performs full diagnosis solo

## Step 6: Post-Process Responses (Consumer-Side)

For each successful MCP response:

1. **Save full original**: Write to `.maestro/consultations/{tool}-debug-{ISO_timestamp}.md`
2. **Extract summary**: Invoke context-curator agent to produce a structured summary
3. **SESSION_ID follow-up**: If policy allows and response contains incomplete signals, send one follow-up

## Step 7: Synthesize Diagnosis

Cross-reference both diagnoses to produce:

1. **Merge hypotheses**: Combine root cause hypotheses from both models, re-rank by combined evidence
2. **Unify diagnostic steps**: Create a single ordered diagnostic plan (avoid redundant steps)
3. **Cross-validate fixes**: Check if one model's fix contradicts the other's analysis
4. **Identify the most likely root cause**: Based on combined analysis

## Step 8: Present Output

```markdown
🎭 Maestro — Debug Diagnosis Report

## 🐛 Error Summary
{error_description_brief}

## 🔍 Error Classification
- **Domain**: {backend | frontend | cross-cutting}
- **Severity**: {critical — service down | high — feature broken | medium — degraded experience | low — cosmetic}
- **Likely Category**: {logic error | configuration | dependency | race condition | data issue | ...}

## 🎯 Root Cause Hypotheses (ranked)

### Hypothesis 1: {most_likely_cause} ⭐ Most Likely
- **Evidence**: {supporting_evidence}
- **Confidence**: {high | medium | low}
- **Source**: {codex | gemini | both}

### Hypothesis 2: {second_cause}
- **Evidence**: {supporting_evidence}
- **Confidence**: {confidence_level}
- **Source**: {source_model}

{... more hypotheses if any}

## 🔬 Diagnostic Steps
1. {first_diagnostic_action}
2. {second_diagnostic_action}
3. {third_diagnostic_action}
{...}

## 🛠️ Recommended Fixes

### For Hypothesis 1:
{concrete_fix_steps}

### For Hypothesis 2:
{concrete_fix_steps}

## 🛡️ Prevention
{how_to_prevent_recurrence}

## 🔧 Backend Perspective {codex | Claude}
{backend_diagnosis_summary}

## 🎨 Frontend Perspective {gemini | Claude}
{frontend_diagnosis_summary}

---
Error domain: {classification}
Models consulted: {list of models used}
Degradation: {none | details}
Full diagnosis records: .maestro/consultations/
```

## Step 9: Save to State

Append debug record to `.maestro/state.json` under `keyDecisions`:

```json
{
  "stage": "debug",
  "decision": "Diagnosed: {most_likely_root_cause}",
  "reason": "Multi-model debugging: {error_brief_description}",
  "models": ["codex", "gemini"],
  "timestamp": "<ISO>"
}
```
