#!/bin/bash
# ============================================
# BlocklyduinoF2 Mac 啟動腳本
# 雙擊此檔案即可啟動 BlocklyduinoF2
# ============================================

# 切換到腳本所在目錄
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# 檢查 NW.js 是否已安裝
if [ ! -d "node_modules/nw" ]; then
    echo "⚠️  NW.js 尚未安裝，正在執行安裝..."
    echo ""
    bash install_mac.sh
    echo ""
fi

echo "🚀 啟動 BlocklyduinoF2..."

# 啟動 NW.js 應用程式
npx nw . &

# 等待一下讓應用程式啟動
sleep 3
echo "✅ BlocklyduinoF2 已啟動！"
echo "   （可以關閉此終端機視窗）"
