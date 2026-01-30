#!/bin/bash
# Report Generator - 将 Markdown 报告转换为 HTML 并更新索引
# 用法: ./generate-report.sh <input.md> [output.html]

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPORTS_DIR="$(dirname "$SCRIPT_DIR")"

INPUT="$1"
OUTPUT="${2:-}"

if [ -z "$INPUT" ] || [ ! -f "$INPUT" ]; then
    echo "用法: $0 <input.md> [output.html]"
    echo ""
    echo "示例:"
    echo "  $0 ai-daily-report-2026-01-30.md"
    echo "  $0 report.md daily-2026-01-30-noon.html"
    exit 1
fi

# 如果没有指定输出文件，自动生成
if [ -z "$OUTPUT" ]; then
    # 从文件名提取日期和类型
    BASENAME=$(basename "$INPUT" .md)
    DATE=$(echo "$BASENAME" | grep -oE '[0-9]{4}-[0-9]{2}-[0-9]{2}' | head -1)
    
    if echo "$INPUT" | grep -qi "noon\|午"; then
        TYPE="noon"
    elif echo "$INPUT" | grep -qi "evening\|晚"; then
        TYPE="evening"
    else
        TYPE="morning"
    fi
    
    OUTPUT="daily-${DATE:-$(date +%Y-%m-%d)}-${TYPE}.html"
fi

echo "🔄 生成报告..."
echo "   输入: $INPUT"
echo "   输出: $OUTPUT"

# 转换 Markdown 到 HTML
node "$SCRIPT_DIR/md-to-html.js" "$INPUT" "$OUTPUT"

# 更新索引
echo ""
echo "🔄 更新索引..."
node "$SCRIPT_DIR/update-index.js"

echo ""
echo "✅ 完成!"
echo "📄 报告: $OUTPUT"
echo "🏠 索引: index.html"
