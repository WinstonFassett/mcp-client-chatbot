"use client";

import { Artifact } from "@/components/create-artifact";
import {
  CopyIcon,
  LogsIcon,
  MessageIcon,
  RedoIcon,
  UndoIcon,
} from "@/components/icons";
import { toast } from "sonner";
import { useState } from "react";
import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
  SandpackFileExplorer,
  SandpackConsole,
  useSandpack,
  SandpackStack,
  SandpackCodeViewer,
} from "@codesandbox/sandpack-react";
import { nightOwl } from "@codesandbox/sandpack-themes";

// Default files for different templates
const TEMPLATES = {
  react: {
    "/App.js": `import { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="App">
      <h1>Hello React Sandbox</h1>
      <div>
        <button onClick={() => setCount(count - 1)}>-</button>
        <span>{count}</span>
        <button onClick={() => setCount(count + 1)}>+</button>
      </div>
    </div>
  );
}`,
    "/index.js": `import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

const root = createRoot(document.getElementById("root"));
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);`,
    "/styles.css": `body {
  font-family: sans-serif;
  margin: 0;
  padding: 1rem;
}

.App {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

button {
  margin: 0 0.5rem;
  padding: 0.5rem 1rem;
  background: #0070f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background: #0051a2;
}

span {
  margin: 0 1rem;
  font-size: 1.5rem;
}`,
  },
  vanilla: {
    "/index.js": `document.getElementById("app").innerHTML = \`
<h1>Hello Vanilla JS</h1>
<div>
  <button id="decrement">-</button>
  <span id="count">0</span>
  <button id="increment">+</button>
</div>
\`;

let count = 0;
const countElement = document.getElementById("count");

document.getElementById("increment").addEventListener("click", () => {
  count++;
  countElement.innerText = count;
});

document.getElementById("decrement").addEventListener("click", () => {
  count--;
  countElement.innerText = count;
});`,
    "/index.html": `<!DOCTYPE html>
<html>
  <head>
    <title>Vanilla JS App</title>
    <meta charset="UTF-8" />
    <link rel="stylesheet" href="styles.css">
  </head>
  <body>
    <div id="app"></div>
    <script src="index.js"></script>
  </body>
</html>`,
    "/styles.css": `body {
  font-family: sans-serif;
  margin: 0;
  padding: 1rem;
}

#app {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

button {
  margin: 0 0.5rem;
  padding: 0.5rem 1rem;
  background: #0070f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background: #0051a2;
}

span {
  margin: 0 1rem;
  font-size: 1.5rem;
}`,
  },
  vue: {
    "/src/App.vue": `<template>
  <div class="App">
    <h1>Hello Vue Sandbox</h1>
    <div>
      <button @click="decrement">-</button>
      <span>{{ count }}</span>
      <button @click="increment">+</button>
    </div>
  </div>
</template>

<script>
export default {
  name: "App",
  data() {
    return {
      count: 0
    };
  },
  methods: {
    increment() {
      this.count++;
    },
    decrement() {
      this.count--;
    }
  }
};
</script>

<style>
.App {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

button {
  margin: 0 0.5rem;
  padding: 0.5rem 1rem;
  background: #0070f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background: #0051a2;
}

span {
  margin: 0 1rem;
  font-size: 1.5rem;
}
</style>`,
    "/src/main.js": `import { createApp } from "vue";
import App from "./App.vue";

createApp(App).mount("#app");`,
    "/index.html": `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vue App</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>`,
  },
};

// Helper function to parse multi-file content from a single string
function parseMultiFileContent(content: string) {
  // Default to react template if we can't parse
  if (!content.includes("---filepath:")) {
    return {
      template: "react",
      files: TEMPLATES.react,
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
  if (Object.keys(files).some(file => file.endsWith(".vue"))) {
    template = "vue";
  } else if (Object.keys(files).some(file => file.includes("react"))) {
    template = "react";
  }

  return {
    template,
    files: Object.keys(files).length > 0 ? files : TEMPLATES[template as keyof typeof TEMPLATES],
  };
}

// SandpackWrapper component to handle the Sandpack UI
function SandpackWrapper({ content }: { content: string }) {
  const { template, files } = parseMultiFileContent(content);
  const [activeTab, setActiveTab] = useState<"code" | "preview" | "console">("code");
  
  return (
    <div className="w-full h-full">
      <div className="flex border-b dark:border-zinc-700 border-zinc-200 mb-2">
        <button 
          className={`px-4 py-2 ${activeTab === 'code' ? 'border-b-2 border-blue-500' : ''}`}
          onClick={() => setActiveTab('code')}
        >
          Code
        </button>
        <button 
          className={`px-4 py-2 ${activeTab === 'preview' ? 'border-b-2 border-blue-500' : ''}`}
          onClick={() => setActiveTab('preview')}
        >
          Preview
        </button>
        <button 
          className={`px-4 py-2 ${activeTab === 'console' ? 'border-b-2 border-blue-500' : ''}`}
          onClick={() => setActiveTab('console')}
        >
          Console
        </button>
      </div>
      
      <SandpackProvider
        template={template as "react" | "vue" | "vanilla"}
        theme={nightOwl}
        files={files}
        options={{
          recompileMode: "delayed",
          recompileDelay: 500,
        }}
      >
        <SandpackLayout className="h-[500px]">
          {activeTab === 'code' && (
            <>
              <SandpackFileExplorer />
              <SandpackCodeEditor showLineNumbers showInlineErrors />
            </>
          )}
          
          {activeTab === 'preview' && (
            <SandpackStack>
              <SandpackPreview showNavigator />
            </SandpackStack>
          )}
          
          {activeTab === 'console' && (
            <SandpackConsole />
          )}
        </SandpackLayout>
      </SandpackProvider>
    </div>
  );
}

interface Metadata {
  template: string;
}

export const jsProjectArtifact = new Artifact<"js-project-sandpack", Metadata>({
  kind: "js-project-sandpack",
  description:
    "Multi-file JavaScript project with live preview. Supports React, Vue, and vanilla JS.",
  initialize: async ({ setMetadata }) => {
    setMetadata({
      template: "react",
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
        <SandpackWrapper content={content} />
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
