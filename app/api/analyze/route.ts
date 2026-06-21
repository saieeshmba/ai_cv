import path from "path";
import { NextResponse } from "next/server";
import { extractTextFromFile } from "@/lib/file-extract";
import { estimateAiUsage } from "@/lib/ai-estimator";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "text/plain",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]);

export async function POST(request: Request): Promise<Response> {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "A file upload is required." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Max supported size is 5MB." },
        { status: 400 }
      );
    }

    const extension = path.extname(file.name).toLowerCase();
    const allowedByExtension = [".txt", ".pdf", ".docx"].includes(extension);

    if (!ALLOWED_TYPES.has(file.type) && !allowedByExtension) {
      return NextResponse.json(
        { error: "Unsupported file type. Allowed: TXT, PDF, DOCX." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const text = await extractTextFromFile(file.name, file.type, buffer);

    if (!text) {
      return NextResponse.json(
        { error: "Could not extract text from uploaded file." },
        { status: 400 }
      );
    }

    const estimate = estimateAiUsage(text);
    return NextResponse.json({
      intent: "document_analysis",
      filename: file.name,
      extracted_characters: text.length,
      estimate
    });
  } catch {
    return NextResponse.json(
      { error: "File analysis failed. Please check file format and try again." },
      { status: 500 }
    );
  }
}
