---
name: learning
description: "This skill defines the learning extraction rules, storage format, and deduplication logic for the lightweight learning system. Reference this when the learning-extractor agent runs."
---

# Learning System

## Overview

The learning system captures project-specific conventions, decisions, and patterns from work sessions. Learnings persist in `.maestro/learnings/` and are loaded at session start to provide continuity across conversations.

## Storage Structure

```
.maestro/learnings/
  conventions.md   — Project coding conventions discovered during work
  decisions.md     — Architecture and design decisions with rationale
  patterns.md      — Recurring code patterns specific to the project
```

## Learning Categories

### Conventions
**What**: Project-specific coding styles, naming patterns, file organization choices that aren't in formal rules but emerge from the codebase.

**Examples**:
- "This project uses barrel exports (index.ts) for all feature modules"
- "API routes follow /api/v1/{resource}/{action} naming"
- "All database queries use the repository pattern via `src/repositories/`"

### Decisions
**What**: Architecture and technology decisions with the reasoning behind them.

**Examples**:
- "Chose Redis for session storage over JWT because the team needs session invalidation capability"
- "Using tRPC instead of REST for internal services to leverage end-to-end type safety"
- "Database migrations use Prisma Migrate — do not use raw SQL migrations"

### Patterns
**What**: Recurring code patterns, solutions to common problems, project-specific abstractions.

**Examples**:
- "Error responses always use `AppError.from()` wrapper for consistent error codes"
- "React components follow: types → hooks → helpers → component → export pattern"
- "All async operations use the `withRetry()` wrapper from `src/utils/retry.ts`"

## Entry Format

Each learning entry follows this format:

```markdown
## [YYYY-MM-DD] {Title}

- {Key point 1}
- {Key point 2}
- {Key point 3 (if needed)}
```

Rules:
- Title should be descriptive and searchable (5-12 words)
- Max 3-5 bullet points per entry
- Each bullet should be a complete, actionable statement
- Include file paths when referencing specific locations

## Extraction Rules

### When to extract
- Session involved ≥ 10 tool calls (indicates substantial work, not just Q&A)
- Session involved code modifications or architectural analysis
- Session produced decisions or discovered project patterns

### When NOT to extract
- Session was purely informational (< 10 tool calls)
- Session only ran existing commands without new insights
- Learning is trivially obvious (e.g., "the project uses TypeScript")

### Deduplication

Before appending a new entry:
1. Read the last 10 entries from the target file
2. Compare the new entry's title with existing titles
3. If a similar title exists (>70% word overlap), update the existing entry instead of appending
4. "Similar" means the core topic is the same, even if wording differs

### Substantiality check

A session is "substantial" if:
- Total tool calls ≥ 10, AND
- At least one of: Edit/Write calls, MCP consultation calls, or multi-file analysis

## Loading Strategy

At session start (via hooks.json SessionStart):
- Load the last 20 lines of each learnings file
- This provides recent context without overwhelming the prompt
- Full history is available on-demand via `Read` tool

## Maintenance

- Entries older than 90 days may be reviewed for relevance
- If a convention changes, update the existing entry rather than adding a contradictory one
- Maximum ~50 entries per file — archive older entries if exceeded
