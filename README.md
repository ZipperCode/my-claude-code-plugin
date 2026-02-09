# Maestro — Claude Code 一站式开发工具箱

<div align="center">

**自动检测项目状态 · 智能路由开发工作流 · 多模型协作 · 代码验证 · 上下文模式 · 学习系统**

[![Claude Code Plugin](https://img.shields.io/badge/Claude_Code-Plugin-7c3aed?style=flat-square)](https://docs.claude.com/docs/claude-code)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

</div>

---

## 目录

- [简介](#简介)
- [快速开始](#快速开始)
- [前置依赖](#前置依赖)
- [命令参考](#命令参考)
- [运行流程](#运行流程)
- [多模型协作](#多模型协作)
- [Hook 自动化](#hook-自动化)
- [上下文模式](#上下文模式)
- [分层规则体系](#分层规则体系)
- [代码验证](#代码验证)
- [学习系统](#学习系统)
- [策略预设与配置](#策略预设与配置)
- [运行时产物](#运行时产物)
- [项目结构](#项目结构)
- [模块详解](#模块详解)
- [Token 管理机制](#token-管理机制)
- [使用示例](#使用示例)
- [测试](#测试)
- [常见问题](#常见问题)

---

## 简介

**Maestro** 是一个 [Claude Code](https://docs.claude.com/docs/claude-code) 插件，扮演 **"一站式开发工具箱"** 角色。

它解决的核心问题是：**不同状态的项目需要不同的开发工作流**，而开发过程中需要多种辅助工具协同工作。

- **全新项目（绿地）** → 需要从需求分析、架构设计到编码的完整规范驱动流程
- **已有项目（棕地）** → 需要基于现有代码的迭代变更管理流程

Maestro 能够 **自动识别** 你的项目处于哪种状态，并 **智能路由** 到对应的工作流：

| 项目状态 | 路由目标 | 说明 |
|---------|---------|------|
| 绿地（全新） | [spec-kit](https://github.com/spec-kit/spec-kit) | 0 → 1 规范驱动开发，6 阶段流程 |
| 棕地（迭代） | [openspec](https://github.com/fission-ai/openspec) | 迭代变更管理，4 阶段流程 |

同时，Maestro 可智能调度外部 AI 模型进行**多模型协作讨论**：

- [Codex MCP](https://github.com/GuDaStudio/codexmcp) — 后端/算法分析
- [Gemini MCP](https://github.com/GuDaStudio/geminimcp) — 前端/UI 设计
- Claude（主 Agent） — 综合裁决与冲突仲裁

### 核心能力

| 能力 | 说明 |
|------|------|
| **智能路由** | 5 维项目评分 + 需求语义分析，自动选择最佳工作流 |
| **多模型协作** | codex 负责后端，gemini 负责前端，Claude 裁决冲突 |
| **规划/执行分离** | `/plan` 仅分析不动代码，`/execute` 按计划路由执行 |
| **代码验证** | Build → Type Check → Lint → Test → Security 一键扫描 |
| **上下文模式** | dev/review/research/debug 四种行为模式自动切换 |
| **Hook 自动化** | 自动格式化、类型检查、debug 语句拦截、状态快照 |
| **分层规则** | 通用 + TypeScript/Python/Rust 专属编码规则库 |
| **学习系统** | 自动提取项目惯例、架构决策、代码模式，跨会话复用 |
| **需求增强** | 自动检测项目上下文，补充技术维度和质量维度 |
| **上下文管理** | 消费侧智能处理 + 阶段摘要压缩 + 跨会话状态恢复 |
| **质量门控** | 每个阶段切换前自动验证产出完整性（≥90% 通过才放行） |
| **优雅降级** | 外部工具缺失时自动切换到可用方案，不中断工作流 |
| **策略预设** | 3 种可配置预设（conservative / balanced / unrestricted） |

### 设计原则

- **不侵入** — 不修改 spec-kit / openspec 的文件，仅在其基础上编排
- **全面** — 11 个命令、6 个 Agent、8 个 Skill，覆盖完整开发周期
- **可配置** — Token 策略外置到 `.maestro/config.json`，支持预设 + 自定义覆盖
- **纯 Markdown** — 所有命令/Agent/Skill 均为 Markdown 文件，shell 脚本仅用于 hooks

---

## 快速开始

### 第 1 步：安装前置工具

Maestro 依赖两个工作流工具，需要先安装：

```bash
# spec-kit（绿地工作流）
pip install spec-kit

# openspec（棕地工作流）
npm i -g @fission-ai/openspec
```

### 第 2 步：安装 Maestro 插件

```bash
# 将本插件目录安装到 Claude Code
claude plugin install /path/to/my-claude-plugin
```

> **提示**：将 `/path/to/my-claude-plugin` 替换为本仓库的实际路径。

### 第 3 步：初始化环境

在 Claude Code 会话中执行：

```bash
/maestro:init
```

该命令会：
1. 自动检测所有 CLI 工具和 MCP 服务器是否可用
2. **检测 spec-kit / openspec 的 slash 命令是否已在项目中注册**
3. **检测项目语言并推荐编码规则**
4. 对缺失的**可选**工具给出安装命令
5. 在当前目录生成 `.maestro/config.json` 配置文件（默认使用 `balanced` 策略预设）

### 第 3.5 步：在目标项目中注册工作流命令

> **重要**：spec-kit 和 openspec 的 slash 命令（如 `/speckit.constitution`、`/opsx:new`）不是全局的，需要在每个使用 Maestro 的项目中分别初始化。

如果 `/maestro:init` 提示 slash 命令未注册，请在**目标项目目录**中运行：

```bash
# 注册 spec-kit 工作流命令（绿地项目需要）
specify init --here --ai claude

# 注册 openspec 工作流命令（棕地项目需要）
openspec init --tools claude
```

初始化完成后，**重启 Claude Code** 使新命令生效。

### 第 4 步：开始使用

```bash
# 输入需求，Maestro 自动判断工作流
/maestro:go 从零构建一个任务管理系统

# 或者先规划后执行
/maestro:plan 从零构建一个任务管理系统
/maestro:execute

# 查看当前工作流状态
/maestro:status

# 查看所有可用命令
/maestro:tools
```

> **就是这么简单！** Maestro 会自动完成项目检测、工作流选择、多模型协作判断等一切流程。

---

## 前置依赖

### 必需工具

以下工具是 Maestro 运行的**最低要求**：

| 工具 | 用途 | 安装命令 |
|------|------|---------|
| [Claude Code](https://docs.claude.com/docs/claude-code) | 主运行环境 | `npm i -g @anthropic-ai/claude-code` |
| [spec-kit](https://github.com/spec-kit/spec-kit) (`specify` CLI) | 绿地工作流引擎 | `pip install spec-kit` |
| [openspec](https://github.com/fission-ai/openspec) (`openspec` CLI) | 棕地工作流引擎 | `npm i -g @fission-ai/openspec` |

> **注意**：安装 CLI 后，还需要在**每个使用 Maestro 的项目中**运行初始化命令来注册 slash 命令：
> - spec-kit：`specify init --here --ai claude`（注册 `/speckit.*` 命令）
> - openspec：`openspec init --tools claude`（注册 `/opsx:*` 命令）
> - 初始化后需重启 Claude Code

### 可选工具：多模型协作

安装后可启用 codex + gemini 多模型协作能力：

| 工具 | 用途 | 安装命令 |
|------|------|---------|
| [uv](https://docs.astral.sh/uv/) | MCP 服务器运行时 | `curl -LsSf https://astral.sh/uv/install.sh \| sh` |
| [Codex CLI](https://github.com/openai/codex) | 后端/算法分析 | `npm i -g @openai/codex` |
| [Gemini CLI](https://github.com/google-gemini/gemini-cli) | 前端/UI 设计 | `npm i -g @google/gemini-cli` |

MCP 桥接安装（需要先安装上面的 CLI 和 uv）：

```bash
# codex MCP 桥接
claude mcp add codex -s user --transport stdio -- \
  uvx --from git+https://github.com/GuDaStudio/codexmcp.git codexmcp

# gemini MCP 桥接
claude mcp add gemini -s user --transport stdio -- \
  uvx --from git+https://github.com/GuDaStudio/geminimcp.git geminimcp
```

### 推荐 MCP 服务器

以下 MCP 非必需，但可增强 Maestro 的能力：

| MCP | 用途 | 何时使用 | 安装参考 |
|-----|------|---------|---------|
| [sequential-thinking](https://github.com/modelcontextprotocol/servers) | 结构化思维链 | 复杂问题分解（≤5 步、3 阶段） | `claude mcp add sequential-thinking -- npx -y @modelcontextprotocol/server-sequential-thinking` |
| [context7](https://github.com/upstash/context7) | 库文档查询 | 实施阶段查库文档 | 参考 context7 官方文档 |
| [open-websearch](https://www.npmjs.com/package/open-websearch) | 通用搜索 | 查找技术资料和方案 | 参考 open-websearch 文档 |
| [serena](https://github.com/oraios/serena) | LSP 级代码理解 | 仅棕地项目的深度代码分析 | 参考 serena 官方文档 |

> **不安装可选工具？没关系。** Maestro 有完善的降级策略 — 缺少 codex/gemini 时 Claude 会自动承担对应的分析工作。

---

## 命令参考

Maestro 提供 11 个命令，均通过 `/maestro:<命令名>` 调用：

```
 Workflow:    go / plan / execute
 Development: review / debug / verify
 Analysis:    consult / context
 Management:  init / status / tools
```

### `/maestro:go` — 主入口

**功能**：智能路由 + 需求增强 + 多模型协作一站式入口

```bash
/maestro:go <需求描述> [--greenfield | --iterative] [--target <项目路径>]
```

| 参数 | 说明 |
|------|------|
| `<需求描述>` | 你想要做什么（必需） |
| `--greenfield` | 强制使用绿地工作流（spec-kit），跳过自动检测 |
| `--iterative` | 强制使用棕地工作流（openspec），跳过自动检测 |
| `--target <路径>` | 指定目标项目目录（默认为当前目录） |

**示例**：

```bash
/maestro:go 构建一个博客系统
/maestro:go 添加搜索功能 --iterative
/maestro:go 重构权限模块 --target /path/to/my-project
```

---

### `/maestro:plan` — 规划（仅分析）

**功能**：多模型协作分析，生成结构化计划文件，**不修改任何代码**

```bash
/maestro:plan <需求描述> [--greenfield | --iterative] [--target <路径>]
```

**与 `/maestro:go` 的区别**：`plan` 是 "think before you act" 命令 — 只做分析和规划，生成 `.maestro/plan.md`，不触发任何代码变更或工作流路由。适用于需要先审查计划再执行的复杂需求。

**示例**：

```bash
/maestro:plan 构建微服务架构的电商系统
# → 生成 .maestro/plan.md
# → 审查和编辑计划
/maestro:execute
# → 按计划路由到工作流
```

---

### `/maestro:execute` — 执行计划

**功能**：读取 `/maestro:plan` 生成的计划文件，验证结构，路由到工作流

```bash
/maestro:execute [plan-file-path] [--dry-run]
```

| 参数 | 说明 |
|------|------|
| `[plan-file-path]` | 计划文件路径（默认 `.maestro/plan.md`） |
| `--dry-run` | 只展示执行步骤，不实际执行 |

---

### `/maestro:review` — 多模型代码审查

**功能**：自动收集 git diff，调用 codex + gemini 进行跨视角代码审查

```bash
/maestro:review [--scope <path>] [--backend-only | --frontend-only] [--staged] [--branch <base>]
```

| 参数 | 说明 |
|------|------|
| `--scope <path>` | 限制审查范围 |
| `--staged` | 仅审查暂存区的更改 |
| `--branch <base>` | 与指定分支对比 |

**输出**：按严重性分级（Critical / Warning / Suggestion）的审查报告。

---

### `/maestro:debug` — 多模型协作调试

**功能**：接收错误信息/日志，调用 codex + gemini 进行多视角诊断

```bash
/maestro:debug <错误描述> [--file <path>] [--log <log-file>] [--backend-only | --frontend-only]
```

| 参数 | 说明 |
|------|------|
| `<错误描述>` | 错误信息或症状（必需） |
| `--file <path>` | 出错的源文件 |
| `--log <path>` | 日志文件路径 |

**输出**：排序的根因假设列表 + 诊断步骤 + 修复建议。

---

### `/maestro:verify` — 代码验证

**功能**：Build → Type Check → Lint → Test → Security 一键扫描

```bash
/maestro:verify [quick|full|pre-pr] [--fix]
```

| 模式 | 执行步骤 |
|------|---------|
| `quick`（默认） | Build + Type Check |
| `full` | Build + Type Check + Lint + Test + Security Scan |
| `pre-pr` | Full + Diff Review + Coverage Check |

- `--fix` 标志会尝试自动修复 lint 和格式问题
- `pre-pr` 模式通过后会提示使用 `/maestro:review`

---

### `/maestro:consult` — 多模型讨论

**功能**：显式召集 codex + gemini 进行多角度设计讨论

```bash
/maestro:consult <讨论主题> [--backend-only | --frontend-only] [--detailed]
```

| 参数 | 说明 |
|------|------|
| `--backend-only` | 只咨询 codex |
| `--frontend-only` | 只咨询 gemini |
| `--detailed` | 深度模式 — 无输出限制 |

---

### `/maestro:context` — 上下文模式切换

**功能**：切换行为上下文模式，改变工具优先级和响应风格

```bash
/maestro:context <dev|review|research|debug> [--auto]
```

| 模式 | 哲学 | 工具优先级 |
|------|------|-----------|
| `dev` | 先写代码后解释 | Edit > Write > Bash > Read |
| `review` | 先阅读后评论 | Read > Grep > Glob |
| `research` | 理解优先 | Read > WebSearch > Grep |
| `debug` | 假设驱动 | Grep > Bash > Read |

`--auto` 从当前工作流阶段自动推导模式。

---

### `/maestro:init` — 初始化

**功能**：检测依赖、配置环境、语言检测、规则推荐、生成配置文件

```bash
/maestro:init
```

**执行内容**：
1. 检测所有 CLI 工具和 MCP 服务器
2. 检测 slash 命令注册状态
3. **检测项目语言（TypeScript/Python/Rust/Go）并推荐编码规则**
4. 生成 `.maestro/config.json`

---

### `/maestro:status` — 状态查看

```bash
/maestro:status [--detail]
```

---

### `/maestro:tools` — 工具菜单

**功能**：展示所有可用命令的分类参考

```bash
/maestro:tools
```

---

## 运行流程

### 核心流程图

```
用户输入需求
      │
      ▼
/maestro:go <需求>
      │
      ├─ Phase 1: 解析输入
      ├─ Phase 1.8: 需求增强（自动检测项目上下文，补充技术维度）
      ├─ Phase 1.5: 验证工作流工具就绪
      ├─ Phase 2: 检测项目状态（评分 + 语义分析）
      ├─ Phase 3: 智能多模型协作（codex + gemini 并行调用）
      ├─ Phase 4: 路由到工作流 + 生成 plan.md
      ├─ Phase 4.5: 提示 plan/execute 分离工作流
      ├─ Phase 5: 保存状态到 .maestro/state.json
      └─ Phase 6: 学习提取（捕获项目惯例和决策）
```

### 规划/执行分离流程

```
/maestro:plan <需求>        /maestro:execute
      │                          │
      ├─ 需求增强                 ├─ 定位 plan 文件
      ├─ 项目检测                 ├─ 验证 plan 结构
      ├─ 多模型分析（深度）        ├─ 检查工作流就绪
      ├─ 生成 plan.md             └─ 路由到工作流
      └─ 不修改代码                   （展示执行步骤）
```

### 路由决策树

```
START
  │
  ├─ 已有 .specify/ 未完成阶段？ ──────→ 继续 spec-kit
  ├─ 已有 openspec/ 活跃变更？   ──────→ 继续 openspec
  ├─ 用户指定 --greenfield？     ──────→ spec-kit
  ├─ 用户指定 --iterative？      ──────→ openspec
  │
  └─ 无显式标志 → 自动检测
      │
      ├── 项目评分（权重 50%）
      │   ├─ 源码文件数   0 → 绿+3 │ 1~3 → 绿+2 │ >50 → 棕+2
      │   ├─ Git 提交数   0 → 绿+3 │ 1~3 → 绿+2 │ >50 → 棕+2
      │   ├─ 配置文件     无 → 绿+1 │ 有 → 棕+1
      │   ├─ 源码目录     无 → 绿+1 │ 有 → 棕+1
      │   └─ 实质 README  无 → 绿+1 │ >10行 → 棕+1
      │
      ├── 语义评分（权重 50%）
      │   ├─ 绿地信号词：从零开始、新项目、创建、MVP...
      │   └─ 棕地信号词：添加功能、修复、优化、重构...
      │
      └── 决策
          ├─ 差值 ≥ 3 → 高置信度，自动选择
          └─ 差值 ≤ 2 → 低置信度，向用户确认
```

### 路由后的工作流

**绿地 → spec-kit 六阶段：**

```
1. /speckit.constitution  → 建立项目宪章和开发原则
2. /speckit.specify       → 编写功能规范
3. /speckit.clarify       → 澄清不明确的需求
4. /speckit.plan          → 制定技术实施计划
5. /speckit.tasks         → 分解为可执行任务
6. /speckit.implement     → 执行实施
```

**棕地 → openspec 四阶段：**

```
1. /opsx:new <功能名>     → 创建新的变更提案
2. /opsx:ff               → 快速填充规划文档
3. /opsx:apply            → 实施变更
4. /opsx:archive          → 存档已完成的变更
```

> **注意**：Maestro 只会 **引导** 你执行上述命令，不会自动代为执行。

---

## 多模型协作

### 自动触发条件

在 `/maestro:go` 流程中，满足以下 **任一** 条件会自动启动多模型协作：

| 条件 | 示例 |
|------|------|
| 需求同时涉及前端 + 后端 | "构建包含 REST API 和 React 前端的系统" |
| 涉及架构级决策 | "设计微服务架构"、"技术选型" |
| 需求描述超过 200 字 | 长篇复杂需求 |
| 包含多个功能模块 | "需要用户管理、以及订单系统、同时还要支付" |

### 分工与合成

```
                  用户需求
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
    ┌───────────┐         ┌───────────┐
    │  codex    │         │  gemini   │
    │  后端/算法 │         │  前端/UI  │
    └─────┬─────┘         └─────┬─────┘
          │                     │
          └──────────┬──────────┘
                     ▼
          ┌──────────────────┐
          │  保存完整原文到    │
          │  .maestro/        │
          │  consultations/   │
          └────────┬─────────┘
                   ▼
          ┌──────────────────┐
          │ context-curator  │
          │ 提取结构化摘要    │
          └────────┬─────────┘
                   ▼
             ┌──────────────┐
             │    Claude    │
             │  合成 + 裁决  │
             └──────────────┘
```

### 降级策略

| codex | gemini | 策略 |
|-------|--------|------|
| ✅ | ✅ | 完整多模型协作 |
| ✅ | ❌ | codex 后端 + Claude 承担前端分析 |
| ❌ | ✅ | Claude 承担后端分析 + gemini 前端 |
| ❌ | ❌ | Claude 独立完成全部分析 |

### codex vs gemini MCP 参数差异

| 参数 | codex | gemini |
|------|-------|--------|
| `PROMPT` | string（必需） | string（必需） |
| `cd` | Path（必需） | **不支持** |
| `sandbox` | **string**: `"read-only"` | **boolean**: `false` |

---

## Hook 自动化

Maestro 通过 hooks 在关键生命周期事件中自动执行任务：

| 事件 | Hook | 行为 |
|------|------|------|
| **SessionStart** | 状态加载 | 自动读取 `.maestro/state.json` 恢复工作流状态 |
| **SessionStart** | 学习加载 | 加载 `.maestro/learnings/` 中的项目经验 |
| **PreToolUse(Bash)** | Debug 检测 | `git commit` 前扫描暂存文件中的调试语句（console.log、debugger 等） |
| **PostToolUse(Edit\|Write)** | 自动格式化 | 按文件类型调用 Prettier/Ruff/gofmt/rustfmt |
| **PostToolUse(Edit\|Write)** | 类型检查 | .ts/.tsx 文件编辑后运行 `tsc --noEmit` |
| **PreCompact** | 状态快照 | 上下文压缩前备份 state.json（保留最近 3 个） |
| **Stop** | 会话结束 | 提醒可提取学习记录 |

所有 hook 脚本位于 `scripts/` 目录，采用优雅降级策略（找不到工具时静默退出，不阻塞工作流）。

---

## 上下文模式

通过 `/maestro:context` 切换行为模式，改变 Claude 的工具优先级和响应风格：

| 模式 | 适用场景 | 行为特点 |
|------|---------|---------|
| **dev** | 编码实施 | 立即写代码，最小解释 |
| **review** | 代码审查 | 详细阅读，不主动修改，按严重性分级 |
| **research** | 技术调研 | 深度探索，延迟实施，产出摘要和分析 |
| **debug** | 问题排查 | 假设驱动，系统化验证，结构化诊断 |

```bash
# 手动切换
/maestro:context dev
/maestro:context review

# 从当前工作流阶段自动推导
/maestro:context --auto
```

上下文模式会随工作流阶段自动切换（如进入 implementation → dev 模式，进入 review → review 模式）。

---

## 分层规则体系

Maestro 内置了按语言分层的编码规则库，位于 `rules/` 目录：

```
rules/
  common/                    ← 通用规则（所有语言）
    coding-style.md          # KISS/YAGNI/DRY/SOLID + 命名规范
    git-workflow.md          # Conventional Commits + 分支策略
    testing.md               # 覆盖率目标 + 测试结构
    security.md              # 安全检查清单
  typescript/                ← TypeScript 专属
    patterns.md              # 类型安全 + async + import
    tools.md                 # ESLint/Prettier/tsc 配置
  python/                    ← Python 专属
    patterns.md              # Type hints + 错误处理
    tools.md                 # Ruff/Mypy/Pytest 配置
  rust/                      ← Rust 专属
    patterns.md              # 错误处理 + 所有权 + 并发
    tools.md                 # Clippy/Cargo/rustfmt 配置
```

### 安装规则

执行 `/maestro:init` 时会自动检测项目语言并推荐规则。安装方式：

```bash
mkdir -p .claude/rules
cp <plugin-dir>/rules/common/*.md .claude/rules/
cp <plugin-dir>/rules/typescript/*.md .claude/rules/   # 按语言选择
```

规则是 **参考模板** — 拷贝后可自由定制。

---

## 代码验证

`/maestro:verify` 提供三种验证级别：

```bash
# 快速验证（默认）— Build + Type Check
/maestro:verify quick

# 完整验证 — Build + Type Check + Lint + Test + Security
/maestro:verify full

# PR 前验证 — Full + Diff Review + Coverage
/maestro:verify pre-pr

# 尝试自动修复
/maestro:verify full --fix
```

### 安全扫描

验证过程会扫描以下安全模式：
- AWS 密钥（`AKIA...`）、API 密钥（`sk-...`）、GitHub Token（`ghp_...`）
- 私钥文件（`-----BEGIN...PRIVATE KEY`）
- 调试语句（`console.log`、`debugger`、`print(`）

### 自动化集成

建议在 PR 前运行 `/maestro:verify pre-pr`，通过后再使用 `/maestro:review` 进行多模型代码审查。

---

## 学习系统

Maestro 的学习系统在工作过程中自动提取项目特有的知识：

### 三类学习

| 类型 | 存储文件 | 内容示例 |
|------|---------|---------|
| **Conventions** | `.maestro/learnings/conventions.md` | "API 路由遵循 /api/v1/{resource} 命名" |
| **Decisions** | `.maestro/learnings/decisions.md` | "选择 Redis 做 session 存储因为需要失效能力" |
| **Patterns** | `.maestro/learnings/patterns.md` | "错误响应统一使用 AppError.from() 包装" |

### 工作方式

1. **自动提取**：命令执行后（go/consult/review/debug），如果会话涉及实质性分析，`learning-extractor` agent 自动提取学习
2. **自动加载**：每次 SessionStart 通过 hook 自动加载最近的学习记录
3. **去重**：新学习与最近 10 条对比，避免重复
4. **持久化**：学习文件存储在 `.maestro/learnings/`，跨会话持久存在

---

## 策略预设与配置

### 三种预设

| 预设 | 适用场景 | SESSION_ID 追问 | 调用上限 |
|------|---------|----------------|---------|
| **conservative** | Token 敏感 / 低配额 | 禁止 | 6 次 |
| **balanced**（默认） | 日常开发 | 允许 1 次 | 10 次 |
| **unrestricted** | 深度架构讨论 | 不限 | 无上限 |

### 配置文件

策略配置位于 `.maestro/config.json` 的 `policy` 段：

```json
{
  "policy": {
    "preset": "balanced",
    "custom": {
      "mcp.maxCalls": 12,
      "mcp.maxFollowUps": 2
    }
  }
}
```

`custom` 中的字段会覆盖预设的对应值。

---

## 运行时产物

```
<你的项目>/
└── .maestro/
    ├── state.json                  # 工作流状态
    ├── config.json                 # 环境配置与策略
    ├── plan.md                     # 规划文件（/maestro:plan 生成）
    ├── summaries/                  # 各阶段详细摘要
    ├── consultations/              # MCP 调用完整原文记录
    └── learnings/                  # 学习记录
        ├── conventions.md          #   项目惯例
        ├── decisions.md            #   架构决策
        └── patterns.md             #   代码模式
```

---

## 项目结构

```
my-claude-plugin/
├── .claude-plugin/
│   └── plugin.json                  # 插件清单
├── CLAUDE.md                        # 插件行为规则
├── README.md                        # 本文件
│
├── commands/                        # 用户命令（11 个）
│   ├── go.md                        #   主入口：智能路由 + 多模型协作
│   ├── plan.md                      #   规划：多模型分析，仅生成计划
│   ├── execute.md                   #   执行：读取计划，路由到工作流
│   ├── init.md                      #   依赖检测 + 语言检测 + 规则推荐
│   ├── consult.md                   #   显式多模型讨论
│   ├── review.md                    #   多模型代码审查
│   ├── debug.md                     #   多模型协作调试
│   ├── verify.md                    #   代码验证（build/lint/test/security）
│   ├── context.md                   #   上下文模式切换
│   ├── status.md                    #   工作流状态查看
│   └── tools.md                     #   命令参考菜单
│
├── agents/                          # 专职代理（6 个）
│   ├── workflow-detector.md         #   绿地/棕地检测（haiku）
│   ├── model-coordinator.md         #   多模型编排协调
│   ├── context-curator.md           #   上下文压缩 + 摘要提取（haiku）
│   ├── quality-gate.md              #   阶段质量门控（sonnet）
│   ├── verifier.md                  #   代码验证执行（haiku）
│   └── learning-extractor.md        #   学习提取（haiku）
│
├── skills/                          # 知识库（8 个）
│   ├── workflow-routing/SKILL.md    #   路由决策树、评分规则
│   ├── mcp-protocols/SKILL.md       #   MCP 调用约定、降级矩阵
│   ├── token-management/SKILL.md    #   Token 控制策略
│   ├── role-prompts/SKILL.md        #   阶段感知角色模板
│   ├── contexts/SKILL.md            #   上下文模式定义
│   ├── rules-guide/SKILL.md         #   规则安装指南
│   ├── learning/SKILL.md            #   学习提取规则
│   └── prompt-enhance/SKILL.md      #   需求增强模板
│
├── rules/                           # 分层编码规则（10 个文件）
│   ├── common/                      #   通用规则
│   │   ├── coding-style.md
│   │   ├── git-workflow.md
│   │   ├── testing.md
│   │   └── security.md
│   ├── typescript/                  #   TypeScript 专属
│   │   ├── patterns.md
│   │   └── tools.md
│   ├── python/                      #   Python 专属
│   │   ├── patterns.md
│   │   └── tools.md
│   └── rust/                        #   Rust 专属
│       ├── patterns.md
│       └── tools.md
│
├── hooks/
│   └── hooks.json                   # 5 个生命周期事件钩子
│
├── scripts/                         # Shell 脚本（6 个）
│   ├── check-deps.sh               #   依赖检测
│   ├── detect-project-state.sh      #   项目状态评分
│   ├── auto-format.sh              #   自动格式化 hook
│   ├── typecheck-after-edit.sh      #   TypeScript 类型检查 hook
│   ├── detect-debug-statements.sh   #   调试语句检测 hook
│   └── save-state-snapshot.sh       #   状态快照 hook
│
├── templates/
│   └── constitution.md              # 项目宪章模板
│
└── tests/
    ├── validate-structure.sh        # 结构验证（含所有 55+ 文件）
    └── detect-project-state.bats    # 项目状态检测测试
```

---

## 模块详解

### Commands（命令）

| 命令 | 允许的工具 | 职责 |
|------|----------|------|
| `go` | Read, Glob, Grep, Bash, Write, Task | 需求增强 → 检测项目 → 多模型 → 路由 → 学习 |
| `plan` | Read, Glob, Grep, Bash, Write, Task | 需求增强 → 检测 → 深度多模型分析 → 生成 plan.md |
| `execute` | Read, Glob, Bash, Write | 定位 plan → 验证结构 → 路由工作流 |
| `review` | Read, Glob, Grep, Bash, Write, Task | 收集 diff → codex+gemini 审查 → 合成报告 → 学习 |
| `debug` | Read, Glob, Grep, Bash, Write, Task | 收集错误 → codex+gemini 诊断 → 假设列表 → 学习 |
| `verify` | Read, Glob, Grep, Bash, Write | 调用 verifier agent → 展示报告 |
| `consult` | Read, Write, Bash, Task | 多模型讨论 → 合成建议 → 学习 |
| `context` | Read, Write | 切换行为模式 → 更新 state.json |
| `init` | Bash, Read, Write | 依赖检测 → 语言检测 → 规则推荐 → 生成 config |
| `status` | Read, Bash, Glob | 读取状态 → 报告进度 |
| `tools` | Read, Glob | 扫描命令 → 分类展示 |

### Agents（代理）

| Agent | 模型 | 职责 |
|-------|------|------|
| `workflow-detector` | haiku | 绿地/棕地检测 |
| `model-coordinator` | default | codex/gemini 调用编排 |
| `context-curator` | haiku | MCP 摘要提取 + 上下文压缩 + 决策存档 |
| `quality-gate` | sonnet | 阶段产出完整性验证 |
| `verifier` | haiku | 代码验证执行（build/lint/test/security） |
| `learning-extractor` | haiku | 项目学习提取（惯例/决策/模式） |

### Skills（知识库）

| Skill | 核心内容 |
|-------|---------|
| `workflow-routing` | 路由决策树、5 维评分规则、信号词库 |
| `mcp-protocols` | MCP 参数模板、降级矩阵、消费侧处理 |
| `token-management` | 消费侧架构、预设系统、上下文预算 |
| `role-prompts` | 6 种阶段感知角色模板（analyzer/architect/implementer/reviewer/debugger/optimizer） |
| `contexts` | 4 种行为模式定义（dev/review/research/debug） |
| `rules-guide` | 语言检测表、规则安装指南 |
| `learning` | 学习提取规则、存储格式、去重逻辑 |
| `prompt-enhance` | 需求增强维度、自动填充策略 |

---

## Token 管理机制

Maestro 采用 **"消费侧智能处理"** 架构：

| 层级 | 策略 | 实现方式 |
|------|------|---------|
| **引导层** | MCP 输出引导 | 按 policy 注入引导性指令（不硬截断） |
| **保存层** | 完整原文保留 | 全文存入 `.maestro/consultations/` |
| **提取层** | 消费侧压缩 | context-curator 提取结构化摘要 |
| **预防层** | 轻量 Agent | haiku 模型降低消耗 |
| **压缩层** | 两层摘要 | 索引（state.json）+ 详细（summaries/） |
| **恢复层** | 跨会话状态 | SessionStart hook + learnings 自动加载 |

---

## 使用示例

### 场景 1：规划/执行分离工作流

```bash
# 1. 先规划
/maestro:plan 构建一个支持实时协作的在线文档编辑器

# 2. 审查 .maestro/plan.md，修改不满意的部分

# 3. 执行计划
/maestro:execute

# 4. 按指引执行工作流命令
```

### 场景 2：开发过程中的验证循环

```bash
# 编码中...快速验证
/maestro:verify quick

# 准备提 PR 前
/maestro:verify pre-pr

# 验证通过后进行代码审查
/maestro:review --staged
```

### 场景 3：上下文模式切换

```bash
# 调研阶段 — research 模式
/maestro:context research
/maestro:consult 微服务 vs 单体架构的选择

# 进入开发 — dev 模式
/maestro:context dev

# 遇到 bug — debug 模式
/maestro:context debug
/maestro:debug TypeError: Cannot read property 'id' of undefined --file src/user.ts
```

### 场景 4：跨会话继续

```bash
# 会话 A
/maestro:go 构建电商系统
# → 路由到 spec-kit，完成 constitution + specify
# → 学习系统自动提取项目惯例和决策

# 会话 B（自动恢复）
# → SessionStart hook 加载 state.json + learnings
/maestro:status   # 查看进度
# → 继续 /speckit.clarify
```

---

## 测试

### 运行结构验证

```bash
bash tests/validate-structure.sh
```

验证内容：
- 所有 55+ 必需文件是否存在
- JSON 文件格式有效
- 无硬编码绝对路径
- Shell 脚本 shebang 正确
- Markdown frontmatter 完整

### 运行单元测试

```bash
bats tests/detect-project-state.bats
```

---

## 常见问题

### Q: 首次使用必须执行 `/maestro:init` 吗？

**A:** 强烈建议执行。`init` 会检测环境并生成 `.maestro/config.json`，同时推荐编码规则。

### Q: 没有安装 codex / gemini 可以使用吗？

**A:** 完全可以。Claude 会自动承担对应的分析工作。核心功能不依赖外部模型。

### Q: `/maestro:plan` 和 `/maestro:go` 有什么区别？

**A:** `plan` 只做分析和规划，生成 `.maestro/plan.md`，不修改代码也不路由到工作流。适用于复杂需求需要先审查方案的场景。`go` 是一站式流程，直接完成检测、分析、路由。

### Q: 上下文模式会自动切换吗？

**A:** 工作流阶段切换时会自动推导合适的上下文模式。你也可以随时用 `/maestro:context <mode>` 手动切换。

### Q: `.maestro/` 目录需要加入 `.gitignore` 吗？

**A:** 推荐加入。`.maestro/` 包含本地状态和 MCP 原文，通常是个人化的。

### Q: 如何安装编码规则？

**A:** 执行 `/maestro:init` 会检测项目语言并推荐规则。手动安装：
```bash
mkdir -p .claude/rules
cp <plugin-dir>/rules/common/*.md .claude/rules/
cp <plugin-dir>/rules/typescript/*.md .claude/rules/
```

### Q: 学习系统的数据存在哪里？

**A:** 存储在 `.maestro/learnings/` 目录，包含三个文件：`conventions.md`（惯例）、`decisions.md`（决策）、`patterns.md`（模式）。每次会话自动加载最近记录。

---

## 许可证

MIT License

---

*Built with Claude Code by zipper*
