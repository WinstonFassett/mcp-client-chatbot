# WebContainers Code Artifacts Implementation Plan

## Overview

This document outlines a plan to implement WebContainers-based code artifacts in our chatbot project, inspired by Bolt.new. The goal is to create a more powerful and flexible code execution environment than our current Sandpack implementation, allowing for full-stack Node.js applications to run directly in the browser.

## Current State

Our project currently has several code artifact types:
- **simple-code-block**: Basic code snippet display
- **python-file-pyodide**: Python code execution using Pyodide
- **js-project-sandpack**: Multi-file JavaScript projects using Sandpack
- **html-fragment**: HTML/CSS/JS fragments with live preview

The `js-project-sandpack` implementation works but is basic and limited in functionality. It doesn't provide a true Node.js environment or terminal access, which limits its usefulness for full-stack applications.

## Proposed Solution: WebContainers-based Code Artifacts

We propose adding a new artifact type called `js-project-webcontainer` that leverages StackBlitz's WebContainer API to provide a full-stack Node.js environment directly in the browser.

### Key Features

1. **Full Node.js Environment**: Run Node.js code directly in the browser
2. **Terminal Access**: Interactive terminal for running commands
3. **Package Management**: Install npm packages on demand
4. **File System**: Complete file system for creating, reading, updating, and deleting files
5. **Multi-file Projects**: Support for complex project structures
6. **Live Preview**: Preview running applications with automatic port forwarding
7. **Persistent Sessions**: Save and restore project state

### Architecture

#### 1. Components

The implementation will consist of the following components:

1. **WebContainer Manager**: Handles WebContainer initialization and lifecycle
   - Initialize WebContainer instance
   - Manage WebContainer state
   - Handle cleanup on unmount

2. **File System Manager**: Manages file operations
   - Create, read, update, and delete files
   - Track file changes
   - Sync with WebContainer file system

3. **Terminal Manager**: Provides terminal access
   - Initialize xterm.js terminal
   - Connect to WebContainer shell
   - Handle command execution and output

4. **Preview Manager**: Handles application preview
   - Detect and forward ports
   - Provide preview URLs
   - Refresh on file changes

5. **UI Components**:
   - File explorer
   - Code editor
   - Terminal
   - Preview panel
   - Toolbar

#### 2. Integration with Existing System

The new artifact type will be integrated with our existing artifact system:

1. **Artifact Detection**: Update the artifact detection logic to identify when to use WebContainers
2. **Server Handler**: Create a server handler for the new artifact type
3. **Client Component**: Create a client component for rendering and interacting with WebContainers
4. **AI Prompts**: Update AI prompts to guide the AI in generating WebContainers-compatible code

#### 3. Data Model

Extend the existing artifact data model to support WebContainers:

```typescript
// Add to ArtifactKind type
type ArtifactKind = 
  | "text" 
  | "simple-code-block" 
  | "python-file-pyodide" 
  | "js-project-sandpack" 
  | "js-project-webcontainer" // New type
  | "html-fragment" 
  | "image" 
  | "sheet";

// WebContainer artifact data
interface WebContainerArtifactData {
  kind: "js-project-webcontainer";
  files: Record<string, string>; // Initial files
  entryFile: string; // Main file to open
  dependencies?: Record<string, string>; // npm dependencies
  devDependencies?: Record<string, string>; // npm dev dependencies
  template?: string; // Optional template name
  startCommand?: string; // Command to start the application
}
```

## Implementation Plan

### Phase 1: Setup and Basic Integration

1. **Install Dependencies**:
   - `@webcontainer/api`: The WebContainer API
   - `xterm`: Terminal emulation
   - `@xterm/addon-fit`: Terminal resizing
   - `@xterm/addon-web-links`: Terminal link handling

2. **Create WebContainer Manager**:
   - Initialize WebContainer instance
   - Handle WebContainer lifecycle
   - Create basic file system operations

3. **Create Basic UI Components**:
   - File explorer
   - Code editor integration
   - Simple terminal

4. **Integrate with Artifact System**:
   - Create server handler
   - Create client component
   - Update artifact detection

### Phase 2: Enhanced Features

1. **Terminal Integration**:
   - Full terminal support with xterm.js
   - Command history
   - Auto-completion

2. **File System Enhancements**:
   - File creation/deletion UI
   - Drag and drop support
   - Context menus

3. **Preview Improvements**:
   - Automatic port detection
   - Multiple preview windows
   - Preview refresh on file changes

4. **State Management**:
   - Save and restore project state
   - Integration with chat history

### Phase 3: Templates and AI Integration

1. **Project Templates**:
   - Create common project templates (React, Vue, Express, etc.)
   - Template selection UI
   - Custom template creation

2. **AI Integration**:
   - Update AI prompts for WebContainers
   - Add examples for common project types
   - Implement structured artifact format

3. **Advanced Features**:
   - Dependency management UI
   - Project export/import
   - GitHub integration

## Technical Details

### WebContainer Initialization

```typescript
import { WebContainer } from '@webcontainer/api';

export class WebContainerManager {
  private webcontainer: WebContainer | null = null;
  
  async initialize() {
    this.webcontainer = await WebContainer.boot();
    return this.webcontainer;
  }
  
  async createFile(path: string, content: string) {
    if (!this.webcontainer) throw new Error('WebContainer not initialized');
    
    // Create parent directories if needed
    const dirPath = path.split('/').slice(0, -1).join('/');
    if (dirPath) {
      await this.webcontainer.fs.mkdir(dirPath, { recursive: true });
    }
    
    // Write file content
    await this.webcontainer.fs.writeFile(path, content);
  }
  
  async mountFiles(files: Record<string, string>) {
    if (!this.webcontainer) throw new Error('WebContainer not initialized');
    
    const entries = Object.entries(files).map(([path, content]) => {
      return {
        path,
        contents: content,
      };
    });
    
    await this.webcontainer.mount({ entries });
  }
  
  async runCommand(command: string, args: string[] = []) {
    if (!this.webcontainer) throw new Error('WebContainer not initialized');
    
    const process = await this.webcontainer.spawn(command, args);
    return process;
  }
  
  async installDependencies(dependencies: Record<string, string>) {
    // Create package.json if it doesn't exist
    // Run npm install
  }
}
```

### Terminal Integration

```typescript
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';

export class TerminalManager {
  private terminal: Terminal;
  private fitAddon: FitAddon;
  
  constructor(element: HTMLElement) {
    this.terminal = new Terminal({
      cursorBlink: true,
      fontFamily: 'monospace',
      fontSize: 14,
    });
    
    this.fitAddon = new FitAddon();
    this.terminal.loadAddon(this.fitAddon);
    this.terminal.loadAddon(new WebLinksAddon());
    
    this.terminal.open(element);
    this.fitAddon.fit();
  }
  
  connectToProcess(process: any) {
    // Connect terminal to WebContainer process
    const input = process.input.getWriter();
    
    this.terminal.onData((data) => {
      input.write(data);
    });
    
    process.output.pipeTo(
      new WritableStream({
        write: (data) => {
          this.terminal.write(data);
        },
      })
    );
    
    return () => {
      input.close();
    };
  }
  
  resize() {
    this.fitAddon.fit();
  }
}
```

### File Explorer Component

```tsx
import React, { useState, useEffect } from 'react';
import { WebContainerManager } from './WebContainerManager';

interface FileExplorerProps {
  webContainerManager: WebContainerManager;
  onFileSelect: (path: string) => void;
}

export function FileExplorer({ webContainerManager, onFileSelect }: FileExplorerProps) {
  const [files, setFiles] = useState<Record<string, any>>({});
  
  useEffect(() => {
    // Watch file system changes
    const unsubscribe = webContainerManager.watchFileSystem((newFiles) => {
      setFiles(newFiles);
    });
    
    return unsubscribe;
  }, [webContainerManager]);
  
  // Render file tree
  // Handle file selection
  // Implement context menu for file operations
}
```

## UI Design

The WebContainers artifact UI will be similar to Bolt.new, with the following components:

1. **Layout**:
   - Split panel layout with resizable sections
   - File explorer on the left
   - Code editor in the center
   - Terminal at the bottom
   - Preview panel on the right

2. **File Explorer**:
   - Tree view of files and directories
   - Icons for different file types
   - Context menu for file operations
   - New file/folder buttons

3. **Code Editor**:
   - Syntax highlighting
   - Line numbers
   - Multiple tabs for open files
   - Save/auto-save functionality

4. **Terminal**:
   - Full terminal emulation
   - Command history
   - Clear button
   - Resizable height

5. **Preview Panel**:
   - Iframe for application preview
   - URL display
   - Refresh button
   - Open in new tab button

6. **Toolbar**:
   - Run/stop buttons
   - Install dependencies button
   - Template selection
   - Settings button

## AI Integration

To integrate with our AI system, we'll update the prompts to guide the AI in generating WebContainers-compatible code:

```
When creating JavaScript/TypeScript projects, use the "js-project-webcontainer" artifact kind for full-stack Node.js applications. This provides:

1. A complete Node.js environment running in the browser
2. Terminal access for running commands
3. Package management with npm
4. File system for creating and editing files
5. Live preview of running applications

Example structure:
{
  "kind": "js-project-webcontainer",
  "files": {
    "index.js": "console.log('Hello, world!');",
    "package.json": "{\"name\":\"my-app\",\"dependencies\":{}}"
  },
  "entryFile": "index.js",
  "dependencies": {
    "express": "^4.18.2"
  },
  "startCommand": "node index.js"
}
```

## Comparison with Sandpack

| Feature | Sandpack | WebContainers |
|---------|----------|--------------|
| Environment | Browser sandbox | Full Node.js runtime |
| Terminal | Limited/None | Full terminal emulation |
| Package Management | Limited | Full npm support |
| File System | Limited | Complete file system API |
| Server-side Code | No | Yes |
| Performance | Lighter weight | More resource-intensive |
| Browser Support | Broader | More limited |
| Licensing | MIT | Free for personal/open source |

## Challenges and Considerations

1. **Performance**: WebContainers are more resource-intensive than Sandpack. We need to ensure good performance on various devices.

2. **Browser Compatibility**: WebContainers have specific browser requirements. We need to handle fallbacks for unsupported browsers.

3. **Licensing**: The WebContainer API is free for personal and open source usage but requires a commercial license for commercial applications.

4. **Integration Complexity**: Integrating WebContainers with our existing artifact system will require careful planning.

5. **Security**: We need to ensure that the WebContainer environment is secure and can't be used for malicious purposes.

## Next Steps

1. **Proof of Concept**: Create a simple WebContainers integration to validate the approach.

2. **Basic Implementation**: Implement the core functionality (WebContainer initialization, file system, terminal).

3. **UI Implementation**: Create the UI components for the WebContainers artifact.

4. **Integration**: Integrate with the existing artifact system.

5. **Testing**: Test the implementation with various project types.

6. **Documentation**: Create documentation for the new artifact type.

7. **Deployment**: Deploy the new feature to production.

## Conclusion

Implementing WebContainers-based code artifacts will significantly enhance our chatbot's capabilities for JavaScript/TypeScript development, providing a more powerful and flexible environment for users to create and run full-stack applications directly in the browser. While there are challenges to overcome, the benefits in terms of functionality and user experience make this a worthwhile addition to our platform.
