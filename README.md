# AI Career Toolkit (Groq Cloud)

A production-ready Next.js app that provides:

- conversational Q&A (Groq Cloud API),
- seminar intent detection with structured seminar details,
- file upload analysis with estimated AI-usage percentage,
- **a resume builder** with live preview, AI-assisted writing, and PDF/TXT export,
- **an ATS score checker** that scores a resume against common ATS-parsing patterns,
- **a resume ↔ job description matcher** that scores keyword overlap and suggests improvements.

The UI is organized into tabs — Chat Assistant, AI Usage Estimator, Resume Builder, ATS Score
Checker, and Match to Job — all in the same app.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create environment variables:

```bash
cp .env.example .env
```

Set:

- `GROQ_API_KEY`: your Groq Cloud API key (server-side only).
- `GROQ_MODEL`: model name (default: `llama-3.3-70b-versatile`).

> `GROQ_API_KEY` is optional for the Resume Builder, ATS Checker, and Job Matcher — their core
> scoring is heuristic and works without it. Without a key, the "✨ Enhance with AI" button and the
> extra AI-generated tips/suggestions will be unavailable (the app degrades gracefully and still
> returns the heuristic results).

## Run

```bash
npm run dev
```

Then open `http://localhost:3000`.

Build/start for production:

```bash
npm run build
npm run start
```

## API Endpoints

### Existing

- `POST /api/chat`
  - Input: `{ prompt, messages }`
  - Detects intent: `general_qa | seminar_details | document_analysis`
  - For `seminar_details`, returns structured fields with `unknown` when missing.

- `POST /api/analyze`
  - Multipart form-data with `file`
  - Supported types: TXT, PDF, DOCX (max 5MB)
  - Returns: `estimated_ai_percentage`, `estimated_human_percentage`, `confidence`, `rationale`,
    `flagged_segments`.

### New: Resume Builder, ATS Checker, Job Matcher

- `POST /api/resume/enhance`
  - JSON body: `{ section: "summary" | "bullet", text: string, job_title?: string }`
  - Uses Groq to rewrite a resume summary or bullet point (strong verbs, no first-person pronouns).
  - Returns: `{ improved_text }`. Requires `GROQ_API_KEY`.

- `POST /api/resume/ats-score`
  - Multipart form-data with either `file` (TXT/PDF/DOCX, max 5MB) or a `resume_text` field.
  - Returns: `{ score, grade, word_count, checks[], strengths[], improvements[], ai_tips[] }`.
  - `score` (0-100) is a weighted heuristic across 11 checks: contact info, summary/experience/
    education/skills sections, bullet usage, action verbs, quantified achievements, length, and
    avoiding first-person pronouns. `ai_tips` is populated only if `GROQ_API_KEY` is set.

- `POST /api/resume/match`
  - Multipart form-data with `resume_file` or `resume_text`, and `job_description` (or
    `job_description_file`).
  - Returns: `{ match_score, matched_keywords[], missing_keywords[], improvement_suggestions[], summary }`.
  - Keywords are ranked from the job description (frequency + "required/must have" cue boosting)
    and checked against the resume text. `improvement_suggestions` are AI-generated when
    `GROQ_API_KEY` is set, otherwise a templated fallback is used.

## Security and reliability

- Groq API key is used only on server endpoints.
- Input/file validation is enforced (file type, file size, required fields).
- Errors return safe, user-friendly messages.
- All three new resume features have a heuristic fallback and never hard-fail just because
  `GROQ_API_KEY` is missing or a Groq request errors out.

## Estimate/score limitations

The AI usage percentage, ATS score, and job-match score are heuristic estimates, not ground truth
from any real ATS vendor or AI-detection product. They can produce false positives/negatives and
should be used as advisory signals only.

