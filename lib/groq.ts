export type GroqMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

type GroqResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: { message?: string };
};

export async function generateGroqAnswer(
  messages: GroqMessage[],
  signal?: AbortSignal
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("Server configuration error: GROQ_API_KEY is missing.");
  }

  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
  const authHeader = ["Bearer", apiKey].join(" ");

  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.4,
      max_tokens: 1024
    }),
    signal
  });

  const payload = (await response.json()) as GroqResponse;

  if (!response.ok) {
    const defaultMessage =
      response.status === 429
        ? "Rate limit reached from AI provider. Please retry in a moment."
        : "AI provider request failed. Please try again later.";
    throw new Error(payload.error?.message || defaultMessage);
  }

  const content = payload.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("AI provider returned an empty response.");
  }
  return content;
}
