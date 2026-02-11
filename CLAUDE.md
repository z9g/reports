# CLAUDE.md

## Project Overview

This is an **AI News Report Publishing System** — a static content platform that converts Markdown daily AI news reports into styled HTML pages and publishes them via GitHub Pages. The project tracks AI industry developments with multiple report types (morning, noon, evening, deep-read) and automatically maintains an index page.

**Language:** JavaScript (Node.js) + Bash
**Dependencies:** Zero external packages — uses only Node.js built-in modules (`fs`, `path`)
**System Requirements:** Node.js >= 14, Git, Bash

## Repository Structure

```
reports/
├── tools/                          # Core toolchain (all JS + shell scripts)
│   ├── generate-report.sh          # One-command orchestration script
│   ├── md-to-html.js               # Primary Markdown → HTML converter (daily reports)
│   ├── md-to-html-research.js      # Specialized converter for technical/research docs
│   ├── link-enricher.js            # Analyzes reports for missing links, suggests URLs
│   └── update-index.js             # Scans HTML files, regenerates index.html
├── ai-news/                        # News articles (MD + HTML pairs)
├── ai-noon-update/                 # Afternoon update reports (MD + HTML pairs)
├── ai-scan/                        # Afternoon scan reports (MD + HTML pairs)
├── index.html                      # Auto-generated report index/landing page
├── PUBLISHING_GUIDE.md             # Developer documentation (Chinese)
├── CLAUDE.md                       # This file
├── *.md                            # Markdown source reports (root level)
└── *.html                          # Generated HTML reports (root level)
```

## Key Commands

### Generate a report (recommended workflow)
```bash
./tools/generate-report.sh <input.md> [output.html]
```
This runs the full pipeline: MD → HTML conversion + index update.

### Individual tools
```bash
# Convert markdown to HTML
node tools/md-to-html.js <input.md> <output.html>

# Convert research/technical documents
node tools/md-to-html-research.js <input.md> <output.html>

# Analyze missing links in a report
node tools/link-enricher.js <input.md>

# Regenerate the index page
node tools/update-index.js
```

### Publishing
```bash
./tools/generate-report.sh new-report.md
git add . && git commit -m "Add report" && git push origin main
```
GitHub Pages auto-publishes from the main branch root.

## File Naming Conventions

### Markdown source files
```
ai-daily-YYYY-MM-DD.md              # Morning report
ai-daily-YYYY-MM-DD-noon.md         # Noon report
ai-daily-YYYY-MM-DD-evening.md      # Evening report
ai-deep-read-YYYY-MM-DD.md          # Deep-read analysis
ai-scan-YYYY-MM-DD-pm.md            # Afternoon scan
ai-noon-update-YYYY-MM-DD.md        # Noon update
```

### Generated HTML files
```
daily-YYYY-MM-DD-morning.html
daily-YYYY-MM-DD-noon.html
daily-YYYY-MM-DD-evening.html
deep-read-YYYY-MM-DD.html
```

### Report type detection
The shell script auto-detects type from the input filename:
- Contains `noon` or `午` → noon
- Contains `evening` or `晚` → evening
- Default → morning

## Markdown Report Format

Reports follow this standard structure:
```markdown
# Report Title

**日期**: YYYY-MM-DD
**时间**: HH:MM AM/PM

## 📊 统计摘要 (Optional)
- 条目数: N
- 来源: N 个平台

## 🔥 重大新闻/头条
### 1. Item title
**来源**: [Source](url)
Description...

## 📰 分类新闻
### Category Name
- Item 1
- Item 2

## 💡 洞察与观点
- Insight 1
- Insight 2
```

## Architecture & Design Decisions

- **Zero dependencies**: The entire toolchain uses only Node.js built-in modules. No `package.json` exists.
- **Embedded CSS**: All HTML output includes inline styles (GitHub Dark theme). No external stylesheets.
- **Stateless tools**: Each script is standalone with no shared state or database.
- **File-based type detection**: Report types are inferred from filenames, not configuration.
- **CommonJS modules**: All JS files use `require()`/`module.exports` (not ES modules).
- **Line-by-line parsing**: Markdown is parsed via a state machine, not a library like `marked`.
- **Chinese-language content**: Reports, comments, and documentation are primarily in Chinese.

## Styling

The HTML output uses a GitHub Dark color scheme defined in CSS variables:
```
--bg: #0d1117          (page background)
--card-bg: #161b22     (card/section background)
--border: #30363d      (borders)
--text: #c9d1d9        (primary text)
--text-muted: #8b949e  (secondary text)
--accent: #58a6ff      (links, highlights)
--accent-green: #3fb950
--accent-orange: #d29922
--accent-red: #f85149
```

The research converter (`md-to-html-research.js`) adds `--accent-purple: #a371f7`.

## Report Types in Index

Defined in `tools/update-index.js`:
| Type | Icon | Label |
|------|------|-------|
| morning | 🌅 | 早间版 |
| noon | 🤖 | 午间版 |
| evening | 🌙 | 晚间版 |
| deep-read | 🧠 | 深度阅读 |

Index sorts by date (descending), then within each date: deep-read > evening > noon > morning.

## Commit Message Conventions

Commits use emoji-prefixed messages:
- `📊` — Reports / data
- `📝` — Documentation
- `📖` — Deep-read analyses
- `🔧` — Tool improvements
- `🌅` / `🤖` / `🌙` — Time-of-day specific reports
- `🔥` — Major features / breaking changes

## Testing

There is no formal test suite. Quality assurance is done through:
- Visual inspection of generated HTML
- Link enrichment analysis (`link-enricher.js`)
- Manual verification of conversion accuracy

## Common Tasks for AI Assistants

### Adding a new daily report
1. Create a Markdown file following the naming convention and format above
2. Run `./tools/generate-report.sh <file.md>`
3. Verify the generated HTML renders correctly
4. Commit both the `.md` and `.html` files

### Modifying HTML styling
Edit the `HTML_TEMPLATE` constant at the top of `tools/md-to-html.js` (or `tools/md-to-html-research.js` for research docs). CSS variables are in the `:root` block.

### Adding a new report type
1. Add the type to `REPORT_TYPES` in `tools/update-index.js`
2. Add detection logic in `tools/generate-report.sh` (the `if/elif` chain)
3. Update the type detection in `tools/update-index.js` `extractMetadata()`

### Updating the index
Run `node tools/update-index.js` — it scans `daily-*.html` and `deep-read-*.html` in the repo root and subdirectories.

## Important Notes

- HTML files are **generated artifacts** committed alongside their Markdown sources. Both should be committed together.
- The `index.html` at root is **auto-generated** by `update-index.js` — do not edit it manually.
- Subdirectories (`ai-news/`, `ai-noon-update/`, `ai-scan/`) each have their own `index.html` files.
- Template variables in HTML: `{{TITLE}}`, `{{CONTENT}}`, `{{DATE}}`, `{{TYPE}}`.
- All files must be UTF-8 encoded (Chinese content).
