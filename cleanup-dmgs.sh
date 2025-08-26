#!/bin/bash

# SRE IDE DMG Cleanup Script
echo "🧹 Cleaning up old DMG files..."

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUNDLE_DIR="$SCRIPT_DIR/src-tauri/target/aarch64-apple-darwin/release/bundle/macos"

# Check if bundle directory exists
if [ ! -d "$BUNDLE_DIR" ]; then
    echo "ℹ️  No bundle directory found. Nothing to clean."
    exit 0
fi

# Count DMG files before cleanup
DMG_COUNT_BEFORE=$(find "$BUNDLE_DIR" -name "*.dmg" | wc -l | tr -d ' ')
echo "📊 Found $DMG_COUNT_BEFORE DMG files before cleanup"

# Remove Tauri-generated DMG files (with random names)
echo "🗑️  Removing Tauri-generated DMG files..."
find "$BUNDLE_DIR" -name "rw.*.sre-ide_*.dmg" -delete 2>/dev/null || true

# Keep only the latest installer DMG
echo "💾 Keeping only the latest installer DMG..."
if [ -f "$BUNDLE_DIR/sre-ide_installer.dmg" ]; then
    echo "✅ Keeping: sre-ide_installer.dmg"
else
    echo "ℹ️  No installer DMG found"
fi

# Count DMG files after cleanup
DMG_COUNT_AFTER=$(find "$BUNDLE_DIR" -name "*.dmg" | wc -l | tr -d ' ')
echo "📊 Remaining DMG files: $DMG_COUNT_AFTER"

if [ "$DMG_COUNT_BEFORE" -gt "$DMG_COUNT_AFTER" ]; then
    echo "✅ Cleanup completed! Removed $((DMG_COUNT_BEFORE - DMG_COUNT_AFTER)) old DMG files."
else
    echo "ℹ️  No cleanup needed."
fi
