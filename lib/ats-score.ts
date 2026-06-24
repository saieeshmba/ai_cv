import { AtsCheckItem, AtsGrade, AtsScoreResult } from "./types";
import { wordCount } from "./keywords";

const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_PATTERN = /(\+?\d{1,3}[\s.-]?)?(\(?\d{2,4}\)?[\s.-]?)?\d{3}[\s.-]?\d{3,4}/;
const BULLET_PATTERN = /(^|\n)\s*[•\-*▪◦‣·]\s+\S/;
const FIRST_PERSON_PATTERN = /\b(i|i'm|i've|my|myself)\b/i;

const SECTION_PATTERNS: Record<string, RegExp> = {
  summary: /\b(summary|professional summary|profile|objective|about me)\b/i,
  experience: /\b(experience|employment history|work history|professional experience)\b/i,
  education: /\b(education|academic background|qualifications)\b/i,
  skills: /\b(skills|technical skills|core competencies|key skills)\b/i
};

const ACTION_VERBS = [
  "achieved", "administered", "analyzed", "built", "collaborated", "created",
  "delivered", "designed", "developed", "directed", "drove", "engineered",
  "established", "executed", "generated", "implemented", "improved",
  "increased", "initiated", "launched", "led", "managed", "negotiated",
  "optimized", "organized", "oversaw", "planned", "produced", "reduced",
  "resolved", "spearheaded", "streamlined", "supervised", "trained"
];

function hasQuantifiedAchievement(text: string): boolean {
  return /\b\d+(\.\d+)?\s?(%|percent|x|k|m|million|billion|hours?|days?|weeks?|months?|years?|\$|usd|users?|customers?|clients?|projects?|people)\b/i.test(
    text
  ) || /\$\s?\d/.test(text);
}

function countActionVerbBullets(lines: string[]): number {
  let count = 0;
  for (const line of lines) {
    const trimmed = line.replace(/^[•\-*▪◦‣·\s]+/, "").trim();
    const firstWord = trimmed.split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, "");
    if (firstWord && ACTION_VERBS.includes(firstWord)) {
      count += 1;
    }
  }
  return count;
}

function gradeFor(score: number): AtsGrade {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Fair";
  if (score >= 30) return "Needs Work";
  return "Poor";
}

export function scoreResumeText(rawText: string): AtsScoreResult {
  const text = rawText.replace(/\r/g, "");
  const lines = text.split(/\n+/).filter((line) => line.trim().length > 0);
  const words = wordCount(text);

  const hasEmail = EMAIL_PATTERN.test(text);
  const hasPhone = PHONE_PATTERN.test(text);
  const hasSummary = SECTION_PATTERNS.summary.test(text);
  const hasExperience = SECTION_PATTERNS.experience.test(text);
  const hasEducation = SECTION_PATTERNS.education.test(text);
  const hasSkills = SECTION_PATTERNS.skills.test(text);
  const usesBullets = BULLET_PATTERN.test(`\n${text}`);
  const actionVerbBullets = countActionVerbBullets(lines);
  const usesActionVerbs = actionVerbBullets >= 2;
  const usesQuantifiedAchievements = hasQuantifiedAchievement(text);
  const appropriateLength = words >= 200 && words <= 950;
  const avoidsFirstPerson = !FIRST_PERSON_PATTERN.test(text);

  const checks: AtsCheckItem[] = [
    {
      id: "email",
      label: "Email address present",
      passed: hasEmail,
      weight: 8,
      detail: hasEmail
        ? "An email address was found near the top of the document."
        : "Add a professional email address so recruiters and ATS software can contact you."
    },
    {
      id: "phone",
      label: "Phone number present",
      passed: hasPhone,
      weight: 7,
      detail: hasPhone
        ? "A phone number was detected."
        : "Add a phone number to your contact section."
    },
    {
      id: "summary",
      label: "Summary / objective section",
      passed: hasSummary,
      weight: 10,
      detail: hasSummary
        ? "A summary or objective section was found."
        : "Add a short 'Summary' or 'Professional Summary' section near the top with 2-3 lines pitching your experience."
    },
    {
      id: "experience",
      label: "Work experience section",
      passed: hasExperience,
      weight: 15,
      detail: hasExperience
        ? "A clearly labeled experience section was found."
        : "Add a clearly labeled 'Experience' or 'Work Experience' section header — ATS parsers look for it explicitly."
    },
    {
      id: "education",
      label: "Education section",
      passed: hasEducation,
      weight: 10,
      detail: hasEducation
        ? "An education section was found."
        : "Add an 'Education' section, even if brief."
    },
    {
      id: "skills",
      label: "Skills section",
      passed: hasSkills,
      weight: 10,
      detail: hasSkills
        ? "A skills section was found."
        : "Add a 'Skills' section listing relevant tools, technologies, and competencies — ATS systems scan this heavily."
    },
    {
      id: "bullets",
      label: "Uses bullet points for achievements",
      passed: usesBullets,
      weight: 10,
      detail: usesBullets
        ? "Bullet points were detected, which is good for ATS parsing and readability."
        : "Use bullet points (•) for experience achievements instead of paragraphs."
    },
    {
      id: "action_verbs",
      label: "Bullets start with strong action verbs",
      passed: usesActionVerbs,
      weight: 10,
      detail: usesActionVerbs
        ? `Found ${actionVerbBullets} bullet(s) starting with strong action verbs (e.g. "Led", "Built", "Increased").`
        : "Start bullet points with strong action verbs like 'Led', 'Built', 'Increased', or 'Designed' instead of 'Responsible for'."
    },
    {
      id: "quantified",
      label: "Quantified achievements (numbers/%/$)",
      passed: usesQuantifiedAchievements,
      weight: 10,
      detail: usesQuantifiedAchievements
        ? "Found measurable results (numbers, percentages, or dollar amounts) — this is a strong signal to recruiters."
        : "Add measurable results where possible, e.g. 'Increased conversion by 18%' or 'Managed a $200K budget'."
    },
    {
      id: "length",
      label: "Appropriate length (~200-950 words)",
      passed: appropriateLength,
      weight: 5,
      detail: appropriateLength
        ? `Word count (${words}) is in a healthy range for a 1-2 page resume.`
        : words < 200
        ? `Resume looks short (${words} words). Add more detail to your experience and skills.`
        : `Resume looks long (${words} words). Trim it down to the most relevant 1-2 pages.`
    },
    {
      id: "first_person",
      label: "Avoids first-person pronouns",
      passed: avoidsFirstPerson,
      weight: 5,
      detail: avoidsFirstPerson
        ? "No first-person pronouns detected — good, resumes should read in implied first person without 'I/my'."
        : "Remove first-person pronouns like 'I' or 'my' — resume bullets should start directly with the action verb."
    }
  ];

  const score = Math.round(
    checks.reduce((acc, check) => acc + (check.passed ? check.weight : 0), 0)
  );

  const strengths = checks.filter((c) => c.passed).map((c) => c.detail);
  const improvements = checks.filter((c) => !c.passed).map((c) => c.detail);

  return {
    score,
    grade: gradeFor(score),
    word_count: words,
    checks,
    strengths,
    improvements,
    ai_tips: []
  };
}
