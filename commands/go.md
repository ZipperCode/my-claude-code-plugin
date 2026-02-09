---
description: "Smart workflow entry point: auto-detect project state, route to spec-kit or openspec, with intelligent multi-model collaboration"
argument-hint: "<requirement description> [--greenfield | --iterative] [--target <project-path>]"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
  - Write
  - Task
---

# Maestro Go — Smart Workflow Entry Point

You are the Maestro workflow orchestrator. Your job is to analyze the user's requirement, detect the project state, optionally engage multi-model collaboration, and route to the appropriate development workflow.

When executing this command, reference the following expertise:
- "workflow routing" — Workflow routing decisions and scoring rules
- "mcp protocols" — MCP invocation conventions for codex/gemini
- "token management" — Token control strategies

## Input

The user's arguments are: `$ARGUMENTS`

## Phase 1: Parse Input

1. Extract the requirement description from `$ARGUMENTS`
2. Check for explicit flags:
   - `--greenfield` → force spec-kit workflow
   - `--iterative` → force openspec workflow
   - `--target <path>` → specify target project directory (default: current working directory)
3. If no `--target`, ask the user which project directory to analyze, or default to cwd

## Phase 1.5: Verify Workflow Tool Readiness

Before proceeding with project detection, verify that the required slash commands are registered in the target project. This prevents users from going through the entire detection flow only to discover commands are unavailable at the end.

1. **Check from config**: Read `.maestro/config.json` and look for the `slashCommands` section
2. **Fallback to filesystem**: If `config.json` doesn't exist or lacks `slashCommands`, check the filesystem directly:
   - spec-kit: Look for files matching `<target_dir>/.claude/commands/speckit.*.md`
   - openspec: Look for directory `<target_dir>/.claude/commands/opsx/` containing `.md` files

3. **Evaluate readiness**:
   - If **neither** spec-kit nor openspec commands are registered:
     ```
     ⚠️ Workflow commands not found in this project.

     Neither spec-kit (/speckit.*) nor openspec (/opsx:*) slash commands are registered.
     Maestro can detect and route your project, but you won't be able to execute workflow steps without initialization.

     To initialize:
       spec-kit:  specify init --here --ai claude
       openspec:  openspec init --tools claude
       ℹ️ Restart Claude Code after initialization.

     Run /maestro:init for a full environment check.
     ```
     Ask user whether to continue with detection anyway or stop to initialize first.

   - If **one** is registered but the other is not — note this but proceed. The routing phase will determine which workflow is needed, and only warn if the selected workflow's commands are missing.

   - If **both** are registered — proceed normally, no warning needed.

4. **Post-routing validation** (at the end of Phase 4): After routing decides the workflow, verify the chosen workflow's commands are available:
   - If routed to **spec-kit** but speckit commands not registered → warn and guide `specify init --here --ai claude`
   - If routed to **openspec** but opsx commands not registered → warn and guide `openspec init --tools claude`
   - Remind user to restart Claude Code after initialization

> **Important**: Follow CLAUDE.md rule — only **guide** the user, do NOT execute initialization commands automatically.

## Phase 2: Detect Project State

If no explicit `--greenfield` or `--iterative` flag:

1. Read `.maestro/config.json` to get `pluginDir`. If config doesn't exist, use Glob to locate `**/scripts/detect-project-state.sh` (filter for a path containing `maestro` or `my-claude-plugin`).
2. Run the project state detection script on the target directory:
   ```bash
   bash "<pluginDir>/scripts/detect-project-state.sh" "<target_dir>"
   ```

3. Parse the JSON output for project state scores

4. Analyze the requirement text for semantic signals using **word boundary matching**:
   - English signals: match as whole words (e.g., `\bcreate\b` does not match "recreate")
   - Chinese signals: match as-is (Chinese does not use word boundaries)

   **Greenfield signals** (+1 each):
   - English: "from scratch", "new project", "build a", /\bcreate\b/, /\binitialize\b/, /\bprototype\b/, /\bMVP\b/
   - Chinese: "从零开始", "新项目", "创建", "初始化", "原型"

   **Brownfield signals** (+1 each):
   - English: "add feature", /\bfix\b/, /\boptimize\b/, /\brefactor\b/, /\bupgrade\b/, /\bimprove\b/
   - Chinese: "添加功能", "修复", "优化", "重构", "升级", "改进"

5. Combine scores:
   - Greenfield > Brownfield by ≥ 3 → **spec-kit** (confident)
   - Brownfield > Greenfield by ≥ 3 → **openspec** (confident)
   - Difference ≤ 2 → **ask user** to confirm

## Phase 3: Intelligent Multi-Model Collaboration Check

Determine if multi-model collaboration should be triggered.

**Auto-trigger conditions** (any one is sufficient):
1. Requirement involves both frontend AND backend (keywords: API + UI, frontend + backend, fullstack, 前端 + 后端, 全栈)
2. Requirement involves architecture-level decisions (keywords: architecture, tech stack, microservice, database design, 架构, 技术选型, 微服务, 数据库设计)
3. Requirement text length > 200 characters (indicates high complexity)
4. Requirement contains multiple feature modules (connectors: "and", "also", "as well as", "additionally", "和", "以及", "同时", "还需要")

**Do NOT trigger when**:
1. Simple single feature (e.g., "add a button")
2. Pure bug fix
3. Documentation update
4. Neither codex nor gemini is available

### If multi-model collaboration is triggered:

1. Read `.maestro/config.json` to check model availability and resolve policy settings:
   - Determine active preset from `policy.preset` (default: `"balanced"`)
   - Apply any `policy.custom` overrides
   - Resolve `mcp.outputHint`, `mcp.maxCalls`, `mcp.allowFollowUp`, `mcp.maxFollowUps`

2. **Parallel Model Invocation**: Call codex and gemini **simultaneously** (not sequentially) to minimize wait time. When both models are available, invoke both MCP calls in a single response — do NOT wait for one to finish before starting the other.

   **If codex available** — call codex MCP for backend/algorithm analysis:
   ```
   Tool: mcp__codex__codex
   PROMPT: "As a backend/algorithm expert, analyze this requirement: {requirement}
   Project context: {project_summary}
   Provide: 1) Backend architecture suggestions 2) Data model design 3) API design 4) Key algorithm choices 5) Risk points
   {resolved_output_hint}
   Use structured format."
   cd: "{target_project_dir}"
   sandbox: "read-only"
   ```

   **If gemini available** — call gemini MCP for frontend/UI analysis (**in the same tool-call batch as codex**):
   ```
   Tool: mcp__gemini__gemini
   PROMPT: "As a frontend/UI design expert with strong aesthetic sense, analyze this requirement: {requirement}
   Project context: {project_summary}
   Leverage your expertise in visual design, CSS/component architecture, and UX interaction patterns.
   Provide: 1) UI architecture suggestions 2) Component hierarchy and design system 3) Key interaction flows 4) Visual design direction and UX highlights 5) Frontend tech stack recommendation
   {resolved_output_hint}
   Use structured format."
   sandbox: false
   ```

   **⚠️ Parameter differences**: gemini's `sandbox` is a **boolean** (`false`), NOT a string like codex. Gemini does NOT support `cd` parameter.

   > **Why parallel?** MCP calls typically take 30-120 seconds each. Parallel execution reduces total wait time from `codex_time + gemini_time` to `max(codex_time, gemini_time)`, saving ~50% wait time.

   **Check returns**: For each response, verify `response.success === true`. If `false`, log `response.error` and fall back to Claude analysis for that domain.

3. **Post-process responses** (Consumer-Side Processing):

   For each successful MCP response:
   ```
   a. Save full agent_messages to .maestro/consultations/{tool}-{ISO_timestamp}.md
   b. Invoke context-curator agent to extract structured summary from the saved file
   c. Use the extracted summary (not the full response) in subsequent decision-making
   ```

   Ensure `.maestro/consultations/` directory exists before writing.

4. **SESSION_ID follow-up** (policy-controlled):

   If policy allows follow-up (`mcp.allowFollowUp === true`) and the response contains incomplete signals (TODO, TBD, "to be continued", truncated lists, ellipsis):
   - Use the `SESSION_ID` from the response to send a concise follow-up question (~500 tokens)
   - Append the follow-up response to the same consultation file
   - Re-extract the combined summary

5. **Synthesize**: Merge both extracted summaries, highlight conflicts, and present a unified recommendation

### Degradation strategy:
- codex unavailable → Claude handles backend analysis + gemini for frontend
- gemini unavailable → codex for backend + Claude handles frontend analysis
- Both unavailable → Claude performs all analysis solo

## Phase 4: Route to Workflow

### Generate Plan File (if multi-model analysis was performed)

If multi-model collaboration was triggered in Phase 3, generate a structured plan file that preserves the full consultation results as an editable artifact:

Write to `.maestro/plan.md`:

```markdown
# Maestro Plan — {requirement_brief}

> Generated at: {ISO_timestamp}
> Workflow: {spec-kit | openspec}
> Models consulted: {codex, gemini | details}

## Requirement

{full_requirement_text}

## Detection Result

- **Project type**: {greenfield | brownfield}
- **Confidence**: {high | medium | low}
- **Scores**: Greenfield {N} / Brownfield {N}

## Backend Analysis {codex | Claude}

{backend_analysis_structured_summary}

## Frontend Analysis {gemini | Claude}

{frontend_analysis_structured_summary}

## Conflicts & Resolutions

{conflicts_and_how_they_were_resolved}

## Unified Recommendations

{synthesized_recommendation}

## Key Decisions

{list_of_key_decisions_made}

## Open Questions

{remaining_questions_for_user}

---
*This file is editable. Modify any section before proceeding to the next workflow stage.*
*Subsequent stages will reference this plan for context.*
```

> **Purpose**: This file survives across sessions without Token compression loss. Users can edit it to adjust recommendations before proceeding. Downstream commands can reference `.maestro/plan.md` for context.

### If greenfield → spec-kit:

Present to user:

```
🎭 Maestro — Workflow Detection Complete

📊 Detection: Greenfield project (new development)
🔧 Recommended: spec-kit specification-driven workflow

[If multi-model analysis was performed, include synthesized recommendations here]

📋 Next steps — execute in order:
1. /speckit.constitution — Establish project charter
2. /speckit.specify — Write functional specifications
3. /speckit.clarify — Clarify ambiguous requirements
4. /speckit.plan — Create implementation plan
5. /speckit.tasks — Break down into tasks
6. /speckit.implement — Execute implementation

💡 Run /maestro:status at any time to check progress.
```

### If brownfield → openspec:

Present to user:

```
🎭 Maestro — Workflow Detection Complete

📊 Detection: Brownfield project (iterative development)
🔧 Recommended: openspec change-driven workflow

[If multi-model analysis was performed, include synthesized recommendations here]

📋 Next steps — execute in order:
1. /opsx:new <feature-name> — Create change proposal
2. /opsx:ff — Fast-fill planning documents
3. /opsx:apply — Implement the change
4. /opsx:archive — Archive completed change

💡 Run /maestro:status at any time to check progress.
```

## Phase 5: Save State

Write workflow state to `.maestro/state.json`:

```json
{
  "activeWorkflow": "spec-kit | openspec",
  "targetProject": "<resolved target path>",
  "currentStage": "routing-complete",
  "requirement": "<user's requirement text>",
  "routingResult": {
    "method": "auto-detect | forced-greenfield | forced-iterative",
    "scores": { "greenfield": N, "brownfield": N },
    "scoreBreakdown": [],
    "semanticMatches": { "greenfield": [], "brownfield": [] },
    "confidence": "high | medium | low"
  },
  "multiModelUsed": true|false,
  "keyDecisions": [],
  "lastActivity": "<ISO timestamp>"
}
```

Ensure `.maestro/` directory exists before writing.

### Cross-directory state synchronization

If `--target <path>` was used and differs from CWD:
1. Ensure `<target_path>/.maestro/` directory exists
2. Also write the same `state.json` to `<target_path>/.maestro/state.json`
3. In the CWD copy, add `"stateAlsoAt": "<target_path>/.maestro/state.json"` field to indicate the mirrored state location
