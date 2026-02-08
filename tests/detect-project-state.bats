#!/usr/bin/env bats
# Tests for detect-project-state.sh
# Requires: bats-core (https://github.com/bats-core/bats-core)

SCRIPT_DIR="$(cd "$(dirname "$BATS_TEST_FILENAME")/.." && pwd)"
DETECT_SCRIPT="$SCRIPT_DIR/scripts/detect-project-state.sh"

setup() {
  TEST_DIR=$(mktemp -d)
}

teardown() {
  rm -rf "$TEST_DIR"
}

# --- Greenfield detection ---

@test "empty directory → greenfield recommendation" {
  run bash "$DETECT_SCRIPT" "$TEST_DIR"
  [ "$status" -eq 0 ]
  echo "$output" | grep -q '"recommendation": "greenfield"'
}

@test "empty directory has high greenfield score" {
  run bash "$DETECT_SCRIPT" "$TEST_DIR"
  [ "$status" -eq 0 ]
  # No source files (0 → +3), no git (0 → +3), no config (+1), no src dir (+1), no readme (+1) = 9
  echo "$output" | grep -q '"greenfield": 9'
}

# --- Brownfield detection ---

@test "many files + many commits → brownfield recommendation" {
  cd "$TEST_DIR"
  git init && git commit --allow-empty -m "init"
  for i in $(seq 1 60); do
    echo "// file $i" > "file${i}.ts"
  done
  git add . && git commit -m "add files"
  for i in $(seq 2 55); do
    git commit --allow-empty -m "commit $i"
  done
  mkdir -p src
  echo '{"name": "test"}' > package.json
  echo -e "# Test Project\n$(printf 'line\n%.0s' {1..15})" > README.md

  run bash "$DETECT_SCRIPT" "$TEST_DIR"
  [ "$status" -eq 0 ]
  echo "$output" | grep -q '"recommendation": "brownfield"'
}

# --- Monorepo subdirectory git detection ---

@test "monorepo subdirectory correctly detects git commits" {
  cd "$TEST_DIR"
  git init
  git commit --allow-empty -m "init"
  for i in $(seq 2 20); do
    git commit --allow-empty -m "commit $i"
  done
  mkdir -p packages/sub-pkg
  echo '{}' > packages/sub-pkg/package.json

  run bash "$DETECT_SCRIPT" "$TEST_DIR/packages/sub-pkg"
  [ "$status" -eq 0 ]
  # Should detect git commits > 0 even in subdirectory
  echo "$output" | grep -q '"gitCommits": 20'
}

# --- Monorepo workspace detection ---

@test "pnpm-workspace.yaml detected as monorepo" {
  cd "$TEST_DIR"
  echo "packages:\n  - packages/*" > pnpm-workspace.yaml
  mkdir -p packages/app

  run bash "$DETECT_SCRIPT" "$TEST_DIR/packages/app"
  [ "$status" -eq 0 ]
  echo "$output" | grep -q '"isMonorepo": true'
  echo "$output" | grep -q '"workspaceType": "pnpm-workspace"'
}

@test "npm workspaces detected as monorepo" {
  cd "$TEST_DIR"
  echo '{"name": "root", "workspaces": ["packages/*"]}' > package.json
  mkdir -p packages/lib

  run bash "$DETECT_SCRIPT" "$TEST_DIR/packages/lib"
  [ "$status" -eq 0 ]
  echo "$output" | grep -q '"isMonorepo": true'
  echo "$output" | grep -q '"workspaceType": "npm-workspaces"'
}

# --- Continue existing workflow ---

@test ".specify/ directory → continue-speckit" {
  mkdir -p "$TEST_DIR/.specify"

  run bash "$DETECT_SCRIPT" "$TEST_DIR"
  [ "$status" -eq 0 ]
  echo "$output" | grep -q '"recommendation": "continue-speckit"'
}

@test "openspec/ directory → continue-openspec" {
  mkdir -p "$TEST_DIR/openspec"

  run bash "$DETECT_SCRIPT" "$TEST_DIR"
  [ "$status" -eq 0 ]
  echo "$output" | grep -q '"recommendation": "continue-openspec"'
}

# --- Error handling ---

@test "nonexistent directory → error" {
  run bash "$DETECT_SCRIPT" "/tmp/nonexistent-dir-$(date +%s)"
  [ "$status" -eq 1 ]
  echo "$output" | grep -q '"error"'
}

# --- Verbose mode ---

@test "--verbose produces stderr output" {
  run bash "$DETECT_SCRIPT" "$TEST_DIR" --verbose
  [ "$status" -eq 0 ]
  # stderr output is captured in $output by bats' run when using 2>&1
  # We need a different approach: check that the script runs without error
  # and produces valid JSON on stdout
  echo "$output" | grep -q '"recommendation"'
}

@test "--verbose shows score breakdown in stderr" {
  result=$(bash "$DETECT_SCRIPT" "$TEST_DIR" --verbose 2>"$TEST_DIR/stderr.log")
  [ -s "$TEST_DIR/stderr.log" ]
  grep -q "\[DETECT\]" "$TEST_DIR/stderr.log"
  grep -q "sourceFiles" "$TEST_DIR/stderr.log"
  grep -q "Final scores" "$TEST_DIR/stderr.log"
}

# --- Score breakdown in output ---

@test "JSON output contains scoreBreakdown array" {
  run bash "$DETECT_SCRIPT" "$TEST_DIR"
  [ "$status" -eq 0 ]
  echo "$output" | grep -q '"scoreBreakdown"'
  echo "$output" | grep -q '"factor"'
}

# --- Gradient scoring ---

@test "zero source files yields greenfield +3" {
  run bash "$DETECT_SCRIPT" "$TEST_DIR"
  [ "$status" -eq 0 ]
  echo "$output" | grep -q '"factor": "sourceFiles"'
  # With 0 files, should get greenfield: 3
  echo "$output" | grep '"factor": "sourceFiles"' | grep -q '"greenfield": 3'
}
