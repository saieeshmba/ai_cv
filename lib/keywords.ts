// Lightweight, dependency-free text/keyword helpers shared by the ATS
// score checker and the resume <-> job description matcher.

export const STOPWORDS = new Set(
  [
    "a", "an", "the", "and", "or", "but", "if", "then", "else", "of", "to",
    "in", "on", "for", "with", "as", "by", "at", "from", "is", "are", "was",
    "were", "be", "been", "being", "this", "that", "these", "those", "it",
    "its", "we", "you", "your", "our", "their", "they", "he", "she", "his",
    "her", "i", "me", "my", "mine", "us", "them", "will", "would", "can",
    "could", "should", "may", "might", "must", "shall", "do", "does", "did",
    "have", "has", "had", "not", "no", "yes", "so", "than", "too", "very",
    "such", "into", "about", "across", "after", "before", "between", "out",
    "up", "down", "over", "under", "again", "further", "once", "here",
    "there", "when", "where", "why", "how", "all", "any", "both", "each",
    "few", "more", "most", "other", "some", "only", "own", "same", "just",
    "etc", "per", "via", "within", "including", "include", "includes",
    "you'll", "we'll", "job", "role", "position", "company", "team",
    "ability", "looking", "responsibilities", "requirements", "preferred",
    "required", "experience", "years", "work", "working", "candidate",
    "candidates", "applicant", "applicants", "please", "apply", "strong",
    "excellent", "proficiency", "proficient", "familiar", "familiarity",
    "knowledge", "ability", "abilities", "demonstrated", "solid",
    "extensive", "minimum", "bonus", "nice", "skill", "skilled", "must",
    "have", "ideal", "ideally", "plus", "etc."
  ]
);

function cleanWord(word: string): string {
  return word
    .toLowerCase()
    .replace(/[^a-z0-9+#./-]/g, "")
    .replace(/\.+$/, "")
    .replace(/^\.+/, "")
    .trim();
}

export function tokenize(text: string): string[] {
  return text
    .split(/\s+/)
    .map(cleanWord)
    .filter((word) => word.length > 1 && !STOPWORDS.has(word));
}

/** Builds unigrams + meaningful bigrams (e.g. "project management") from raw text. */
export function extractCandidatePhrases(text: string): string[] {
  const rawWords = text
    .replace(/[\u2022\u25CF]/g, " ")
    .split(/\s+/)
    .map((w) => w.replace(/^[^a-zA-Z0-9+#./]+|[^a-zA-Z0-9+#./]+$/g, ""))
    .filter(Boolean);

  const phrases: string[] = [];

  for (let i = 0; i < rawWords.length; i += 1) {
    const word = cleanWord(rawWords[i]);
    if (word.length > 1 && !STOPWORDS.has(word)) {
      phrases.push(word);
    }

    if (i < rawWords.length - 1) {
      const a = cleanWord(rawWords[i]);
      const b = cleanWord(rawWords[i + 1]);
      if (a.length > 1 && b.length > 1 && !STOPWORDS.has(a) && !STOPWORDS.has(b)) {
        phrases.push(`${a} ${b}`);
      }
    }
  }

  return phrases;
}

export type RankedKeyword = { term: string; count: number };

/**
 * Ranks the most relevant keywords/phrases in a job description.
 * Frequency is boosted for terms that appear capitalized in the source text
 * (often technologies, tools, or proper nouns) and for terms that appear
 * near common "requirement" cue words.
 */
export function rankKeywords(text: string, limit = 25): RankedKeyword[] {
  const cueWords = /(required|requirement|must have|proficien|knowledge of|experience with|familiar with|skills?:|expertise)/i;
  const lines = text.split(/\n+/);
  const counts = new Map<string, number>();

  for (const line of lines) {
    const phrases = extractCandidatePhrases(line);
    const boosted = cueWords.test(line);
    for (const phrase of phrases) {
      if (!/[a-z]/i.test(phrase)) continue; // skip terms with no letters (e.g. "5+", "3-5")
      const weight = boosted ? 2 : 1;
      counts.set(phrase, (counts.get(phrase) || 0) + weight);
    }
  }

  return Array.from(counts.entries())
    .map(([term, count]) => ({ term, count }))
    .sort((a, b) => b.count - a.count || a.term.length - b.term.length)
    .slice(0, limit);
}

export function textContainsTerm(text: string, term: string): boolean {
  const haystack = text.toLowerCase();
  if (term.includes(" ")) {
    return haystack.includes(term);
  }
  const pattern = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
  return pattern.test(haystack);
}

export function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}
