import path from "path";

function normalize(text: string): string {
  return text.replace(/\u0000/g, "").replace(/\s{3,}/g, " ").trim();
}

export async function extractTextFromFile(
  fileName: string,
  mimeType: string,
  buffer: Buffer
): Promise<string> {
  const extension = path.extname(fileName).toLowerCase();

  if (mimeType === "text/plain" || extension === ".txt") {
    return normalize(buffer.toString("utf-8"));
  }

  if (mimeType === "application/pdf" || extension === ".pdf") {
    const pdfParseModule = await import("pdf-parse");
    const pdfParse = (pdfParseModule as unknown as { default?: (input: Buffer) => Promise<{ text: string }> }).default ?? (pdfParseModule as unknown as (input: Buffer) => Promise<{ text: string }>);
    const parsed = await pdfParse(buffer);
    return normalize(parsed.text || "");
  }

  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    extension === ".docx"
  ) {
    const mammoth = await import("mammoth");
    const parsed = await mammoth.extractRawText({ buffer });
    return normalize(parsed.value || "");
  }

  throw new Error("Unsupported file type. Only TXT, PDF, and DOCX are accepted.");
}
