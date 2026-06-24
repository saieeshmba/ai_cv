import { NextResponse } from "next/server";
import { generateGroqAnswer, GroqMessage } from "@/lib/groq";
import { EnhanceSection } from "@/lib/types";

type EnhanceBody = {
  section?: EnhanceSection;
  text?: string;
  job_title?: string;
};

const MAX_INPUT_LENGTH = 1000;

function buildSystemPrompt(section: EnhanceSection): string {
  if (section === "summary") {
    return [
      "You rewrite resume professional summaries.",
      "Rules: 2-4 sentences max, no first-person pronouns (no 'I' or 'my'),",
      "no markdown, no quotation marks, confident and specific tone,",
      "keep it truthful to the input (do not invent employers, titles, or skills not implied by the input).",
      "Return ONLY the rewritten summary text, nothing else."
    ].join(" ");
  }
  return [
    "You rewrite a single resume bullet point.",
    "Rules: start with a strong action verb, no first-person pronouns,",
    "keep it to one line, quantify impact with a plausible metric ONLY if the",
    "original text already implies one (otherwise do not fabricate numbers),",
    "no markdown, no quotation marks, no leading bullet character.",
    "Return ONLY the rewritten bullet text, nothing else."
  ].join(" ");
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as EnhanceBody;
    const section = body.section === "bullet" ? "bullet" : "summary";
    const text = body.text?.trim();
    const jobTitle = body.job_title?.trim();

    if (!text) {
      return NextResponse.json({ error: "Text to enhance is required." }, { status: 400 });
    }
    if (text.length > MAX_INPUT_LENGTH) {
      return NextResponse.json(
        { error: `Text is too long. Limit is ${MAX_INPUT_LENGTH} characters.` },
        { status: 400 }
      );
    }

    const userPrompt = jobTitle
      ? `Target role: ${jobTitle}\nOriginal text: ${text}`
      : `Original text: ${text}`;

    const messages: GroqMessage[] = [
      { role: "system", content: buildSystemPrompt(section) },
      { role: "user", content: userPrompt }
    ];

    const improved = await generateGroqAnswer(messages, request.signal);
    const cleaned = improved.replace(/^["'•\-\s]+|["'\s]+$/g, "");

    return NextResponse.json({ improved_text: cleaned });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error occurred.";
    const status = /rate limit/i.test(message) ? 429 : 500;
    return NextResponse.json(
      {
        error:
          status === 429
            ? "Rate limited by provider. Please wait briefly and retry."
            : message.includes("GROQ_API_KEY")
            ? "AI enhancement requires a GROQ_API_KEY to be configured on the server."
            : "Unable to enhance this text right now."
      },
      { status }
    );
  }
}
