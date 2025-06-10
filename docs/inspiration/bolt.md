# Bolt.new Analysis

## Overview

[Bolt.new](https://bolt.new) is a browser-based AI development tool created by StackBlitz that enables users to prompt, run, edit, and deploy full-stack web applications directly in the browser. It's built on top of StackBlitz's WebContainer API, which provides a Node.js environment running entirely in the browser.

## Key Components

### 1. WebContainers

Bolt.new uses [WebContainers](https://webcontainers.io/) to run generated code in the browser. WebContainers provide a full-stack sandbox environment using the WebContainer API. Key features include:

- **Browser-based Node.js runtime**: Runs a Node.js environment directly in the browser without server-side execution
- **File system access**: Complete file system API for creating, reading, updating, and deleting files
- **Terminal emulation**: Provides a terminal-like interface for running commands
- **Package management**: Supports npm/pnpm for installing dependencies
- **Port forwarding**: Allows running web servers with accessible URLs

### 2. Architecture

Bolt.new's architecture consists of:

- **WebContainer initialization**: The system boots a WebContainer instance when the application loads
- **File system management**: A files store that tracks file changes and syncs with the WebContainer file system
- **Terminal integration**: A terminal store that manages terminal sessions and command execution
- **Preview management**: A previews store that handles port forwarding and preview URLs
- **Action runner**: Executes actions like creating files or running shell commands

### 3. AI Integration

Bolt uses Claude Sonnet 3.5 (Anthropic) for AI capabilities:

- **Message parsing**: Processes AI responses to extract actions (file creation, shell commands)
- **Artifact system**: Uses a structured format for AI to generate complete solutions
- **Streaming responses**: Handles streaming AI responses for real-time interaction

### 4. UI Components

- **Code editor**: Uses CodeMirror for syntax highlighting and editing
- **Terminal**: Uses xterm.js for terminal emulation
- **File explorer**: Custom component for navigating the file system
- **Chat interface**: For interacting with the AI assistant

## Implementation Details

### WebContainer Initialization

```typescript
// From app/lib/webcontainer/index.ts
export let webcontainer: Promise<WebContainer> = new Promise(() => {
  // noop for ssr
});

if (!import.meta.env.SSR) {
  webcontainer =
    import.meta.hot?.data.webcontainer ??
    Promise.resolve()
      .then(() => {
        return WebContainer.boot({ workdirName: WORK_DIR_NAME });
      })
      .then((webcontainer) => {
        webcontainerContext.loaded = true;
        return webcontainer;
      });
}
```

### File System Management

Bolt.new uses a files store to manage the file system:

```typescript
// From app/lib/stores/files.ts
export class FilesStore {
  #webcontainer: Promise<WebContainer>;
  files: MapStore<FileMap> = import.meta.hot?.data.files ?? map({});

  async saveFile(filePath: string, content: string) {
    const webcontainer = await this.#webcontainer;
    const relativePath = nodePath.relative(webcontainer.workdir, filePath);
    await webcontainer.fs.writeFile(relativePath, content);
    // Update the file in the store
    this.files.setKey(filePath, { type: 'file', content, isBinary: false });
  }
}
```

### Action Runner

The action runner executes actions like creating files or running shell commands:

```typescript
// From app/lib/runtime/action-runner.ts
export class ActionRunner {
  #webcontainer: Promise<WebContainer>;

  async #runFileAction(action: ActionState) {
    if (action.type !== 'file') {
      unreachable('Expected file action');
    }

    const webcontainer = await this.#webcontainer;
    let folder = nodePath.dirname(action.filePath);
    
    if (folder !== '.') {
      await webcontainer.fs.mkdir(folder, { recursive: true });
    }
    
    await webcontainer.fs.writeFile(action.filePath, action.content);
  }

  async #runShellAction(action: ActionState) {
    if (action.type !== 'shell') {
      unreachable('Expected shell action');
    }

    const webcontainer = await this.#webcontainer;
    const process = await webcontainer.spawn('jsh', ['-c', action.content], {
      env: { npm_config_yes: true },
    });
    
    // Handle process output and exit
  }
}
```

### Message Parsing

Bolt.new uses a message parser to extract actions from AI responses:

```typescript
// From app/lib/runtime/message-parser.ts
export class StreamingMessageParser {
  parse(messageId: string, input: string) {
    // Parse the input to extract artifacts and actions
    // Artifacts are wrapped in <boltArtifact> tags
    // Actions are wrapped in <boltAction> tags
  }
}
```

## Key Insights

1. **Browser-based Execution**: Bolt.new runs everything in the browser, eliminating the need for server-side execution.

2. **Structured AI Responses**: The AI generates structured responses with specific tags for artifacts and actions.

3. **File System Abstraction**: The WebContainer file system is abstracted through a store that manages file operations.

4. **Terminal Integration**: The terminal is fully integrated with the WebContainer environment.

5. **Action-based Architecture**: Actions (file creation, shell commands) are the primary way of interacting with the WebContainer.

6. **No Templates System**: Bolt.new doesn't appear to use a templates system like Sandpack. Instead, it relies on the AI to generate complete projects.

7. **Browser Storage**: The current implementation uses browser storage rather than a backend database.

## Limitations

1. **WebContainer API Licensing**: The WebContainer API is free for personal and open source usage, but requires a commercial license for commercial applications.

2. **Browser Compatibility**: WebContainers have specific browser requirements and may not work in all browsers.

3. **Resource Constraints**: Running a full Node.js environment in the browser can be resource-intensive.

4. **Limited Language Support**: Currently focused on JavaScript/TypeScript and Node.js ecosystem.

## Conclusion

Bolt.new represents a sophisticated approach to browser-based development environments, leveraging WebContainers to provide a full-stack development experience without server-side execution. Its architecture and integration with AI offer valuable insights for implementing similar functionality in our own application.
