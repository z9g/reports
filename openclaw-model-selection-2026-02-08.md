# OpenClaw 基座模型选型深度调研

> 调研日期: 2026-02-08
> 调研范围: 成本、效果、评估方法

---

## 一、核心结论 (TL;DR)

| 场景 | 推荐模型 | 理由 |
|------|----------|------|
| **最强效果** | `anthropic/claude-opus-4-5` | 综合能力最强，工具调用最稳定 |
| **性价比首选** | `anthropic/claude-sonnet-4-5` | 效果/成本平衡最佳 |
| **预算敏感** | `anthropic/claude-haiku-4-5` 或 `openai/gpt-5-mini` | 低成本，适合简单任务 |
| **隐私优先** | `venice/llama-3.3-70b` | 完全私有推理，无日志 |
| **代码专项** | `openai/gpt-5.2` 或 `moonshot/kimi-k2.5` | Coding benchmark 领先 |

---

## 二、支持的模型提供商

OpenClaw 通过 `pi-ai` 统一 API 支持 20+ 提供商:

### 内置提供商 (无需额外配置)
- **Anthropic**: Claude Opus/Sonnet/Haiku 系列
- **OpenAI**: GPT-5.x, GPT-4.1, Codex
- **Google**: Gemini 3/2.5 系列
- **xAI**: Grok 4 系列
- **Z.AI**: GLM 4.7
- **Groq/Cerebras**: 高速推理
- **OpenRouter**: 聚合多模型

### 需配置提供商
- **Venice AI**: 隐私推理 + 匿名代理
- **Moonshot/Kimi**: 中国区优化
- **MiniMax**: M2.1 写作优化
- **Ollama**: 本地模型
- **自定义**: LM Studio, vLLM, LiteLLM 等

---

## 三、定价对比 (2026-02 最新)

### 3.1 Anthropic Claude 系列

| 模型 | 输入 ($/MTok) | 输出 ($/MTok) | 缓存读取 | 缓存写入 |
|------|--------------|--------------|----------|----------|
| **Opus 4.6** | $5 | $25 | $0.50 | $6.25 |
| **Opus 4.5** | $5 | $25 | $0.50 | $6.25 |
| **Sonnet 4.5** | $3 | $15 | $0.30 | $3.75 |
| **Haiku 4.5** | $1 | $5 | $0.10 | $1.25 |
| Haiku 3 | $0.25 | $1.25 | $0.03 | $0.30 |

> **订阅替代**: Claude Pro $17/月, Claude Max $100+/月 (5x-20x 用量)

### 3.2 OpenAI GPT 系列

| 模型 | 输入 ($/MTok) | 缓存输入 | 输出 ($/MTok) |
|------|--------------|----------|--------------|
| **GPT-5.2** | $1.75 | $0.175 | $14.00 |
| **GPT-5.2 Pro** | $21.00 | - | $168.00 |
| **GPT-5 mini** | $0.25 | $0.025 | $2.00 |
| GPT-4.1 | $3.00 | $0.75 | $12.00 |
| GPT-4.1 mini | $0.80 | $0.20 | $3.20 |

> **订阅替代**: Codex 订阅 (ChatGPT Plus/Pro)

### 3.3 Google Gemini 系列

| 模型 | 输入 ($/MTok) | 缓存输入 | 输出 ($/MTok) |
|------|--------------|----------|--------------|
| **Gemini 3 Pro** | $2.00 | $0.20 | $12.00 |
| **Gemini 3 Flash** | $0.50 | $0.05 | $3.00 |
| Gemini 2.5 Pro | $1.25 | $0.125 | $10.00 |
| Gemini 2.5 Flash | $0.30 | $0.03 | $2.50 |
| Gemini 2.5 Flash Lite | $0.10 | $0.01 | $0.40 |

### 3.4 成本估算示例

假设每天 Agent 运行:
- 输入 ~500K tokens (系统提示+历史+工具结果)
- 输出 ~100K tokens

| 模型 | 日成本 | 月成本 (30天) |
|------|--------|--------------|
| Opus 4.5 | $5.00 | $150 |
| Sonnet 4.5 | $3.00 | $90 |
| Haiku 4.5 | $1.00 | $30 |
| GPT-5.2 | $2.28 | $68 |
| GPT-5 mini | $0.33 | $10 |
| Gemini 3 Pro | $2.20 | $66 |
| Gemini 3 Flash | $0.55 | $17 |

> **提示缓存**: OpenClaw 支持 Anthropic prompt caching，可配置 5分钟/1小时 TTL，实际成本可降低 50-80%

---

## 四、效果评估维度

### 4.1 OpenClaw 内置测试套件

OpenClaw 提供三层测试体系:

#### Layer 1: 直接模型测试 (`models.profiles.live.test.ts`)
- 绕过 Gateway，直接测试模型 API
- 验证: 模型是否能正常返回响应
- 隔离: 区分 "API 问题" vs "Gateway 问题"

#### Layer 2: Gateway + Agent 冒烟测试 (`gateway-models.profiles.live.test.ts`)
- 启动完整 Gateway 实例
- 创建 `agent:dev:*` 测试会话
- 执行三类探针:
  - **响应探针**: 无工具的基础对话
  - **Read 探针**: 写入随机文件，要求模型读取并返回内容
  - **Exec+Read 探针**: 要求模型执行命令写入文件后读取
  - **图像探针**: 发送带 OCR 挑战的图片，验证视觉理解

```bash
# 运行现代模型测试
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_GATEWAY_MODELS="anthropic/claude-opus-4-5,openai/gpt-5.2" \
pnpm test:live
```

#### Layer 3: CLI 后端测试 (`gateway-cli-backend.live.test.ts`)
- 测试 Claude Code CLI / Codex CLI 集成
- 验证本地 CLI 作为后端的完整流程

### 4.2 关键评估指标

| 维度 | 测试方法 | 权重 |
|------|----------|------|
| **工具调用准确性** | Read/Exec 探针成功率 | ⭐⭐⭐⭐⭐ |
| **指令遵循** | 系统提示遵循度 | ⭐⭐⭐⭐⭐ |
| **上下文利用** | 长会话记忆测试 | ⭐⭐⭐⭐ |
| **代码生成** | 实际编码任务 | ⭐⭐⭐⭐ |
| **多模态** | 图像探针 OCR | ⭐⭐⭐ |
| **响应延迟** | TTFT/TPS 测量 | ⭐⭐⭐ |
| **成本效率** | Token/效果比 | ⭐⭐⭐⭐ |

### 4.3 实际评估方法

#### 方法 A: OpenClaw 内置扫描
```bash
# 扫描 OpenRouter 免费模型并探测能力
openclaw models scan --max-candidates 10 --set-default

# 查看当前模型状态
openclaw models status

# 列出所有可用模型
openclaw models list --all
```

#### 方法 B: 手动 A/B 测试
```bash
# 在聊天中切换模型
/model anthropic/claude-opus-4-5
# 执行测试任务...

/model openai/gpt-5.2
# 执行相同任务对比...

# 查看 token 使用和成本
/status
/usage full
```

#### 方法 C: 配置回退链
```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-sonnet-4-5",
        fallbacks: [
          "openai/gpt-5.2",
          "google/gemini-3-pro-preview"
        ]
      }
    }
  }
}
```

---

## 五、模型特性对比

### 5.1 工具调用 (Function Calling)

| 模型 | 工具调用质量 | 并行调用 | 复杂链式调用 |
|------|-------------|----------|-------------|
| Claude Opus 4.5 | ⭐⭐⭐⭐⭐ | ✅ | ⭐⭐⭐⭐⭐ |
| Claude Sonnet 4.5 | ⭐⭐⭐⭐⭐ | ✅ | ⭐⭐⭐⭐ |
| GPT-5.2 | ⭐⭐⭐⭐ | ✅ | ⭐⭐⭐⭐ |
| Gemini 3 Pro | ⭐⭐⭐⭐ | ✅ | ⭐⭐⭐ |
| GLM 4.7 | ⭐⭐⭐⭐ | ✅ | ⭐⭐⭐ |

> OpenClaw 文档备注: "GLM: a bit better for coding/tool calling. MiniMax: better for writing and vibes."

### 5.2 上下文窗口

| 模型 | 上下文长度 | 实际可用 |
|------|-----------|---------|
| Claude Opus/Sonnet 4.5 | 200K | ~150K 稳定 |
| GPT-5.2 | 262K | ~200K 稳定 |
| Gemini 3 Pro | 202K | ~150K 稳定 |
| Kimi K2.5 | 1M+ | 长文优势明显 |

### 5.3 特殊能力

| 能力 | 最佳选择 |
|------|----------|
| **扩展思考** | Claude Opus (extended thinking), Gemini 3 Pro |
| **代码生成** | GPT-5.2, Kimi K2.5, Claude Sonnet |
| **多模态视觉** | GPT-5.2, Gemini 3, Claude Sonnet/Opus |
| **中文理解** | Kimi K2.5, GLM 4.7, Qwen3 |
| **本地部署** | Ollama + Llama 3.3 70B / Qwen3 |

---

## 六、OpenClaw 推荐配置

### 6.1 最佳效果配置
```json5
{
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-opus-4-5" },
      models: {
        "anthropic/claude-opus-4-5": {
          alias: "opus",
          params: { cacheControlTtl: "1h" }
        }
      }
    }
  }
}
```

### 6.2 性价比配置
```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-sonnet-4-5",
        fallbacks: ["anthropic/claude-haiku-4-5"]
      },
      models: {
        "anthropic/claude-sonnet-4-5": { alias: "sonnet" },
        "anthropic/claude-haiku-4-5": { alias: "haiku" }
      }
    }
  }
}
```

### 6.3 隐私优先配置 (Venice)
```json5
{
  env: { VENICE_API_KEY: "vapi_..." },
  agents: {
    defaults: {
      model: {
        primary: "venice/llama-3.3-70b",
        fallbacks: ["venice/claude-opus-45"]  // 匿名代理
      }
    }
  }
}
```

### 6.4 混合成本优化配置
```json5
{
  agents: {
    defaults: {
      model: {
        primary: "openai/gpt-5-mini",  // 简单任务
        fallbacks: [
          "anthropic/claude-sonnet-4-5",  // 中等任务
          "anthropic/claude-opus-4-5"     // 复杂任务
        ]
      },
      heartbeat: { every: "55m" }  // 保持缓存热
    }
  }
}
```

---

## 七、成本优化策略

### 7.1 Prompt Caching
Anthropic 支持 5分钟/1小时 缓存 TTL:
```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-5": {
          params: { cacheControlTtl: "1h" }
        }
      },
      heartbeat: { every: "55m" }  // 55分钟心跳保持缓存
    }
  }
}
```

**成本节省**: 缓存读取仅 $0.50/MTok vs 输入 $5/MTok (节省 90%)

### 7.2 会话压缩
使用 `/compact` 主动压缩长会话:
```
/compact  # 总结当前会话，重置上下文
```

### 7.3 Batch API (Anthropic/OpenAI)
异步批处理可节省 50%:
- Anthropic: 支持 batch processing
- OpenAI: Batch API 24小时异步处理

### 7.4 订阅 vs API
| 使用量 | 推荐 |
|--------|------|
| < $20/月 | API 按量付费 |
| $20-100/月 | Claude Pro 订阅 ($17) |
| $100-500/月 | Claude Max ($100) 或 API |
| > $500/月 | API + 批量处理 + 缓存优化 |

---

## 八、快速设置指南

### 8.1 Anthropic (推荐)
```bash
# 方式 A: API Key
openclaw onboard --auth-choice anthropic-api-key

# 方式 B: Claude 订阅 (setup-token)
claude setup-token
openclaw models auth paste-token --provider anthropic
```

### 8.2 OpenAI
```bash
# API Key
openclaw onboard --auth-choice openai-api-key

# 或 Codex 订阅 (OAuth)
openclaw onboard --auth-choice openai-codex
```

### 8.3 Venice (隐私)
```bash
openclaw onboard --auth-choice venice-api-key
openclaw models set venice/llama-3.3-70b
```

### 8.4 验证配置
```bash
openclaw models status
openclaw chat "Hello, what model are you?"
```

---

## 九、评估清单

在选择模型前，建议执行以下评估:

- [ ] **工具调用测试**: 让模型执行 read/exec 任务
- [ ] **指令遵循测试**: 给复杂系统提示，验证遵循度
- [ ] **长会话测试**: 20+ 轮对话后检查上下文记忆
- [ ] **代码任务测试**: 实际编程任务的完成质量
- [ ] **成本监控**: 运行 `/status` 和 `/usage cost` 追踪消耗
- [ ] **延迟测试**: 注意首 token 时间 (TTFT) 和生成速度

---

## 十、总结

### 选型决策树

```
需要最强能力？
├── 是 → Claude Opus 4.5
└── 否 → 预算敏感？
         ├── 是 → 简单任务？
         │        ├── 是 → Haiku 4.5 / GPT-5 mini
         │        └── 否 → Sonnet 4.5
         └── 否 → 需要隐私？
                  ├── 是 → Venice Llama 3.3 70B
                  └── 否 → Sonnet 4.5 (默认推荐)
```

### 当前推荐 (2026-02)

**默认选择**: `anthropic/claude-sonnet-4-5`
- 工具调用稳定
- 成本合理 ($3/$15 per MTok)
- OpenClaw 官方推荐
- 配合 prompt caching 效果最佳

---

## 参考资料

- OpenClaw 文档: https://docs.openclaw.ai
- Anthropic 定价: https://claude.com/pricing
- OpenAI 定价: https://openai.com/api/pricing
- Google Vertex AI 定价: https://cloud.google.com/vertex-ai/generative-ai/pricing
- Venice AI: https://venice.ai
