# Markdown → HTML 报告发布指南

本文档描述将 Markdown 报告转换为精美 HTML 并发布到 GitHub Pages 的完整流程。

---

## 📁 项目结构

```
reports/
├── tools/
│   ├── md-to-html.js      # Markdown → HTML 转换核心
│   ├── link-enricher.js   # 链接补全工具
│   ├── update-index.js    # 索引页自动更新
│   └── generate-report.sh # 一键生成脚本
├── index.html             # 报告索引页
├── *.md                   # 源 Markdown 文件
├── *.html                 # 生成的 HTML 报告
└── PUBLISHING_GUIDE.md    # 本文档
```

---

## 🚀 快速开始

### 一键生成（推荐）

```bash
cd reports
./tools/generate-report.sh your-report.md
git add . && git commit -m "Add report" && git push
```

### 手动步骤

```bash
# 1. 转换 Markdown → HTML
node tools/md-to-html.js input.md output.html

# 2. 更新索引
node tools/update-index.js

# 3. 推送
git add . && git commit -m "Add report" && git push origin main
```

---

## 📝 Markdown 报告格式

### 标准结构

```markdown
# 报告标题

**日期**: 2026-02-08
**时间**: 10:30 AM

## 📊 统计摘要 (可选)
- 条目数: 15
- 来源: 5 个平台

## 🔥 重大新闻/头条
### 1. 标题一
**来源**: [来源名](https://example.com)
描述内容...

### 2. 标题二
内容...

## 📰 分类新闻
### 类别 A
- 条目 1
- 条目 2

## 💡 洞察与观点
- 观点 1
- 观点 2
```

### 支持的元素

| 元素 | Markdown | HTML 渲染 |
|------|----------|-----------|
| 标题 | `# ## ###` | 层级标题 |
| 链接 | `[文字](url)` | 可点击链接 |
| 列表 | `- item` | 项目列表 |
| 表格 | `\| col \|` | 响应式表格 |
| 引用 | `> quote` | 引用块 |
| 代码 | `` `code` `` | 内联代码 |
| 粗体 | `**text**` | 加粗显示 |

---

## 🔧 工具详解

### 1. md-to-html.js

**功能**: 将 Markdown 转换为深色主题 HTML

**用法**:
```bash
node tools/md-to-html.js <input.md> <output.html>
```

**特性**:
- GitHub Dark 配色方案
- 响应式设计
- 自动识别报告类型 (早报/午报/晚报/深度阅读)
- 新闻卡片布局
- 表格自适应
- 无链接条目标记 (🔗)

**自定义样式变量**:
```css
:root {
    --bg: #0d1117;        /* 背景色 */
    --card-bg: #161b22;   /* 卡片背景 */
    --border: #30363d;    /* 边框色 */
    --text: #c9d1d9;      /* 主文字 */
    --text-muted: #8b949e;/* 次要文字 */
    --accent: #58a6ff;    /* 强调色/链接 */
    --accent-green: #3fb950;
    --accent-orange: #d29922;
    --accent-red: #f85149;
}
```

### 2. link-enricher.js

**功能**: 分析 Markdown 中缺失链接的条目，生成搜索建议

**用法**:
```bash
node tools/link-enricher.js <input.md>
# 输出: input-links.json
```

**输出示例**:
```json
{
  "Claude 4 发布": "https://hn.algolia.com/?q=Claude%204",
  "GPT-5 讨论": "https://x.com/search?q=GPT-5"
}
```

**搜索源优先级**:
1. HN 讨论 → `hn.algolia.com`
2. X/Twitter → `x.com/search`
3. 其他 → `google.com/search`

### 3. update-index.js

**功能**: 扫描所有 `*.html` 报告，自动生成/更新索引页

**用法**:
```bash
node tools/update-index.js
```

**索引特性**:
- 按日期分组
- 报告类型图标 (🌅早报 🤖午报 🌙晚报 🧠深度)
- 自动提取摘要
- 按时间倒序排列

### 4. generate-report.sh

**功能**: 一键完成转换 + 更新索引

**用法**:
```bash
./tools/generate-report.sh <input.md> [output.html]
```

**自动命名规则**:
- 输入: `ai-daily-2026-02-08.md`
- 输出: `daily-2026-02-08-morning.html`

**类型识别**:
- 含 `noon` 或 `午` → noon
- 含 `evening` 或 `晚` → evening
- 默认 → morning

---

## 🌐 GitHub Pages 发布

### 初始配置

```bash
# 1. 初始化仓库
cd reports
git init
git remote add origin git@github.com:username/reports.git

# 2. 配置 GitHub Pages
# Settings → Pages → Source: main branch / root
```

### 发布流程

```bash
# 生成报告
./tools/generate-report.sh new-report.md

# 提交并推送
git add .
git commit -m "Add 2026-02-08 morning report"
git push origin main
```

### 访问地址

- 索引: `https://username.github.io/reports/`
- 报告: `https://username.github.io/reports/daily-2026-02-08-morning.html`

---

## 📋 文件命名规范

### Markdown 源文件

```
ai-daily-YYYY-MM-DD.md           # 早报
ai-daily-YYYY-MM-DD-noon.md      # 午报
ai-daily-YYYY-MM-DD-evening.md   # 晚报
ai-deep-read-YYYY-MM-DD.md       # 深度阅读
```

### HTML 输出文件

```
daily-YYYY-MM-DD-morning.html
daily-YYYY-MM-DD-noon.html
daily-YYYY-MM-DD-evening.html
deep-read-YYYY-MM-DD.html
```

---

## 🎨 HTML 模板定制

如需修改默认样式，编辑 `md-to-html.js` 中的 `HTML_TEMPLATE` 常量：

```javascript
const HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{TITLE}}</title>
    <style>
        /* 在此自定义 CSS */
    </style>
</head>
<body>
    {{CONTENT}}
</body>
</html>`;
```

**模板变量**:
- `{{TITLE}}` - 页面标题
- `{{CONTENT}}` - 转换后的 HTML 内容
- `{{DATE}}` - 报告日期
- `{{TYPE}}` - 报告类型

---

## 🔍 故障排查

| 问题 | 解决方案 |
|------|----------|
| 中文乱码 | 确保文件 UTF-8 编码 |
| 索引未更新 | 运行 `node tools/update-index.js` |
| 样式不生效 | 清除浏览器缓存 / 检查 CSS 语法 |
| Git push 失败 | 检查 SSH key / remote 配置 |
| HTML 为空 | 检查 Markdown 格式是否正确 |

---

## 📚 依赖

- Node.js >= 14
- Git
- GitHub 账号 (用于 Pages 托管)

无需额外 npm 包，工具使用 Node.js 内置模块。

---

*最后更新: 2026-02-08*
