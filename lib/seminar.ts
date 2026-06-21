import { SeminarDetails } from "./types";

const UNKNOWN = "unknown";

function extractValue(input: string, pattern: RegExp): string {
  const match = input.match(pattern);
  return match?.[1]?.trim() || UNKNOWN;
}

export function extractSeminarDetails(input: string): SeminarDetails {
  const text = input.replace(/\s+/g, " ").trim();

  return {
    topic_or_title: extractValue(
      text,
      /\b(?:topic|title|seminar(?: topic)?)\s*[:\-]\s*([^;,]+)/i
    ),
    speaker: extractValue(text, /\b(?:speaker|presenter|host)\s*[:\-]\s*([^;,]+)/i),
    date_time: extractValue(
      text,
      /\b(?:date|time|when|scheduled for)\s*[:\-]\s*([^;,]+)/i
    ),
    venue: extractValue(text, /\b(?:venue|location|where)\s*[:\-]\s*([^;,]+)/i),
    agenda_or_summary: extractValue(
      text,
      /\b(?:agenda|summary|about)\s*[:\-]\s*([^;]+)/i
    ),
    key_takeaways: extractValue(
      text,
      /\b(?:takeaways?|key points?)\s*[:\-]\s*([^;]+)/i
    )
  };
}

export function seminarDetailsMessage(details: SeminarDetails): string {
  return [
    "Seminar details (best-effort extraction):",
    `- Topic/Title: ${details.topic_or_title}`,
    `- Speaker: ${details.speaker}`,
    `- Date/Time: ${details.date_time}`,
    `- Venue: ${details.venue}`,
    `- Agenda/Summary: ${details.agenda_or_summary}`,
    `- Key Takeaways: ${details.key_takeaways}`
  ].join("\n");
}
