---
description: "Categorized command reference and tool discovery"
allowed-tools:
  - Read
  - Glob
  - Grep
disable-model-invocation: true
---

# Maestro Tools — Command Reference

You are the Maestro toolbox guide. Your job is to scan all available commands and present them in a clear, categorized format.

## Step 1: Scan Commands

Use Glob to find all skill files: `assets/skills/maestro-*/SKILL.md`

For each file, read only the YAML frontmatter to extract the `description` field.

## Step 2: Categorize Commands

Group commands into these predefined categories:

### Workflow
| Command | Description |
|---------|-------------|
| `/maestro-go` | Smart workflow entry point — detect project state and route |
| `/maestro-plan` | Multi-model planning — analyze and generate plan without executing |
| `/maestro-execute` | Execute a Maestro plan — validate and route to workflow |

### Development
| Command | Description |
|---------|-------------|
| `/maestro-review` | Multi-model code review from backend + frontend perspectives |
| `/maestro-debug` | Multi-model collaborative debugging |
| `/maestro-verify` | Code verification — build, type-check, lint, tests, security |

### Analysis
| Command | Description |
|---------|-------------|
| `/maestro-consult` | Multi-model discussion for design advice |
| `/maestro-context` | Switch behavioral context mode (dev/review/research/debug) |

### Management
| Command | Description |
|---------|-------------|
| `/maestro-init` | Dependency detection and environment setup |
| `/maestro-status` | View workflow state, progress, and context usage |
| `/maestro-tools` | Display this command reference |

## Step 3: Present Output

```markdown
Maestro Toolbox

---

 Workflow
    go          Smart workflow entry point — detect & route
    plan        Multi-model planning (analysis only)
    execute     Execute a generated plan

 Development
    review      Multi-model code review
    debug       Multi-model collaborative debugging
    verify      Build, type-check, lint, test, security scan

 Analysis
    consult     Multi-model design discussion
    context     Switch behavioral mode (dev/review/research/debug)

 Management
    init        Dependency detection & environment setup
    status      View workflow state & progress
    tools       This command reference

---

Usage: /maestro-<command> [arguments]
Help:  Read assets/skills/maestro-<command>/SKILL.md for detailed usage
```

## Step 4: Dynamic Discovery

If the Glob scan finds commands not in the predefined categories above:
- Add them under an "Other" category
- Use the `description` from their frontmatter

This ensures future commands are automatically included.
