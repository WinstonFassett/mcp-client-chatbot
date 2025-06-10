#!/bin/bash

# Script to copy template-related components from bolt.diy to our artifacts/bolt directory

# Source and destination directories
BOLT_SRC="/Users/winston/dev/personal/try/mcp-client-chatbot/inspiration/bolt.diy"
BOLT_DEST="/Users/winston/dev/personal/try/mcp-client-chatbot/src/artifacts/bolt"

# Create necessary directories
mkdir -p "$BOLT_DEST/components/chat"
mkdir -p "$BOLT_DEST/components/header"
mkdir -p "$BOLT_DEST/components/git"
mkdir -p "$BOLT_DEST/components/ui/BackgroundRays"
mkdir -p "$BOLT_DEST/lib/hooks"
mkdir -p "$BOLT_DEST/lib/persistence"
mkdir -p "$BOLT_DEST/utils"

# Copy chat components (including BaseChat)
echo "Copying chat components..."
cp -r "$BOLT_SRC/app/components/chat/BaseChat.tsx" "$BOLT_DEST/components/chat/"
cp -r "$BOLT_SRC/app/components/chat/Chat.client.tsx" "$BOLT_DEST/components/chat/"

# Copy header components
echo "Copying header components..."
cp -r "$BOLT_SRC/app/components/header/Header.tsx" "$BOLT_DEST/components/header/"

# Copy git components
echo "Copying git components..."
cp -r "$BOLT_SRC/app/components/git/GitUrlImport.client.tsx" "$BOLT_DEST/components/git/"

# Copy UI components
echo "Copying UI components..."
cp -r "$BOLT_SRC/app/components/ui/BackgroundRays/index.tsx" "$BOLT_DEST/components/ui/BackgroundRays/"
cp -r "$BOLT_SRC/app/components/ui/LoadingOverlay.tsx" "$BOLT_DEST/components/ui/"

# Copy hooks
echo "Copying hooks..."
cp -r "$BOLT_SRC/app/lib/hooks/useGit.ts" "$BOLT_DEST/lib/hooks/"

# Copy persistence
echo "Copying persistence..."
cp -r "$BOLT_SRC/app/lib/persistence" "$BOLT_DEST/lib/"

# Copy utilities
echo "Copying utilities..."
cp -r "$BOLT_SRC/app/utils/projectCommands.ts" "$BOLT_DEST/utils/"

echo "Copy completed!"
