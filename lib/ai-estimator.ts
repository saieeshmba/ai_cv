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
// Baseline and thresholds tuned for practical, conservative estimation on plain text.
const BASE_SCORE = 50;
const LONG_SENTENCE_THRESHOLD = 22;
const LOW_DIVERSITY_THRESHOLD = 0.42;
const LONG_TEXT_THRESHOLD = 300;
// Score adjustments keep output balanced and avoid extreme percentages on short inputs.
const LONG_SENTENCE_BONUS = 12;
const SHORT_SENTENCE_PENALTY = -4;
const LOW_DIVERSITY_BONUS = 10;
const HIGH_DIVERSITY_PENALTY = -6;
const AI_PHRASE_BONUS = 5;
const LONG_TEXT_BONUS = 6;
const SHORT_TEXT_PENALTY = -2;

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

  let score = BASE_SCORE;
  score += avgSentenceLength > LONG_SENTENCE_THRESHOLD ? LONG_SENTENCE_BONUS : SHORT_SENTENCE_PENALTY;
  score += lexicalDiversity < LOW_DIVERSITY_THRESHOLD ? LOW_DIVERSITY_BONUS : HIGH_DIVERSITY_PENALTY;
  score += aiPhraseHits * AI_PHRASE_BONUS;
  score += words.length > LONG_TEXT_THRESHOLD ? LONG_TEXT_BONUS : SHORT_TEXT_PENALTY;
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
