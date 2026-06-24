import path from "path";
import { NextResponse } from "next/server";
import { extractTextFromFile } from "@/lib/file-extract";
import { matchResumeToJob } from "@/lib/job-match";
import { generateGroqAnswer, GroqMessage } from "@/lib/groq";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "text/plain",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]);
const MAX_TEXT_LENGTH = 20000;

async function extractFromFileField(formData: FormData, field: string): Promise<string | null> {
  const file = formData.get(field);
  if (!(file instanceof File) || file.size === 0) return null;

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File too large. Max supported size is 5MB.");
  }
  const extension = path.extname(file.name).toLowerCase();
  const allowedByExtension = [".txt", ".pdf", ".docx"].includes(extension);
  if (!ALLOWED_TYPES.has(file.type) && !allowedByExtension) {
    throw new Error("Unsupported file type. Allowed: TXT, PDF, DOCX.");
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  return extractTextFromFile(file.name, file.type, buffer);
}

async function generateAiSuggestions(
  resumeText: string,
  jobDescription: string,
  missingKeywords: string[]
): Promise<string[] | null> {
  if (missingKeywords.length === 0) return null;
  try {
    const messages: GroqMessage[] = [
      {
        role: "system",
        content:
          "You are a resume coach helping a candidate tailor their resume to a specific job description. " +
          "Given the resume, the job description, and a list of keywords missing from the resume, " +
          "suggest at most 6 concrete improvements. Each suggestion should be one sentence, specific, " +
          "and actionable (e.g. reference an existing bullet to rephrase, or a skill to add IF it's plausible " +
          "given the resume's existing background). Do not invent fake job history. " +
          "Return only the suggestions, one per line, no numbering, no markdown."
      },
      {
        role: "user",
        content:
          `Missing keywords: ${missingKeywords.slice(0, 12).join(", ")}\n\n` +
          `Job description (truncated):\n${jobDescription.slice(0, 2500)}\n\n` +
          `Resume (truncated):\n${resumeText.slice(0, 2500)}`
      }
    ];
    const answer = await generateGroqAnswer(messages);
    const suggestions = answer
      .split(/\n+/)
      .map((line) => line.replace(/^[-•\d.\s]+/, "").trim())
      .filter(Boolean)
      .slice(0, 6);
    return suggestions.length > 0 ? suggestions : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const formData = await request.formData();

    const resumeFileText = await extractFromFileField(formData, "resume_file");
    const jobFileText = await extractFromFileField(formData, "job_description_file");

    const resumeText = (resumeFileText || (formData.get("resume_text") as string) || "").trim();
    const jobDescription = (
      jobFileText || (formData.get("job_description") as string) || ""
    ).trim();

    if (!resumeText) {
      return NextResponse.json(
        { error: "Upload a resume file or paste your resume text." },
        { status: 400 }
      );
    }
    if (!jobDescription) {
      return NextResponse.json(
        { error: "Paste or upload the job description to match against." },
        { status: 400 }
      );
    }

    const trimmedResume = resumeText.slice(0, MAX_TEXT_LENGTH);
    const trimmedJob = jobDescription.slice(0, MAX_TEXT_LENGTH);

    const result = matchResumeToJob(trimmedResume, trimmedJob);
    const aiSuggestions = await generateAiSuggestions(
      trimmedResume,
      trimmedJob,
      result.missing_keywords
    );

    return NextResponse.json({
      ...result,
      improvement_suggestions: aiSuggestions || result.improvement_suggestions
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Job match failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
