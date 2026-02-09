#!/usr/bin/env bash
# Maestro plugin structure validation script
# Validates that all required files exist, JSON files are valid,
# and no hardcoded absolute paths remain.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ERRORS=0

error() {
  echo "ERROR: $*" >&2
  ERRORS=$((ERRORS + 1))
}

info() {
  echo "CHECK: $*"
}

# --- 1. Required files ---
info "Checking required files..."

REQUIRED_FILES=(
  ".claude-plugin/plugin.json"
  "CLAUDE.md"
  "README.md"
  # Commands — original
  "commands/init.md"
  "commands/go.md"
  "commands/consult.md"
  "commands/status.md"
  # Commands — F2: plan/execute
  "commands/plan.md"
  "commands/execute.md"
  # Commands — F3: context
  "commands/context.md"
  # Commands — F5: verify
  "commands/verify.md"
  # Commands — F6: tools
  "commands/tools.md"
  # Commands — F7: review/debug (already existed)
  "commands/review.md"
  "commands/debug.md"
  # Agents — original
  "agents/workflow-detector.md"
  "agents/quality-gate.md"
  "agents/context-curator.md"
  "agents/model-coordinator.md"
  # Agents — F5: verifier
  "agents/verifier.md"
  # Agents — F7: learning-extractor
  "agents/learning-extractor.md"
  # Scripts — original
  "scripts/detect-project-state.sh"
  "scripts/check-deps.sh"
  # Scripts — F1: hooks
  "scripts/auto-format.sh"
  "scripts/typecheck-after-edit.sh"
  "scripts/detect-debug-statements.sh"
  "scripts/save-state-snapshot.sh"
  # Skills — original
  "skills/workflow-routing/SKILL.md"
  "skills/mcp-protocols/SKILL.md"
  "skills/token-management/SKILL.md"
  "skills/role-prompts/SKILL.md"
  # Skills — F3: contexts
  "skills/contexts/SKILL.md"
  # Skills — F4: rules-guide
  "skills/rules-guide/SKILL.md"
  # Skills — F7: learning
  "skills/learning/SKILL.md"
  # Skills — F8: prompt-enhance
  "skills/prompt-enhance/SKILL.md"
  # Rules — F4
  "rules/common/coding-style.md"
  "rules/common/git-workflow.md"
  "rules/common/testing.md"
  "rules/common/security.md"
  "rules/typescript/patterns.md"
  "rules/typescript/tools.md"
  "rules/python/patterns.md"
  "rules/python/tools.md"
  "rules/rust/patterns.md"
  "rules/rust/tools.md"
  # Other
  "hooks/hooks.json"
  "templates/constitution.md"
)

for f in "${REQUIRED_FILES[@]}"; do
  if [ ! -f "$SCRIPT_DIR/$f" ]; then
    error "Missing required file: $f"
  fi
done

# --- 2. JSON file validation ---
info "Checking JSON files..."

JSON_FILES=(
  ".claude-plugin/plugin.json"
  "hooks/hooks.json"
)

if command -v jq &>/dev/null; then
  for f in "${JSON_FILES[@]}"; do
    filepath="$SCRIPT_DIR/$f"
    if [ -f "$filepath" ]; then
      if ! jq . "$filepath" > /dev/null 2>&1; then
        error "Invalid JSON: $f"
      fi
    fi
  done
elif command -v python3 &>/dev/null; then
  for f in "${JSON_FILES[@]}"; do
    filepath="$SCRIPT_DIR/$f"
    if [ -f "$filepath" ]; then
      if ! python3 -c "import json; json.load(open('$filepath'))" 2>/dev/null; then
        error "Invalid JSON: $f"
      fi
    fi
  done
else
  echo "WARN: Neither jq nor python3 found, skipping JSON validation"
fi

# --- 3. No hardcoded absolute paths ---
info "Checking for hardcoded absolute paths..."

# Search for /home/ patterns in non-test, non-.git files
HARDCODED=$(grep -r "/home/" "$SCRIPT_DIR" \
  --include="*.md" \
  --include="*.sh" \
  --include="*.json" \
  --exclude-dir=".git" \
  --exclude-dir="node_modules" \
  --exclude-dir="tests" \
  -l 2>/dev/null || true)

if [ -n "$HARDCODED" ]; then
  for f in $HARDCODED; do
    # Exclude CLAUDE.md global instructions reference (it's a system path, not plugin path)
    rel_path="${f#$SCRIPT_DIR/}"
    if [ "$rel_path" = "CLAUDE.md" ]; then
      continue
    fi
    error "Hardcoded absolute path found in: $rel_path"
  done
fi

# --- 4. Shell scripts are executable or at least have shebang ---
info "Checking shell scripts..."

SHELL_SCRIPTS=(
  "scripts/detect-project-state.sh"
  "scripts/check-deps.sh"
  "scripts/auto-format.sh"
  "scripts/typecheck-after-edit.sh"
  "scripts/detect-debug-statements.sh"
  "scripts/save-state-snapshot.sh"
)

for f in "${SHELL_SCRIPTS[@]}"; do
  filepath="$SCRIPT_DIR/$f"
  if [ -f "$filepath" ]; then
    if ! head -1 "$filepath" | grep -q "^#!/"; then
      error "Missing shebang in: $f"
    fi
  fi
done

# --- 5. Markdown frontmatter validation ---
info "Checking command/agent markdown frontmatter..."

for f in "$SCRIPT_DIR"/commands/*.md "$SCRIPT_DIR"/agents/*.md; do
  if [ -f "$f" ]; then
    rel_path="${f#$SCRIPT_DIR/}"
    if ! head -1 "$f" | grep -q "^---$"; then
      error "Missing YAML frontmatter in: $rel_path"
    fi
  fi
done

# --- Summary ---
echo ""
if [ "$ERRORS" -eq 0 ]; then
  echo "All checks passed."
  exit 0
else
  echo "FAILED: $ERRORS error(s) found."
  exit 1
fi
