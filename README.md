# Maestro — Claude Code 元工作流编排插件

<div align="center">

**自动检测项目状态 · 智能路由开发工作流 · 多模型协作讨论**

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

**Maestro** 是一个 [Claude Code](https://docs.claude.com/docs/claude-code) 插件，扮演 **"元工作流指挥中枢"** 角色。

它解决的核心问题是：**不同状态的项目需要不同的开发工作流**。

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
| **上下文管理** | 消费侧智能处理 + 阶段摘要压缩 + 跨会话状态恢复，防止 Token 爆炸 |
| **质量门控** | 每个阶段切换前自动验证产出完整性（≥90% 通过才放行） |
| **优雅降级** | 外部工具缺失时自动切换到可用方案，不中断工作流 |
| **策略预设** | 3 种可配置预设（conservative / balanced / unrestricted） |

### 设计原则

- **不侵入** — 不修改 spec-kit / openspec 的文件，仅在其基础上编排
- **精简** — 4 个命令、4 个 Agent、3 个 Skill，不过度工程化
- **可配置** — Token 策略外置到 `.maestro/config.json`，支持预设 + 自定义覆盖

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
3. 对缺失的**可选**工具给出安装命令
4. 在当前目录生成 `.maestro/config.json` 配置文件（默认使用 `balanced` 策略预设）

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

# 查看当前工作流状态
/maestro:status
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

Maestro 提供 4 个命令，均通过 `/maestro:<命令名>` 调用。

### `/maestro:go` — 主入口

**功能**：智能路由 + 多模型协作一站式入口

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
# 自动检测项目状态
/maestro:go 构建一个博客系统

# 强制绿地模式
/maestro:go 创建一个微服务框架 --greenfield

# 强制棕地模式
/maestro:go 添加搜索功能 --iterative

# 指定目标项目
/maestro:go 重构权限模块 --target /path/to/my-project
```

---

### `/maestro:init` — 初始化

**功能**：检测依赖、配置环境、生成配置文件

```bash
/maestro:init
```

**执行内容**：
1. 检测所有 CLI 工具（specify、openspec、codex、gemini）是否安装
2. 检测 spec-kit / openspec 的 slash 命令是否已在项目中注册
3. 检测所有 MCP 服务器是否已注册
4. 对缺失项输出彩色状态报告和安装/初始化命令
5. 生成 `.maestro/config.json`（含工具可用性、slash 命令状态、降级模式、策略预设）

> **何时使用**：首次使用 Maestro 前必须执行一次。之后如果安装了新工具，可再次执行来更新配置。

---

### `/maestro:consult` — 多模型讨论

**功能**：显式召集 codex + gemini 进行多角度设计讨论

```bash
/maestro:consult <讨论主题> [--backend-only | --frontend-only] [--detailed]
```

| 参数 | 说明 |
|------|------|
| `<讨论主题>` | 要讨论的技术问题（必需） |
| `--backend-only` | 只咨询 codex（后端/算法） |
| `--frontend-only` | 只咨询 gemini（前端/UI） |
| `--detailed` | 深度模式 — 临时切换为 `unrestricted` 策略，无输出限制 |

**示例**：

```bash
# 全栈讨论
/maestro:consult 设计一个实时聊天系统

# 仅后端
/maestro:consult 数据库分库分表方案 --backend-only

# 仅前端
/maestro:consult 仪表盘 UI 布局设计 --frontend-only

# 深度讨论（无限制）
/maestro:consult 百万级并发推送系统架构 --detailed
```

> **与 `/maestro:go` 的区别**：`consult` 不走工作流路由，纯粹用于多模型讨论获取建议。

---

### `/maestro:status` — 状态查看

**功能**：查看当前工作流进度、关键决策和下一步建议

```bash
/maestro:status [--detail]
```

| 参数 | 说明 |
|------|------|
| `--detail` | 显示详细信息（包含阶段摘要、MCP 咨询记录等） |

**输出内容**：
- 当前激活的工作流（spec-kit / openspec）
- 当前所处阶段
- 已记录的关键决策
- 工具可用性状态
- 建议的下一步操作

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
      │   ├─ 提取需求文本
      │   └─ 检查 --greenfield / --iterative / --target 标志
      │
      ├─ Phase 2: 检测项目状态（无显式标志时）
      │   ├─ 快速路由：已有 .specify/ 或 openspec/ 目录？→ 继续对应工作流
      │   ├─ 项目评分（权重 50%）：文件数 + Git 历史 + 配置文件 + 源码目录 + README
      │   └─ 语义评分（权重 50%）：需求文本中的绿地/棕地信号词匹配
      │
      ├─ Phase 3: 智能多模型判断
      │   ├─ 触发条件：全栈需求 / 架构决策 / 长描述 / 多模块
      │   ├─ 是 → 调用 codex + gemini → 保存原文 → 提取摘要 → 合成建议
      │   └─ 否 → 跳过多模型
      │
      ├─ Phase 4: 路由到工作流
      │   ├─ 绿地 → 引导用户执行 spec-kit 六阶段流程
      │   └─ 棕地 → 引导用户执行 openspec 四阶段流程
      │
      └─ Phase 5: 保存状态到 .maestro/state.json
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
      │   ├─ 源码文件数   0 → 绿+3 │ 1~3 → 绿+2 │ 4~10 → 绿+1 │ 11~50 → 棕+1 │ >50 → 棕+2
      │   ├─ Git 提交数   0 → 绿+3 │ 1~3 → 绿+2 │ 4~10 → 绿+1 │ 11~50 → 棕+1 │ >50 → 棕+2
      │   ├─ 配置文件     无 → 绿+1 │ 有 → 棕+1
      │   ├─ 源码目录     无 → 绿+1 │ 有 → 棕+1
      │   └─ 实质 README  无 → 绿+1 │ >10行 → 棕+1
      │
      ├── 语义评分（权重 50%）
      │   ├─ 绿地信号词：从零开始、新项目、创建、MVP、prototype...
      │   └─ 棕地信号词：添加功能、修复、优化、重构、升级...
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

> **注意**：Maestro 只会 **引导** 你执行上述命令，不会自动代为执行。你需要手动执行每个阶段的命令。

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
    │           │         │           │
    │ · 架构设计 │         │ · UI 架构 │
    │ · 数据模型 │         │ · 组件拆分 │
    │ · API 设计 │         │ · 交互流程 │
    │ · 算法选择 │         │ · 视觉设计 │
    │ · 风险评估 │         │ · UX 要点 │
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
             │              │
             │ · 识别一致点  │
             │ · 标注冲突    │
             │ · 裁决分歧    │
             │ · 统一建议    │
             └──────────────┘
```

### 降级策略

当外部模型不可用时，Maestro 会自动降级：

| codex | gemini | 策略 |
|-------|--------|------|
| ✅ | ✅ | 完整多模型协作 |
| ✅ | ❌ | codex 后端 + **Claude 承担前端分析** |
| ❌ | ✅ | **Claude 承担后端分析** + gemini 前端 |
| ❌ | ❌ | **Claude 独立完成全部分析** |

### codex vs gemini MCP 参数差异

这两个 MCP 的 API 存在**关键差异**，开发者需注意：

| 参数 | codex | gemini |
|------|-------|--------|
| `PROMPT` | string（必需） | string（必需） |
| `cd` | Path（必需） | **不支持** |
| `sandbox` | **string**: `"read-only"` / `"workspace-write"` / `"danger-full-access"` | **boolean**: `true` / `false` |

返回值格式（两者相同）：

```json
// 成功
{ "success": true, "SESSION_ID": "uuid", "agent_messages": "分析内容..." }

// 失败
{ "success": false, "error": "错误描述" }
```

---

## 策略预设与配置

Maestro 使用可配置的策略预设系统来控制 Token 使用和 MCP 行为。

### 核心理念：消费侧处理 > 生产侧限制

```
传统做法：prompt("限制1500字") → MCP 输出 1500 字 → 直接使用 ❌（信息不可逆丢失）

Maestro：prompt(引导性指令) → MCP 输出完整分析 → 完整原文存入 .maestro/consultations/
                                                  → context-curator 提取关键决策
                                                  → 压缩版进入主上下文
                                                  → 用户可随时查看完整原文 ✅
```

### 三种预设

| 预设 | 适用场景 | MCP 输出引导 | SESSION_ID 追问 | 调用上限 | 摘要长度 |
|------|---------|-------------|----------------|---------|---------|
| **conservative** | Token 敏感 / 低配额 API | 限制 ≤1500 字符 | 禁止 | 6 次 | 索引 500 / 详细 1500 字符 |
| **balanced**（默认） | 日常开发 | 引导结构化输出 | 允许 1 次 | 10 次 | 索引 800 / 详细 3000 字符 |
| **unrestricted** | 深度架构讨论 | 无限制 | 不限 | 无上限 | 无上限 |

### 配置文件位置

策略配置位于 `.maestro/config.json` 的 `policy` 段（由 `/maestro:init` 自动生成）：

```json
{
  "policy": {
    "preset": "balanced",
    "custom": {}
  }
}
```

### 如何切换预设

直接修改 `preset` 字段即可：

```json
{
  "policy": {
    "preset": "conservative"
  }
}
```

### 如何自定义覆盖

在 `custom` 中可覆盖预设的任意字段，**优先级**：`custom` > `preset` > 默认值（balanced）

```json
{
  "policy": {
    "preset": "balanced",
    "custom": {
      "mcp.outputHint": "Be concise, ≤ 3000 characters",
      "mcp.maxCalls": 12,
      "mcp.allowFollowUp": true,
      "mcp.maxFollowUps": 2,
      "summary.indexLength": 1000,
      "summary.detailLength": 4000
    }
  }
}
```

### 可配置字段一览

| 字段 | 说明 | conservative | balanced | unrestricted |
|------|------|-------------|----------|-------------|
| `mcp.outputHint` | 注入 MCP prompt 的输出引导文本 | `"Be concise, ≤ 1500 chars"` | `"Provide a thorough, structured analysis..."` | (空) |
| `mcp.maxCalls` | 单次会话 MCP 调用上限 | 6 | 10 | 无限制 |
| `mcp.allowFollowUp` | 是否允许 SESSION_ID 追问 | `false` | `true` | `true` |
| `mcp.maxFollowUps` | 最大追问次数 | 0 | 1 | 无限制 |
| `summary.indexLength` | `state.json` 中索引摘要长度 | 500 字符 | 800 字符 | 无限制 |
| `summary.detailLength` | `summaries/` 中详细摘要长度 | 1500 字符 | 3000 字符 | 无限制 |
| `storage.keyDecisions.maxInState` | `state.json` 中 keyDecisions 上限 | — | — | — |
| `storage.consultations.maxAge` | 咨询文件最大保留时间 | — | — | — |
| `storage.consultations.maxCount` | 咨询文件最大保留数量 | — | — | — |

---

## 运行时产物

Maestro 在工作过程中会在目标项目目录下生成 `.maestro/` 目录：

```
<你的项目>/
└── .maestro/                       ← Maestro 生成的所有产物
    ├── state.json                  # 工作流状态（核心文件）
    ├── config.json                 # 环境配置与策略预设
    ├── summaries/                  # 各阶段详细摘要
    │   ├── routing-complete.md     #   路由完成摘要
    │   ├── constitution.md         #   宪章阶段摘要
    │   ├── specify.md              #   规范阶段摘要
    │   ├── decisions-archive.md    #   keyDecisions 溢出存档
    │   └── ...
    └── consultations/              # MCP 调用完整原文记录
        ├── codex-2026-02-08T12-30-00Z.md
        ├── gemini-2026-02-08T12-31-00Z.md
        └── ...
```

### `state.json` — 工作流状态

这是 Maestro 的核心状态文件，新会话启动时会自动加载：

```json
{
  "activeWorkflow": "spec-kit",          // 当前工作流：spec-kit | openspec | null
  "targetProject": "/path/to/project",   // 目标项目路径
  "currentStage": "specify",             // 当前所处阶段
  "requirement": "用户的需求描述",         // 原始需求文本
  "routingResult": {                     // 路由决策详情
    "method": "auto-detect",             //   检测方式：auto-detect | explicit | resume
    "scores": {                          //   评分结果
      "greenfield": 4,
      "brownfield": 1
    },
    "confidence": "high"                 //   置信度：high | low
  },
  "multiModelUsed": true,               // 是否使用了多模型协作
  "stageSummary": "索引级摘要...",        // 自动加载的简短摘要
  "keyDecisions": [                      // 关键决策记录
    {
      "stage": "consultation",
      "decision": "使用 React + TypeScript + NestJS",
      "reason": "多模型一致推荐",
      "timestamp": "2026-02-08T12:30:00Z"
    }
  ],
  "lastActivity": "2026-02-08T12:30:00Z" // 最后活动时间
}
```

### `config.json` — 环境配置

由 `/maestro:init` 生成，记录工具可用性和策略预设：

```json
{
  "pluginDir": "/path/to/maestro-plugin", // 插件目录路径
  "detectedAt": "2026-02-08T12:00:00Z",  // 检测时间
  "cli": {                                // CLI 工具可用性
    "specify": true,
    "openspec": true,
    "codex": true,
    "gemini": true
  },
  "slashCommands": {                      // 项目级 slash 命令注册状态
    "speckit": true,
    "openspec": true
  },
  "mcp": {                                // MCP 服务器可用性
    "codex": true,
    "gemini": true,
    "sequential-thinking": true,
    "serena": false,
    "context7": true,
    "open-websearch": true
  },
  "multiModelAvailable": true,            // 是否可用多模型协作
  "degradationMode": "none",              // 降级模式：none | codex-only | gemini-only | solo
  "policy": {                             // 策略预设
    "preset": "balanced",
    "custom": {}
  }
}
```

### 文件生命周期

| 文件 | 创建时机 | 更新频率 | 清理策略 |
|------|---------|---------|---------|
| `state.json` | `/maestro:go` 首次路由后 | 每次阶段切换 | 手动删除或新工作流覆盖 |
| `config.json` | `/maestro:init` 执行时 | 再次执行 init 时 | 手动修改或重新 init |
| `summaries/*.md` | 每个阶段完成时 | 不更新（追加新文件） | 手动清理 |
| `consultations/*.md` | 每次 MCP 调用后 | 不更新（追加新文件） | 由 context-curator 按 maxAge + maxCount 自动清理 |

---

## 项目结构

```
my-claude-plugin/
├── .claude-plugin/
│   └── plugin.json                  # 插件清单（名称、描述、作者）
├── .claude/
│   └── settings.local.json          # Claude Code 权限配置
├── CLAUDE.md                        # 插件行为规则与约束
├── README.md                        # 本文件
│
├── commands/                        # 用户可调用的命令（4 个）
│   ├── go.md                        #   主入口：智能路由 + 多模型协作
│   ├── init.md                      #   依赖检测与环境初始化
│   ├── consult.md                   #   显式多模型讨论
│   └── status.md                    #   工作流状态查看
│
├── agents/                          # 专职代理（4 个）
│   ├── workflow-detector.md         #   绿地/棕地检测（haiku 模型）
│   ├── model-coordinator.md         #   多模型编排协调
│   ├── context-curator.md           #   上下文压缩 + MCP 摘要提取（haiku 模型）
│   └── quality-gate.md              #   阶段质量门控（sonnet 模型）
│
├── skills/                          # 无状态知识库（3 个）
│   ├── workflow-routing/SKILL.md    #   路由决策树、评分规则、信号词
│   ├── mcp-protocols/SKILL.md       #   MCP 调用约定、降级矩阵
│   └── token-management/SKILL.md    #   Token 控制策略、消费侧处理
│
├── hooks/
│   └── hooks.json                   # SessionStart 钩子：自动加载工作流状态
│
├── scripts/
│   ├── check-deps.sh                # 依赖检测脚本（CLI + MCP）
│   └── detect-project-state.sh      # 项目状态评分脚本
│
├── templates/
│   └── constitution.md              # 项目宪章模板
│
└── tests/
    ├── README.md                    # 测试文档
    ├── validate-structure.sh        # 结构验证脚本
    └── detect-project-state.bats    # 项目状态检测单元测试（BATS）
```

---

## 模块详解

### Commands（命令）— 用户交互入口

命令是用户通过 `/maestro:<name>` 调用的入口点，每个命令定义了允许使用的工具和执行流程。

| 命令 | 允许的工具 | 职责 |
|------|----------|------|
| `go` | Read, Glob, Grep, Bash, Write, Task | 解析需求 → 检测项目 → 判断多模型 → 路由工作流 → 保存状态 |
| `init` | Bash, Read, Write | 检测 CLI/MCP 可用性 → 生成 config.json |
| `consult` | Read, Write, Bash, Task | 显式多模型讨论，支持 --detailed 深度模式 |
| `status` | Read, Bash, Glob | 读取 state.json → 报告进度 → 建议下一步 |

### Agents（代理）— 专职执行者

Agent 由命令或其他 Agent 调度，不能被用户直接调用。

| Agent | 模型 | 职责 | 调用时机 |
|-------|------|------|---------|
| `workflow-detector` | haiku | 项目是绿地还是棕地的检测，输出 ≤300 字 | `/maestro:go` Phase 2 |
| `model-coordinator` | default | 编排 codex/gemini 调用，分解前后端子问题 | `/maestro:consult` 或 go 的多模型阶段 |
| `context-curator` | haiku | MCP 原文摘要提取 + 阶段上下文压缩 + 决策存档 | 每次 MCP 调用后、阶段切换时 |
| `quality-gate` | sonnet | 阶段产出完整性验证（≥90% 通过才放行） | 每次阶段切换前 |

### Skills（知识库）— 无状态参考文档

Skill 是知识文档，供命令和 Agent 在执行时引用参考。

| Skill | 核心内容 |
|-------|---------|
| `workflow-routing` | 路由决策树、5 维评分规则、绿地/棕地信号词库、路由后引导话术 |
| `mcp-protocols` | 各 MCP 参数模板、策略预设解析、消费侧后处理流程、SESSION_ID 策略、降级矩阵 |
| `token-management` | 消费侧处理架构、三层防护策略、预设系统、上下文预算分配、跨会话恢复协议 |

### Scripts（脚本）

| 脚本 | 用途 | 输出 |
|------|------|------|
| `check-deps.sh` | 检测所有 CLI 工具和 MCP 服务器可用性 | 彩色状态报告 + JSON 摘要 |
| `detect-project-state.sh` | 分析目标目录的项目状态评分 | JSON（绿地/棕地分数 + 详情 + 建议） |

### Hooks（钩子）

| 事件 | 行为 |
|------|------|
| `SessionStart` | 自动读取 `.maestro/state.json`，使新会话从上次断点恢复 |

---

## Token 管理机制

Maestro 采用 **"消费侧智能处理"** 架构，通过多层策略管理 Token 消耗：

| 层级 | 策略 | 实现方式 |
|------|------|---------|
| **引导层** | MCP 输出引导 | 按 policy 注入引导性指令（不硬截断输出） |
| **保存层** | 完整原文保留 | MCP 全文存入 `.maestro/consultations/`，不丢失任何信息 |
| **提取层** | 消费侧压缩 | context-curator 从原文中提取结构化摘要，进入主上下文 |
| **预防层** | 轻量 Agent | workflow-detector / context-curator 使用 haiku 模型，降低消耗 |
| **压缩层** | 两层阶段摘要 | 索引摘要（state.json，自动加载）+ 详细摘要（summaries/，按需加载） |
| **恢复层** | 跨会话状态 | state.json + SessionStart hook 自动加载，支持长工作流跨会话 |

### 跨会话恢复流程

```
1. 新会话启动
2. SessionStart hook 自动读取 .maestro/state.json（含索引摘要）
3. Maestro 自动加载最近阶段的 .maestro/summaries/{stage}.md
4. 从 currentStage + 1 继续工作
5. 历史摘要和 MCP 原文仅在用户请求时按需加载
```

> **好处**：你可以放心关闭会话，下次打开时 Maestro 会自动接续上次的工作流进度。

---

## 使用示例

### 场景 1：全新项目（绿地）

```bash
# 1. 初始化环境
/maestro:init
# → 检测依赖，生成 .maestro/config.json

# 2. 输入需求
/maestro:go 从零构建一个在线问卷系统，支持拖拽设计和数据分析
# → 检测到空目录 → 绿地模式
# → 检测到前端+后端 → 自动调用 codex + gemini 协作
# → 完整分析保存到 .maestro/consultations/
# → 输出统一设计建议 + 路由到 spec-kit

# 3. 按指引执行 spec-kit 流程
/speckit.constitution    # 建立项目宪章
/speckit.specify         # 编写功能规范
/speckit.clarify         # 澄清需求
/speckit.plan            # 技术方案
/speckit.tasks           # 分解任务
/speckit.implement       # 执行实施
```

### 场景 2：已有项目迭代（棕地）

```bash
# 在已有 React 项目目录中
/maestro:go 添加用户认证功能，支持 OAuth 和邮箱注册
# → 检测到 src/、package.json、50+ commits → 棕地模式
# → 路由到 openspec

# 按指引执行 openspec 流程
/opsx:new user-auth      # 创建变更提案
/opsx:ff                 # 快速填充规划
/opsx:apply              # 实施变更
/opsx:archive            # 存档完成
```

### 场景 3：纯技术讨论

```bash
# 不走路由，直接讨论架构
/maestro:consult 设计一个支持百万级并发的实时推送系统
# → codex: WebSocket + Redis Pub/Sub + 分片架构
# → gemini: 消息卡片 UI + 连接状态指示器 + 离线缓存
# → Claude: 基于摘要合成统一方案

# 深度讨论（无输出限制）
/maestro:consult 设计一个支持百万级并发的实时推送系统 --detailed
```

### 场景 4：切换策略预设

```bash
# 切换到 conservative（适合低 Token 配额）
# 编辑 .maestro/config.json：
{
  "policy": {
    "preset": "conservative"
  }
}

# 或在保持 balanced 基础上自定义
{
  "policy": {
    "preset": "balanced",
    "custom": {
      "mcp.maxCalls": 20,
      "summary.detailLength": 5000
    }
  }
}
```

### 场景 5：跨会话继续

```bash
# 会话 A：开始工作
/maestro:go 构建一个电商系统
# → 路由到 spec-kit
/speckit.constitution
/speckit.specify
# ... 关闭会话

# 会话 B：自动恢复
# → SessionStart hook 自动加载 state.json
# → Maestro 知道你在 specify 阶段
/maestro:status          # 查看当前进度
# → 提示你继续执行 /speckit.clarify
```

---

## 测试

### 运行结构验证

```bash
bash tests/validate-structure.sh
```

验证内容：
- 所有必需文件是否存在
- JSON 文件格式是否有效
- 无硬编码绝对路径
- Shell 脚本是否有正确的 shebang
- Markdown 文件是否有 YAML frontmatter

### 运行单元测试

需要安装 [BATS](https://github.com/bats-core/bats-core) 测试框架：

```bash
bats tests/detect-project-state.bats
```

测试覆盖：
- 空目录 → greenfield 检测
- 多文件+多提交 → brownfield 检测
- Monorepo 识别（pnpm-workspace、npm workspaces、lerna、nx）
- 已有工作流目录检测（.specify/、openspec/）
- 梯度评分准确性
- 错误处理（不存在的目录）

---

## 常见问题

### Q: 首次使用必须执行 `/maestro:init` 吗？

**A:** 强烈建议执行。`init` 会检测你的环境并生成 `.maestro/config.json`，让 Maestro 知道哪些工具可用。如果不执行，Maestro 仍会尝试工作，但可能因缺少配置信息而无法启用多模型协作等功能。

### Q: 没有安装 codex / gemini 可以使用吗？

**A:** 完全可以。Maestro 有完善的降级策略 — 当 codex/gemini 不可用时，Claude 会自动承担对应的分析工作。核心的项目检测和工作流路由功能不依赖外部模型。

### Q: `.maestro/` 目录需要加入 `.gitignore` 吗？

**A:** 取决于你的团队协作需求：
- **加入 `.gitignore`**（推荐）：`.maestro/` 包含本地工作流状态和 MCP 原文，通常是个人化的
- **不加入**：如果团队需要共享工作流状态和决策记录，可以提交

### Q: 如何重新开始一个工作流？

**A:** 删除 `.maestro/state.json` 即可。下次执行 `/maestro:go` 时会重新检测和路由。如果需要完全重置，删除整个 `.maestro/` 目录然后重新 `/maestro:init`。

### Q: 为什么 Maestro 不自动执行 spec-kit / openspec 的命令？

**A:** 这是设计决策。Maestro 的角色是"编排层"而非"执行层" — 它负责检测项目状态、选择工作流、协调多模型讨论，但每个阶段的具体执行权交给用户。这样可以确保用户对每一步都有控制权。

### Q: 策略预设什么时候该切换？

**A:**
- **conservative**：API 配额有限、Token 计费较高、简单项目
- **balanced**（默认）：日常开发、大多数项目
- **unrestricted**：深度架构讨论、技术预研、不计成本的场景

### Q: 如何查看 MCP 调用的完整原文？

**A:** 执行 `/maestro:status --detail`，或直接查看 `.maestro/consultations/` 目录下的 Markdown 文件。

### Q: 执行 `/maestro:go` 后提示命令不存在怎么办？

**A:** 这通常是因为 spec-kit 或 openspec 的 slash 命令没有在当前项目中初始化。这些命令不是全局的，而是通过项目级初始化注册到 `.claude/commands/` 目录的。

解决步骤：
1. 确认 CLI 已安装（`which specify` 和 `which openspec`）
2. 在**目标项目目录**中运行初始化命令：
   - 绿地工作流：`specify init --here --ai claude`
   - 棕地工作流：`openspec init --tools claude`
3. **重启 Claude Code**（新的 slash 命令需要重启后才会被识别）
4. 重新执行 `/maestro:init` 确认状态
5. 再次执行 `/maestro:go`

> **提示**：执行 `/maestro:init` 可以自动检测并提示缺失的初始化步骤。

---

## 许可证

MIT License

---

*Built with Claude Code by zipper*
