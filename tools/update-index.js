#!/usr/bin/env node
/**
 * 更新报告索引页面
 * 扫描所有 daily-*.html 文件，生成索引列表
 * 
 * 用法: node update-index.js
 */

const fs = require('fs');
const path = require('path');

const REPORTS_DIR = path.join(__dirname, '..');
const INDEX_FILE = path.join(REPORTS_DIR, 'index.html');

// 报告类型配置
const REPORT_TYPES = {
    morning: { icon: '🌅', badge: 'morning', label: '早间版', name: 'AI 早报' },
    noon: { icon: '🤖', badge: 'noon', label: '午间版', name: 'AI 午间快报' },
    evening: { icon: '🌙', badge: 'evening', label: '晚间版', name: 'AI 晚报' },
    default: { icon: '📊', badge: '', label: '', name: 'AI 报告' }
};

/**
 * 从 HTML 文件中提取元数据
 */
function extractMetadata(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.basename(filePath);
    
    // 提取标题
    const titleMatch = content.match(/<title>(.+?)<\/title>/);
    const title = titleMatch ? titleMatch[1].replace(/[🌅🤖🌙📊]\s*/, '') : fileName;
    
    // 提取日期
    const dateMatch = fileName.match(/(\d{4}-\d{2}-\d{2})/);
    const date = dateMatch ? dateMatch[1] : '';
    
    // 判断报告类型
    let type = 'default';
    if (fileName.includes('morning') || title.includes('早报')) type = 'morning';
    else if (fileName.includes('noon') || title.includes('午间')) type = 'noon';
    else if (fileName.includes('evening') || title.includes('晚报')) type = 'evening';
    
    // 提取摘要 (从热门头条或重大新闻中提取关键词)
    const summaryParts = [];
    const h3Matches = content.matchAll(/<h3[^>]*>(?:<a[^>]*>)?([^<]+)/g);
    let count = 0;
    for (const match of h3Matches) {
        if (count >= 3) break;
        const text = match[1].replace(/^\d+\.\s*/, '').trim();
        if (text && text.length > 2 && text.length < 30) {
            summaryParts.push(text);
            count++;
        }
    }
    const summary = summaryParts.join('、') || '查看详情';
    
    // 提取时间
    const timeMatch = content.match(/(\d{1,2}:\d{2}\s*(AM|PM)?)/i);
    const time = timeMatch ? timeMatch[1] : '';
    
    return {
        fileName,
        title,
        date,
        time,
        type,
        summary,
        config: REPORT_TYPES[type]
    };
}

/**
 * 生成报告列表 HTML
 */
function generateReportListHTML(reports) {
    // 按日期分组
    const grouped = {};
    for (const report of reports) {
        if (!grouped[report.date]) {
            grouped[report.date] = [];
        }
        grouped[report.date].push(report);
    }
    
    // 按日期倒序排列
    const sortedDates = Object.keys(grouped).sort().reverse();
    
    let html = '';
    for (const date of sortedDates) {
        const dateObj = new Date(date);
        const dateStr = `${dateObj.getFullYear()}年${dateObj.getMonth() + 1}月${dateObj.getDate()}日`;
        
        html += `        <div class="date-group">
            <h2>📅 ${dateStr}</h2>
            <ul class="report-list">\n`;
        
        // 按类型排序：晚间 > 午间 > 早间
        const typeOrder = { evening: 0, noon: 1, morning: 2, default: 3 };
        const sortedReports = grouped[date].sort((a, b) => typeOrder[a.type] - typeOrder[b.type]);
        
        for (const report of sortedReports) {
            const badgeHTML = report.config.label 
                ? ` <span class="report-badge ${report.config.badge}">${report.config.label}</span>`
                : '';
            
            html += `                <li class="report-item">
                    <a href="${report.fileName}">
                        <span class="report-icon">${report.config.icon}</span>
                        <div class="report-info">
                            <h3>${report.config.name}${badgeHTML}</h3>
                            <p class="meta">${report.date}${report.time ? ' ' + report.time : ''} · ${report.summary}</p>
                        </div>
                        <span class="arrow">→</span>
                    </a>
                </li>\n`;
        }
        
        html += `            </ul>
        </div>\n`;
    }
    
    return html;
}

/**
 * 更新 index.html
 */
function updateIndex() {
    // 扫描所有报告文件
    const files = fs.readdirSync(REPORTS_DIR)
        .filter(f => f.startsWith('daily-') && f.endsWith('.html') && !f.includes('-v2'));
    
    console.log(`📂 发现 ${files.length} 个报告文件`);
    
    // 提取元数据
    const reports = files.map(f => {
        const meta = extractMetadata(path.join(REPORTS_DIR, f));
        console.log(`  - ${f} → ${meta.config.name} (${meta.date})`);
        return meta;
    });
    
    // 生成列表 HTML
    const listHTML = generateReportListHTML(reports);
    
    // 读取并更新 index.html
    let indexContent = fs.readFileSync(INDEX_FILE, 'utf-8');
    
    // 替换列表部分
    const startMarker = '<!-- REPORT_LIST_START -->';
    const endMarker = '<!-- REPORT_LIST_END -->';
    const startIdx = indexContent.indexOf(startMarker);
    const endIdx = indexContent.indexOf(endMarker);
    
    if (startIdx !== -1 && endIdx !== -1) {
        indexContent = indexContent.slice(0, startIdx + startMarker.length) + '\n' +
                       listHTML +
                       '        ' + indexContent.slice(endIdx);
    }
    
    fs.writeFileSync(INDEX_FILE, indexContent);
    console.log(`\n✅ 索引已更新: ${INDEX_FILE}`);
    console.log(`📊 共 ${reports.length} 份报告`);
}

// 执行
updateIndex();
