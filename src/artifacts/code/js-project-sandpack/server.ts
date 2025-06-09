import { z } from "zod";
import { streamObject } from "ai";
import { myProvider } from "@/lib/ai/models";
import { codePrompt, updateDocumentPrompt } from "@/lib/ai/prompts";
import { createDocumentHandler } from "@/lib/artifacts/server";

// JavaScript project document handler with Sandpack support
// @ts-ignore - Using 'code' kind for compatibility
export const jsProjectDocumentHandler = createDocumentHandler<"code">({
  kind: "code",
  onCreateDocument: async ({ title, dataStream }) => {
    let draftContent = "";

    // Make artifact visible immediately
    dataStream.writeData({
      type: "kind",
      content: "js-project",
    });

    // Set a loading message while generating code
    dataStream.writeData({
      type: "code-delta",
      content: "// Generating JavaScript project based on: " + title + "\n// Please wait...",
    });

    // Determine if we should use a specific template based on the title
    const templateHint = title.toLowerCase();
    let templateType = "react";
    
    if (templateHint.includes("vue")) {
      templateType = "vue";
    } else if (templateHint.includes("vanilla") || templateHint.includes("plain javascript")) {
      templateType = "vanilla";
    }

    const { fullStream } = streamObject({
      model: myProvider.getModel("artifact-model"),
      system: codePrompt + `
Generate a multi-file ${templateType} project. Format the output as follows:

---filepath:/path/to/file.ext
// File content goes here

---filepath:/path/to/another/file.ext
// Another file content goes here

For example:
---filepath:/App.js
import React from 'react';

export default function App() {
  return <h1>Hello World</h1>;
}

---filepath:/index.js
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

ReactDOM.render(<App />, document.getElementById('root'));
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
      // @ts-ignore - Using 'code' kind for compatibility
      system: updateDocumentPrompt(document.content, "code") + `
Maintain the multi-file structure using the format:

---filepath:/path/to/file.ext
// File content goes here

---filepath:/path/to/another/file.ext
// Another file content goes here
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
          dataStream.writeData({
            type: "code-delta",
            content: code ?? "",
          });

          draftContent = code;
        }
      }
    }

    return draftContent;
  },
});
