#!/usr/bin/env bash
# PostToolUse(Edit|Write) hook — auto-format edited files by extension
# Reads JSON from stdin, extracts file_path, selects formatter by extension.
# Always exits 0 (graceful degradation — never blocks edits).

set -euo pipefail

# Read tool input from stdin
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null)

if [ -z "$FILE_PATH" ] || [ ! -f "$FILE_PATH" ]; then
  exit 0
fi

EXT="${FILE_PATH##*.}"

case "$EXT" in
  ts|tsx|js|jsx|mjs|mts|json|css|scss|html|vue|svelte)
    if command -v npx &>/dev/null && [ -f "node_modules/.bin/prettier" ] || npx prettier --version &>/dev/null 2>&1; then
      npx prettier --write "$FILE_PATH" 2>/dev/null || true
    fi
    ;;
  py)
    if command -v ruff &>/dev/null; then
      ruff format "$FILE_PATH" 2>/dev/null || true
    elif command -v black &>/dev/null; then
      black --quiet "$FILE_PATH" 2>/dev/null || true
    fi
    ;;
  go)
    if command -v gofmt &>/dev/null; then
      gofmt -w "$FILE_PATH" 2>/dev/null || true
    fi
    ;;
  rs)
    if command -v rustfmt &>/dev/null; then
      rustfmt "$FILE_PATH" 2>/dev/null || true
    fi
    ;;
  *)
    # No formatter for this extension — silent exit
    ;;
esac

exit 0
