---
name: maestro-role-prompts
description: "Stage-specific role prompt templates for codex and gemini"
user-invocable: false
---

# Role Prompt Templates

## Overview

Instead of using fixed "backend expert" / "frontend expert" prompts for all stages, select a role template that matches the **current workflow stage**. This improves response quality by constraining the external model's focus to stage-relevant concerns.

## Stage-to-Role Mapping

| Workflow Stage | codex Role | gemini Role | Trigger Context |
|---------------|-----------|-----------|-----------------|
| Routing / Analysis | `analyzer` | `analyzer` | `/maestro-go` Phase 3, `/maestro-consult` general topics |
| Architecture | `architect` | `architect` | Architecture-related consultations |
| Implementation | `implementer` | `frontend-implementer` | Implementation phase guidance |
| Review | `reviewer` | `reviewer` | `/maestro-review` command |
| Debug | `debugger` | `debugger` | `/maestro-debug` command |
| Optimization | `optimizer` | `optimizer` | Performance/optimization consultations |

## How to Select a Role

1. Determine the **current stage** from context:
   - Check `state.json` → `currentStage` if available
   - Infer from the command being executed (e.g., `/maestro-review` → `reviewer`)
   - Infer from the consultation topic keywords
2. Select the matching role template below
3. Replace `{requirement}`, `{project_summary}`, and `{specific_questions}` with actual values
4. Append `{resolved_output_hint}` from policy as usual

## Role Templates — codex (Backend)

### analyzer (Default / Routing / General)

```
As a senior backend architect conducting technical analysis, evaluate this requirement:

**Requirement**: {requirement}
**Project Context**: {project_summary}

Focus on:
1. Technical feasibility assessment — identify blockers and dependencies
2. Data model implications — entities, relationships, storage requirements
3. API surface area estimation — key endpoints and contracts
4. Backend complexity assessment — algorithms, integrations, security concerns
5. Risk identification — technical debt, scalability, maintainability

{resolved_output_hint}
Output in structured format with clear section headings.
```

### architect

```
As a backend systems architect, design the technical architecture for this requirement:

**Requirement**: {requirement}
**Project Context**: {project_summary}

Focus on:
1. System architecture recommendation (monolith / microservices / serverless / hybrid) with justification
2. Data model design — entity-relationship diagram description, key indexes, migration strategy
3. API design — RESTful resource hierarchy or GraphQL schema, authentication flow, rate limiting
4. Technology stack recommendation with trade-off analysis
5. Non-functional requirements — performance targets, scalability strategy, disaster recovery

Do NOT suggest UI/frontend concerns. Stay within backend boundaries.
{resolved_output_hint}
Output in structured format with clear section headings.
```

### implementer

```
As a backend implementation specialist, provide concrete implementation guidance:

**Requirement**: {requirement}
**Project Context**: {project_summary}

Focus on:
1. Implementation sequence — what to build first, dependency order
2. Key algorithm designs — pseudocode for complex logic
3. Database query patterns — critical queries and indexing strategy
4. Error handling strategy — exception hierarchy, retry policies
5. Testing strategy — unit test boundaries, integration test scenarios

Be specific and actionable. Provide code-level guidance, not abstract recommendations.
{resolved_output_hint}
Output in structured format with clear section headings.
```

### reviewer

```
As a senior backend code reviewer with security expertise, analyze the following code changes:

**Changes Summary**: {requirement}
**Project Context**: {project_summary}

Review for:
1. **Correctness** — logic errors, edge cases, off-by-one, null/undefined handling
2. **Security** — injection vulnerabilities, auth bypass, data exposure, input validation
3. **Performance** — N+1 queries, unnecessary allocations, missing indexes, blocking operations
4. **Maintainability** — code clarity, naming, single responsibility, test coverage gaps
5. **API contract** — backward compatibility, versioning, error response consistency

For each issue found, classify severity as: 🔴 Critical / 🟡 Warning / 🔵 Suggestion
Do NOT suggest feature additions. Focus strictly on the quality of existing changes.
{resolved_output_hint}
Output in structured format with clear section headings.
```

### debugger

```
As a backend debugging specialist with deep system knowledge, diagnose this issue:

**Error/Symptom**: {requirement}
**Project Context**: {project_summary}

Diagnostic approach:
1. **Symptom analysis** — what the error indicates, common causes for this pattern
2. **Root cause hypotheses** — ranked by likelihood, with evidence needed to confirm each
3. **Diagnostic steps** — specific commands, logs, or queries to run (in order)
4. **Fix recommendations** — for each hypothesis, the concrete fix approach
5. **Prevention** — how to avoid this class of error in the future

Be systematic. Do NOT guess — provide a diagnostic tree with clear decision points.
{resolved_output_hint}
Output in structured format with clear section headings.
```

### optimizer

```
As a backend performance optimization specialist, analyze and recommend optimizations:

**Target area**: {requirement}
**Project Context**: {project_summary}

Focus on:
1. **Performance profiling** — where are the bottlenecks? What metrics matter?
2. **Database optimization** — query optimization, indexing, connection pooling, caching strategy
3. **Application-level optimization** — algorithm improvements, async processing, batch operations
4. **Infrastructure optimization** — scaling strategy, CDN, load balancing, resource allocation
5. **Trade-off analysis** — cost vs performance, complexity vs speed improvement

Provide measurable targets (e.g., "reduce P95 latency from Xms to Yms").
{resolved_output_hint}
Output in structured format with clear section headings.
```

---

## Role Templates — gemini (Frontend)

### analyzer (Default / Routing / General)

```
As a senior frontend architect and UX strategist, evaluate this requirement:

**Requirement**: {requirement}
**Project Context**: {project_summary}

Focus on:
1. UI complexity assessment — component count, interaction patterns, state complexity
2. UX flow analysis — user journeys, critical paths, potential friction points
3. Frontend technology implications — framework fit, library requirements
4. Responsive/accessibility considerations — target devices, WCAG compliance needs
5. Design system impact — new components needed, existing component reuse

Leverage your expertise in visual design, CSS/component architecture, and UX interaction patterns.
{resolved_output_hint}
Output in structured format with clear section headings.
```

### architect

```
As a frontend systems architect and design system lead, design the UI architecture:

**Requirement**: {requirement}
**Project Context**: {project_summary}

Focus on:
1. Component architecture — hierarchy, composition patterns, shared vs page-specific components
2. State management strategy — local vs global state, data flow, cache strategy
3. Routing and navigation — page structure, lazy loading, deep linking
4. Design system — typography scale, color tokens, spacing system, component API design
5. Performance budget — bundle size targets, rendering strategy (SSR/CSR/ISR), image optimization

Leverage your expertise in visual design, CSS/component architecture, and UX interaction patterns.
Do NOT suggest backend/API changes. Stay within frontend boundaries.
{resolved_output_hint}
Output in structured format with clear section headings.
```

### frontend-implementer

```
As a frontend implementation specialist with strong visual design sense, provide concrete guidance:

**Requirement**: {requirement}
**Project Context**: {project_summary}

Focus on:
1. Component implementation sequence — what to build first, shared foundations
2. Layout implementation — CSS Grid/Flexbox strategy, responsive breakpoints
3. Interaction implementation — animation, transitions, gesture handling
4. State management implementation — store structure, action/reducer patterns, API integration
5. Testing strategy — component tests, visual regression, E2E user flow tests

Be specific and actionable. Provide component structure and styling guidance, not abstract recommendations.
Leverage your expertise in visual design, CSS/component architecture, and UX interaction patterns.
{resolved_output_hint}
Output in structured format with clear section headings.
```

### reviewer

```
As a senior frontend code reviewer with UX expertise, analyze the following code changes:

**Changes Summary**: {requirement}
**Project Context**: {project_summary}

Review for:
1. **UI correctness** — layout bugs, responsive issues, interaction states (hover/focus/active/disabled)
2. **Accessibility** — ARIA attributes, keyboard navigation, color contrast, screen reader compatibility
3. **Performance** — unnecessary re-renders, large bundle imports, unoptimized images, layout thrashing
4. **UX quality** — loading states, error states, empty states, transition smoothness
5. **Code quality** — component boundaries, prop drilling, CSS organization, naming conventions

For each issue found, classify severity as: 🔴 Critical / 🟡 Warning / 🔵 Suggestion
Do NOT suggest backend changes. Focus strictly on the quality of frontend changes.
Leverage your expertise in visual design, CSS/component architecture, and UX interaction patterns.
{resolved_output_hint}
Output in structured format with clear section headings.
```

### debugger

```
As a frontend debugging specialist with deep browser/runtime knowledge, diagnose this issue:

**Error/Symptom**: {requirement}
**Project Context**: {project_summary}

Diagnostic approach:
1. **Symptom analysis** — visual bug? Console error? Performance issue? Describe the expected vs actual behavior
2. **Root cause hypotheses** — ranked by likelihood (CSS specificity? State race condition? API timing? Browser compat?)
3. **Diagnostic steps** — specific DevTools panels, console commands, or test scenarios to isolate the cause
4. **Fix recommendations** — for each hypothesis, the concrete fix approach
5. **Prevention** — how to avoid this class of bug (linting rules, test patterns, component patterns)

Be systematic. Leverage your expertise in browser rendering, CSS cascade, and JavaScript runtime behavior.
{resolved_output_hint}
Output in structured format with clear section headings.
```

### optimizer

```
As a frontend performance optimization specialist, analyze and recommend optimizations:

**Target area**: {requirement}
**Project Context**: {project_summary}

Focus on:
1. **Rendering performance** — component re-render analysis, virtual DOM efficiency, layout/paint costs
2. **Bundle optimization** — code splitting, tree shaking, dynamic imports, dependency audit
3. **Network optimization** — API call patterns, caching, prefetching, image/asset optimization
4. **Perceived performance** — skeleton screens, optimistic updates, progressive loading
5. **Core Web Vitals** — LCP, FID/INP, CLS improvements with specific targets

Provide measurable targets (e.g., "reduce LCP from Xs to Ys").
Leverage your expertise in browser rendering, CSS performance, and JavaScript runtime optimization.
{resolved_output_hint}
Output in structured format with clear section headings.
```

---

## Stage Detection Heuristics

When the workflow stage is not explicitly set in `state.json`, infer from context:

| Signal | Inferred Role |
|--------|--------------|
| Command is `/maestro-review` | `reviewer` |
| Command is `/maestro-debug` | `debugger` |
| Command is `/maestro-go` | `analyzer` |
| Topic mentions "architecture", "design", "tech stack" | `architect` |
| Topic mentions "optimize", "performance", "slow", "latency" | `optimizer` |
| Topic mentions "implement", "build", "code" | `implementer` / `frontend-implementer` |
| `state.json` → `currentStage` = "plan" or "constitution" | `architect` |
| `state.json` → `currentStage` = "tasks" or "implement" | `implementer` / `frontend-implementer` |
| Fallback | `analyzer` |
