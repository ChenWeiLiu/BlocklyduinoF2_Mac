#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
TOOLCHAIN_DIR="$ROOT_DIR/.toolchain"
BIN_DIR="$TOOLCHAIN_DIR/bin"
DATA_DIR="$TOOLCHAIN_DIR/data"
DOWNLOADS_DIR="$TOOLCHAIN_DIR/downloads"
CONFIG_FILE="$TOOLCHAIN_DIR/arduino-cli.yaml"
LOCAL_CLI="$BIN_DIR/arduino-cli"
ESP32_CORE_VERSION="${ESP32_CORE_VERSION:-2.0.17}"
ESP32_PKG_DIR="$DATA_DIR/packages/esp32"
TOOLCHAIN_DATA_DIR="$TOOLCHAIN_DIR/data"
PY_ENV_DIR="$TOOLCHAIN_DIR/py"
PY_BIN="$PY_ENV_DIR/bin/python"
XATTR_BIN="/usr/bin/xattr"
CODESIGN_BIN="/usr/bin/codesign"

mkdir -p "$BIN_DIR" "$DATA_DIR" "$DOWNLOADS_DIR" "$ROOT_DIR/build/tmp_py" "$ROOT_DIR/sketches"

copy_cli_from_system() {
  local src
  src="$(command -v arduino-cli || true)"
  if [ -n "$src" ] && [ -x "$src" ]; then
    cp -f "$src" "$LOCAL_CLI"
    chmod +x "$LOCAL_CLI"
    return 0
  fi
  return 1
}

if [ ! -x "$LOCAL_CLI" ]; then
  if ! copy_cli_from_system; then
    if command -v brew >/dev/null 2>&1; then
      echo "[toolchain] installing arduino-cli by brew..."
      brew install arduino-cli
      copy_cli_from_system
    else
      echo "[toolchain] arduino-cli not found. Install Homebrew + arduino-cli first."
      exit 1
    fi
  fi
fi

cat > "$CONFIG_FILE" <<CFG
board_manager:
  additional_urls:
    - https://espressif.github.io/arduino-esp32/package_esp32_index.json
directories:
  data: $DATA_DIR
  downloads: $DOWNLOADS_DIR
  user: $ROOT_DIR/sketches
library:
  enable_unsafe_install: true
CFG

CLI=("$LOCAL_CLI" --config-file "$CONFIG_FILE")

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
  archive="$(find "$DOWNLOADS_DIR/packages" -maxdepth 1 -type f -name 'esptool-v*-macos.tar.gz' 2>/dev/null | head -n 1 || true)"
  if [ -z "$archive" ]; then
    return 1
  fi

  mkdir -p "$esptool_dir"
  tmpdir="$(mktemp -d "$ROOT_DIR/build/tmp_py/esptool_restore.XXXXXX")"
  tar -xzf "$archive" -C "$tmpdir" || true
  if [ -f "$tmpdir/esptool/esptool" ]; then
    cp -f "$tmpdir/esptool/esptool" "$esptool_dir/esptool"
    chmod +x "$esptool_dir/esptool"
  fi
  rm -rf "$tmpdir" || true
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

verify_esptool_runnable() {
  local esptool_bin
  restore_esptool_if_missing || true
  esptool_bin="$(find_esptool_bin)"
  if [ -z "$esptool_bin" ]; then
    echo "[toolchain] warning: esptool not found yet"
    return 0
  fi
  "$XATTR_BIN" -d com.apple.quarantine "$esptool_bin" 2>/dev/null || true
  "$CODESIGN_BIN" --force --sign - "$esptool_bin" >/dev/null 2>&1 || true
  if "$XATTR_BIN" -l "$esptool_bin" 2>/dev/null | grep -q "com.apple.quarantine"; then
    echo "[toolchain] warning: esptool still quarantined: $esptool_bin"
    return 0
  fi
  "$esptool_bin" version >/dev/null 2>&1 || true
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
    return 0
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
  "$XATTR_BIN" -d com.apple.quarantine "$esptool_bin" 2>/dev/null || true
}

rewrite_quarantined_compilers() {
  local f
  while IFS= read -r -d '' f; do
    if "$XATTR_BIN" -l "$f" 2>/dev/null | grep -q "com.apple.quarantine"; then
      python3 - "$f" <<'PY'
import os, sys
p = sys.argv[1]
t = p + ".tmpxq"
st = os.stat(p)
with open(p, "rb") as src, open(t, "wb") as dst:
    dst.write(src.read())
os.chmod(t, st.st_mode)
os.replace(t, p)
PY
      "$XATTR_BIN" -d com.apple.quarantine "$f" 2>/dev/null || true
      "$CODESIGN_BIN" --force --sign - "$f" >/dev/null 2>&1 || true
    fi
  done < <(find "$TOOLCHAIN_DATA_DIR/packages/esp32/tools" -type f \( -name 'xtensa-esp32-elf-g++' -o -name 'xtensa-esp32-elf-gcc' \) -print0 2>/dev/null)
}

echo "[toolchain] cli: $($LOCAL_CLI version | head -n1)"
"${CLI[@]}" core update-index
"${CLI[@]}" core install "esp32:esp32@$ESP32_CORE_VERSION"
"${CLI[@]}" core install arduino:avr || true

clear_gatekeeper_quarantine
adhoc_sign_local_binaries
verify_esptool_runnable
install_esptool_proxy
rewrite_quarantined_compilers

echo "[toolchain] installed cores:"
"${CLI[@]}" core list

echo "[toolchain] done"
echo "[toolchain] local cli: $LOCAL_CLI"
echo "[toolchain] config: $CONFIG_FILE"
