#!/usr/bin/env node
/**
 * 链接补全工具
 * 为缺失链接的条目尝试搜索补充链接
 * 
 * 输出: JSON 格式的链接映射
 * 用法: node link-enricher.js <input.md>
 */

const fs = require('fs');

// 已知的链接映射 (可以手动补充或从缓存加载)
const KNOWN_LINKS = {
    // Hacker News 讨论
    'AGENTS.md vs Skills': 'https://news.ycombinator.com/item?id=42866428',
    'AgentMail': 'https://news.ycombinator.com/item?id=42869042',
    
    // Twitter/X 讨论
    'GPT-4o 关闭': 'https://x.com/search?q=GPT-4o%20shutdown',
    'OpenAI 计划 2 月 13 日关闭 GPT-4o': 'https://x.com/search?q=GPT-4o%20February%2013',
    
    // 常用来源
    'Cloudflare': 'https://blog.cloudflare.com',
    'HuggingFace': 'https://huggingface.co/blog',
    'Hacker News': 'https://news.ycombinator.com',
};

// 搜索 URL 生成器
const SEARCH_URLS = {
    hn: (q) => `https://hn.algolia.com/?q=${encodeURIComponent(q)}`,
    x: (q) => `https://x.com/search?q=${encodeURIComponent(q)}`,
    google: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`,
};

/**
 * 从 Markdown 中提取需要链接的条目
 */
function extractItemsNeedingLinks(content) {
    const items = [];
    const lines = content.split('\n');
    
    let currentSection = '';
    
    for (const line of lines) {
        // 跟踪当前章节
        if (line.startsWith('## ')) {
            currentSection = line.replace('## ', '').trim();
            continue;
        }
        
        // 跳过有链接的行
        if (line.includes('](http')) continue;
        
        // 三级标题
        if (line.startsWith('### ')) {
            const title = line.replace('### ', '').trim()
                .replace(/^\d+\.\s*/, ''); // 移除序号
            items.push({
                section: currentSection,
                title: title,
                type: 'heading',
                suggestedLink: KNOWN_LINKS[title] || null
            });
            continue;
        }
        
        // 表格行中的条目
        if (line.startsWith('|') && !line.includes('---') && !line.includes('话题') && !line.includes('帖子')) {
            const cells = line.split('|').filter(c => c.trim());
            if (cells.length > 0) {
                const firstCell = cells[0].trim();
                // 检查是否已有链接
                if (!firstCell.includes('](')) {
                    items.push({
                        section: currentSection,
                        title: firstCell,
                        type: 'table-cell',
                        suggestedLink: KNOWN_LINKS[firstCell] || null
                    });
                }
            }
        }
        
        // 来源字段
        if (line.includes('**来源**:') && !line.includes('](')) {
            const source = line.replace(/.*\*\*来源\*\*:\s*/, '').trim();
            items.push({
                section: currentSection,
                title: source,
                type: 'source',
                suggestedLink: KNOWN_LINKS[source] || SEARCH_URLS.google(source)
            });
        }
    }
    
    return items;
}

/**
 * 生成链接建议
 */
function generateLinkSuggestions(items) {
    const suggestions = {};
    
    for (const item of items) {
        if (item.suggestedLink) {
            suggestions[item.title] = item.suggestedLink;
        } else {
            // 根据内容类型生成搜索链接
            if (item.section.includes('热门讨论') && item.section.includes('Hacker News')) {
                suggestions[item.title] = SEARCH_URLS.hn(item.title);
            } else if (item.section.includes('Twitter') || item.section.includes('X/')) {
                suggestions[item.title] = SEARCH_URLS.x(item.title);
            } else {
                suggestions[item.title] = SEARCH_URLS.google(item.title);
            }
        }
    }
    
    return suggestions;
}

// Main
const inputFile = process.argv[2];

if (!inputFile) {
    console.error('用法: node link-enricher.js <input.md>');
    process.exit(1);
}

const content = fs.readFileSync(inputFile, 'utf-8');
const items = extractItemsNeedingLinks(content);
const suggestions = generateLinkSuggestions(items);

console.log('📋 缺失链接的条目分析:\n');

const grouped = {};
for (const item of items) {
    if (!grouped[item.section]) grouped[item.section] = [];
    grouped[item.section].push(item);
}

for (const [section, sectionItems] of Object.entries(grouped)) {
    console.log(`【${section}】`);
    for (const item of sectionItems) {
        const status = item.suggestedLink ? '✓' : '?';
        console.log(`  ${status} ${item.title}`);
        if (suggestions[item.title]) {
            console.log(`    → ${suggestions[item.title]}`);
        }
    }
    console.log('');
}

// 输出 JSON 格式的建议
const outputFile = inputFile.replace('.md', '-links.json');
fs.writeFileSync(outputFile, JSON.stringify(suggestions, null, 2));
console.log(`💾 链接建议已保存到: ${outputFile}`);
