import { z } from "zod";
import { streamObject } from "ai";
import { myProvider } from "@/lib/ai/models";
import { codePrompt, updateDocumentPrompt } from "@/lib/ai/prompts";
import { createDocumentHandler } from "@/lib/artifacts/server";

// JavaScript project document handler with WebContainer support
export const jsProjectWebcontainerHandler = createDocumentHandler<"js-project-webcontainer">({
  kind: "js-project-webcontainer",
  onCreateDocument: async ({ title, dataStream }) => {
    let draftContent = "";

    // Make artifact visible immediately
    dataStream.writeData({
      type: "kind",
      content: "js-project-webcontainer",
    });

    // Set a loading message while generating code
    dataStream.writeData({
      type: "code-delta",
      content: "// Generating JavaScript project based on: " + title + "\n// Please wait...",
    });

    // Determine if we should use a specific template based on the title
    const templateHint = title.toLowerCase();
    let templateType = "node";
    
    if (templateHint.includes("react")) {
      templateType = "react";
    } else if (templateHint.includes("vue")) {
      templateType = "vue";
    } else if (templateHint.includes("express") || templateHint.includes("server")) {
      templateType = "express";
    } else if (templateHint.includes("vanilla") || templateHint.includes("plain javascript")) {
      templateType = "vanilla";
    }

    const { fullStream } = streamObject({
      model: myProvider.getModel("artifact-model"),
      system: codePrompt + `
Generate a multi-file ${templateType} project that can run in a WebContainer environment (Node.js in browser). Format the output as follows:

---filepath:/path/to/file.ext
// File content goes here

---filepath:/path/to/another/file.ext
// Another file content goes here

IMPORTANT: Always include a package.json file with appropriate dependencies and scripts.
For example:

---filepath:/package.json
{
  "name": "example-app",
  "type": "module",
  "dependencies": {
    "express": "latest",
    "nodemon": "latest"
  },
  "scripts": {
    "start": "nodemon --watch './' index.js"
  }
}

---filepath:/index.js
import express from 'express';
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(\`Server running at http://localhost:\${port}\`);
});

Make sure the project is complete and can be run with npm start or similar command.
`,
      prompt: title,
      schema: z.object({
        code: z.string(),
      }),
    });

    // Clear the loading message before streaming actual content
    dataStream.writeData({
      type: "clear",
      content: "",
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === "object") {
        const { object } = delta;
        const { code } = object;

        if (code) {
          // Format code to ensure proper display
          const formattedCode = code.trim();

          dataStream.writeData({
            type: "code-delta",
            content: formattedCode,
          });

          draftContent = formattedCode;
        }
      }
    }

    return draftContent;
  },
  onUpdateDocument: async ({ document, description, dataStream }) => {
    let draftContent = "";

    const { fullStream } = streamObject({
      model: myProvider.getModel("artifact-model"),
      system: updateDocumentPrompt(document.content, "js-project-webcontainer") + `
Update the WebContainer project according to the description. Format the output as follows:

---filepath:/path/to/file.ext
// File content goes here

---filepath:/path/to/another/file.ext
// Another file content goes here

IMPORTANT: Always maintain the package.json file with appropriate dependencies and scripts.
Make sure the project remains complete and can be run with npm start or similar command.
`,
      prompt: description,
      schema: z.object({
        code: z.string(),
      }),
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === "object") {
        const { object } = delta;
        const { code } = object;

        if (code) {
          // Format code to ensure proper display
          const formattedCode = code.trim();

          dataStream.writeData({
            type: "code-delta",
            content: formattedCode,
          });

          draftContent = formattedCode;
        }
      }
    }

    return draftContent;
  },
});
