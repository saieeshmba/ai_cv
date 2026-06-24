import { JobMatchResult } from "./types";
import { rankKeywords, textContainsTerm } from "./keywords";

const MAX_KEYWORDS = 25;

export function matchResumeToJob(resumeText: string, jobDescription: string): JobMatchResult {
  const ranked = rankKeywords(jobDescription, MAX_KEYWORDS);

  const matched: string[] = [];
  const missing: string[] = [];

  for (const { term } of ranked) {
    if (textContainsTerm(resumeText, term)) {
      matched.push(term);
    } else {
      missing.push(term);
    }
  }

  const total = matched.length + missing.length;
  const matchScore = total > 0 ? Math.round((matched.length / total) * 100) : 0;

  const improvementSuggestions = buildFallbackSuggestions(missing);

  const summary =
    total === 0
      ? "Couldn't extract meaningful keywords from the job description. Try pasting the full posting, including the requirements/qualifications section."
      : `Your resume matches ${matched.length} of ${total} key terms from this job description (${matchScore}%). Focus on weaving the missing terms below into your experience and skills sections where truthful.`;

  return {
    match_score: matchScore,
    matched_keywords: matched.slice(0, 20),
    missing_keywords: missing.slice(0, 20),
    improvement_suggestions: improvementSuggestions,
    summary
  };
}

function buildFallbackSuggestions(missingKeywords: string[]): string[] {
  if (missingKeywords.length === 0) {
    return [
      "Great coverage — your resume already reflects most of the key terms in this job description.",
      "Consider quantifying your achievements further (numbers, %, $) to stand out among similarly-matched candidates."
    ];
  }

  const top = missingKeywords.slice(0, 8);
  return top.map(
    (term) =>
      `Add a line that genuinely reflects experience with "${term}" — e.g. mention it in your Skills section, or rework a bullet point such as "Used ${term} to accomplish [a real result]" if it applies to your background.`
  );
}
