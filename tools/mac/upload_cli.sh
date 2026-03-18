#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
CLI="$ROOT_DIR/.toolchain/bin/arduino-cli"
CFG="$ROOT_DIR/.toolchain/arduino-cli.yaml"
TMP_PY="$ROOT_DIR/build/tmp_py"
ESP32_CORE_VERSION="${ESP32_CORE_VERSION:-2.0.17}"
ESP32_UPLOAD_BAUD="${ESP32_UPLOAD_BAUD:-115200}"
TOOLCHAIN_DATA_DIR="$ROOT_DIR/.toolchain/data"
PY_ENV_DIR="$ROOT_DIR/.toolchain/py"
PY_BIN="$PY_ENV_DIR/bin/python"
XATTR_BIN="/usr/bin/xattr"
CODESIGN_BIN="/usr/bin/codesign"

BOARD=""
PORT=""
SKETCH_DIR=""
BUILD_PATH=""

while [ "$#" -gt 0 ]; do
  case "$1" in
    --board) BOARD="$2"; shift 2 ;;
    --port) PORT="$2"; shift 2 ;;
    --sketch-dir) SKETCH_DIR="$2"; shift 2 ;;
    --build-path) BUILD_PATH="$2"; shift 2 ;;
    *) echo "Unknown arg: $1"; exit 2 ;;
  esac
done

if [ -z "$BOARD" ] || [ -z "$PORT" ] || [ -z "$SKETCH_DIR" ] || [ -z "$BUILD_PATH" ]; then
  echo "Usage: upload_cli.sh --board <fqbn> --port <port> --sketch-dir <dir> --build-path <dir>"
  exit 2
fi
if [ ! -x "$CLI" ] || [ ! -f "$CFG" ]; then
  echo "[ERROR] local toolchain missing. Run ./install_mac.sh first."
  exit 3
fi

mkdir -p "$TMP_PY" "$BUILD_PATH"
export TMPDIR="$TMP_PY/"
unset PYTHONHOME PYTHONPATH PYTHONEXECUTABLE DYLD_LIBRARY_PATH DYLD_FRAMEWORK_PATH

CLI_CMD=("$CLI" --config-file "$CFG")
ESP32_PKG_DIR="$TOOLCHAIN_DATA_DIR/packages/esp32"

find_esptool_bin() {
  find "$TOOLCHAIN_DATA_DIR/packages/esp32/tools/esptool_py" -type f -name esptool 2>/dev/null | head -n 1 || true
}

restore_esptool_if_missing() {
  local esptool_bin esptool_dir archive tmpdir
  esptool_bin="$(find_esptool_bin)"
  if [ -n "$esptool_bin" ] && [ -f "$esptool_bin" ]; then
    return 0
  fi

  esptool_dir="$(find "$TOOLCHAIN_DATA_DIR/packages/esp32/tools/esptool_py" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | head -n 1 || true)"
  if [ -z "$esptool_dir" ]; then
    esptool_dir="$TOOLCHAIN_DATA_DIR/packages/esp32/tools/esptool_py/4.5.1"
  fi
  archive="$(find "$ROOT_DIR/.toolchain/downloads/packages" -maxdepth 1 -type f -name 'esptool-v*-macos.tar.gz' 2>/dev/null | head -n 1 || true)"
  if [ -z "$archive" ]; then
    return 1
  fi

  mkdir -p "$esptool_dir"
  tmpdir="$(mktemp -d "$TMP_PY/esptool_restore.XXXXXX")"
  tar -xzf "$archive" -C "$tmpdir" || true
  if [ -f "$tmpdir/esptool/esptool" ]; then
    cp -f "$tmpdir/esptool/esptool" "$esptool_dir/esptool"
    chmod +x "$esptool_dir/esptool"
  fi
  rm -rf "$tmpdir" || true
}

ensure_python_esptool() {
  if [ ! -x "$PY_BIN" ]; then
    python3 -m venv "$PY_ENV_DIR"
  fi
  "$PY_BIN" -m pip show esptool >/dev/null 2>&1 || "$PY_BIN" -m pip install "esptool==4.5.1"
}

install_esptool_proxy() {
  local esptool_bin
  restore_esptool_if_missing || true
  esptool_bin="$(find_esptool_bin)"
  if [ -z "$esptool_bin" ]; then
    return 1
  fi
  ensure_python_esptool

  if [ -f "$esptool_bin" ] && ! grep -q "ESPTOOL_PROXY_V1" "$esptool_bin" 2>/dev/null; then
    [ -f "${esptool_bin}.bin" ] || mv -f "$esptool_bin" "${esptool_bin}.bin"
  fi

  cat > "$esptool_bin" <<EOF
#!/bin/bash
# ESPTOOL_PROXY_V1
PY="$PY_BIN"
if [ ! -x "\$PY" ]; then
  echo "python env missing: \$PY" >&2
  exit 1
fi
exec "\$PY" -m esptool "\$@"
EOF
  chmod +x "$esptool_bin"
  xattr -d com.apple.quarantine "$esptool_bin" 2>/dev/null || true
}

clear_gatekeeper_quarantine() {
  if [ ! -d "$TOOLCHAIN_DATA_DIR" ]; then
    return
  fi
  "$XATTR_BIN" -dr com.apple.quarantine "$TOOLCHAIN_DATA_DIR" 2>/dev/null || true
  while IFS= read -r -d '' f; do
    "$XATTR_BIN" -d com.apple.quarantine "$f" 2>/dev/null || true
  done < <(find "$TOOLCHAIN_DATA_DIR" -type f -print0)
}

adhoc_sign_local_binaries() {
  if [ ! -d "$TOOLCHAIN_DATA_DIR" ]; then
    return
  fi
  while IFS= read -r -d '' f; do
    "$CODESIGN_BIN" --force --sign - "$f" >/dev/null 2>&1 || true
  done < <(find "$TOOLCHAIN_DATA_DIR" -type f \( -perm -111 -o -name "*.dylib" \) -print0)
}

find_xtensa_gpp_bin() {
  find "$TOOLCHAIN_DATA_DIR/packages/esp32/tools/xtensa-esp32-elf-gcc" -type f -name 'xtensa-esp32-elf-g++' 2>/dev/null | head -n 1 || true
}

verify_compiler_runnable() {
  local gpp_bin
  gpp_bin="$(find_xtensa_gpp_bin)"
  if [ -z "$gpp_bin" ]; then
    echo "[ERROR] xtensa-esp32-elf-g++ not found."
    return 1
  fi
  "$XATTR_BIN" -d com.apple.quarantine "$gpp_bin" 2>/dev/null || true
  "$CODESIGN_BIN" --force --sign - "$gpp_bin" >/dev/null 2>&1 || true
  if "$XATTR_BIN" -l "$gpp_bin" 2>/dev/null | grep -q "com.apple.quarantine"; then
    echo "[ERROR] xtensa-esp32-elf-g++ still quarantined: $gpp_bin"
    return 1
  fi
  if ! "$gpp_bin" --version >/dev/null 2>&1; then
    echo "[ERROR] xtensa-esp32-elf-g++ test run failed: $gpp_bin"
    return 1
  fi
}

verify_esptool_runnable() {
  local esptool_bin
  restore_esptool_if_missing || true
  esptool_bin="$(find_esptool_bin)"
  if [ -z "$esptool_bin" ]; then
    echo "[ERROR] esptool binary not found (possibly moved to Trash by macOS dialog)."
    return 1
  fi
  "$XATTR_BIN" -d com.apple.quarantine "$esptool_bin" 2>/dev/null || true
  if "$XATTR_BIN" -l "$esptool_bin" 2>/dev/null | grep -q "com.apple.quarantine"; then
    echo "[WARN] esptool quarantined, switching to python proxy..."
    install_esptool_proxy || true
    esptool_bin="$(find_esptool_bin)"
  fi
  if ! "$esptool_bin" version >/dev/null 2>&1; then
    echo "[WARN] esptool launch failed, switching to python proxy..."
    install_esptool_proxy || true
    esptool_bin="$(find_esptool_bin)"
    if ! "$esptool_bin" version >/dev/null 2>&1; then
      echo "[ERROR] esptool test run failed: $esptool_bin"
      return 1
    fi
  fi
}

echo "[V12-CLI] starting local toolchain upload"
echo "Board: $BOARD"
echo "Port: $PORT"

echo "[1/4] Checking toolchain..."
core_version="$("${CLI_CMD[@]}" core list | awk '$1=="esp32:esp32" {print $2; exit}')"
if [ -z "$core_version" ]; then
  echo "ESP32 core missing, installing $ESP32_CORE_VERSION ..."
  "${CLI_CMD[@]}" core update-index
  "${CLI_CMD[@]}" core install "esp32:esp32@$ESP32_CORE_VERSION"
  clear_gatekeeper_quarantine
  core_version="$ESP32_CORE_VERSION"
fi
echo "Core esp32:esp32 version: $core_version"
echo "Applying macOS Gatekeeper fix..."
clear_gatekeeper_quarantine
adhoc_sign_local_binaries
if ! verify_esptool_runnable; then
  echo "Please run: ./tools/mac/install_toolchain.sh"
  exit 4
fi
if ! verify_compiler_runnable; then
  echo "Please run: ./tools/mac/install_toolchain.sh"
  exit 5
fi

echo "[2/4] Compiling with arduino-cli..."
"${CLI_CMD[@]}" compile --fqbn "$BOARD" --build-path "$BUILD_PATH" "$SKETCH_DIR"

echo "[3/4] Uploading with arduino-cli..."
"${CLI_CMD[@]}" upload --fqbn "$BOARD" -p "$PORT" --input-dir "$BUILD_PATH" --upload-property "upload.speed=$ESP32_UPLOAD_BAUD" "$SKETCH_DIR"

echo "[4/4] Finish"
