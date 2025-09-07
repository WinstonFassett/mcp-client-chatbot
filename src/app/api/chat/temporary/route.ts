import { redirect } from "next/navigation";
import { getSession } from "auth/server";
import { type UIMessage, convertToCoreMessages, smoothStream, streamText } from "ai";
import { myProvider } from "lib/ai/models";
import logger from "logger";
import { buildUserSystemPrompt } from "lib/ai/prompts";
import { userRepository } from "lib/db/repository";

export async function POST(request: Request) {
  try {
    const json = await request.json();

    const session = await getSession();

    if (!session?.user.id) {
      return redirect("/sign-in");
    }

    const { messages, model: modelName } = json as {
      messages: UIMessage[];
      model: string;
    };

    const model = myProvider.getModel(modelName);

    const userPreferences =
      (await userRepository.getPreferences(session.user.id)) || undefined;

    return streamText({
      model,
      system: buildUserSystemPrompt(session.user, userPreferences),
      messages: convertToCoreMessages(messages as any),
      experimental_transform: smoothStream({ chunking: "word" }),
    }).toTextStreamResponse();
  } catch (error: any) {
    logger.error(error);
    return new Response(error.message || "Oops, an error occured!", {
      status: 500,
    });
  }
}
