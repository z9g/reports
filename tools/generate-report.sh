#!/bin/bash
# Report Generator - 将 Markdown 报告转换为 HTML
# 用法: ./generate-report.sh <input.md> [output.html]

set -e

INPUT="$1"
OUTPUT="${2:-${INPUT%.md}.html}"

if [ -z "$INPUT" ] || [ ! -f "$INPUT" ]; then
    echo "用法: $0 <input.md> [output.html]"
    exit 1
fi

# 提取标题和日期
TITLE=$(grep -m1 "^# " "$INPUT" | sed 's/^# //')
DATE=$(echo "$INPUT" | grep -oE '[0-9]{4}-[0-9]{2}-[0-9]{2}' | head -1)

echo "生成报告: $INPUT → $OUTPUT"
echo "标题: $TITLE"
echo "日期: $DATE"

# 调用 Node.js 脚本进行转换
node "$(dirname "$0")/md-to-html.js" "$INPUT" "$OUTPUT"

echo "✅ 完成: $OUTPUT"
