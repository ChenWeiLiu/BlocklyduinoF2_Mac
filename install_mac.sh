#!/bin/bash
# ============================================
# BlocklyduinoF2 Mac 安裝腳本
# 適用於 macOS (Apple Silicon / Intel)
# ============================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "=========================================="
echo "  BlocklyduinoF2 Mac 安裝程式"
echo "=========================================="
echo ""

# 1. 檢查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未找到 Node.js！"
    echo "   請先安裝 Node.js：https://nodejs.org/"
    echo "   或使用 Homebrew：brew install node"
    exit 1
fi

NODE_VERSION=$(node -v)
echo "✅ Node.js 版本: $NODE_VERSION"

# 2. 檢查 npm
if ! command -v npm &> /dev/null; then
    echo "❌ 未找到 npm！請重新安裝 Node.js。"
    exit 1
fi

NPM_VERSION=$(npm -v)
echo "✅ npm 版本: $NPM_VERSION"
echo ""

# 3. 安裝相依套件
echo "📦 安裝相依套件..."
npm install
echo ""

# 4. 安裝 NW.js
if [ -d "node_modules/nw" ]; then
    echo "✅ NW.js 已安裝"
else
    echo "📦 安裝 NW.js（這可能需要幾分鐘）..."
    npm install nw@0.109.0 --save-dev
fi
echo ""

# 5. 完成
echo "=========================================="
echo "  ✅ 安裝完成！"
echo ""
echo "  啟動方式："
echo "    方法一：雙擊 start_mac.command"
echo "    方法二：在終端機執行 ./start_mac.command"
echo "=========================================="
