#!/bin/bash

# SRE IDE DMG Creation Script
echo "📦 Creating SRE IDE DMG installer..."

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_PATH="$SCRIPT_DIR/src-tauri/target/aarch64-apple-darwin/release/bundle/macos/sre-ide.app"
DMG_PATH="$SCRIPT_DIR/src-tauri/target/aarch64-apple-darwin/release/bundle/macos/sre-ide_installer.dmg"

# Check if the app exists
if [ ! -d "$APP_PATH" ]; then
    echo "❌ Error: sre-ide.app not found at $APP_PATH"
    echo "Please run 'npm run build:mac' first to build the application."
    exit 1
fi

# Remove old DMG if it exists
if [ -f "$DMG_PATH" ]; then
    echo "🗑️  Removing old DMG..."
    rm "$DMG_PATH"
fi

# Create DMG
echo "🔨 Creating DMG installer..."
create-dmg \
    --volname "SRE IDE Installer" \
    --volicon "$SCRIPT_DIR/src-tauri/icons/icon.icns" \
    --window-pos 200 120 \
    --window-size 600 400 \
    --icon-size 100 \
    --icon "sre-ide.app" 175 120 \
    --hide-extension "sre-ide.app" \
    --app-drop-link 425 120 \
    --no-internet-enable \
    "$DMG_PATH" \
    "$APP_PATH"

# Check if DMG was created successfully
if [ -f "$DMG_PATH" ]; then
    echo "✅ DMG installer created successfully!"
    echo "📁 Location: $DMG_PATH"
    echo ""
    echo "🎉 You can now:"
    echo "   • Double-click the DMG to mount it"
    echo "   • Drag SRE IDE to your Applications folder"
    echo "   • Unmount the DMG when done"
    echo ""
    echo "🚀 Opening DMG location..."
    open "$(dirname "$DMG_PATH")"
else
    echo "❌ Failed to create DMG installer."
    exit 1
fi
