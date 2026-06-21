import { NextResponse } from "next/server";
import { classifyIntent } from "@/lib/intent";
import { generateGroqAnswer, GroqMessage } from "@/lib/groq";
import { extractSeminarDetails, seminarDetailsMessage } from "@/lib/seminar";

type ChatBody = {
  prompt?: string;
  messages?: GroqMessage[];
};

const SYSTEM_PROMPT =
  "You are a helpful, concise AI assistant. Provide factual answers and explicitly state uncertainty when needed.";

function sanitizeMessages(messages: GroqMessage[] = []): GroqMessage[] {
  return messages
    .filter(
      (message) =>
        ["system", "user", "assistant"].includes(message.role) &&
        typeof message.content === "string" &&
        message.content.trim().length > 0
    )
    .slice(-20);
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as ChatBody;
    const history = sanitizeMessages(body.messages);
    const prompt =
      body.prompt?.trim() ||
      [...history].reverse().find((message) => message.role === "user")?.content?.trim();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required." },
        { status: 400 }
      );
    }

    const intent = classifyIntent(prompt);

    if (intent === "seminar_details") {
      const details = extractSeminarDetails(prompt);
      return NextResponse.json({
        intent,
        answer: seminarDetailsMessage(details),
        seminar_details: details
      });
    }

    const messages: GroqMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history.filter((message) => message.role !== "system"),
      { role: "user", content: prompt }
    ];

    const answer = await generateGroqAnswer(messages, request.signal);
    return NextResponse.json({
      intent,
      answer,
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile"
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error occurred.";
    const status = /rate limit/i.test(message) ? 429 : 500;
    return NextResponse.json(
      {
        error:
          status === 429
            ? "Rate limited by provider. Please wait briefly and retry."
            : "Unable to process request right now."
      },
      { status }
    );
  }
}
