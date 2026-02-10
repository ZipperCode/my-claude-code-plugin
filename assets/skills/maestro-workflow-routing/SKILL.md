---
name: maestro-workflow-routing
description: "Workflow routing decisions and scoring rules"
user-invocable: false
---

# Workflow Routing Decision Knowledge

## Workflow Comparison

| Aspect | spec-kit (Greenfield) | openspec (Brownfield) |
|--------|----------------------|----------------------|
| **Use case** | 0→1 new project development | Iterative feature development on existing codebase |
| **Approach** | Specification-driven: define what before how | Change-proposal-driven: propose → plan → apply |
| **Stages** | constitution → specify → clarify → plan → tasks → implement | new → ff (fast-fill) → apply → archive |
| **Output** | Full project specification + implementation plan | Change proposal + focused implementation |
| **Best for** | Blank slate, MVP, prototype, new system design | Adding features, fixing bugs, refactoring existing code |

## Decision Tree

```
START
  ├─ Has .specify/ with incomplete stages?
  │   └─ YES → Continue spec-kit (resume workflow)
  ├─ Has openspec/ with active change?
  │   └─ YES → Continue openspec (resume workflow)
  ├─ User passed --greenfield?
  │   └─ YES → spec-kit
  ├─ User passed --iterative?
  │   └─ YES → openspec
  └─ No explicit flag
      ├─ Compute project state score (file count, git history, config files, src dirs, README)
      ├─ Compute requirement semantic score (greenfield vs brownfield signal words)
      ├─ greenfield_total > brownfield_total by ≥ 3 → spec-kit (confident)
      ├─ brownfield_total > greenfield_total by ≥ 3 → openspec (confident)
      └─ difference ≤ 2 → ASK USER to confirm
```

## Greenfield Signal Words (word boundary matching for English)
- English: "from scratch", "new project", "build a", /\bcreate\b/, /\binitialize\b/, /\bprototype\b/, /\bMVP\b/, "brand new", "start fresh"
- Chinese: "从零开始", "新项目", "建一个", "创建", "初始化", "原型", "全新"

## Brownfield Signal Words (word boundary matching for English)
- English: "add feature", /\bfix\b/, /\boptimize\b/, "iterate", /\brefactor\b/, /\bupgrade\b/, /\bimprove\b/, /\benhance\b/, /\bmodify\b/, /\bupdate\b/, /\bextend\b/
- Chinese: "添加功能", "修复", "优化", "迭代", "重构", "升级", "改进", "增强", "修改", "更新", "扩展"

## Post-Routing Guidance

### Greenfield → spec-kit

```
Detection result: This is a new project (greenfield mode)
Recommended workflow: spec-kit specification-driven development

⚠️ Prerequisite: Ensure spec-kit slash commands are registered in this project.
   Check: Do /speckit.* commands exist? If not, run: specify init --here --ai claude
   Then restart Claude Code to load the new commands.

Execute in order:
1. /speckit.constitution — Establish project charter and development principles
2. /speckit.specify — Write functional specifications (focus on "what" not "how")
3. /speckit.clarify — Clarify ambiguous requirement points
4. /speckit.plan — Create technical implementation plan
5. /speckit.tasks — Break down into executable tasks
6. /speckit.implement — Execute implementation
```

### Brownfield → openspec

```
Detection result: This is iterative development on an existing project (brownfield mode)
Recommended workflow: openspec iterative development

⚠️ Prerequisite: Ensure openspec slash commands are registered in this project.
   Check: Do /opsx:* commands exist? If not, run: openspec init --tools claude
   Then restart Claude Code to load the new commands.

Execute in order:
1. /opsx:new <feature-name> — Create a new change proposal
2. /opsx:ff — Fast-fill planning documents
3. /opsx:apply — Implement the change
4. /opsx:archive — Archive completed change
```

## Scoring Details

### Project State Score (weight 50%)

| Factor | Greenfield | Brownfield |
|--------|------------|------------|
| Source file count | 0 files: +3, 1-3: +2, 4-10: +1 | 11-50: +1, >50: +2 |
| Git commits | 0: +3, 1-3: +2, 4-10: +1 | 11-50: +1, >50: +2 |
| Config files (package.json, etc.) | Not present: +1 | Present: +1 |
| Source directories (src/, app/, etc.) | Not present: +1 | Present: +1 |
| Substantive README (>10 lines) | No: +1 | Yes: +1 |

### Requirement Semantic Score (weight 50%)

Count greenfield and brownfield signal words in the requirement text. English signals use **word boundary matching** (e.g., `\bcreate\b` does not match "recreate"); Chinese signals match as-is. Each matched signal word adds +1 to the corresponding category.
