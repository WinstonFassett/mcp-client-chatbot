# Bolt Artifacts Implementation

## Overview

This document outlines our plan to implement Bolt-based code artifacts in our chatbot project. We'll be integrating the bolt.diy codebase (a community fork of bolt.new with enhanced features) into our artifacts system to provide a powerful, WebContainer-based code execution environment.

## Why Bolt?

Bolt.diy provides several advantages over our current code artifact implementations:

1. **Full Node.js Environment**: Runs a complete Node.js environment directly in the browser using WebContainers
2. **Multi-file Projects**: Supports complex project structures with file system operations
3. **Terminal Access**: Provides a terminal interface for running commands
4. **Package Management**: Supports npm/pnpm for installing dependencies
5. **Modern UI**: Clean, intuitive interface for code editing and execution
6. **Multi-model Support**: Works with various AI providers (OpenAI, Anthropic, Google, etc.)

## Implementation Plan

### Phase 1: Initial Integration

1. **Create Artifacts/Bolt Directory Structure**:
   - Copy relevant parts of bolt.diy into our project
   - Adapt the file structure to fit our artifacts system

2. **Dependency Management**:
   - Add bolt.diy dependencies to our package.json
   - Resolve any dependency conflicts

3. **Create a Standalone Route**:
   - Implement a route that embeds the full bolt experience
   - Test the integration in isolation

### Phase 2: Artifact Integration

1. **Create Bolt Artifact Type**:
   - Add "js-project-bolt" to our artifact kinds
   - Implement server handler for the new artifact type
   - Create client component for rendering Bolt artifacts

2. **WebContainer Integration**:
   - Adapt the WebContainer initialization for our environment
   - Implement file system operations
   - Set up terminal integration

3. **UI Components**:
   - Integrate Bolt's code editor
   - Implement file explorer
   - Add terminal component
   - Create preview panel

### Phase 3: Enhanced Features

1. **Chat Integration**:
   - Adapt Bolt's message handling to our chat system
   - Implement artifact versioning

2. **Template System**:
   - Create project templates for common frameworks
   - Implement template selection UI

3. **AI Integration**:
   - Update AI prompts to use the new artifact type
   - Implement structured artifact format

## Technical Details

### Core Components to Integrate

1. **WebContainer Manager**:
   - From `app/lib/webcontainer/index.ts`
   - Handles WebContainer initialization and lifecycle

2. **Files Store**:
   - From `app/lib/stores/files.ts`
   - Manages file operations and state

3. **Terminal Integration**:
   - From `app/components/terminal/`
   - Provides terminal access via xterm.js

4. **Code Editor**:
   - From `app/components/editor/`
   - CodeMirror-based editor with syntax highlighting

5. **Preview Manager**:
   - From `app/lib/stores/previews.ts`
   - Handles port forwarding and preview URLs

### Integration Strategy

We'll follow a "lift and adapt" approach:

1. Copy the core components from bolt.diy
2. Adapt them to our project structure
3. Remove any unnecessary UI chrome/shell
4. Integrate with our chat UI and artifact system

## Next Steps

1. Create the artifacts/bolt directory structure
2. Copy the core components from bolt.diy
3. Add necessary dependencies to our package.json
4. Create a standalone route to test the integration
5. Implement the bolt artifact type in our system

## Implementation Journal

### 2025-06-10: Initial Integration of Bolt Artifact Type

#### Work Completed

1. **Artifact Schema and Handler**
   - Created `src/artifacts/bolt/server.ts` defining the bolt artifact data schema and handler
   - Implemented the bolt artifact handler with create and update methods
   - Defined the BoltArtifactData interface with fields for files, entryFile, dependencies, etc.

2. **Client Component**
   - Created `src/artifacts/bolt/client.tsx` with a placeholder React component
   - Implemented tabs for editor, preview, and terminal views
   - Added file list and content display components

3. **Document Handler**
   - Created `src/artifacts/bolt/server-handler.ts` implementing the document handler
   - Defined default files for a simple Express.js project
   - Implemented onCreateDocument and onUpdateDocument methods
   - Fixed template string syntax issues in the default files

4. **System Integration**
   - Created `src/artifacts/bolt/index.ts` to export all necessary components
   - Registered the boltDocumentHandler in the artifact system's handler array
   - Added the bolt document handler to `documentHandlersByArtifactKind` in `src/lib/artifacts/server.ts`

5. **Dependency Management**
   - Created scripts to analyze and install required dependencies:
     - `scripts/update-dependencies.mjs`: Compares and identifies missing dependencies
     - `scripts/install-bolt-dependencies.sh`: Installs the required dependencies via pnpm
   - Created `scripts/copy-bolt-components.sh` to copy core components from bolt.diy

#### Next Steps

1. **Component Integration**
   - Copy and adapt WebContainer components from bolt.diy
   - Integrate the terminal using xterm.js
   - Set up the CodeMirror editor with proper syntax highlighting

2. **File System and Preview**
   - Implement the file system operations
   - Set up the preview functionality with port forwarding

3. **Testing and Refinement**
   - Test the full workflow: create, edit, run, preview
   - Fix any TypeScript errors and improve type safety
   - Optimize performance and UI responsiveness

#### Notes

- Focus on getting functionality working before addressing all TypeScript errors
- The bolt artifact is based on WebContainers which provides a full Node.js environment in the browser
- Current implementation uses a simple Express.js project as default files
