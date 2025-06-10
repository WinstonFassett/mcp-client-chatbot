import { createDocumentHandler } from "@/lib/artifacts/server";
import { BoltArtifactData, boltArtifactHandler } from "./server";

// Default files for a simple Node.js project
const DEFAULT_FILES = {
  "index.js": `console.log('Hello from WebContainers!');

// This is a simple Node.js application running in the browser
// You can use npm packages, create files, and run commands

const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Hello from WebContainers!');
});

const port = 3000;
app.listen(port, () => {
  console.log(\`Server running at http://localhost:\${port}\`);
});`,
  "package.json": `{
  "name": "webcontainer-project",
  "version": "1.0.0",
  "description": "A Node.js project running in WebContainers",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  }
}`,
  "README.md": `# WebContainer Project

This is a Node.js project running in the browser using WebContainers.

## Getting Started

1. Click the "Run" button to start the server
2. View the preview to see the running application
3. Use the terminal to run commands

## Features

- Full Node.js environment in the browser
- Terminal access
- File system operations
- npm package support
`
};

export const boltDocumentHandler = createDocumentHandler({
  kind: "js-project-bolt" as const,
  
  // Create a new bolt document
  onCreateDocument: async ({ dataStream }) => {
    // Create a new bolt artifact with default files
    const data: BoltArtifactData = await boltArtifactHandler.create({
      kind: "js-project-bolt",
      files: DEFAULT_FILES,
      entryFile: "index.js",
      dependencies: {
        "express": "^4.18.2"
      },
      startCommand: "npm start"
    });
    
    // Return the stringified data
    return JSON.stringify(data);
  },
  
  // Update an existing bolt document
  onUpdateDocument: async ({ document, description, dataStream }) => {
    try {
      // Parse the existing document content to validate it's valid JSON
      JSON.parse(document.content) as BoltArtifactData;
      
      // For now, we're just returning the existing content
      // In a real implementation, we would update the content based on the description
      return document.content;
    } catch (error) {
      console.error("Error updating bolt document:", error);
      // Return empty JSON object as string if parsing fails
      return JSON.stringify({});
    }
  }
});
