---
name: token-management
description: "This skill should be used when managing context window usage, when sessions are getting long, or when transitioning between workflow stages. Provides strategies for context compression and cross-session state preservation."
---

# Token Management Strategies

## Architecture: Consumer-Side Processing > Producer-Side Limiting

**Core principle**: Instead of forcing MCP models to truncate output (irreversible information loss), let them produce thorough analysis freely, then extract/compress on the consumer side.

```
Old: prompt("Limit 1500 chars") → MCP outputs 1500 chars → used directly (info lost forever)

New: prompt(guided, no hard limit) → MCP outputs full analysis → save original to .maestro/consultations/
                                                                → context-curator extracts summary
                                                                → compressed version enters main context
                                                                → full original available on demand
```

## Policy Preset System

All token-related limits are configured in `.maestro/config.json` → `policy`, NOT hardcoded in prompts.

### Three Presets

| Preset | Use Case | MCP Output Hint | SESSION_ID Follow-up | Max Calls | Summary Length |
|--------|----------|----------------|---------------------|-----------|---------------|
| **conservative** | Token-sensitive / low-quota APIs | `"Be concise, ≤ 1500 chars"` | Forbidden | 6 | index: 500 chars, detail: 1500 chars |
| **balanced** (default) | Daily usage | `"Provide a thorough, structured analysis. Use concise language, focus on actionable recommendations."` | Allow 1 follow-up | 10 | index: 800 chars, detail: 3000 chars |
| **unrestricted** | Deep architecture discussions | No output guidance | Unlimited | No limit | No limit |

### Storage Lifecycle Presets

Controls automatic cleanup of `keyDecisions` in `state.json` and consultation files in `.maestro/consultations/`.

| Preset | `keyDecisions.maxInState` | `consultations.maxAge` | `consultations.maxCount` |
|--------|--------------------------|----------------------|------------------------|
| **conservative** | 6 | `"3d"` | 10 |
| **balanced** (default) | 10 | `"7d"` | 20 |
| **unrestricted** | null (no limit) | null (no limit) | null (no limit) |

- When `keyDecisions` exceed `maxInState`, oldest entries are archived to `.maestro/summaries/decisions-archive.md`
- Consultation files exceeding `maxAge` or `maxCount` are deleted (oldest first)
- `null` values disable the corresponding cleanup (unrestricted mode)
- Cleanup is triggered by context-curator at stage transitions (keyDecisions) and after MCP calls (consultations)

### Custom Overrides

Users can override any preset field in `policy.custom`:

```json
{
  "policy": {
    "preset": "balanced",
    "custom": {
      "mcp.outputHint": "Be concise, ≤ 3000 characters",
      "mcp.maxCalls": 8,
      "mcp.allowFollowUp": true,
      "mcp.maxFollowUps": 2,
      "summary.indexLength": 800,
      "summary.detailLength": 3000,
      "storage.keyDecisions.maxInState": 10,
      "storage.consultations.maxAge": "7d",
      "storage.consultations.maxCount": 20
    }
  }
}
```

**Resolution order**: `custom field` > `preset value` > `hardcoded default (balanced)`

## Three-Layer Defense (Updated)

### Layer 1: Producer-Side Guidance + Consumer-Side Extraction

- **MCP output guidance**: Inject `policy.mcp.outputHint` into prompts — guides model tone/structure without hard truncation
- **Structured output**: Request JSON or bullet-point format (more compressed than prose)
- **Lightweight agents**: Use haiku model for detection/compression agents (shorter responses)
- **Consumer-side extraction**: After MCP response, context-curator extracts only key decisions and actionable items
- **Full preservation**: Complete MCP responses saved to `.maestro/consultations/` for on-demand access

### Layer 2: Stage Transition Compression

- **Trigger**: At the end of each workflow stage, invoke context-curator agent
- **Two-tier summaries**:
  - **Index summary**: Stored in `state.json` → `stageSummary`, length controlled by `policy.summary.indexLength`
  - **Detailed summary**: Stored in `.maestro/summaries/{stage}.md`, length controlled by `policy.summary.detailLength`
- **MCP originals**: Stored in `.maestro/consultations/{tool}-{timestamp}.md` — no length limit
- **Benefit**: Subsequent stages reference summaries instead of full conversation history

### Layer 3: Recovery — Cross-Session State

- **State file**: `.maestro/state.json` records active workflow, current stage, key decisions
- **Session start**: `hooks/hooks.json` auto-loads state on new session
- **Lazy loading**: Historical summaries and MCP consultation records loaded only when explicitly requested

## Token Estimation Rules

| Content Type | Approximate Tokens |
|-------------|-------------------|
| 1 English word | ~1.3 tokens |
| 1 Chinese character | ~2 tokens |
| 1 line of code | ~10-15 tokens |
| JSON key-value pair | ~5-8 tokens |
| MCP prompt (structured) | ~800-1200 tokens |
| MCP response (balanced, typical) | ~1500-4000 tokens |
| MCP response (conservative, guided) | ~500-800 tokens |
| Extracted summary (balanced) | ~600-1200 tokens |
| Index summary (balanced, 800 chars) | ~300-500 tokens |
| Detail summary (balanced, 3000 chars) | ~1000-1800 tokens |

## Context Budget Allocation

For a typical Maestro session (~200K context window):

| Category | Budget | Notes |
|----------|--------|-------|
| System prompt + CLAUDE.md | ~5K | Fixed overhead |
| Command + agent definitions | ~3K | Loaded on demand |
| User conversation | ~80K | Primary working space |
| MCP extracted summaries (10 calls max) | ~15K | Summaries only; originals in files |
| Code reading/analysis | ~70K | Dynamic, depends on project size |
| Reserve buffer | ~27K | Safety margin |

Note: With consumer-side processing, MCP call budget is more efficient since only extracted summaries enter the context, not full responses.

## When Context Is Running Low

1. **Avoid new MCP calls** — use Claude's built-in knowledge instead
2. **Compress existing context** — invoke context-curator immediately
3. **Start new session** — save state to `.maestro/state.json`, suggest user start fresh
4. **Reference summaries** — point to `.maestro/summaries/` files instead of re-reading artifacts
5. **Reference consultations** — point to `.maestro/consultations/` for full MCP originals

## Cross-Session State Recovery Protocol

When starting a new session:

1. Read `.maestro/state.json` (auto-loaded by SessionStart hook)
2. Read the most recent summary from `.maestro/summaries/{currentStage}.md`
3. Resume from `currentStage` + 1
4. Only load historical summaries if user asks "what did we decide about X?"
5. Only load MCP consultation records if user asks for original analysis details

## Multi-Agent Token Control

- **Max concurrent agents**: 2
- **Detection agents** (workflow-detector): haiku model, ≤300 word responses
- **Quality agents** (quality-gate): sonnet model, ≤500 word responses
- **Coordinator agents** (model-coordinator): default model, structured output only
- **Curator agents** (context-curator): haiku model, summary-focused (length per policy)

## Storage Layout

```
.maestro/
├── state.json                       # Workflow state + index summaries
├── config.json                      # Environment config + policy settings
├── summaries/                       # Detailed stage summaries
│   ├── routing-complete.md
│   ├── constitution.md
│   ├── decisions-archive.md         # Archived keyDecisions overflow (append-only)
│   └── ...
└── consultations/                   # Full MCP response originals
    ├── codex-2026-02-08T12-30-00Z.md
    ├── gemini-2026-02-08T12-31-00Z.md
    └── ...
```
