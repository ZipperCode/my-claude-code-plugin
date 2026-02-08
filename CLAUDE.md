# Maestro Plugin Rules

## Workflow Rules
- Do NOT modify files inside `.specify/` or `openspec/` directories — those belong to spec-kit and openspec respectively
- Before transitioning between workflow stages, invoke the `quality-gate` agent to validate stage outputs
- Always record workflow selection results and stage transitions to `.maestro/state.json`
- When routing to spec-kit or openspec, guide the user to execute the corresponding commands — do NOT execute them automatically

## MCP Invocation Rules
- MCP output guidance and call limits follow `.maestro/config.json` → `policy` settings (preset + custom overrides)
- SESSION_ID follow-up strategy is controlled by policy: `conservative` = forbidden, `balanced` = allow 1 follow-up when response contains incomplete signals (TODO/TBD/...), `unrestricted` = no limit
- When a MCP tool is unavailable, degrade gracefully and explicitly inform the user
- codex MCP: backend/algorithm analysis; gemini MCP: frontend/UI analysis
- sequential-thinking MCP: use ≤ 5 thought steps, 3 phases only (Definition → Analysis → Conclusion)
- serena MCP: only use in brownfield (iterative) projects for LSP-level code understanding
- context7 MCP: use only during implementation phase for library docs; always call `resolve-library-id` before `query-docs`
- open-websearch MCP: use for general searches; prefer context7 for known library documentation
- After each MCP call: save full response to `.maestro/consultations/`, then invoke context-curator to extract a structured summary for the main context

## Multi-Model Collaboration Rules
- codex handles backend/algorithm concerns; gemini handles frontend/UI concerns
- Conflict points between models are arbitrated by Claude (the main agent)
- MCP call limits follow `.maestro/config.json` → `policy.mcp.maxCalls` (default: 10 in balanced preset)
- When codex is unavailable → Claude assumes backend analysis + gemini for frontend
- When gemini is unavailable → codex for backend + Claude assumes frontend analysis
- When both unavailable → Claude performs all analysis solo

## Token Management Rules
- Stage summary lengths follow `.maestro/config.json` → `policy` settings (index summary in state.json + detailed summary in `.maestro/summaries/`)
- Store summaries in `.maestro/summaries/{stage}.md`
- Store MCP full responses in `.maestro/consultations/{tool}-{timestamp}.md`
- New sessions load only `state.json` + the most recent stage summary
- Historical stage summaries and MCP consultation records are loaded on-demand only (when user requests)
- Maximum 2 agents running concurrently
- Detection agents (workflow-detector) use haiku model for short responses
- MCP calls require structured output to control response length
- `keyDecisions` in state.json is bounded by `policy.storage.keyDecisions.maxInState` — overflow entries are archived to `.maestro/summaries/decisions-archive.md` by context-curator
- `.maestro/consultations/` files are cleaned by context-curator after each MCP call, following `policy.storage.consultations.maxAge` and `maxCount` limits
