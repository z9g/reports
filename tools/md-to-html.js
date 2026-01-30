#!/usr/bin/env node
/**
 * Markdown 报告转 HTML 工具
 * 功能:
 * 1. 解析 Markdown 报告结构
 * 2. 识别缺失链接的条目
 * 3. 生成美观的 HTML 页面
 */

const fs = require('fs');
const path = require('path');

// HTML 模板
const HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{TITLE}}</title>
    <style>
        :root {
            --bg: #0d1117;
            --card-bg: #161b22;
            --border: #30363d;
            --text: #c9d1d9;
            --text-muted: #8b949e;
            --accent: #58a6ff;
            --accent-green: #3fb950;
            --accent-orange: #d29922;
            --accent-red: #f85149;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
            background: var(--bg);
            color: var(--text);
            line-height: 1.6;
            padding: 2rem;
            max-width: 900px;
            margin: 0 auto;
        }
        header {
            text-align: center;
            padding: 2rem 0;
            border-bottom: 1px solid var(--border);
            margin-bottom: 2rem;
        }
        header h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
        header .meta { color: var(--text-muted); font-size: 0.9rem; }
        .stats {
            display: flex;
            justify-content: center;
            gap: 2rem;
            margin-top: 1rem;
            flex-wrap: wrap;
        }
        .stat {
            background: var(--card-bg);
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            border: 1px solid var(--border);
        }
        .stat strong { color: var(--accent); }
        section {
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
        }
        section h2 {
            font-size: 1.25rem;
            margin-bottom: 1rem;
            padding-bottom: 0.5rem;
            border-bottom: 1px solid var(--border);
        }
        .breaking { border-left: 4px solid var(--accent-red); }
        .breaking h2 { color: var(--accent-red); }
        .news-item {
            padding: 1rem 0;
            border-bottom: 1px solid var(--border);
        }
        .news-item:last-child { border-bottom: none; }
        .news-item h3 {
            font-size: 1rem;
            margin-bottom: 0.5rem;
        }
        .news-item h3 a { color: var(--accent); text-decoration: none; }
        .news-item h3 a:hover { text-decoration: underline; }
        .news-item h3.no-link { color: var(--text); }
        .news-item p { color: var(--text-muted); font-size: 0.9rem; margin-top: 0.25rem; }
        .news-item .source { 
            font-size: 0.8rem; 
            color: var(--text-muted);
            margin-bottom: 0.5rem;
        }
        .news-item .source a { color: var(--accent); text-decoration: none; }
        .news-item .read-more {
            display: inline-block;
            margin-top: 0.5rem;
            color: var(--accent);
            text-decoration: none;
            font-size: 0.85rem;
        }
        .news-item .read-more:hover { text-decoration: underline; }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.9rem;
        }
        th, td {
            padding: 0.75rem;
            text-align: left;
            border-bottom: 1px solid var(--border);
        }
        th { color: var(--text-muted); font-weight: 600; }
        td a { color: var(--accent); text-decoration: none; }
        td a:hover { text-decoration: underline; }
        .tools-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 1rem;
        }
        .tool-card {
            background: var(--bg);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 1rem;
            text-decoration: none;
            color: inherit;
            display: block;
            transition: all 0.2s ease;
        }
        .tool-card:hover {
            border-color: var(--accent);
            transform: translateY(-2px);
        }
        .tool-card.no-link { cursor: default; }
        .tool-card.no-link:hover { transform: none; border-color: var(--border); }
        .tool-card h4 { color: var(--accent-green); margin-bottom: 0.25rem; }
        .tool-card.no-link h4 { color: var(--text); }
        .tool-card .type {
            font-size: 0.75rem;
            color: var(--accent-orange);
            margin-bottom: 0.5rem;
        }
        .tool-card p { font-size: 0.85rem; color: var(--text-muted); }
        .insight-list { list-style: none; }
        .insight-list li {
            padding: 0.75rem 0;
            padding-left: 1.5rem;
            position: relative;
        }
        .insight-list li::before {
            content: "→";
            position: absolute;
            left: 0;
            color: var(--accent);
        }
        .insight-list strong { color: var(--accent-orange); }
        .action-list { list-style: none; }
        .action-list li {
            padding: 0.5rem 0;
            padding-left: 1.75rem;
            position: relative;
        }
        .action-list li::before {
            content: "☐";
            position: absolute;
            left: 0;
            color: var(--accent-green);
        }
        .missing-link {
            font-size: 0.75rem;
            color: var(--accent-orange);
            opacity: 0.7;
        }
        footer {
            text-align: center;
            padding: 2rem 0;
            color: var(--text-muted);
            font-size: 0.85rem;
            border-top: 1px solid var(--border);
            margin-top: 2rem;
        }
        @media (max-width: 600px) {
            body { padding: 1rem; }
            header h1 { font-size: 1.75rem; }
            .stats { flex-direction: column; gap: 0.5rem; }
        }
    </style>
</head>
<body>
    <nav style="margin-bottom: 1rem;">
        <a href="index.html" style="color: var(--text-muted); text-decoration: none; font-size: 0.9rem;">← 返回报告索引</a>
    </nav>
{{CONTENT}}
</body>
</html>`;

/**
 * 解析 Markdown 报告
 */
function parseMarkdownReport(content) {
    const report = {
        title: '',
        date: '',
        stats: {},
        sections: []
    };
    
    const lines = content.split('\n');
    let currentSection = null;
    let currentItem = null;
    let inTable = false;
    let tableHeaders = [];
    let tableRows = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // 标题
        if (line.startsWith('# ')) {
            report.title = line.replace('# ', '').trim();
            // 提取日期
            const dateMatch = report.title.match(/(\d{4}-\d{2}-\d{2})/);
            if (dateMatch) report.date = dateMatch[1];
            continue;
        }
        
        // 统计数据
        if (line.includes('**RSS新文章**') || line.includes('**扫描时间**')) {
            const match = line.match(/\*\*(.+?)\*\*:\s*(.+)/);
            if (match) {
                report.stats[match[1]] = match[2].trim();
            }
            continue;
        }
        
        // 二级标题 - 新 section
        if (line.startsWith('## ')) {
            if (currentSection) {
                if (inTable && tableRows.length > 0) {
                    currentSection.tables = currentSection.tables || [];
                    currentSection.tables.push({ headers: tableHeaders, rows: tableRows });
                }
                report.sections.push(currentSection);
            }
            currentSection = {
                title: line.replace('## ', '').trim(),
                items: [],
                tables: []
            };
            inTable = false;
            tableHeaders = [];
            tableRows = [];
            continue;
        }
        
        // 三级/四级标题 - 新 item
        if (line.startsWith('### ') || line.startsWith('#### ')) {
            if (currentItem && currentSection) {
                currentSection.items.push(currentItem);
            }
            const title = line.replace(/^#{3,4}\s*/, '').trim();
            // 检查是否有链接
            const linkMatch = title.match(/\[(.+?)\]\((.+?)\)/);
            currentItem = {
                title: linkMatch ? linkMatch[1] : title,
                link: linkMatch ? linkMatch[2] : null,
                content: [],
                metadata: {}
            };
            continue;
        }
        
        // 表格
        if (line.startsWith('|')) {
            if (!inTable) {
                inTable = true;
                tableHeaders = line.split('|').filter(c => c.trim()).map(c => c.trim());
            } else if (line.includes('---')) {
                // 分隔行，跳过
            } else {
                const cells = line.split('|').filter(c => c.trim()).map(c => {
                    const cell = c.trim();
                    // 检查链接
                    const linkMatch = cell.match(/\[(.+?)\]\((.+?)\)/);
                    if (linkMatch) {
                        return { text: linkMatch[1], link: linkMatch[2] };
                    }
                    return { text: cell, link: null };
                });
                tableRows.push(cells);
            }
            continue;
        } else if (inTable && line.trim() === '') {
            // 表格结束
            if (tableRows.length > 0 && currentSection) {
                currentSection.tables = currentSection.tables || [];
                currentSection.tables.push({ 
                    headers: tableHeaders, 
                    rows: tableRows,
                    subheading: currentItem?.title
                });
            }
            inTable = false;
            tableHeaders = [];
            tableRows = [];
        }
        
        // 列表项
        if (line.startsWith('- **') && currentItem) {
            const match = line.match(/- \*\*(.+?)\*\*:\s*(.+)/);
            if (match) {
                currentItem.metadata[match[1]] = match[2].trim();
                // 检查链接
                const linkInMeta = match[2].match(/\[(.+?)\]\((.+?)\)/);
                if (linkInMeta && !currentItem.link) {
                    currentItem.link = linkInMeta[2];
                }
            }
        } else if (line.startsWith('- [ ]') || line.startsWith('- [x]')) {
            // 任务列表
            if (currentSection) {
                currentSection.tasks = currentSection.tasks || [];
                currentSection.tasks.push({
                    done: line.startsWith('- [x]'),
                    text: line.replace(/- \[.\]\s*/, '').trim()
                });
            }
        } else if (line.startsWith('- ') && currentSection && !currentItem) {
            // 普通列表
            currentSection.listItems = currentSection.listItems || [];
            currentSection.listItems.push(line.replace('- ', '').trim());
        }
        
        // 段落内容
        if (currentItem && line.trim() && !line.startsWith('-') && !line.startsWith('#') && !line.startsWith('|')) {
            currentItem.content.push(line.trim());
        }
    }
    
    // 添加最后的 section 和 item
    if (currentItem && currentSection) {
        currentSection.items.push(currentItem);
    }
    if (currentSection) {
        if (inTable && tableRows.length > 0) {
            currentSection.tables.push({ headers: tableHeaders, rows: tableRows });
        }
        report.sections.push(currentSection);
    }
    
    return report;
}

/**
 * 格式化日期
 */
function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 · ${weekdays[date.getDay()]}`;
}

/**
 * 生成 HTML
 */
function generateHTML(report) {
    let content = '';
    
    // Header
    content += `<header>
        <h1>${report.title}</h1>
        <p class="meta">${formatDate(report.date)}</p>
        <div class="stats">`;
    
    for (const [key, value] of Object.entries(report.stats)) {
        const icon = key.includes('RSS') ? '📰' : '⏰';
        content += `<div class="stat">${icon} ${key}: <strong>${value}</strong></div>`;
    }
    content += `</div></header>`;
    
    // Sections
    for (const section of report.sections) {
        const isBreaking = section.title.includes('重大新闻');
        const isTools = section.title.includes('新工具') || section.title.includes('项目');
        const isInsights = section.title.includes('洞察');
        const isActions = section.title.includes('行动项');
        
        content += `<section${isBreaking ? ' class="breaking"' : ''}>`;
        content += `<h2>${section.title}</h2>`;
        
        // News items
        if (section.items.length > 0 && !isInsights) {
            if (isTools) {
                content += `<div class="tools-grid">`;
                for (const item of section.items) {
                    const hasLink = !!item.link;
                    if (hasLink) {
                        content += `<a href="${item.link}" class="tool-card" target="_blank">`;
                    } else {
                        content += `<div class="tool-card no-link">`;
                    }
                    content += `<h4>${item.title}</h4>`;
                    if (item.metadata['类型']) {
                        content += `<div class="type">${item.metadata['类型']}</div>`;
                    }
                    if (item.metadata['说明'] || item.content.length > 0) {
                        content += `<p>${item.metadata['说明'] || item.content[0]}</p>`;
                    }
                    if (!hasLink) {
                        content += `<span class="missing-link">🔗 暂无链接</span>`;
                    }
                    content += hasLink ? `</a>` : `</div>`;
                }
                content += `</div>`;
            } else {
                for (const item of section.items) {
                    content += `<div class="news-item">`;
                    
                    // 标题
                    if (item.link) {
                        content += `<h3><a href="${item.link}" target="_blank">${item.title}</a></h3>`;
                    } else {
                        content += `<h3 class="no-link">${item.title}</h3>`;
                    }
                    
                    // 来源
                    if (item.metadata['来源']) {
                        const sourceLink = item.metadata['来源'].match(/\[(.+?)\]\((.+?)\)/);
                        if (sourceLink) {
                            content += `<p class="source">来源: <a href="${sourceLink[2]}" target="_blank">${sourceLink[1]}</a></p>`;
                        } else {
                            content += `<p class="source">来源: ${item.metadata['来源']} <span class="missing-link">🔗 暂无链接</span></p>`;
                        }
                    }
                    
                    // 摘要
                    if (item.metadata['摘要']) {
                        content += `<p>${item.metadata['摘要']}</p>`;
                    } else if (item.content.length > 0) {
                        content += `<p>${item.content.join(' ')}</p>`;
                    }
                    
                    // 影响
                    if (item.metadata['影响']) {
                        content += `<p style="margin-top: 0.5rem; color: var(--accent-orange);">⚠️ 影响: ${item.metadata['影响']}</p>`;
                    }
                    
                    // 链接
                    if (item.metadata['链接']) {
                        const linkMatch = item.metadata['链接'].match(/\[(.+?)\]\((.+?)\)/);
                        if (linkMatch) {
                            content += `<a href="${linkMatch[2]}" class="read-more" target="_blank">阅读原文 →</a>`;
                        }
                    } else if (item.link) {
                        content += `<a href="${item.link}" class="read-more" target="_blank">阅读原文 →</a>`;
                    }
                    
                    content += `</div>`;
                }
            }
        }
        
        // Tables
        if (section.tables && section.tables.length > 0) {
            for (const table of section.tables) {
                if (table.subheading) {
                    content += `<h4 style="color: var(--text-muted); margin: 1rem 0 0.75rem;">${table.subheading}</h4>`;
                }
                content += `<table><tr>`;
                for (const header of table.headers) {
                    content += `<th>${header}</th>`;
                }
                content += `</tr>`;
                for (const row of table.rows) {
                    content += `<tr>`;
                    for (const cell of row) {
                        if (cell.link) {
                            content += `<td><a href="${cell.link}" target="_blank">${cell.text}</a></td>`;
                        } else {
                            // 检查是否应该有链接但没有
                            const shouldHaveLink = cell.text && !cell.text.match(/^(🔥|Launch|产品|技术|热度|要点|类型)/);
                            if (shouldHaveLink && table.headers[0]?.includes('帖子')) {
                                content += `<td>${cell.text} <span class="missing-link">🔗</span></td>`;
                            } else {
                                content += `<td>${cell.text}</td>`;
                            }
                        }
                    }
                    content += `</tr>`;
                }
                content += `</table>`;
            }
        }
        
        // Insights (list)
        if (isInsights && section.items.length > 0) {
            content += `<ul class="insight-list">`;
            for (const item of section.items) {
                content += `<li><strong>${item.title}</strong>`;
                if (item.content.length > 0) {
                    content += ` — ${item.content.join(' ')}`;
                }
                content += `</li>`;
            }
            content += `</ul>`;
        }
        
        // List items
        if (section.listItems && section.listItems.length > 0 && isInsights) {
            content += `<ul class="insight-list">`;
            for (const item of section.listItems) {
                // 解析 **粗体** - 内容 格式
                const match = item.match(/\*\*(.+?)\*\*\s*[-—]\s*(.+)/);
                if (match) {
                    content += `<li><strong>${match[1]}</strong> — ${match[2]}</li>`;
                } else {
                    content += `<li>${item}</li>`;
                }
            }
            content += `</ul>`;
        }
        
        // Tasks
        if (section.tasks && section.tasks.length > 0) {
            content += `<ul class="action-list">`;
            for (const task of section.tasks) {
                content += `<li>${task.text}</li>`;
            }
            content += `</ul>`;
        }
        
        content += `</section>`;
    }
    
    // Footer
    content += `<footer>
        <p>报告生成时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })} GMT+8</p>
        <p>Generated by Miles AI Assistant ⚡</p>
    </footer>`;
    
    return HTML_TEMPLATE
        .replace('{{TITLE}}', report.title)
        .replace('{{CONTENT}}', content);
}

// Main
const inputFile = process.argv[2];
const outputFile = process.argv[3];

if (!inputFile) {
    console.error('用法: node md-to-html.js <input.md> <output.html>');
    process.exit(1);
}

const mdContent = fs.readFileSync(inputFile, 'utf-8');
const report = parseMarkdownReport(mdContent);
const html = generateHTML(report);

fs.writeFileSync(outputFile, html);
console.log(`✅ 已生成: ${outputFile}`);
console.log(`📊 解析结果: ${report.sections.length} 个章节`);

// 输出缺失链接的条目
let missingLinks = [];
for (const section of report.sections) {
    for (const item of section.items) {
        if (!item.link && !section.title.includes('洞察') && !section.title.includes('行动项')) {
            missingLinks.push(`  - [${section.title}] ${item.title}`);
        }
    }
    if (section.tables) {
        for (const table of section.tables) {
            for (const row of table.rows) {
                if (row[0] && !row[0].link && table.headers[0]?.includes('帖子')) {
                    missingLinks.push(`  - [${section.title}] ${row[0].text}`);
                }
            }
        }
    }
}

if (missingLinks.length > 0) {
    console.log(`\n⚠️  缺失链接的条目 (${missingLinks.length} 个):`);
    missingLinks.forEach(m => console.log(m));
}
