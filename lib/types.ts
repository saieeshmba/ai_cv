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

/* ---------------------------------------------------------------------- */
/* Resume Builder                                                          */
/* ---------------------------------------------------------------------- */

export type ResumeExperience = {
  title: string;
  company: string;
  location: string;
  start_date: string;
  end_date: string;
  bullets: string[];
};

export type ResumeEducation = {
  degree: string;
  school: string;
  location: string;
  start_date: string;
  end_date: string;
  details: string;
};

export type ResumeProject = {
  name: string;
  description: string;
  link: string;
};

export type ResumeData = {
  full_name: string;
  job_title: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  website: string;
  summary: string;
  skills: string[];
  experience: ResumeExperience[];
  education: ResumeEducation[];
  projects: ResumeProject[];
  certifications: string[];
};

export type EnhanceSection = "summary" | "bullet";

/* ---------------------------------------------------------------------- */
/* ATS Score Checker                                                       */
/* ---------------------------------------------------------------------- */

export type AtsCheckItem = {
  id: string;
  label: string;
  passed: boolean;
  weight: number;
  detail: string;
};

export type AtsGrade = "Excellent" | "Good" | "Fair" | "Needs Work" | "Poor";

export type AtsScoreResult = {
  score: number;
  grade: AtsGrade;
  word_count: number;
  checks: AtsCheckItem[];
  strengths: string[];
  improvements: string[];
  ai_tips: string[];
};

/* ---------------------------------------------------------------------- */
/* Resume <-> Job Description Matcher                                      */
/* ---------------------------------------------------------------------- */

export type JobMatchResult = {
  match_score: number;
  matched_keywords: string[];
  missing_keywords: string[];
  improvement_suggestions: string[];
  summary: string;
};
