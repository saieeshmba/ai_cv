import { AiEstimate } from "./types";

const AI_PHRASES = [
  "in conclusion",
  "it is important to note",
  "overall",
  "furthermore",
  "additionally",
  "as an ai",
  "delve",
  "leverage",
  "robust"
];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function estimateAiUsage(text: string): AiEstimate {
  const cleaned = text.replace(/\s+/g, " ").trim();
  const sentences = cleaned.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean);
  const words = cleaned.toLowerCase().split(/\s+/).filter(Boolean);
  const uniqueWords = new Set(words);

  const avgSentenceLength =
    sentences.length > 0
      ? sentences.reduce((acc, sentence) => acc + sentence.split(/\s+/).length, 0) /
        sentences.length
      : 0;
  const lexicalDiversity = words.length > 0 ? uniqueWords.size / words.length : 0;
  const aiPhraseHits = AI_PHRASES.reduce(
    (acc, phrase) => acc + (cleaned.toLowerCase().includes(phrase) ? 1 : 0),
    0
  );

  let score = 50;
  score += avgSentenceLength > 22 ? 12 : -4;
  score += lexicalDiversity < 0.42 ? 10 : -6;
  score += aiPhraseHits * 5;
  score += words.length > 300 ? 6 : -2;
  score = clamp(Math.round(score), 0, 100);

  const confidence: AiEstimate["confidence"] =
    words.length > 450 ? "high" : words.length > 180 ? "medium" : "low";

  const flaggedSegments = sentences
    .filter((sentence) => {
      const lower = sentence.toLowerCase();
      return (
        sentence.split(/\s+/).length > 30 ||
        AI_PHRASES.some((phrase) => lower.includes(phrase))
      );
    })
    .slice(0, 3);

  return {
    estimated_ai_percentage: score,
    estimated_human_percentage: 100 - score,
    confidence,
    rationale:
      "Estimated score uses linguistic heuristics (sentence uniformity, lexical diversity, and common AI-like phrasing). This is an estimate, not a definitive determination.",
    flagged_segments: flaggedSegments
  };
}
