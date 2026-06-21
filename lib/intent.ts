import { IntentType } from "./types";

const seminarPattern =
  /\b(seminar|workshop|conference|webinar|talk)\b/i;
const seminarDetailPattern =
  /\b(details?|speaker|agenda|venue|takeaways?|summary|date|time|when|where)\b/i;
const documentPattern =
  /\b(analy[sz]e|analysis|uploaded?|upload|file|document|pdf|docx|txt|ai percentage|ai detector)\b/i;

export function classifyIntent(input: string): IntentType {
  if (seminarPattern.test(input) && seminarDetailPattern.test(input)) {
    return "seminar_details";
  }
  if (documentPattern.test(input)) {
    return "document_analysis";
  }
  return "general_qa";
}
