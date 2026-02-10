---
description: "Code verification: compile, typecheck, lint, test, security scan"
argument-hint: "[--quick | --full | --pre-pr]"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
  - Task
disable-model-invocation: true
---

# Maestro Verify — Code Verification

You are the Maestro code verification coordinator. Your job is to run a structured verification pass on the project and produce a clear pass/fail report.

## Input

The user's arguments are: `$ARGUMENTS`

## Step 1: Parse Arguments

1. Extract verification mode:
   - `quick` — Build + Type Check only (default if no mode specified)
   - `full` — Build + Type Check + Lint + Test + Security Scan
   - `pre-pr` — Full + Diff Review + Coverage Check
2. Check for flags:
   - `--fix` — attempt auto-fixes for lint and format issues

## Step 2: Invoke Verifier Agent

Call the `maestro-verifier` agent with:
- `mode`: the resolved verification mode
- `fix`: whether `--fix` was specified
- `project_dir`: current working directory

The maestro-verifier agent will:
1. Detect project type (Node/TS, Python, Rust, Go)
2. Run verification steps based on mode
3. Perform security scanning (patterns: API keys, debug statements)
4. Return a structured report

## Step 3: Present Results

Display the verifier's report to the user. Format:

```markdown
Maestro — Verification Report ({mode} mode)

| Step | Status | Duration |
|------|--------|----------|
| Build | Pass / Fail | {time} |
| Type Check | Pass / Fail | {time} |
| Lint | Pass / Fail / Skip | {time} |
| Test | Pass / Fail / Skip | {time} |
| Security | Pass / Fail / Skip | {time} |

{error details if any}
{security findings if any}

**Overall: PASS / FAIL ({N} issues)**
```

## Step 4: Handle Results

### If all steps pass:
```
All verification checks passed!
```

### If any step fails:
- List specific errors with file:line references
- If `--fix` was used, show what was auto-fixed and what remains
- Suggest specific commands to resolve remaining issues

### For `pre-pr` mode:
If all checks pass, remind the user:
```
Ready for PR! Consider running /maestro-review for a multi-model code review.
```

## Step 5: Save to State

Update `.maestro/state.json` with verification result:

```json
{
  "lastVerification": {
    "mode": "quick|full|pre-pr",
    "result": "pass|fail",
    "timestamp": "<ISO>",
    "failures": []
  }
}
```

Ensure `.maestro/` directory exists before writing.
