#!/usr/bin/env bash
# PreToolUse(Bash) hook — detect debug statements before git commit
# Reads JSON from stdin, extracts the bash command.
# Only activates when the command contains "git commit".
# Scans staged files for debug statements (console.log, debugger, print, etc.).
# Exit 2 = block the commit, Exit 0 = allow.

set -euo pipefail

# Read tool input from stdin
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null)

if [ -z "$COMMAND" ]; then
  exit 0
fi

# Only check when command involves git commit
if ! echo "$COMMAND" | grep -qE "git\s+commit"; then
  exit 0
fi

# Get staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM 2>/dev/null) || exit 0

if [ -z "$STAGED_FILES" ]; then
  exit 0
fi

FOUND_DEBUG=0
DEBUG_REPORT=""

while IFS= read -r file; do
  [ -f "$file" ] || continue

  EXT="${file##*.}"
  PATTERNS=""

  case "$EXT" in
    ts|tsx|js|jsx|mjs|mts|vue|svelte)
      PATTERNS="console\.(log|debug|warn|info|trace|dir)\b|^\s*debugger\s*;?"
      ;;
    py)
      PATTERNS="^\s*(print\(|breakpoint\(\)|import\s+pdb|pdb\.set_trace)"
      ;;
    go)
      PATTERNS="fmt\.Print(ln|f)?\("
      ;;
    rs)
      PATTERNS="(println!|dbg!|eprintln!)\("
      ;;
    *)
      continue
      ;;
  esac

  MATCHES=$(git diff --cached -- "$file" | grep "^+" | grep -v "^+++" | grep -En "$PATTERNS" 2>/dev/null) || true

  if [ -n "$MATCHES" ]; then
    FOUND_DEBUG=1
    DEBUG_REPORT="${DEBUG_REPORT}\n  ${file}:\n${MATCHES}\n"
  fi
done <<< "$STAGED_FILES"

if [ "$FOUND_DEBUG" -eq 1 ]; then
  echo "--- Debug Statement Detection ---" >&2
  echo "Found debug statements in staged files:" >&2
  echo -e "$DEBUG_REPORT" >&2
  echo "Remove debug statements before committing, or use --no-verify to bypass." >&2
  echo "---------------------------------" >&2
  exit 2
fi

exit 0
