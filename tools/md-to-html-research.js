#!/usr/bin/env node
/**
 * 技术研究文档 Markdown → HTML 转换工具
 * 专门优化代码块、表格、引用等技术文档元素
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
            --accent-purple: #a371f7;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
            background: var(--bg);
            color: var(--text);
            line-height: 1.7;
            padding: 2rem;
            max-width: 960px;
            margin: 0 auto;
        }
        /* Navigation */
        nav { margin-bottom: 1.5rem; }
        nav a { color: var(--text-muted); text-decoration: none; font-size: 0.9rem; }
        nav a:hover { color: var(--accent); }
        
        /* Header */
        header {
            text-align: center;
            padding: 2rem 0;
            border-bottom: 1px solid var(--border);
            margin-bottom: 2rem;
        }
        header h1 { font-size: 2.2rem; margin-bottom: 0.75rem; color: #fff; }
        header .meta { color: var(--text-muted); font-size: 0.9rem; }
        
        /* Headings */
        h1, h2, h3, h4, h5, h6 { color: #fff; margin-top: 2rem; margin-bottom: 1rem; }
        h2 { font-size: 1.5rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border); }
        h3 { font-size: 1.25rem; color: var(--accent); }
        h4 { font-size: 1.1rem; color: var(--accent-green); }
        h5 { font-size: 1rem; color: var(--accent-orange); }
        
        /* Content sections */
        .content { margin-bottom: 2rem; }
        .content > * { margin-bottom: 1rem; }
        
        /* Paragraphs */
        p { margin: 0.75rem 0; }
        
        /* Links */
        a { color: var(--accent); text-decoration: none; }
        a:hover { text-decoration: underline; }
        
        /* Lists */
        ul, ol { padding-left: 1.5rem; margin: 0.75rem 0; }
        li { margin: 0.4rem 0; }
        li > ul, li > ol { margin: 0.25rem 0; }
        
        /* Code - Inline */
        code {
            background: rgba(110, 118, 129, 0.4);
            padding: 0.2em 0.4em;
            border-radius: 6px;
            font-family: 'SF Mono', 'Fira Code', 'JetBrains Mono', Consolas, Monaco, monospace;
            font-size: 0.85em;
            color: #e6edf3;
        }
        
        /* Code - Block */
        pre {
            background: #161b22;
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 1rem;
            overflow-x: auto;
            margin: 1rem 0;
            position: relative;
        }
        pre code {
            background: none;
            padding: 0;
            border-radius: 0;
            font-size: 0.875rem;
            line-height: 1.6;
            color: #e6edf3;
            display: block;
            white-space: pre;
        }
        /* Code language label */
        pre[data-lang]::before {
            content: attr(data-lang);
            position: absolute;
            top: 0;
            right: 0;
            padding: 0.25rem 0.75rem;
            font-size: 0.75rem;
            color: var(--text-muted);
            background: var(--bg);
            border-bottom-left-radius: 6px;
            border-top-right-radius: 7px;
            text-transform: uppercase;
        }
        
        /* Syntax Highlighting */
        .token-keyword { color: #ff7b72; }
        .token-string { color: #a5d6ff; }
        .token-comment { color: #8b949e; font-style: italic; }
        .token-function { color: #d2a8ff; }
        .token-number { color: #79c0ff; }
        .token-operator { color: #ff7b72; }
        .token-class { color: #ffa657; }
        .token-property { color: #79c0ff; }
        .token-builtin { color: #ffa657; }
        .token-variable { color: #ffa657; }
        .token-type { color: #7ee787; }
        .token-punctuation { color: #c9d1d9; }
        .token-tag { color: #7ee787; }
        .token-attr-name { color: #79c0ff; }
        .token-attr-value { color: #a5d6ff; }
        
        /* Tables */
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 1rem 0;
            font-size: 0.9rem;
            display: block;
            overflow-x: auto;
        }
        th, td {
            padding: 0.75rem 1rem;
            text-align: left;
            border: 1px solid var(--border);
        }
        th {
            background: var(--card-bg);
            color: #fff;
            font-weight: 600;
        }
        tr:nth-child(even) { background: rgba(22, 27, 34, 0.5); }
        
        /* Blockquotes */
        blockquote {
            border-left: 4px solid var(--accent);
            padding: 0.5rem 1rem;
            margin: 1rem 0;
            background: rgba(56, 139, 253, 0.1);
            border-radius: 0 8px 8px 0;
        }
        blockquote p { margin: 0.5rem 0; color: var(--text); }
        blockquote code { background: rgba(110, 118, 129, 0.3); }
        
        /* Horizontal rule */
        hr {
            border: none;
            border-top: 1px solid var(--border);
            margin: 2rem 0;
        }
        
        /* Emoji-based markers */
        .marker-star { color: var(--accent-orange); }
        .marker-check { color: var(--accent-green); }
        .marker-cross { color: var(--accent-red); }
        
        /* Strong & Em */
        strong { color: #fff; }
        em { color: var(--text-muted); }
        
        /* TOC */
        .toc {
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 1.5rem;
            margin-bottom: 2rem;
        }
        .toc h2 { margin-top: 0; font-size: 1.1rem; }
        .toc ol { margin: 0; padding-left: 1.25rem; }
        .toc li { margin: 0.5rem 0; }
        .toc a { color: var(--text); }
        .toc a:hover { color: var(--accent); }
        
        /* Footer */
        footer {
            text-align: center;
            padding: 2rem 0;
            color: var(--text-muted);
            font-size: 0.85rem;
            border-top: 1px solid var(--border);
            margin-top: 3rem;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            body { padding: 1rem; }
            header h1 { font-size: 1.5rem; }
            pre { padding: 0.75rem; font-size: 0.8rem; }
            table { font-size: 0.8rem; }
            th, td { padding: 0.5rem; }
        }
    </style>
</head>
<body>
    <nav><a href="index.html">← 返回报告索引</a></nav>
{{CONTENT}}
    <footer>
        <p>报告生成时间: {{DATE}} GMT+8</p>
        <p>Generated by Miles AI Assistant ⚡</p>
    </footer>
</body>
</html>`;

/**
 * 基础语法高亮
 */
function highlightCode(code, lang) {
    if (!lang) return escapeHtml(code);
    
    const keywords = {
        js: /\b(const|let|var|function|return|if|else|for|while|class|extends|import|export|from|async|await|new|this|try|catch|throw|typeof|instanceof|default|switch|case|break|continue)\b/g,
        typescript: /\b(const|let|var|function|return|if|else|for|while|class|extends|import|export|from|async|await|new|this|try|catch|throw|typeof|instanceof|interface|type|enum|implements|public|private|protected|readonly|abstract|as|is|keyof|infer|never|unknown|any|void|null|undefined)\b/g,
        python: /\b(def|class|return|if|elif|else|for|while|import|from|as|try|except|finally|raise|with|lambda|yield|async|await|pass|break|continue|and|or|not|in|is|True|False|None)\b/g,
        bash: /\b(if|then|else|elif|fi|for|while|do|done|case|esac|function|return|export|source|alias|cd|echo|exit|test|read)\b/g,
        json: null,
        markdown: null,
    };
    
    const langKey = lang.toLowerCase().replace('javascript', 'js').replace('ts', 'typescript').replace('sh', 'bash').replace('shell', 'bash').replace('json5', 'json');
    
    let escaped = escapeHtml(code);
    
    // Comments
    escaped = escaped.replace(/(\/\/.*$)/gm, '<span class="token-comment">$1</span>');
    escaped = escaped.replace(/(#.*$)/gm, '<span class="token-comment">$1</span>');
    escaped = escaped.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="token-comment">$1</span>');
    
    // Strings
    escaped = escaped.replace(/(&quot;[^&]*?&quot;|&#39;[^&]*?&#39;|`[^`]*?`)/g, '<span class="token-string">$1</span>');
    
    // Numbers
    escaped = escaped.replace(/\b(\d+\.?\d*)\b/g, '<span class="token-number">$1</span>');
    
    // Keywords
    if (keywords[langKey]) {
        escaped = escaped.replace(keywords[langKey], '<span class="token-keyword">$1</span>');
    }
    
    // Functions (word before parens)
    escaped = escaped.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g, '<span class="token-function">$1</span>(');
    
    return escaped;
}

function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * 转换 Markdown 为 HTML
 */
function convertMarkdown(content) {
    let html = '';
    const lines = content.split('\n');
    let i = 0;
    let inCodeBlock = false;
    let codeBlockLang = '';
    let codeBlockContent = '';
    let inBlockquote = false;
    let blockquoteContent = '';
    let inList = false;
    let listType = '';
    let listContent = '';
    let title = '';
    
    while (i < lines.length) {
        const line = lines[i];
        
        // Code blocks
        if (line.startsWith('```')) {
            if (!inCodeBlock) {
                // Start code block
                inCodeBlock = true;
                codeBlockLang = line.slice(3).trim();
                codeBlockContent = '';
            } else {
                // End code block
                inCodeBlock = false;
                const langAttr = codeBlockLang ? ` data-lang="${escapeHtml(codeBlockLang)}"` : '';
                html += `<pre${langAttr}><code>${highlightCode(codeBlockContent.trim(), codeBlockLang)}</code></pre>\n`;
                codeBlockLang = '';
            }
            i++;
            continue;
        }
        
        if (inCodeBlock) {
            codeBlockContent += line + '\n';
            i++;
            continue;
        }
        
        // Close open list if needed
        if (inList && !line.match(/^[\s]*[-*\d]/) && line.trim() !== '') {
            html += listType === 'ul' ? '</ul>\n' : '</ol>\n';
            inList = false;
        }
        
        // Blockquotes
        if (line.startsWith('>')) {
            if (!inBlockquote) {
                inBlockquote = true;
                html += '<blockquote>\n';
            }
            const quoteLine = line.replace(/^>\s?/, '');
            html += `<p>${processInline(quoteLine)}</p>\n`;
            i++;
            continue;
        } else if (inBlockquote && line.trim() === '') {
            inBlockquote = false;
            html += '</blockquote>\n';
        }
        
        // Headers
        const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
        if (headerMatch) {
            const level = headerMatch[1].length;
            const text = headerMatch[2];
            if (level === 1 && !title) {
                title = text;
                html += `<header><h1>${processInline(text)}</h1></header>\n`;
            } else {
                const id = text.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-').replace(/^-|-$/g, '');
                html += `<h${level} id="${id}">${processInline(text)}</h${level}>\n`;
            }
            i++;
            continue;
        }
        
        // Horizontal rule
        if (line.match(/^[-*_]{3,}$/)) {
            html += '<hr>\n';
            i++;
            continue;
        }
        
        // Tables
        if (line.startsWith('|') && lines[i + 1]?.match(/^\|[\s-:|]+\|/)) {
            html += convertTable(lines, i);
            // Skip to end of table
            while (i < lines.length && lines[i].startsWith('|')) i++;
            continue;
        }
        
        // Lists
        const ulMatch = line.match(/^(\s*)([-*])\s+(.+)$/);
        const olMatch = line.match(/^(\s*)(\d+)\.\s+(.+)$/);
        
        if (ulMatch || olMatch) {
            const match = ulMatch || olMatch;
            const newType = ulMatch ? 'ul' : 'ol';
            
            if (!inList) {
                inList = true;
                listType = newType;
                html += `<${newType}>\n`;
            }
            
            html += `<li>${processInline(match[3])}</li>\n`;
            i++;
            continue;
        }
        
        // Empty lines
        if (line.trim() === '') {
            if (inList) {
                html += listType === 'ul' ? '</ul>\n' : '</ol>\n';
                inList = false;
            }
            i++;
            continue;
        }
        
        // Paragraphs
        html += `<p>${processInline(line)}</p>\n`;
        i++;
    }
    
    // Close any open elements
    if (inList) html += listType === 'ul' ? '</ul>\n' : '</ol>\n';
    if (inBlockquote) html += '</blockquote>\n';
    
    return { html, title };
}

/**
 * 转换表格
 */
function convertTable(lines, startIndex) {
    let html = '<table>\n';
    let i = startIndex;
    
    // Header row
    const headerCells = lines[i].split('|').filter(c => c.trim()).map(c => c.trim());
    html += '<tr>';
    for (const cell of headerCells) {
        html += `<th>${processInline(cell)}</th>`;
    }
    html += '</tr>\n';
    
    i += 2; // Skip header and separator
    
    // Body rows
    while (i < lines.length && lines[i].startsWith('|')) {
        const cells = lines[i].split('|').filter(c => c.trim()).map(c => c.trim());
        html += '<tr>';
        for (const cell of cells) {
            html += `<td>${processInline(cell)}</td>`;
        }
        html += '</tr>\n';
        i++;
    }
    
    html += '</table>\n';
    return html;
}

/**
 * 处理行内元素
 */
function processInline(text) {
    // Escape HTML first (but preserve some entities)
    text = text
        .replace(/&(?!(amp|lt|gt|quot|#39);)/g, '&amp;')
        .replace(/<(?![/a-zA-Z])/g, '&lt;');
    
    // Code (must be before other processing)
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Bold
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    
    // Italic
    text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    text = text.replace(/_([^_]+)_/g, '<em>$1</em>');
    
    // Strikethrough
    text = text.replace(/~~([^~]+)~~/g, '<del>$1</del>');
    
    // Links
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
    
    // Checkboxes
    text = text.replace(/\[x\]/gi, '☑️');
    text = text.replace(/\[ \]/g, '☐');
    
    // Emojis for markers
    text = text.replace(/⭐/g, '<span class="marker-star">⭐</span>');
    text = text.replace(/✅/g, '<span class="marker-check">✅</span>');
    text = text.replace(/❌/g, '<span class="marker-cross">❌</span>');
    
    return text;
}

// Main
const inputFile = process.argv[2];
const outputFile = process.argv[3];

if (!inputFile) {
    console.error('用法: node md-to-html-research.js <input.md> [output.html]');
    process.exit(1);
}

const mdContent = fs.readFileSync(inputFile, 'utf-8');
const { html: bodyContent, title } = convertMarkdown(mdContent);

const finalHtml = HTML_TEMPLATE
    .replace('{{TITLE}}', title || path.basename(inputFile, '.md'))
    .replace('{{CONTENT}}', `<div class="content">\n${bodyContent}</div>`)
    .replace('{{DATE}}', new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }));

const outFile = outputFile || inputFile.replace('.md', '.html');
fs.writeFileSync(outFile, finalHtml);
console.log(`✅ 已生成: ${outFile}`);
