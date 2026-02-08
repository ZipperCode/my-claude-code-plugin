# Maestro Plugin Tests

## Prerequisites

### bats-core (for .bats tests)

```bash
# Ubuntu/Debian
sudo apt install bats

# macOS
brew install bats-core

# npm
npm install -g bats
```

### jq (for JSON validation)

```bash
# Ubuntu/Debian
sudo apt install jq

# macOS
brew install jq
```

## Running Tests

### Run all bats tests

```bash
bats tests/detect-project-state.bats
```

### Run structure validation

```bash
bash tests/validate-structure.sh
```

### Run all tests

```bash
bats tests/*.bats && bash tests/validate-structure.sh
```

## Test Descriptions

### detect-project-state.bats

| Test | Description |
|------|-------------|
| empty directory → greenfield | Empty dir should be detected as greenfield |
| many files + many commits → brownfield | Rich project should be detected as brownfield |
| monorepo subdirectory git detection | Git commits should be detected from subdirectories |
| pnpm-workspace.yaml monorepo detection | pnpm workspace config triggers monorepo flag |
| npm workspaces monorepo detection | npm workspaces in package.json triggers monorepo flag |
| .specify/ → continue-speckit | Existing spec-kit directory triggers continuation |
| openspec/ → continue-openspec | Existing openspec directory triggers continuation |
| nonexistent directory → error | Invalid path returns error JSON |
| --verbose produces stderr output | Verbose flag enables diagnostic logging |
| scoreBreakdown in output | JSON output includes per-factor score details |
| gradient scoring | Zero source files yields greenfield +3 |

### validate-structure.sh

- All required plugin files exist
- JSON files are valid
- No hardcoded absolute paths (excluding CLAUDE.md)
- Shell scripts have proper shebangs
- Markdown files have YAML frontmatter
