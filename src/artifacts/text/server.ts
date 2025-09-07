import { smoothStream, streamText } from "ai";
import { myProvider } from "@/lib/ai/models";
import { createDocumentHandler } from "@/lib/artifacts/server";
import { updateDocumentPrompt } from "@/lib/ai/prompts";

export const textDocumentHandler = createDocumentHandler<"text">({
  kind: "text",
  onCreateDocument: async ({ title, dataStream }) => {
    let draftContent = "";

    const { fullStream } = streamText({
      model: myProvider.getModel("artifact-model"),
      system:
        "Write about the given topic. Markdown is supported. Use headings wherever appropriate.",
      experimental_transform: smoothStream({ chunking: "word" }),
      prompt: title,
    });

    for await (const delta of fullStream) {
      const { type } = delta as any;

      if (type === "text-delta") {
        const text = (delta as any).text as string;

        draftContent += text;

        dataStream.writeData({
          type: "text-delta",
          content: text,
        });
      }
    }

    return draftContent;
  },
  onUpdateDocument: async ({ document, description, dataStream }) => {
    let draftContent = "";

    const { fullStream } = streamText({
      model: myProvider.getModel("artifact-model"),
      system: updateDocumentPrompt(document.content, "text"),
      experimental_transform: smoothStream({ chunking: "word" }),
      prompt: description,
    });

    for await (const delta of fullStream) {
      const { type } = delta as any;

      if (type === "text-delta") {
        const text = (delta as any).text as string;

        draftContent += text;
        dataStream.writeData({
          type: "text-delta",
          content: text,
        });
      }
    }

    return draftContent;
  },
});
