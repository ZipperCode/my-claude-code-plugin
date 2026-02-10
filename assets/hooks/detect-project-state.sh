#!/usr/bin/env bash
# Maestro project state detection script
# Analyzes a target directory to determine greenfield vs brownfield

set -euo pipefail

TARGET_DIR="${1:-.}"
VERBOSE=false
if [ "${2:-}" = "--verbose" ]; then VERBOSE=true; fi

log_v() { [ "$VERBOSE" = true ] && echo "[DETECT] $*" >&2 || true; }

if [ ! -d "$TARGET_DIR" ]; then
  echo '{"error": "Target directory does not exist: '"$TARGET_DIR"'"}'
  exit 1
fi

cd "$TARGET_DIR"

# --- Scoring ---
GREENFIELD_SCORE=0
BROWNFIELD_SCORE=0
SCORE_BREAKDOWN=""

add_breakdown() {
  local factor="$1" value="$2" gf="$3" bf="$4"
  if [ -n "$SCORE_BREAKDOWN" ]; then
    SCORE_BREAKDOWN="${SCORE_BREAKDOWN},"
  fi
  SCORE_BREAKDOWN="${SCORE_BREAKDOWN}
    {\"factor\": \"$factor\", \"value\": $value, \"greenfield\": $gf, \"brownfield\": $bf}"
}

# 1. Source file count
SRC_COUNT=$(find . -maxdepth 3 -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.py" -o -name "*.go" -o -name "*.rs" -o -name "*.java" -o -name "*.vue" -o -name "*.svelte" \) ! -path "*/node_modules/*" ! -path "*/.git/*" ! -path "*/dist/*" ! -path "*/build/*" ! -path "*/__pycache__/*" 2>/dev/null | wc -l)

if [ "$SRC_COUNT" -eq 0 ]; then
  GREENFIELD_SCORE=$((GREENFIELD_SCORE + 3))
  add_breakdown "sourceFiles" "$SRC_COUNT" 3 0
  log_v "sourceFiles: count=$SRC_COUNT → greenfield +3"
elif [ "$SRC_COUNT" -le 3 ]; then
  GREENFIELD_SCORE=$((GREENFIELD_SCORE + 2))
  add_breakdown "sourceFiles" "$SRC_COUNT" 2 0
  log_v "sourceFiles: count=$SRC_COUNT → greenfield +2"
elif [ "$SRC_COUNT" -le 10 ]; then
  GREENFIELD_SCORE=$((GREENFIELD_SCORE + 1))
  add_breakdown "sourceFiles" "$SRC_COUNT" 1 0
  log_v "sourceFiles: count=$SRC_COUNT → greenfield +1"
elif [ "$SRC_COUNT" -le 50 ]; then
  BROWNFIELD_SCORE=$((BROWNFIELD_SCORE + 1))
  add_breakdown "sourceFiles" "$SRC_COUNT" 0 1
  log_v "sourceFiles: count=$SRC_COUNT → brownfield +1"
else
  BROWNFIELD_SCORE=$((BROWNFIELD_SCORE + 2))
  add_breakdown "sourceFiles" "$SRC_COUNT" 0 2
  log_v "sourceFiles: count=$SRC_COUNT → brownfield +2"
fi

# 2. Git commit count (supports monorepo subdirectories)
GIT_COMMITS=0
GIT_ROOT=""
if git rev-parse --git-dir &>/dev/null; then
  GIT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo "")
  GIT_COMMITS=$(git rev-list --count HEAD 2>/dev/null || echo 0)
fi

if [ "$GIT_COMMITS" -eq 0 ]; then
  GREENFIELD_SCORE=$((GREENFIELD_SCORE + 3))
  add_breakdown "gitCommits" "$GIT_COMMITS" 3 0
  log_v "gitCommits: count=$GIT_COMMITS → greenfield +3"
elif [ "$GIT_COMMITS" -le 3 ]; then
  GREENFIELD_SCORE=$((GREENFIELD_SCORE + 2))
  add_breakdown "gitCommits" "$GIT_COMMITS" 2 0
  log_v "gitCommits: count=$GIT_COMMITS → greenfield +2"
elif [ "$GIT_COMMITS" -le 10 ]; then
  GREENFIELD_SCORE=$((GREENFIELD_SCORE + 1))
  add_breakdown "gitCommits" "$GIT_COMMITS" 1 0
  log_v "gitCommits: count=$GIT_COMMITS → greenfield +1"
elif [ "$GIT_COMMITS" -le 50 ]; then
  BROWNFIELD_SCORE=$((BROWNFIELD_SCORE + 1))
  add_breakdown "gitCommits" "$GIT_COMMITS" 0 1
  log_v "gitCommits: count=$GIT_COMMITS → brownfield +1"
else
  BROWNFIELD_SCORE=$((BROWNFIELD_SCORE + 2))
  add_breakdown "gitCommits" "$GIT_COMMITS" 0 2
  log_v "gitCommits: count=$GIT_COMMITS → brownfield +2"
fi

# 3. Package/config files
HAS_CONFIG=false
for f in package.json pyproject.toml Cargo.toml go.mod pom.xml build.gradle; do
  if [ -f "$f" ]; then
    HAS_CONFIG=true
    break
  fi
done

if [ "$HAS_CONFIG" = true ]; then
  BROWNFIELD_SCORE=$((BROWNFIELD_SCORE + 1))
  add_breakdown "configFiles" 1 0 1
  log_v "configFiles: found → brownfield +1"
else
  GREENFIELD_SCORE=$((GREENFIELD_SCORE + 1))
  add_breakdown "configFiles" 0 1 0
  log_v "configFiles: not found → greenfield +1"
fi

# 4. Source directories
HAS_SRC_DIR=false
for d in src app lib pkg cmd internal components pages routes api services; do
  if [ -d "$d" ]; then
    HAS_SRC_DIR=true
    break
  fi
done

if [ "$HAS_SRC_DIR" = true ]; then
  BROWNFIELD_SCORE=$((BROWNFIELD_SCORE + 1))
  add_breakdown "sourceDirs" 1 0 1
  log_v "sourceDirs: found → brownfield +1"
else
  GREENFIELD_SCORE=$((GREENFIELD_SCORE + 1))
  add_breakdown "sourceDirs" 0 1 0
  log_v "sourceDirs: not found → greenfield +1"
fi

# 5. README with substance
README_SUBSTANCE=false
if [ -f "README.md" ]; then
  LINE_COUNT=$(wc -l < README.md 2>/dev/null || echo 0)
  if [ "$LINE_COUNT" -gt 10 ]; then
    README_SUBSTANCE=true
  fi
fi

if [ "$README_SUBSTANCE" = true ]; then
  BROWNFIELD_SCORE=$((BROWNFIELD_SCORE + 1))
  add_breakdown "readme" 1 0 1
  log_v "readme: substantive (>10 lines) → brownfield +1"
else
  GREENFIELD_SCORE=$((GREENFIELD_SCORE + 1))
  add_breakdown "readme" 0 1 0
  log_v "readme: absent or minimal → greenfield +1"
fi

# 5.5 Workspace / monorepo detection
IS_MONOREPO=false
WORKSPACE_TYPE=""
SEARCH_DIR="$(pwd)"
while [ "$SEARCH_DIR" != "/" ]; do
  for wf in "$SEARCH_DIR/pnpm-workspace.yaml" "$SEARCH_DIR/lerna.json" \
            "$SEARCH_DIR/turbo.json" "$SEARCH_DIR/nx.json"; do
    if [ -f "$wf" ]; then
      IS_MONOREPO=true
      WORKSPACE_TYPE=$(basename "$wf" | sed 's/\..*//')
      break 2
    fi
  done
  if [ -f "$SEARCH_DIR/package.json" ] && grep -q '"workspaces"' "$SEARCH_DIR/package.json" 2>/dev/null; then
    IS_MONOREPO=true
    WORKSPACE_TYPE="npm-workspaces"
    break
  fi
  SEARCH_DIR=$(dirname "$SEARCH_DIR")
done

# 6. Existing workflow directories
HAS_SPECIFY=false
HAS_OPENSPEC=false
if [ -d ".specify" ]; then
  HAS_SPECIFY=true
fi
if [ -d "openspec" ]; then
  HAS_OPENSPEC=true
fi

# --- Output ---
log_v "Final scores: greenfield=$GREENFIELD_SCORE, brownfield=$BROWNFIELD_SCORE"
cat <<ENDJSON
{
  "targetDir": "$(pwd)",
  "scores": {
    "greenfield": $GREENFIELD_SCORE,
    "brownfield": $BROWNFIELD_SCORE
  },
  "details": {
    "sourceFileCount": $SRC_COUNT,
    "gitCommits": $GIT_COMMITS,
    "gitRoot": "$GIT_ROOT",
    "isMonorepo": $IS_MONOREPO,
    "workspaceType": "$WORKSPACE_TYPE",
    "hasConfigFile": $HAS_CONFIG,
    "hasSourceDir": $HAS_SRC_DIR,
    "hasSubstantiveReadme": $README_SUBSTANCE,
    "hasSpecifyDir": $HAS_SPECIFY,
    "hasOpenspecDir": $HAS_OPENSPEC
  },
  "scoreBreakdown": [$SCORE_BREAKDOWN
  ],
  "recommendation": "$(
    if [ "$HAS_SPECIFY" = true ]; then
      echo "continue-speckit"
    elif [ "$HAS_OPENSPEC" = true ]; then
      echo "continue-openspec"
    elif [ "$GREENFIELD_SCORE" -gt "$BROWNFIELD_SCORE" ]; then
      echo "greenfield"
    elif [ "$BROWNFIELD_SCORE" -gt "$GREENFIELD_SCORE" ]; then
      echo "brownfield"
    else
      echo "ambiguous"
    fi
  )"
}
ENDJSON
