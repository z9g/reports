# Pi Framework 深度调研报告

> 调研日期：2026-02-08
> 版本：v0.52.8
> 仓库：https://github.com/badlogic/pi-mono
> 作者：Mario Zechner (libGDX 创始人)

---

## 目录

1. [概述](#1-概述)
2. [架构设计](#2-架构设计)
3. [核心包分析](#3-核心包分析)
4. [创新与独创性](#4-创新与独创性)
5. [使用指南](#5-使用指南)
6. [Demo 示例](#6-demo-示例)
7. [与竞品对比](#7-与竞品对比)
8. [总结与建议](#8-总结与建议)

---

## 1. 概述

### 1.1 什么是 Pi

Pi 是一个**极简主义的终端编码助手框架**，其核心理念是：

> "Adapt pi to your workflows, not the other way around."
> （让 Pi 适应你的工作流，而不是反过来）

Pi 由 Mario Zechner 开发（libGDX 游戏引擎创始人），设计哲学是**做减法而非加法**——通过提供强大的扩展机制，让用户自己构建需要的功能，而非内置一堆可能用不上的特性。

### 1.2 定位

| 维度 | Pi 的选择 |
|------|-----------|
| **内置功能** | 极简（仅 read/write/edit/bash 四个工具） |
| **扩展性** | 极强（Extensions、Skills、Prompt Templates、Themes、Packages） |
| **运行模式** | 多样（Interactive、Print、JSON、RPC、SDK） |
| **MCP 支持** | 刻意不内置（可通过扩展实现） |
| **子代理** | 刻意不内置（可通过扩展实现） |
| **权限弹窗** | 刻意不内置（可通过扩展实现） |

### 1.3 官方 Slogan

```
"shittycodingagent.ai" — 自嘲式的官网域名
"robots need your body" — rentahuman.ai 的标语（相关项目）
```

---

## 2. 架构设计

### 2.1 Monorepo 结构

```
pi-mono/
├── packages/
│   ├── ai/              # 统一 LLM API 层
│   ├── agent/           # Agent 运行时核心
│   ├── coding-agent/    # 终端编码助手 CLI
│   ├── tui/             # 终端 UI 框架
│   ├── web-ui/          # Web UI 组件
│   ├── mom/             # Slack Bot 集成
│   └── pods/            # vLLM GPU Pod 管理
├── .pi/                 # 项目级配置目录
├── AGENTS.md            # Agent 开发规范
└── package.json
```

### 2.2 分层架构

```
┌─────────────────────────────────────────────────────────┐
│                    应用层 (Applications)                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ coding-agent│  │     mom     │  │    pods     │     │
│  │ (终端 CLI)  │  │ (Slack Bot) │  │ (GPU 管理)  │     │
│  └──────┬──────┘  └──────┬──────┘  └─────────────┘     │
├─────────┼────────────────┼──────────────────────────────┤
│         │                │                              │
│         ▼                ▼                              │
│  ┌────────────────────────────┐                        │
│  │       agent-core           │  ← Agent 运行时        │
│  │  • 工具调用 • 状态管理     │                        │
│  │  • 事件流 • 消息队列       │                        │
│  └────────────┬───────────────┘                        │
│               │                                         │
│               ▼                                         │
│  ┌────────────────────────────┐                        │
│  │          pi-ai             │  ← 统一 LLM 接口       │
│  │  • 多 Provider 支持        │                        │
│  │  • Token/Cost 追踪         │                        │
│  │  • 跨 Provider 切换        │                        │
│  └────────────────────────────┘                        │
├─────────────────────────────────────────────────────────┤
│                    UI 层 (Presentation)                 │
│  ┌─────────────┐  ┌─────────────┐                      │
│  │    tui      │  │   web-ui    │                      │
│  │ (终端渲染)  │  │ (Web 组件)  │                      │
│  └─────────────┘  └─────────────┘                      │
└─────────────────────────────────────────────────────────┘
```

### 2.3 事件驱动架构

Pi 采用事件驱动设计，所有操作都可被拦截和修改：

```
用户输入
  │
  ├─► input 事件 (可拦截/转换)
  ├─► before_agent_start (可注入消息)
  ├─► agent_start
  │   │
  │   └─► turn_start
  │       ├─► context 事件 (可修改消息)
  │       │
  │       │   LLM 响应:
  │       │   ├─► tool_call (可阻止)
  │       │   │   └─► tool_result (可修改)
  │       │
  │       └─► turn_end
  │
  └─► agent_end
```

---

## 3. 核心包分析

### 3.1 @mariozechner/pi-ai

**统一的多 Provider LLM API**

#### 支持的 Provider（18+）

| 类型 | Provider |
|------|----------|
| **API Key** | OpenAI, Anthropic, Google, Azure, Mistral, Groq, Cerebras, xAI, OpenRouter, Bedrock, MiniMax |
| **OAuth** | Anthropic Claude Pro/Max, OpenAI Codex, GitHub Copilot, Google Gemini CLI, Antigravity |
| **自定义** | 任何 OpenAI 兼容 API（Ollama、vLLM、LM Studio 等） |

#### 核心特性

```typescript
import { getModel, stream, complete, Context } from '@mariozechner/pi-ai';

// 1. 类型安全的模型选择（IDE 自动补全）
const model = getModel('anthropic', 'claude-sonnet-4-20250514');

// 2. 统一的上下文结构
const context: Context = {
  systemPrompt: 'You are a helpful assistant.',
  messages: [{ role: 'user', content: 'Hello' }],
  tools: [myTool]
};

// 3. 流式响应
for await (const event of stream(model, context)) {
  if (event.type === 'text_delta') {
    process.stdout.write(event.delta);
  }
}

// 4. 跨 Provider 无缝切换
const gpt = getModel('openai', 'gpt-4o');
const continuation = await complete(gpt, context); // 自动处理消息格式转换
```

#### 创新点：跨 Provider Handoff

Pi 支持在对话中**无缝切换不同 Provider**：
- Claude 的 thinking blocks 会自动转换为 `<thinking>` 标签发给 GPT
- 工具调用和结果在不同 Provider 间正确传递
- 图片、部分响应等都能正确处理

### 3.2 @mariozechner/pi-agent-core

**Agent 运行时核心**

```typescript
import { Agent } from "@mariozechner/pi-agent-core";

const agent = new Agent({
  initialState: {
    systemPrompt: "You are helpful.",
    model: getModel("anthropic", "claude-sonnet-4-20250514"),
    tools: [readTool, bashTool],
  },
  
  // 消息转换器（过滤自定义消息类型）
  convertToLlm: (messages) => messages.filter(m => 
    ["user", "assistant", "toolResult"].includes(m.role)
  ),
  
  // 上下文转换器（用于压缩、剪枝）
  transformContext: async (messages) => pruneOldMessages(messages),
});

// 事件订阅
agent.subscribe((event) => {
  switch (event.type) {
    case 'message_update': // 流式文本
    case 'tool_execution_start': // 工具开始
    case 'tool_execution_end': // 工具完成
  }
});

await agent.prompt("Read the config file");
```

#### 核心概念

| 概念 | 说明 |
|------|------|
| **AgentMessage** | 扩展的消息类型，支持自定义字段 |
| **Steering** | 在工具执行期间插入消息，中断当前流程 |
| **Follow-up** | 在 Agent 完成后追加消息 |
| **Context Transform** | 发送给 LLM 前的消息预处理 |

### 3.3 @mariozechner/pi-coding-agent

**终端编码助手 CLI**

#### 运行模式

```bash
# 1. 交互模式（默认）
pi

# 2. 打印模式（执行后退出）
pi -p "Summarize this codebase"

# 3. JSON 模式（输出事件流）
pi --mode json "Your task"

# 4. RPC 模式（进程集成）
pi --mode rpc

# 5. SDK 模式（嵌入其他应用）
import { createAgentSession } from "@mariozechner/pi-coding-agent";
```

#### 内置工具

| 工具 | 功能 |
|------|------|
| `read` | 读取文件 |
| `write` | 写入文件 |
| `edit` | 编辑文件（精确替换） |
| `bash` | 执行命令 |
| `grep` | 搜索内容（可选） |
| `find` | 查找文件（可选） |
| `ls` | 列目录（可选） |

### 3.4 @mariozechner/pi-tui

**终端 UI 框架**

#### 核心特性

- **差分渲染**：三策略渲染系统，只更新变化部分
- **同步输出**：使用 CSI 2026 原子更新，无闪烁
- **组件化**：Text、Editor、Markdown、SelectList、Image 等
- **内联图片**：支持 Kitty/iTerm2 图形协议

```typescript
import { TUI, Text, Editor, ProcessTerminal } from "@mariozechner/pi-tui";

const tui = new TUI(new ProcessTerminal());
tui.addChild(new Text("Welcome!"));

const editor = new Editor(tui, theme);
editor.onSubmit = (text) => handleInput(text);
tui.addChild(editor);

tui.start();
```

---

## 4. 创新与独创性

### 4.1 哲学创新："刻意不做"

Pi 最大的创新是**反向思维**——通过不内置功能来实现最大灵活性：

| 常见功能 | Pi 的态度 | 理由 |
|----------|-----------|------|
| **MCP** | 不内置 | "构建带 README 的 CLI 工具即可" |
| **子代理** | 不内置 | "通过 tmux 或扩展实现" |
| **权限弹窗** | 不内置 | "在容器中运行，或自建确认流程" |
| **Plan Mode** | 不内置 | "写到文件，或通过扩展实现" |
| **后台 Bash** | 不内置 | "用 tmux，完全可观察" |

### 4.2 技术创新

#### 4.2.1 Session 树形结构

```
Session 采用 JSONL + 树形结构存储
每条记录有 id 和 parentId
支持原地分支，无需创建新文件

[entry-1] ─► [entry-2] ─► [entry-3] ─► [entry-4]
                 │
                 └─► [entry-5] ─► [entry-6]  (分支)
```

**优势**：
- `/tree` 命令可视化导航
- 无损分支历史
- 支持任意点回溯

#### 4.2.2 扩展系统

Pi 的扩展系统是其最强大的特性：

```typescript
// 一个扩展可以:
export default function (pi: ExtensionAPI) {
  // 1. 注册自定义工具
  pi.registerTool({ name: "deploy", ... });
  
  // 2. 拦截事件
  pi.on("tool_call", async (event, ctx) => {
    if (event.toolName === "bash" && isDangerous(event.input)) {
      return { block: true, reason: "Blocked dangerous command" };
    }
  });
  
  // 3. 注册命令
  pi.registerCommand("stats", { handler: async (args, ctx) => {} });
  
  // 4. 注册快捷键
  pi.registerShortcut("ctrl+shift+p", { handler: async (ctx) => {} });
  
  // 5. 自定义 UI
  pi.registerMessageRenderer("my-type", renderer);
  
  // 6. 修改 Provider
  pi.registerProvider("my-proxy", { baseUrl: "..." });
}
```

**示例扩展**（官方仓库包含 60+ 示例）：
- `doom-overlay` — 等待时玩 Doom
- `ssh.ts` — 远程执行
- `git-checkpoint.ts` — 自动 Git 检查点
- `confirm-destructive.ts` — 危险命令确认
- `custom-compaction.ts` — 自定义上下文压缩
- `handoff.ts` — 跨模型切换

#### 4.2.3 Compaction（上下文压缩）

```typescript
pi.on("session_before_compact", async (event, ctx) => {
  // 自定义压缩逻辑
  const summary = await generateSummary(event.branchEntries);
  return {
    compaction: {
      summary,
      firstKeptEntryId: event.preparation.firstKeptEntryId,
      tokensBefore: event.preparation.tokensBefore,
    }
  };
});
```

#### 4.2.4 Skills 标准

Pi 采用 [Agent Skills](https://agentskills.io) 标准：

```markdown
<!-- .pi/skills/my-skill/SKILL.md -->
# My Skill
Use this skill when the user asks about X.

## Steps
1. Do this
2. Then that
```

使用 `/skill:my-skill` 调用。

#### 4.2.5 Prompt Caching 支持

```bash
# Anthropic 扩展缓存时间
PI_CACHE_RETENTION=long pi  # 5分钟 → 1小时

# OpenAI 扩展缓存
PI_CACHE_RETENTION=long pi  # 内存缓存 → 24小时
```

### 4.3 设计亮点

| 特性 | 说明 |
|------|------|
| **热重载** | 扩展、Skills、主题支持 `/reload` 热重载 |
| **TypeBox Schema** | 工具参数使用 TypeBox 定义，支持序列化 |
| **自动补全** | 编辑器内 `/` 触发命令补全，`Tab` 触发路径补全 |
| **粘贴处理** | 大于 10 行的粘贴自动折叠为标记 |
| **IME 支持** | 正确处理中日韩输入法 |

---

## 5. 使用指南

### 5.1 安装

```bash
npm install -g @mariozechner/pi-coding-agent
```

### 5.2 配置

```bash
# 方式 1: 环境变量
export ANTHROPIC_API_KEY=sk-ant-...
pi

# 方式 2: OAuth 登录
pi
/login  # 选择 Provider
```

### 5.3 基本操作

```bash
# 交互模式
pi

# 带初始提示
pi "List all .ts files"

# 非交互模式
pi -p "Summarize this codebase"

# 继续上次会话
pi -c

# 选择历史会话
pi -r

# 指定模型
pi --provider anthropic --model claude-sonnet-4-20250514

# 指定 Thinking Level
pi --thinking high "Complex problem"
```

### 5.4 编辑器快捷键

| 快捷键 | 功能 |
|--------|------|
| `Enter` | 提交 |
| `Shift+Enter` | 换行 |
| `Tab` | 自动补全 |
| `Ctrl+C` | 清空编辑器 |
| `Ctrl+C x2` | 退出 |
| `Escape` | 取消/中止 |
| `Escape x2` | 打开 `/tree` |
| `Ctrl+L` | 模型选择器 |
| `Ctrl+P` | 循环模型 |
| `Shift+Tab` | 循环 Thinking Level |
| `Ctrl+O` | 展开/折叠工具输出 |
| `Ctrl+T` | 展开/折叠 Thinking |

### 5.5 命令参考

| 命令 | 功能 |
|------|------|
| `/login`, `/logout` | OAuth 认证 |
| `/model` | 切换模型 |
| `/settings` | 设置 |
| `/new` | 新会话 |
| `/resume` | 恢复会话 |
| `/tree` | 会话树导航 |
| `/fork` | 分叉会话 |
| `/compact` | 手动压缩上下文 |
| `/copy` | 复制最后回复 |
| `/export` | 导出为 HTML |
| `/share` | 上传为 Gist |
| `/reload` | 重载扩展 |

---

## 6. Demo 示例

### 6.1 基础 SDK 使用

```typescript
// demo-basic.ts
import { AuthStorage, createAgentSession, ModelRegistry, SessionManager } from "@mariozechner/pi-coding-agent";

async function main() {
  const authStorage = new AuthStorage();
  const modelRegistry = new ModelRegistry(authStorage);
  
  const { session } = await createAgentSession({
    sessionManager: SessionManager.inMemory(),
    authStorage,
    modelRegistry,
  });

  // 订阅事件
  session.subscribe((event) => {
    if (event.type === "message_update" && event.assistantMessageEvent.type === "text_delta") {
      process.stdout.write(event.assistantMessageEvent.delta);
    }
  });

  // 发送请求
  await session.prompt("What files are in the current directory?");
}

main().catch(console.error);
```

### 6.2 自定义扩展

```typescript
// my-extension.ts
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";

export default function (pi: ExtensionAPI) {
  // 1. 危险命令拦截
  pi.on("tool_call", async (event, ctx) => {
    if (event.toolName === "bash") {
      const cmd = event.input.command || "";
      if (cmd.includes("rm -rf") || cmd.includes("sudo")) {
        const ok = await ctx.ui.confirm(
          "⚠️ 危险命令", 
          `确认执行: ${cmd}?`
        );
        if (!ok) return { block: true, reason: "用户取消" };
      }
    }
  });

  // 2. 自定义工具
  pi.registerTool({
    name: "timestamp",
    label: "Timestamp",
    description: "Get current timestamp in various formats",
    parameters: Type.Object({
      format: Type.Optional(Type.String({ description: "iso, unix, or human" })),
    }),
    async execute(toolCallId, params) {
      const now = new Date();
      let result: string;
      switch (params.format) {
        case "unix": result = String(Math.floor(now.getTime() / 1000)); break;
        case "human": result = now.toLocaleString(); break;
        default: result = now.toISOString();
      }
      return { content: [{ type: "text", text: result }], details: {} };
    },
  });

  // 3. 自定义命令
  pi.registerCommand("hello", {
    description: "Say hello",
    handler: async (args, ctx) => {
      ctx.ui.notify(`Hello, ${args || "world"}! 🎉`, "info");
    },
  });

  // 4. 会话启动通知
  pi.on("session_start", async (_event, ctx) => {
    ctx.ui.setStatus("my-ext", "🚀 Extension loaded");
  });
}
```

使用：
```bash
pi -e ./my-extension.ts
```

### 6.3 RPC 模式集成

```typescript
// rpc-client.ts
import { spawn } from "child_process";
import * as readline from "readline";

const pi = spawn("pi", ["--mode", "rpc"], {
  stdio: ["pipe", "pipe", "inherit"],
});

const rl = readline.createInterface({ input: pi.stdout });

rl.on("line", (line) => {
  const event = JSON.parse(line);
  console.log("Event:", event.type);
});

// 发送提示
pi.stdin.write(JSON.stringify({
  method: "prompt",
  params: { text: "Hello!" }
}) + "\n");
```

---

## 7. 与竞品对比

### 7.1 对比矩阵

| 特性 | Pi | Claude Code | Cursor | Aider | Continue |
|------|-----|-------------|--------|-------|----------|
| **开源** | ✅ MIT | ❌ | ❌ | ✅ Apache | ✅ Apache |
| **终端原生** | ✅ | ✅ | ❌ | ✅ | ❌ |
| **多 Provider** | ✅ 18+ | ❌ Claude only | ✅ | ✅ | ✅ |
| **扩展系统** | ✅ 强大 | ❌ | ✅ | ❌ | ✅ |
| **Session 分支** | ✅ 树形 | ❌ | ❌ | ❌ | ❌ |
| **自定义工具** | ✅ | ❌ | ❌ | ❌ | ✅ |
| **SDK 嵌入** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **MCP** | 扩展 | ✅ | ✅ | ❌ | ✅ |
| **子代理** | 扩展 | ✅ | ✅ | ❌ | ❌ |

### 7.2 核心差异

**Pi vs Claude Code**
- Pi 更灵活，支持多 Provider
- Claude Code 更开箱即用，但锁定 Anthropic

**Pi vs Cursor**
- Pi 是终端工具，Cursor 是 IDE
- Pi 扩展性更强，Cursor 用户体验更好

**Pi vs Aider**
- Pi 有 UI 框架和扩展系统
- Aider 专注于 Git 集成和代码编辑

### 7.3 Pi 的最佳场景

1. **需要深度定制**：扩展系统无与伦比
2. **多 Provider 切换**：跨 Provider Handoff 独家
3. **嵌入其他应用**：SDK 模式支持
4. **终端重度用户**：TUI 体验优秀
5. **隐私敏感**：可完全本地运行（Ollama）

---

## 8. 总结与建议

### 8.1 优势

| 方面 | 评价 |
|------|------|
| **设计哲学** | ⭐⭐⭐⭐⭐ 极简主义 + 极致扩展性 |
| **架构质量** | ⭐⭐⭐⭐⭐ 分层清晰、事件驱动 |
| **扩展能力** | ⭐⭐⭐⭐⭐ 几乎可以改变一切 |
| **多 Provider** | ⭐⭐⭐⭐⭐ 业界最全 |
| **文档质量** | ⭐⭐⭐⭐ 详尽但需要时间消化 |
| **社区活跃** | ⭐⭐⭐ Discord 活跃，但规模较小 |

### 8.2 局限

- 学习曲线陡峭（需要理解扩展系统）
- 不适合追求开箱即用的用户
- 部分高级功能需要自己实现

### 8.3 建议使用场景

✅ **推荐使用**：
- 需要将 AI Agent 嵌入自己的工具链
- 需要自定义工具和工作流
- 需要在多个 LLM Provider 间切换
- 终端重度用户

❌ **不推荐使用**：
- 追求开箱即用体验
- 不愿意学习扩展系统
- 非技术用户

### 8.4 OpenClaw 集成

OpenClaw 已集成 Pi 作为 coding-agent 技能之一：

```bash
# 在 OpenClaw 中使用 Pi
bash pty:true workdir:~/project command:"pi 'Your task'"
```

Pi 的 SDK 模式也可以更深度地嵌入 OpenClaw：

```typescript
import { createAgentSession } from "@mariozechner/pi-coding-agent";

// 在 OpenClaw Gateway 中运行 Pi session
const { session } = await createAgentSession({...});
await session.prompt(userTask);
```

---

## 附录

### A. 相关链接

- **GitHub**: https://github.com/badlogic/pi-mono
- **npm**: https://www.npmjs.com/package/@mariozechner/pi-coding-agent
- **Discord**: https://discord.com/invite/3cU7Bz4UPx
- **官网**: https://shittycodingagent.ai
- **作者博客**: https://mariozechner.at

### B. 版本历史关键点

- **v0.52.8** (当前) — Anthropic Prompt Caching 优化
- **v0.50.0** — 扩展系统重构
- **v0.40.0** — RPC 模式支持
- **v0.30.0** — Session 树形结构

### C. 贡献者

- **Mario Zechner** (@badlogic) — 创始人、主要维护者
- 社区贡献者 — 扩展示例、Bug 修复

---

*报告完成时间：2026-02-08*
*调研人：OpenClaw Agent*
