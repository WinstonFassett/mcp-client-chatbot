import {
  smoothStream,
  streamText,
  Tool,
  type UIMessage,
  convertToCoreMessages,
} from "ai";
import { myProvider } from "@/lib/ai/models";
import { generateUUID } from "lib/utils";

import { mcpClientsManager } from "lib/ai/mcp/mcp-manager";

import { chatRepository } from "lib/db/repository";
import logger from "logger";
import {
  buildProjectInstructionsSystemPrompt,
  buildUserSystemPrompt,
} from "lib/ai/prompts";
import {
  chatApiSchemaRequestBodySchema,
  ChatMessageAnnotation,
} from "app-types/chat";

import { AppDefaultToolkit } from "app-types/chat";
import { defaultTools } from "lib/ai/tools";
import type { ChatRequestBody } from "./types";

import {
  appendAnnotations,
  excludeToolExecution,
  filterToolsByMentions,
  handleError,
  manualToolExecuteByLastMessage,
  mergeSystemPrompt,
  convertToMessage,
  extractInProgressToolPart,
  assignToolResult,
  isUserMessage,
  filterToolsByAllowedMCPServers,
} from "./helper";
import { generateTitleFromUserMessageAction } from "./actions";
import { getSession } from "auth/server";
import { createDocument } from "lib/ai/tools/create-document";
import { updateDocument } from "lib/ai/tools/update-document";

export async function POST(request: Request) {
  try {
    const json = (await request.json()) as ChatRequestBody;

    // Debug logging to understand AI SDK v5 request structure
    console.log('[DEBUG] Chat API - Full request body:', JSON.stringify(json, null, 2));

    const session = await getSession();

    if (!session?.user.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const {
      id,
      messages: requestMessages,
      model: modelName,
      toolChoice,
      allowedAppDefaultToolkit,
      allowedMcpServers,
      projectId,
    } = chatApiSchemaRequestBodySchema.parse(json);

    // AI SDK v5 sends messages array, we want the last one
    const message = requestMessages[requestMessages.length - 1];

    console.log('[DEBUG] Chat API - Parsed messages:', JSON.stringify(requestMessages, null, 2));
    console.log('[DEBUG] Chat API - Current message:', JSON.stringify(message, null, 2));

    const model = myProvider.getModel(modelName);

    let thread = await chatRepository.selectThreadDetails(id);

    if (!thread) {
      const title = await generateTitleFromUserMessageAction({
        message,
        model,
      });
      const newThread = await chatRepository.insertThread({
        id,
        projectId: projectId ?? null,
        title,
        userId: session.user.id,
        visibility: "private",
      });
      thread = await chatRepository.selectThreadDetails(newThread.id);
    }

    // if is false, it means the last message is manual tool execution
    const isLastMessageUserMessage = isUserMessage(message);

    const previousMessages = (thread?.messages ?? []).map(convertToMessage);

    if (!thread) {
      return new Response("Thread not found", { status: 404 });
    }

    const annotations = ((message as any)?.annotations as ChatMessageAnnotation[]) ?? [];

    const mcpTools = mcpClientsManager.tools();

    const isToolCallAllowed = toolChoice != "none";

    const requiredToolsAnnotations = annotations
      .flatMap((annotation) => annotation.requiredTools)
      .filter(Boolean) as string[];

    // Define artifact tools that should be included when allowed
    const artifactTools: Record<string, Tool> = {};

    // Only add artifact tools when tool calls are allowed
    if (isToolCallAllowed && toolChoice !== ("none" as any)) {
      // Create a session object structure that matches what the tools expect
      const sessionForTools = session as any;

      // Create the tools without data stream proxy (simplified)
      const createToolWithDataStream = (toolFn: any) => {
        return toolFn({ session: sessionForTools });
      };

      artifactTools.createDocument = createToolWithDataStream(createDocument);
      artifactTools.updateDocument = createToolWithDataStream(updateDocument);
    }

    // Get enabled default toolkit tools based on allowedAppDefaultToolkit
    const enabledDefaultTools: Record<string, Tool> = {};

    if (allowedAppDefaultToolkit?.includes(AppDefaultToolkit.Weather)) {
      Object.assign(enabledDefaultTools, defaultTools[AppDefaultToolkit.Weather] ?? {});
    }

    if (allowedAppDefaultToolkit?.includes(AppDefaultToolkit.WebSearch)) {
      Object.assign(enabledDefaultTools, defaultTools[AppDefaultToolkit.WebSearch] ?? {});
    }

    if (allowedAppDefaultToolkit?.includes(AppDefaultToolkit.Visualization)) {
      Object.assign(enabledDefaultTools, defaultTools[AppDefaultToolkit.Visualization] ?? {});
    }

    // Get all available tools
    const availableTools: Record<string, Tool> = {
      ...enabledDefaultTools,
      ...artifactTools,
      ...(isToolCallAllowed ? mcpTools : {}),
    };

    console.log('[DEBUG] Available tools:', Object.keys(availableTools));

    // Filter tools based on mentions if needed
    const filteredTools =
      requiredToolsAnnotations.length > 0
        ? filterToolsByMentions(availableTools, requiredToolsAnnotations)
        : availableTools;

    // Filter by MCP servers if needed
    const mcpFilteredTools = allowedMcpServers
      ? filterToolsByAllowedMCPServers(filteredTools, allowedMcpServers)
      : filteredTools;

    // Apply manual mode filtering if needed
    const tools =
      toolChoice === "manual"
        ? excludeToolExecution(mcpFilteredTools)
        : mcpFilteredTools;

    if (!tools) {
      console.log("[DEBUG] No tools available");
    }

    const messages: UIMessage[] = isLastMessageUserMessage
      ? ([...previousMessages, message] as UIMessage[])
      : (previousMessages as UIMessage[]);

    const inProgressToolStep = extractInProgressToolPart(messages.slice(-2));

    const userPreferences = thread?.userPreferences || undefined;

    const systemPrompt = mergeSystemPrompt(
      buildUserSystemPrompt(session.user, userPreferences),
      buildProjectInstructionsSystemPrompt(thread?.instructions),
    );

    // Precompute toolChoice to avoid repeated tool calls
    const computedToolChoice =
      isToolCallAllowed &&
      requiredToolsAnnotations.length > 0 &&
      inProgressToolStep
        ? "required"
        : "auto";

    console.log('[DEBUG] Final tools passed to streamText:', Object.keys(tools || {}));

    const result = streamText({
      model,
      system: systemPrompt,
      messages: convertToCoreMessages(messages as any),
      experimental_transform: smoothStream({ chunking: "word" }),
      maxRetries: 0,
      tools,
      toolChoice: computedToolChoice,
      experimental_activeTools: toolChoice === "none" ? [] : undefined,
      onFinish: async ({ response }) => {
        try {
          if (isLastMessageUserMessage) {
            await chatRepository.insertMessage({
              threadId: thread!.id,
              model: modelName,
              role: "user",
              parts: (message as any).parts,
              attachments: (message as any).experimental_attachments,
              id: (message as any).id || generateUUID(),
              annotations: appendAnnotations((message as any).annotations, {} as any),
            });
          }
          const assistantMessage = response.messages.at(-1) as any;
          if (assistantMessage) {
            const annotations = appendAnnotations(assistantMessage.annotations, {
              toolChoice,
            } as any);
            await chatRepository.upsertMessage({
              model: modelName,
              threadId: thread!.id,
              role: assistantMessage.role,
              id: assistantMessage.id,
              parts: assistantMessage.parts,
              attachments: assistantMessage.experimental_attachments,
              annotations,
            });
          }
        } catch (e) {
          console.error("onFinish persistence error", e);
        }
      },
    });

    return result.toTextStreamResponse();
  } catch (error: any) {
    logger.error(error);
    return new Response(error.message, { status: 500 });
  }
}
