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
