import path from "path";
import { NextResponse } from "next/server";
import { extractTextFromFile } from "@/lib/file-extract";
import { scoreResumeText } from "@/lib/ats-score";
import { generateGroqAnswer, GroqMessage } from "@/lib/groq";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "text/plain",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]);
const MAX_TEXT_LENGTH = 20000;

async function resolveResumeText(formData: FormData): Promise<{ text: string; filename?: string }> {
  const file = formData.get("file");
  const pastedText = formData.get("resume_text");

  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_FILE_SIZE) {
      throw new Error("File too large. Max supported size is 5MB.");
    }
    const extension = path.extname(file.name).toLowerCase();
    const allowedByExtension = [".txt", ".pdf", ".docx"].includes(extension);
    if (!ALLOWED_TYPES.has(file.type) && !allowedByExtension) {
      throw new Error("Unsupported file type. Allowed: TXT, PDF, DOCX.");
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const text = await extractTextFromFile(file.name, file.type, buffer);
    return { text, filename: file.name };
  }

  if (typeof pastedText === "string" && pastedText.trim()) {
    return { text: pastedText.trim() };
  }

  throw new Error("Upload a resume file or paste your resume text.");
}

async function generateAiTips(resumeText: string, improvements: string[]): Promise<string[]> {
  if (improvements.length === 0) return [];
  try {
    const messages: GroqMessage[] = [
      {
        role: "system",
        content:
          "You are an ATS resume coach. Given a resume and a list of detected weaknesses, " +
          "give at most 4 short, concrete, actionable tips (one sentence each) to fix the weaknesses. " +
          "Return them as a plain list separated by newlines, no numbering, no markdown."
      },
      {
        role: "user",
        content: `Detected weaknesses:\n- ${improvements.join("\n- ")}\n\nResume text (truncated):\n${resumeText.slice(
          0,
          3000
        )}`
      }
    ];
    const answer = await generateGroqAnswer(messages);
    return answer
      .split(/\n+/)
      .map((line) => line.replace(/^[-•\d.\s]+/, "").trim())
      .filter(Boolean)
      .slice(0, 4);
  } catch {
    return [];
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const formData = await request.formData();
    const { text, filename } = await resolveResumeText(formData);

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Could not extract any text from the provided resume." },
        { status: 400 }
      );
    }

    const trimmedText = text.slice(0, MAX_TEXT_LENGTH);
    const result = scoreResumeText(trimmedText);
    const aiTips = await generateAiTips(trimmedText, result.improvements);

    return NextResponse.json({
      filename: filename || "pasted-resume",
      ...result,
      ai_tips: aiTips
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "ATS scoring failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
