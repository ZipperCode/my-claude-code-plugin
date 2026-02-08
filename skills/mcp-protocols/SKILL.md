---
name: mcp-protocols
description: "This skill should be used when calling external MCP tools (codex, gemini, sequential-thinking, serena, context7), when formatting MCP prompts, or when handling MCP failures and fallbacks."
---

# MCP Invocation Protocols Knowledge

## General MCP Rules

1. **Policy-driven limits**: All MCP output guidance, call limits, and SESSION_ID rules are defined in `.maestro/config.json` → `policy`. Do NOT hardcode numeric limits in prompts.
2. **Structured output**: Always request structured/JSON output to improve information density
3. **Graceful degradation**: When MCP unavailable, inform user and fall back to Claude analysis
4. **Consumer-side processing**: After each MCP call, save full response to `.maestro/consultations/{tool}-{timestamp}.md`, then use context-curator to extract a structured summary for the main context

### Policy Presets Reference

| Preset | Output Hint | SESSION_ID Follow-up | Max Calls | Summary Length |
|--------|-------------|---------------------|-----------|---------------|
| **conservative** | `"Be concise, ≤ 1500 chars"` | Forbidden | 6 | 500 chars |
| **balanced** (default) | `"Provide a thorough, structured analysis. Use concise language, focus on actionable recommendations."` | Allow 1 follow-up when response contains incomplete signals (TODO/TBD/...) | 10 | 2000 chars |
| **unrestricted** | No output guidance | Unlimited | No limit | No limit |

Custom overrides in `policy.custom` take precedence over preset values.

### Consumer-Side Post-Processing Flow

```
Step 1: MCP returns response (full, unconstrained)
Step 2: Save full response to .maestro/consultations/{tool}-{timestamp}.md
Step 3: context-curator extracts structured summary (length controlled by policy)
Step 4: Structured summary enters main context for decision-making
Step 5: User can view full original via /maestro:status --detail
```

### SESSION_ID Follow-Up Strategy

- Read `policy.mcp.allowFollowUp` and `policy.mcp.maxFollowUps` from config
- **conservative**: Never use SESSION_ID — single call only
- **balanced**: If first response contains incomplete signals (TODO, TBD, "to be continued", ellipsis, truncated lists), allow 1 follow-up using SESSION_ID with a concise supplementary question (~500 tokens)
- **unrestricted**: No restrictions on follow-ups
- Follow-up is more token-efficient than a full re-invocation (~500 tokens vs ~4000 tokens)

---

## codex MCP

| Item | Detail |
|------|--------|
| **Tool name** | `mcp__codex__codex` |
| **Purpose** | Backend architecture, API design, algorithm analysis, data modeling |
| **Required params** | `PROMPT` (string), `cd` (Path — target project dir, must exist) |
| **Recommended params** | `sandbox: "read-only"` |
| **sandbox type** | `Literal["read-only", "workspace-write", "danger-full-access"]` — **string**, default `"read-only"` |
| **Dependency** | `codex` CLI installed, `OPENAI_API_KEY` env var, `uv`/`uvx` installed |
| **Install** | `claude mcp add codex -s user --transport stdio -- uvx --from git+https://github.com/GuDaStudio/codexmcp.git codexmcp` |
| **Fallback** | Claude assumes backend analysis role |

### codex Prompt Template

```
PROMPT: "As a backend/algorithm expert, analyze this requirement: {requirement}
Project context: {project_summary}
Provide: 1) Backend architecture 2) Data model 3) API design 4) Key algorithms 5) Risks
{policy_output_hint}
Use structured format."
cd: "{target_project_dir}"
sandbox: "read-only"
```

Where `{policy_output_hint}` is read from `.maestro/config.json` → resolved policy `mcp.outputHint`. For the default `balanced` preset, this resolves to: `"Provide a thorough, structured analysis. Use concise language, focus on actionable recommendations."`. For `conservative`, it resolves to `"Limit output to 1500 characters."`.

### codex Return Value

```json
// Success
{ "success": true, "SESSION_ID": "uuid", "agent_messages": "Codex response text..." }
// Failure
{ "success": false, "error": "Error description" }
```

**Error handling**: Always check `response.success === true` before using `agent_messages`. On failure, log `response.error` and fall back to Claude analysis.

**Post-processing**: Save full `agent_messages` to `.maestro/consultations/codex-{timestamp}.md`, then invoke context-curator to extract summary.

---

## gemini MCP

| Item | Detail |
|------|--------|
| **Tool name** | `mcp__gemini__gemini` |
| **Purpose** | Frontend design, UI/UX advice, component architecture, interaction flows. Gemini excels at **frontend aesthetics, UI component design, and visual layout** |
| **Required params** | `PROMPT` (string) |
| **Recommended params** | `sandbox: false` |
| **sandbox type** | `bool` — **boolean** (NOT string like codex!), default `false`. `false` = no sandbox, `true` = sandbox mode |
| **⚠️ No `cd` param** | Unlike codex, gemini does NOT have a `cd` parameter |
| **Dependency** | `gemini` CLI installed, Google AI API configured, `uv`/`uvx` installed |
| **Install** | `claude mcp add gemini -s user --transport stdio -- uvx --from git+https://github.com/GuDaStudio/geminimcp.git geminimcp` |
| **Fallback** | Claude + ui-ux-designer agent |

### gemini Prompt Template

```
PROMPT: "As a frontend/UI design expert with strong aesthetic sense, analyze this requirement: {requirement}
Project context: {project_summary}
Leverage your expertise in visual design, CSS/component architecture, and UX interaction patterns.
Provide: 1) UI architecture recommendation 2) Component hierarchy and design system 3) Key interaction flows 4) Visual design direction and UX highlights 5) Frontend tech stack recommendation
{policy_output_hint}
Use structured format."
sandbox: false
```

### gemini Return Value

```json
// Success
{ "success": true, "SESSION_ID": "session-uuid", "agent_messages": "Gemini response text..." }
// Failure
{ "success": false, "error": "Error description" }
```

**Error handling**: Always check `response.success === true` before using `agent_messages`. On failure, log `response.error` and fall back to Claude frontend analysis.

**Post-processing**: Save full `agent_messages` to `.maestro/consultations/gemini-{timestamp}.md`, then invoke context-curator to extract summary.

### ⚠️ codex vs gemini Parameter Differences

| Parameter | codex | gemini |
|-----------|-------|--------|
| `PROMPT` | string (required) | string (required) |
| `cd` | Path (required) | **N/A — not supported** |
| `sandbox` | **string**: `"read-only"` etc. | **boolean**: `true`/`false` |
| `SESSION_ID` | UUID (optional, policy-controlled) | string (optional, policy-controlled) |
| `return_all_messages` | bool (optional) | bool (optional) |
| `model` | string (optional) | string (optional) |

---

## sequential-thinking MCP

| Item | Detail |
|------|--------|
| **Tool name** | `mcp__sequential-thinking__process_thought` / `mcp__sequential-thinking__generate_summary` |
| **Purpose** | Complex problem decomposition, structured reasoning, contradiction analysis |
| **Usage rules** | ≤ 5 thought steps; 3 phases only: Definition → Analysis → Conclusion |
| **When to use** | Ambiguous requirements OR conflicting multi-model responses |
| **Fallback** | Claude analyzes directly, skipping structured thinking |
| **Fix command** | `claude mcp remove sequential-thinking && claude mcp add sequential-thinking -- npx -y @modelcontextprotocol/server-sequential-thinking` |

---

## serena MCP

| Item | Detail |
|------|--------|
| **Tool name** | `mcp__serena__find_symbol` / `mcp__serena__find_referencing_symbols` / `mcp__serena__get_symbol_details` |
| **Purpose** | LSP-level semantic code search, symbol lookup, reference tracing |
| **Usage rules** | ONLY in brownfield projects during code understanding phase |
| **Never use** | In greenfield projects |
| **Fallback** | Grep + Glob for code search |

---

## context7 MCP

| Item | Detail |
|------|--------|
| **Tool name** | `resolve-library-id` → `query-docs` (must resolve first) |
| **Purpose** | Query up-to-date documentation for specific libraries/frameworks |
| **Usage rules** | Implementation phase only; 1 library per query; NOT during planning |
| **Fallback** | WebSearch for documentation |

---

## open-websearch MCP

| Item | Detail |
|------|--------|
| **Tool name** | `mcp__open-websearch__search` / `mcp__open-websearch__fetchGithubReadme` |
| **Purpose** | General web search for technical solutions and best practices |
| **Usage rules** | Prefer context7 for known library docs; use websearch for general search |

---

## ace-tool MCP (Optional)

| Item | Detail |
|------|--------|
| **Tool name** | `mcp__ace-tool__search_context` / `mcp__ace-tool__enhance_prompt` |
| **Purpose** | Codebase indexing, semantic search, prompt enhancement |
| **Dependency** | External indexing service (base-url + token) |
| **Fallback** | serena + Grep |

---

## Degradation Matrix

| codex | gemini | Strategy |
|-------|--------|----------|
| ✅ | ✅ | Full multi-model: codex→backend, gemini→frontend |
| ✅ | ❌ | codex→backend, Claude→frontend analysis |
| ❌ | ✅ | Claude→backend analysis, gemini→frontend |
| ❌ | ❌ | Claude solo — all analysis by main agent |

Always explicitly inform the user when operating in degraded mode.
