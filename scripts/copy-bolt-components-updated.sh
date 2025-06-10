#!/bin/bash

# Updated script to copy core components from bolt.diy to our artifacts/bolt directory
# Based on the actual directory structure

# Source and destination directories
BOLT_SRC="/Users/winston/dev/personal/try/mcp-client-chatbot/inspiration/bolt.diy"
BOLT_DEST="/Users/winston/dev/personal/try/mcp-client-chatbot/src/artifacts/bolt"

# Create necessary directories
mkdir -p "$BOLT_DEST/lib/webcontainer"
mkdir -p "$BOLT_DEST/lib/stores"
mkdir -p "$BOLT_DEST/components/editor"
mkdir -p "$BOLT_DEST/components/workbench"
mkdir -p "$BOLT_DEST/components/ui"
mkdir -p "$BOLT_DEST/types"
mkdir -p "$BOLT_DEST/utils"

# Copy WebContainer core
echo "Copying WebContainer core..."
cp -r "$BOLT_SRC/app/lib/webcontainer"/* "$BOLT_DEST/lib/webcontainer/"

# Copy stores (files, terminal, previews)
echo "Copying stores..."
cp -r "$BOLT_SRC/app/lib/stores"/* "$BOLT_DEST/lib/stores/"

# Copy editor components
echo "Copying editor components..."
cp -r "$BOLT_SRC/app/components/editor"/* "$BOLT_DEST/components/editor/"

# Copy workbench components (includes terminal and file explorer)
echo "Copying workbench components..."
cp -r "$BOLT_SRC/app/components/workbench"/* "$BOLT_DEST/components/workbench/"

# Copy UI components
echo "Copying UI components..."
cp -r "$BOLT_SRC/app/components/ui"/* "$BOLT_DEST/components/ui/"

# Copy types
echo "Copying types..."
cp -r "$BOLT_SRC/app/types"/* "$BOLT_DEST/types/"

# Copy necessary utilities
echo "Copying utilities..."
cp -r "$BOLT_SRC/app/utils"/* "$BOLT_DEST/utils/"

echo "Copy completed!"
