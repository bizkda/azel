#!/bin/bash
# Azel installer — builds from source and installs it as a proper desktop app.
# Usage: ./install.sh

set -e

echo "==> Building Azel (release mode)..."
npm install
npm run tauri build

BIN_SRC="src-tauri/target/release/azel"
BIN_DEST="/usr/local/bin/azel"
ICON_SRC="src-tauri/icons/icon.png"
ICON_DEST="$HOME/.local/share/icons/azel.png"
DESKTOP_FILE="$HOME/.local/share/applications/azel.desktop"

if [ ! -f "$BIN_SRC" ]; then
    echo "Error: built binary not found at $BIN_SRC"
    exit 1
fi

echo "==> Installing binary to $BIN_DEST (requires sudo)..."
sudo cp "$BIN_SRC" "$BIN_DEST"
sudo chmod +x "$BIN_DEST"

echo "==> Installing icon..."
mkdir -p "$(dirname "$ICON_DEST")"
if [ -f "$ICON_SRC" ]; then
    cp "$ICON_SRC" "$ICON_DEST"
else
    echo "Warning: icon not found at $ICON_SRC, skipping (app will use a default icon)."
fi

echo "==> Creating desktop launcher entry..."
mkdir -p "$(dirname "$DESKTOP_FILE")"
cat > "$DESKTOP_FILE" <<EOF
[Desktop Entry]
Name=Azel
Comment=AI chat app
Exec=$BIN_DEST
Icon=azel
Terminal=false
Type=Application
Categories=Utility;Chat;
StartupWMClass=azel
EOF

echo "==> Refreshing application database..."
update-desktop-database "$(dirname "$DESKTOP_FILE")" 2>/dev/null || true

echo ""
echo "✅ Azel installed successfully!"
echo "   - Run from terminal: azel"
echo "   - Or launch it from your app menu / launcher (rofi, wofi, etc.)"
echo ""
echo "To update later, just re-run this script after pulling the latest changes."