import { z } from "zod";
import { streamObject } from "ai";
import { myProvider } from "@/lib/ai/models";
import { codePrompt, updateDocumentPrompt } from "@/lib/ai/prompts";
import { createDocumentHandler } from "@/lib/artifacts/server";

// HTML fragment document handler for simple HTML/CSS/JS snippets
// @ts-ignore - Using 'code' kind for compatibility
export const htmlFragmentDocumentHandler = createDocumentHandler<"code">({
  kind: "code",
  onCreateDocument: async ({ title, dataStream }) => {
    let draftContent = "";

    // Make artifact visible immediately
    dataStream.writeData({
      type: "kind",
      content: "html-fragment",
    });

    // Set a loading message while generating code
    dataStream.writeData({
      type: "code-delta",
      content: "<!-- Generating HTML fragment based on: " + title + " -->\n<!-- Please wait... -->",
    });

    const { fullStream } = streamObject({
      model: myProvider.getModel("artifact-model"),
      system: codePrompt + `
Generate a simple HTML fragment with embedded CSS and JavaScript.
The HTML should be a complete, self-contained document that can be rendered in a browser.
Include appropriate styling with CSS and any necessary JavaScript functionality.
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
Maintain the HTML structure with embedded CSS and JavaScript.
Ensure the HTML is a complete, self-contained document that can be rendered in a browser.
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
