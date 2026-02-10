---
description: "Multi-model code review with cross-analysis and unified report"
argument-hint: "[--base <branch>] [--files <glob>]"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
  - Task
disable-model-invocation: true
---

# Maestro Review — Multi-Model Code Review

You are the Maestro code review coordinator. Your job is to automatically collect code changes, invoke external models for cross-perspective review, and synthesize a unified review report.

When executing this command, reference the following expertise:
- "maestro-role-prompts" — Use the `reviewer` role templates for codex/gemini
- "maestro-mcp-protocols" — MCP invocation conventions for codex/gemini
- "maestro-token-management" — Token control strategies

## Input

The user's arguments are: `$ARGUMENTS`

## Step 1: Parse Arguments

1. Check for flags:
   - `--scope <path>` → limit review to specific directory or file
   - `--backend-only` → only invoke codex review
   - `--frontend-only` → only invoke gemini review
   - `--staged` → review only staged changes (`git diff --cached`)
   - `--branch <base>` → compare against specific branch (default: auto-detect main/master)
   - Default: review all uncommitted changes with both models
2. If no flags, default to reviewing uncommitted changes (`git diff`)

## Step 2: Collect Changes

1. **Detect base branch** (if not specified by `--branch`):
   ```bash
   git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@' || echo "main"
   ```

2. **Collect diff** based on mode:
   - Default: `git diff` (unstaged changes)
   - `--staged`: `git diff --cached`
   - `--branch <base>`: `git diff <base>...HEAD`

3. **Scope filtering**: If `--scope` specified, append `-- <path>` to the diff command

4. **Collect context**:
   - Run `git diff --stat` (same flags) to get a file change summary
   - If diff is very large (>5000 lines), summarize by file and only include the most critical sections

5. **Empty check**: If no changes detected, inform the user and exit:
   ```
   No changes detected for review. Working tree is clean.
   ```

## Step 3: Check Availability & Resolve Policy

Read `.maestro/config.json` to determine:
- Model availability: `mcp.codex`, `mcp.gemini`
- Policy settings: resolve from `policy.preset` + `policy.custom` overrides

## Step 4: Prepare Review Context

Compose a review context package:
1. **Change summary**: File list with change stats (+/- lines)
2. **Full diff**: The actual code changes
3. **Project context**: Brief project description from `package.json` / `pyproject.toml` / `state.json`

## Step 5: Invoke Models (Parallel)

Use the `reviewer` role templates from "maestro-role-prompts" skill. Invoke both models **simultaneously in a single tool-call batch**.

### Backend Review (codex)

If codex is available and not `--frontend-only`:

Call `mcp__codex__codex` with the **reviewer** role template:
```
PROMPT: "<reviewer role template from maestro-role-prompts skill>

**Changes Summary**: {change_stat_summary}

**Full Diff**:
```diff
{diff_content}
```

**Project Context**: {project_summary}

Review for:
1. **Correctness** — logic errors, edge cases, off-by-one, null/undefined handling
2. **Security** — injection vulnerabilities, auth bypass, data exposure, input validation
3. **Performance** — N+1 queries, unnecessary allocations, missing indexes, blocking operations
4. **Maintainability** — code clarity, naming, single responsibility, test coverage gaps
5. **API contract** — backward compatibility, versioning, error response consistency

Classify each issue: Critical / Warning / Suggestion
{resolved_output_hint}
Use structured format."

cd: "{project_dir}"
sandbox: "read-only"
```

### Frontend Review (gemini)

If gemini is available and not `--backend-only`:

Call `mcp__gemini__gemini` with the **reviewer** role template (**in the same tool-call batch as codex**):
```
PROMPT: "<reviewer role template from maestro-role-prompts skill>

**Changes Summary**: {change_stat_summary}

**Full Diff**:
```diff
{diff_content}
```

**Project Context**: {project_summary}

Review for:
1. **UI correctness** — layout bugs, responsive issues, interaction states
2. **Accessibility** — ARIA, keyboard nav, color contrast, screen reader
3. **Performance** — re-renders, bundle size, unoptimized assets, layout thrashing
4. **UX quality** — loading states, error states, empty states, transitions
5. **Code quality** — component boundaries, prop drilling, CSS organization

Classify each issue: Critical / Warning / Suggestion
{resolved_output_hint}
Use structured format."

sandbox: false
```

**Note**: gemini's `sandbox` is a **boolean** (`false`), NOT a string. Gemini does NOT support `cd` parameter.

### Degradation

- codex unavailable → Claude performs backend review
- gemini unavailable → Claude performs frontend review
- Both unavailable → Claude performs full review solo

## Step 6: Post-Process Responses (Consumer-Side)

For each successful MCP response:

1. **Save full original**: Write to `.maestro/consultations/{tool}-review-{ISO_timestamp}.md`
2. **Extract summary**: Invoke maestro-context-curator agent to produce a structured summary
3. **SESSION_ID follow-up**: If policy allows and response contains incomplete signals, send one follow-up

## Step 7: Synthesize Review Report

Cross-reference both reviews to produce:

1. **Deduplicate**: Remove issues found by both models (keep the more detailed description)
2. **Classify by severity**: Group all issues as Critical -> Warning -> Suggestion
3. **Highlight cross-cutting concerns**: Issues that affect both backend and frontend (e.g., API contract changes)

## Step 8: Present Output

```markdown
Maestro — Code Review Report

## Change Summary
{file_change_stats}

## Critical Issues ({count})
{critical_issues_list}

## Warnings ({count})
{warning_issues_list}

## Suggestions ({count})
{suggestion_issues_list}

## Backend Perspective {codex | Claude}
{backend_review_summary}

## Frontend Perspective {gemini | Claude}
{frontend_review_summary}

## Cross-Cutting Concerns
{cross_cutting_issues}

## Overall Assessment
{overall_quality_assessment}

---
Files reviewed: {file_count}
Lines changed: +{additions} / -{deletions}
Models consulted: {list of models used}
Degradation: {none | details}
Full review records: .maestro/consultations/
```

## Step 9: Save to State

Append review record to `.maestro/state.json` under `keyDecisions`:

```json
{
  "stage": "review",
  "decision": "{critical_count} critical, {warning_count} warnings, {suggestion_count} suggestions",
  "reason": "Multi-model code review on {file_count} changed files",
  "models": ["codex", "gemini"],
  "timestamp": "<ISO>"
}
```

## Step 10: Optional Learning Extraction

If the review uncovered project-specific patterns, conventions, or architectural decisions worth preserving, invoke the `maestro-learning-extractor` agent to capture these insights for future sessions.
