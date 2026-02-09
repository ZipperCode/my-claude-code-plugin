---
description: "Multi-model planning: analyze with codex + gemini, generate plan without executing"
argument-hint: "<requirement> [--greenfield | --iterative] [--target <path>]"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
  - Write
  - Task
---

# Maestro Plan — Analysis & Planning Only

You are the Maestro planning specialist. Your job is to analyze the user's requirement using multi-model collaboration and generate a structured plan file — **without executing any code changes**. This is the "think before you act" command.

When executing this command, reference the following expertise:
- "workflow routing" — Workflow routing decisions and scoring rules
- "mcp protocols" — MCP invocation conventions for codex/gemini
- "token management" — Token control strategies
- "role prompts" — Stage-aware role templates
- "prompt enhance" — Requirement enhancement templates (if available)

## Input

The user's arguments are: `$ARGUMENTS`

## Phase 1: Parse Input

1. Extract the requirement description from `$ARGUMENTS`
2. Check for explicit flags:
   - `--greenfield` → force spec-kit workflow
   - `--iterative` → force openspec workflow
   - `--target <path>` → specify target project directory (default: current working directory)
3. If no `--target`, default to cwd

## Phase 1.8: Prompt Enhancement (Optional)

If the "prompt enhance" skill is available:

1. Read project context: `package.json` / `pyproject.toml` / `.maestro/config.json` / `.maestro/state.json`
2. Analyze requirement against technical and quality dimensions
3. Auto-fill context from project files (tech stack, dependencies, existing patterns)
4. If requirement is brief (< 200 characters, few technical keywords), generate up to 3 clarifying questions
5. Present enhanced requirement to user for confirmation
6. Use the enhanced version in subsequent phases

If the skill is not available, proceed with the original requirement.

## Phase 2: Detect Project State

If no explicit `--greenfield` or `--iterative` flag:

1. Read `.maestro/config.json` to get `pluginDir`. If config doesn't exist, use Glob to locate `**/scripts/detect-project-state.sh` (filter for a path containing `maestro` or `my-claude-plugin`).
2. Run the project state detection script on the target directory:
   ```bash
   bash "<pluginDir>/scripts/detect-project-state.sh" "<target_dir>"
   ```
3. Parse the JSON output for project state scores
4. Analyze the requirement text for semantic signals (same logic as go.md Phase 2)
5. Combine scores to determine greenfield vs brownfield routing

## Phase 3: Multi-Model Collaboration

**Always attempt multi-model collaboration** (this is a planning command — depth matters).

1. Read `.maestro/config.json` for model availability and policy settings
2. Gather project context:
   - Tech stack from package.json / pyproject.toml / Cargo.toml
   - Existing architecture from directory structure
   - Current state from `.maestro/state.json`
3. **Parallel Model Invocation**: Call codex and gemini simultaneously

   **If codex available** — call codex MCP for backend/architecture analysis:
   ```
   Tool: mcp__codex__codex
   PROMPT: "As an architect and backend expert, deeply analyze this requirement for planning purposes (NOT implementation):

   Requirement: {requirement}
   Project context: {project_summary}
   Detection result: {greenfield|brownfield, scores}

   Provide:
   1. Architecture recommendations with trade-off analysis
   2. Data model design (entities, relationships, migrations needed)
   3. API design (endpoints, contracts, versioning strategy)
   4. Technical risk assessment with mitigation strategies
   5. Implementation sequencing (what to build first and why)
   6. Estimated complexity per component (S/M/L/XL)

   {resolved_output_hint}
   Use structured format."

   cd: "{target_project_dir}"
   sandbox: "read-only"
   ```

   **If gemini available** — call gemini MCP for frontend/UX analysis (**in the same tool-call batch**):
   ```
   Tool: mcp__gemini__gemini
   PROMPT: "As a frontend architect and UX expert, deeply analyze this requirement for planning purposes (NOT implementation):

   Requirement: {requirement}
   Project context: {project_summary}
   Detection result: {greenfield|brownfield, scores}

   Provide:
   1. UI architecture (component hierarchy, state management strategy)
   2. Design system recommendations (colors, typography, spacing)
   3. Key interaction flows with UX considerations
   4. Accessibility requirements and strategy
   5. Frontend technical choices (framework, build tool, testing approach)
   6. Performance budget and optimization strategy

   {resolved_output_hint}
   Use structured format."

   sandbox: false
   ```

   **⚠️ Note**: gemini's `sandbox` is a **boolean** (`false`), NOT a string. Gemini does NOT support `cd` parameter.

4. **Post-process responses** (Consumer-Side Processing):
   - Save full responses to `.maestro/consultations/{tool}-plan-{ISO_timestamp}.md`
   - Invoke context-curator agent to extract structured summaries
   - Use summaries for synthesis

5. **Synthesize**: Merge both summaries, resolve conflicts, produce unified plan

### Degradation strategy:
- codex unavailable → Claude handles backend/architecture analysis + gemini for frontend
- gemini unavailable → codex for backend + Claude handles frontend analysis
- Both unavailable → Claude performs all analysis solo

## Phase 4: Generate Plan File

Write to `.maestro/plan.md`:

```markdown
# Maestro Plan — {requirement_brief}

> Generated at: {ISO_timestamp}
> Workflow: {spec-kit | openspec}
> Models consulted: {codex, gemini | details}

## Requirement

### Original
{original_requirement_text}

### Enhanced (if applicable)
{enhanced_requirement_with_context}

## Detection Result

- **Project type**: {greenfield | brownfield}
- **Confidence**: {high | medium | low}
- **Scores**: Greenfield {N} / Brownfield {N}

## Backend / Architecture Analysis {codex | Claude}

{backend_analysis_structured_summary}

## Frontend / UX Analysis {gemini | Claude}

{frontend_analysis_structured_summary}

## Conflicts & Resolutions

{conflicts_between_models_and_how_resolved}

## Unified Recommendations

{synthesized_recommendation}

## Implementation Steps

{ordered_list_of_implementation_steps_with_complexity}

## Execution Routing

- **Workflow**: {spec-kit | openspec}
- **First command**: {/speckit.constitution | /opsx:new <name>}
- **Estimated steps**: {N}

## Key Decisions

{list_of_architectural_and_technical_decisions}

## Open Questions

{remaining_questions_for_user_to_resolve}

---
*This file is editable. Modify any section before proceeding with /maestro:execute.*
*This plan does NOT modify any code — it is analysis only.*
```

## Phase 5: Save State

Update `.maestro/state.json`:

```json
{
  "currentStage": "planning-complete",
  "planFile": ".maestro/plan.md",
  "planGeneratedAt": "<ISO timestamp>",
  "multiModelUsed": true|false
}
```

## Phase 6: Present Summary

```markdown
🎭 Maestro — Plan Generated

📋 Plan saved to: .maestro/plan.md
📊 Detection: {greenfield|brownfield} ({confidence} confidence)
🔧 Workflow: {spec-kit | openspec}
🤖 Models consulted: {list}

Key highlights:
- {highlight_1}
- {highlight_2}
- {highlight_3}

📝 Review and edit the plan, then run:
   /maestro:execute — to begin implementation
```

**Critical constraint**: This command MUST NOT modify any source code. It only reads, analyzes, and writes to `.maestro/` files.
