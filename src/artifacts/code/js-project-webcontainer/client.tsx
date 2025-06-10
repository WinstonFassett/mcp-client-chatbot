"use client";

import { useState, useEffect, useCallback } from "react";
import { Artifact } from "@/components/create-artifact";
import {
  CopyIcon,
  LogsIcon,
  MessageIcon,
  RedoIcon,
  UndoIcon,
  FileIcon,
  TerminalIcon,
  CodeIcon
} from "@/components/icons";
import { toast } from "sonner";

// Import WebContainer components
import { FileExplorer } from "./file-explorer";
import { CodeEditor } from "./code-editor";
import { WebTerminal } from "./terminal";
import { Preview } from "./preview";
import { mountFiles } from "./webcontainer-manager";

// Import types
import type { FC } from "react";

// Import styles
import 'xterm/css/xterm.css';

// Default files for different templates
const TEMPLATES = {
  react: {
    "/package.json": `{
  "name": "react-app",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.0",
    "vite": "^4.3.9"
  }
}`,
    "/index.html": `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`,
    "/src/main.jsx": `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`,
    "/src/App.jsx": `import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <h1>React + Vite</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
    </>
  )
}

export default App`,
    "/src/index.css": `:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;
  color-scheme: light dark;
  color: rgba(255, 255, 255, 0.87);
  background-color: #242424;
}

body {
  margin: 0;
  display: flex;
  place-items: center;
  min-width: 320px;
  min-height: 100vh;
}

h1 {
  font-size: 3.2em;
  line-height: 1.1;
}

button {
  border-radius: 8px;
  border: 1px solid transparent;
  padding: 0.6em 1.2em;
  font-size: 1em;
  font-weight: 500;
  font-family: inherit;
  background-color: #1a1a1a;
  cursor: pointer;
  transition: border-color 0.25s;
}
button:hover {
  border-color: #646cff;
}
button:focus,
button:focus-visible {
  outline: 4px auto -webkit-focus-ring-color;
}`,
    "/src/App.css": `.card {
  padding: 2em;
}`,
  },
  express: {
    "/package.json": `{
  "name": "express-app",
  "type": "module",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  }
}`,
    "/index.js": `import express from 'express';
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(\`Server running at http://localhost:\${port}\`);
});`,
  },
  vanilla: {
    "/package.json": `{
  "name": "vanilla-js",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "devDependencies": {
    "vite": "^4.3.9"
  }
}`,
    "/index.html": `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vanilla JS App</title>
    <link rel="stylesheet" href="style.css">
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/main.js"></script>
  </body>
</html>`,
    "/main.js": `document.querySelector('#app').innerHTML = \`
  <h1>Vanilla JS App</h1>
  <div class="card">
    <button id="counter" type="button">Count: 0</button>
  </div>
\`

let count = 0
const button = document.querySelector('#counter')
button.addEventListener('click', () => {
  count++
  button.textContent = \`Count: \${count}\`
})`,
    "/style.css": `body {
  margin: 0;
  display: flex;
  place-items: center;
  min-width: 320px;
  min-height: 100vh;
  font-family: system-ui, sans-serif;
}

#app {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}

.card {
  padding: 2em;
}

button {
  border-radius: 8px;
  border: 1px solid transparent;
  padding: 0.6em 1.2em;
  font-size: 1em;
  font-weight: 500;
  font-family: inherit;
  background-color: #1a1a1a;
  cursor: pointer;
  transition: border-color 0.25s;
}
button:hover {
  border-color: #646cff;
}`,
  },
};

// Helper function to parse multi-file content from a single string
function parseMultiFileContent(content: string) {
  // Default to express template if we can't parse
  if (!content.includes("---filepath:")) {
    return {
      template: "express",
      files: TEMPLATES.express,
    };
  }

  const files: Record<string, string> = {};
  const fileSegments = content.split("---filepath:");
  
  // Skip the first segment if it doesn't contain a filepath
  for (let i = 1; i < fileSegments.length; i++) {
    const segment = fileSegments[i];
    const firstLineEnd = segment.indexOf("\n");
    
    if (firstLineEnd !== -1) {
      const filepath = segment.substring(0, firstLineEnd).trim();
      const fileContent = segment.substring(firstLineEnd + 1).trim();
      
      // Find the end of this file (start of next file marker or end of content)
      const nextFileMarker = fileContent.indexOf("---filepath:");
      const actualContent = nextFileMarker !== -1 
        ? fileContent.substring(0, nextFileMarker).trim()
        : fileContent;
      
      files[filepath] = actualContent;
    }
  }

  // Determine template based on files
  let template = "vanilla";
  if (Object.keys(files).some(file => file.includes("express"))) {
    template = "express";
  } else if (Object.keys(files).some(file => file.includes("react"))) {
    template = "react";
  }

  return {
    template,
    files: Object.keys(files).length > 0 ? files : TEMPLATES[template as keyof typeof TEMPLATES],
  };
}

// WebContainerWrapper component to handle the WebContainer UI
function WebContainerWrapper({ content }: { content: string }) {
  const { files } = parseMultiFileContent(content);
  const [activeTab, setActiveTab] = useState<"code" | "preview" | "terminal">("code");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize WebContainer with files
  useEffect(() => {
    const initWebContainer = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Mount files to WebContainer
        await mountFiles(files);
        
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to initialize WebContainer:', err);
        setError('Failed to initialize WebContainer. WebContainers may not be supported in this browser.');
        setIsLoading(false);
      }
    };
    
    initWebContainer();
  }, [files]);
  
  // Handle file selection
  const handleFileSelect = useCallback((path: string, content: string) => {
    setSelectedFile(path);
    setFileContent(content);
  }, []);
  
  if (isLoading) {
    return (
      <div className="w-full h-[500px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <div>Initializing WebContainer...</div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="w-full h-[500px] flex items-center justify-center">
        <div className="text-center text-red-500">
          <div className="mb-2">⚠️ {error}</div>
          <button 
            onClick={() => window.location.reload()}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full h-[500px] border rounded-md overflow-hidden dark:border-zinc-700 border-zinc-200">
      {/* Tabs */}
      <div className="flex border-b dark:border-zinc-700 border-zinc-200">
        <button 
          className={`px-4 py-2 flex items-center ${activeTab === 'code' ? 'border-b-2 border-blue-500' : ''}`}
          onClick={() => setActiveTab('code')}
        >
          <span className="flex items-center">
            <CodeIcon />
            <span className="ml-1">Code</span>
          </span>
        </button>
        <button 
          className={`px-4 py-2 flex items-center ${activeTab === 'preview' ? 'border-b-2 border-blue-500' : ''}`}
          onClick={() => setActiveTab('preview')}
        >
          <span className="flex items-center">
            <FileIcon />
            <span className="ml-1">Preview</span>
          </span>
        </button>
        <button 
          className={`px-4 py-2 flex items-center ${activeTab === 'terminal' ? 'border-b-2 border-blue-500' : ''}`}
          onClick={() => setActiveTab('terminal')}
        >
          <span className="flex items-center">
            <TerminalIcon />
            <span className="ml-1">Terminal</span>
          </span>
        </button>
      </div>
      
      {/* Content */}
      <div className="h-[calc(100%-40px)]">
        {activeTab === 'code' && (
          <div className="flex h-full">
            <div className="w-1/4 border-r dark:border-zinc-700 border-zinc-200 overflow-auto">
              <FileExplorer onFileSelect={handleFileSelect} />
            </div>
            <div className="w-3/4 overflow-auto">
              <CodeEditor 
                filePath={selectedFile || ''}
                content={fileContent}
              />
            </div>
          </div>
        )}
        
        {activeTab === 'preview' && (
          <Preview className="h-full" />
        )}
        
        {activeTab === 'terminal' && (
          <WebTerminal className="h-full" />
        )}
      </div>
    </div>
  );
}

interface Metadata {
  template: string;
}

export const jsProjectWebcontainerArtifact = new Artifact<"js-project-webcontainer", Metadata>({
  kind: "js-project-webcontainer",
  description:
    "Multi-file JavaScript project with Node.js runtime, terminal, and live preview. Supports React, Express, and vanilla JS.",
  initialize: async ({ setMetadata }) => {
    setMetadata({
      template: "express",
    });
  },
  onStreamPart: ({ streamPart, setArtifact }) => {
    if (streamPart.type === "code-delta") {
      setArtifact((draftArtifact) => ({
        ...draftArtifact,
        content: streamPart.content as string,
        isVisible:
          draftArtifact.status === "streaming" &&
          draftArtifact.content.length > 300 &&
          draftArtifact.content.length < 310
            ? true
            : draftArtifact.isVisible,
        status: "streaming",
      }));
    }
  },
  content: ({ content }) => {
    return (
      <div className="px-1 w-full">
        <WebContainerWrapper content={content} />
      </div>
    );
  },
  actions: [
    {
      icon: <UndoIcon size={18} />,
      description: "View Previous version",
      onClick: ({ handleVersionChange }) => {
        handleVersionChange("prev");
      },
      isDisabled: ({ currentVersionIndex }) => {
        return currentVersionIndex === 0;
      },
    },
    {
      icon: <RedoIcon size={18} />,
      description: "View Next version",
      onClick: ({ handleVersionChange }) => {
        handleVersionChange("next");
      },
      isDisabled: ({ isCurrentVersion }) => {
        return isCurrentVersion;
      },
    },
    {
      icon: <CopyIcon size={18} />,
      description: "Copy code to clipboard",
      onClick: ({ content }) => {
        navigator.clipboard.writeText(content);
        toast.success("Code copied to clipboard");
      },
    },
  ],
  toolbar: [
    {
      icon: <MessageIcon />,
      description: "Ask about this code",
      onClick: ({ appendMessage }) => {
        appendMessage({
          role: "user",
          content: "Can you explain this code?",
        });
      },
    },
    {
      icon: <LogsIcon />,
      description: "Add logs",
      onClick: ({ appendMessage }) => {
        appendMessage({
          role: "user",
          content: "Can you add logging to this code?",
        });
      },
    },
  ],
});
