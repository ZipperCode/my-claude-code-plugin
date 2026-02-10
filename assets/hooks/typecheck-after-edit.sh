#!/usr/bin/env bash
# PostToolUse(Edit|Write) hook — run TypeScript type-check after .ts/.tsx edits
# Reads JSON from stdin, extracts file_path.
# Only triggers for TypeScript files. Outputs errors to stderr (user-visible).
# Always exits 0 (never blocks edits).

set -euo pipefail

# Read tool input from stdin
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null)

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

EXT="${FILE_PATH##*.}"

# Only check TypeScript files
if [ "$EXT" != "ts" ] && [ "$EXT" != "tsx" ]; then
  exit 0
fi

# Check if tsconfig.json exists in the project
PROJECT_DIR=$(dirname "$FILE_PATH")
while [ "$PROJECT_DIR" != "/" ]; do
  if [ -f "$PROJECT_DIR/tsconfig.json" ]; then
    break
  fi
  PROJECT_DIR=$(dirname "$PROJECT_DIR")
done

if [ ! -f "$PROJECT_DIR/tsconfig.json" ]; then
  exit 0
fi

# Run type check
if command -v npx &>/dev/null; then
  ERRORS=$(cd "$PROJECT_DIR" && npx tsc --noEmit --pretty 2>&1 | head -20) || true
  if [ -n "$ERRORS" ] && echo "$ERRORS" | grep -q "error TS"; then
    echo "--- TypeScript type-check warnings ---" >&2
    echo "$ERRORS" >&2
    echo "--------------------------------------" >&2
  fi
fi

exit 0
