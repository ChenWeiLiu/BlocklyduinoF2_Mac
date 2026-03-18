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

# 檢查本地 Arduino toolchain
if [ ! -x "$SCRIPT_DIR/.toolchain/bin/arduino-cli" ] || [ ! -f "$SCRIPT_DIR/.toolchain/arduino-cli.yaml" ]; then
    echo "⚠️  未找到本地 Arduino toolchain，正在執行安裝..."
    echo ""
    bash install_mac.sh
    echo ""
fi

echo "🚀 啟動 BlocklyduinoF2..."

# 關閉殘留 NW.js 行程，避免舊快取/舊狀態影響本次啟動
pkill -f 'nwjs.app/Contents/MacOS/nwjs' 2>/dev/null || pkill -f nwjs 2>/dev/null || true
sleep 1

# 啟動 NW.js 應用程式（每次啟動都清除快取與使用者資料）
rm -rf "$SCRIPT_DIR/.nw-user-data" 2>/dev/null || true
mkdir -p "$SCRIPT_DIR/.nw-user-data"
NW_APP="$SCRIPT_DIR/node_modules/nw/nwjs-v0.109.0-osx-arm64/nwjs.app"
if [ ! -d "$NW_APP" ]; then
    echo "⚠️  找不到 NW.js app，重新安裝..."
    npm install
fi

# 清除 Gatekeeper 標記，避免 NW.js 啟動後呼叫工具鏈時被 macOS 擋下
xattr -dr com.apple.quarantine "$NW_APP" 2>/dev/null || true
xattr -dr com.apple.quarantine "$SCRIPT_DIR/.toolchain/data" 2>/dev/null || true

# 關閉 NW.js 的 quarantine 繼承行為（否則它建立/改寫的檔案會再次被標記 quarantine）
PLIST="$NW_APP/Contents/Info.plist"
if [ -f "$PLIST" ]; then
    /usr/libexec/PlistBuddy -c "Set :LSFileQuarantineEnabled false" "$PLIST" 2>/dev/null || \
    /usr/libexec/PlistBuddy -c "Add :LSFileQuarantineEnabled bool false" "$PLIST" 2>/dev/null || true
fi

# macOS 上直接用 open + --args，避免執行檔忽略專案路徑
open -na "$NW_APP" --args \
    "$SCRIPT_DIR" \
    "--disable-http-cache" \
    "--user-data-dir=$SCRIPT_DIR/.nw-user-data"

# 等待一下讓應用程式啟動
sleep 3
echo "✅ BlocklyduinoF2 已啟動！"
echo "   （可以關閉此終端機視窗）"
