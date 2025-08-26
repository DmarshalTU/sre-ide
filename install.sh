#!/bin/bash

# SRE IDE Installation Script
echo "🚀 Installing SRE IDE..."

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_PATH="$SCRIPT_DIR/src-tauri/target/aarch64-apple-darwin/release/bundle/macos/sre-ide.app"
APPLICATIONS_DIR="/Applications"

# Check if the app exists
if [ ! -d "$APP_PATH" ]; then
    echo "❌ Error: sre-ide.app not found at $APP_PATH"
    echo "Please run 'npm run build:mac' first to build the application."
    exit 1
fi

# Check if app is already installed
if [ -d "$APPLICATIONS_DIR/sre-ide.app" ]; then
    echo "⚠️  SRE IDE is already installed. Removing old version..."
    rm -rf "$APPLICATIONS_DIR/sre-ide.app"
fi

# Copy the app to Applications
echo "📦 Copying SRE IDE to Applications..."
cp -R "$APP_PATH" "$APPLICATIONS_DIR/"

# Set proper permissions
echo "🔐 Setting permissions..."
chmod +x "$APPLICATIONS_DIR/sre-ide.app/Contents/MacOS/sre-ide"

# Verify installation
if [ -d "$APPLICATIONS_DIR/sre-ide.app" ]; then
    echo "✅ SRE IDE successfully installed to $APPLICATIONS_DIR/sre-ide.app"
    echo ""
    echo "🎉 Installation complete! You can now:"
    echo "   • Find SRE IDE in your Applications folder"
    echo "   • Launch it from Spotlight (Cmd+Space, then type 'SRE IDE')"
    echo "   • Add it to your Dock for quick access"
    echo ""
    echo "🚀 Launching SRE IDE..."
    open "$APPLICATIONS_DIR/sre-ide.app"
else
    echo "❌ Installation failed. Please check permissions and try again."
    exit 1
fi
