export type IntentType = "general_qa" | "seminar_details" | "document_analysis";

export type SeminarDetails = {
  topic_or_title: string;
  speaker: string;
  date_time: string;
  venue: string;
  agenda_or_summary: string;
  key_takeaways: string;
};

export type AiEstimate = {
  estimated_ai_percentage: number;
  estimated_human_percentage: number;
  confidence: "low" | "medium" | "high";
  rationale: string;
  flagged_segments: string[];
};
