import {
  LoadAPIKeyError,
  type UIMessage,
  Tool,
  tool as createTool,
} from "ai";
import {
  ChatMessage,
  ChatMessageAnnotation,
  ToolInvocationUIPart,
} from "app-types/chat";
import { extractMCPToolId } from "lib/ai/mcp/mcp-tool-id";
import { errorToString, objectFlow, toAny } from "lib/utils";
import { callMcpToolAction } from "../mcp/actions";
import { safe } from "ts-safe";
import logger from "logger";
import { defaultTools } from "lib/ai/tools";
import { AllowedMCPServer } from "app-types/mcp";
import { MANUAL_REJECT_RESPONSE_PROMPT } from "lib/ai/prompts";

export function filterToolsByMentions(
  tools: Record<string, Tool>,
  mentions: string[],
) {
  if (mentions.length === 0) {
    return tools;
  }
  return objectFlow(tools).filter((_tool, key) =>
    mentions.some((mention) => key.startsWith(mention)),
  );
}

export function filterToolsByAllowedMCPServers(
  tools: Record<string, Tool>,
  allowedMcpServers?: Record<string, AllowedMCPServer>,
): Record<string, Tool> {
  // If allowedMcpServers is undefined, return all tools
  // This ensures MCP tools are included when no specific filtering is requested
  if (!allowedMcpServers) {
    return tools;
  }

  // Otherwise, filter tools based on allowedMcpServers
  const filteredTools = objectFlow(tools).filter((_tool, key) => {
    const { serverName, toolName } = extractMCPToolId(key);
    // If this isn't an MCP tool or the server has no tool restrictions, include it
    if (!serverName || !allowedMcpServers[serverName]?.tools) return true;
    // Otherwise, only include if the tool is in the allowed list
    return allowedMcpServers[serverName].tools.includes(toolName);
  });

  return filteredTools;
}
export function getAllowedDefaultToolkit(
  allowedAppDefaultToolkit?: string[],
): Record<string, Tool> {

  if (!allowedAppDefaultToolkit) {
    const allTools = Object.values(defaultTools).reduce((acc, toolkit) => {
      return { ...acc, ...toolkit };
    }, {});
    return allTools;
  }

  const filteredTools = allowedAppDefaultToolkit.reduce((acc, toolkit) => {
    const toolsForKit = defaultTools[toolkit] ?? {};
    return { ...acc, ...toolsForKit };
  }, {});

  return filteredTools;
}

export function excludeToolExecution(
  tool: Record<string, Tool>,
): Record<string, Tool> {
  // Simplified: return tools unchanged to avoid type issues; manual mode handled elsewhere if needed
  return tool;
}

export function appendAnnotations(
  annotations: any[] = [],
  annotationsToAppend: ChatMessageAnnotation[] | ChatMessageAnnotation,
): ChatMessageAnnotation[] {
  const newAnnotations = Array.isArray(annotationsToAppend)
    ? annotationsToAppend
    : [annotationsToAppend];
  return [...annotations, ...newAnnotations];
}

export function mergeSystemPrompt(...prompts: (string | undefined)[]): string {
  const filteredPrompts = prompts
    .map((prompt) => prompt?.trim())
    .filter(Boolean);
  return filteredPrompts.join("\n\n");
}

export function manualToolExecuteByLastMessage(
  part: ToolInvocationUIPart,
  message: UIMessage,
) {
  const { args, toolName } = part.toolInvocation;

  const manulConfirmation = (message.parts as any[]).find(
    (_part) => {
      const ti = (_part as any).toolInvocation;
      return ti?.state == "result" && ti?.toolCallId == part.toolInvocation.toolCallId;
    },
  )?.toolInvocation as any;

  if (!manulConfirmation?.result) return MANUAL_REJECT_RESPONSE_PROMPT;

  const toolId = extractMCPToolId(toolName);

  return safe(() => callMcpToolAction(toolId.serverName, toolId.toolName, args))
    .ifFail((error) => ({
      isError: true,
      statusMessage: `tool call fail: ${toolName}`,
      error: errorToString(error),
    }))
    .unwrap();
}

export function handleError(error: any) {
  if (LoadAPIKeyError.isInstance(error)) {
    return error.message;
  }

  logger.error(error);
  logger.error(error.name);
  return errorToString(error.message);
}

export function convertToMessage(message: ChatMessage): UIMessage {
  return {
    ...message,
    id: message.id,
    role: message.role,
    parts: message.parts,
    experimental_attachments:
      toAny(message).attachments || toAny(message).experimental_attachments,
  } as any;
}

export function extractInProgressToolPart(
  messages: UIMessage[],
): ToolInvocationUIPart | null {
  let result: any = null;

  for (const message of messages) {
    for (const part of message.parts || []) {
      const p: any = part as any;
      if (p.type != "tool-invocation") continue;
      if (p.toolInvocation?.state == "result") continue;
      result = part as ToolInvocationUIPart;
      return result;
    }
  }
  return null;
}
export function assignToolResult(toolPart: ToolInvocationUIPart, result: any) {
  return Object.assign(toolPart, {
    toolInvocation: {
      ...toolPart.toolInvocation,
      state: "result",
      result,
    },
  });
}

export function isUserMessage(message: UIMessage): boolean {
  return message.role == "user";
}
