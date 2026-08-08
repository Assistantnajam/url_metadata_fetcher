import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { groq } from "@ai-sdk/groq";
import { fetchPageMetadataTool } from "@/lib/tools/fetch-page-metadata";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: groq("llama-3.1-8b-instant"),
    system:
      "You are a helpful assistant. Whenever the user shares or mentions a URL, call the fetchPageMetadata tool to look up a preview of that page before commenting on it. Keep replies short.",
    messages: await convertToModelMessages(messages),
    tools: {
      fetchPageMetadata: fetchPageMetadataTool,
    },
  });

  return result.toUIMessageStreamResponse();
}
