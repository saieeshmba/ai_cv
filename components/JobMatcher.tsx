"use client";

import { FormEvent, useEffect, useState } from "react";
import { JobMatchResult } from "@/lib/types";

type Props = {
  initialResumeText?: string;
};

type MatchResponse = JobMatchResult & { error?: string };

export default function JobMatcher({ initialResumeText = "" }: Props): JSX.Element {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState(initialResumeText);
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<MatchResponse | null>(null);

  useEffect(() => {
    if (initialResumeText) {
      setResumeText(initialResumeText);
      setResumeFile(null);
      setResult(null);
    }
  }, [initialResumeText]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (loading) return;
    if (!resumeFile && !resumeText.trim()) {
      setError("Upload a resume file or paste your resume text.");
      return;
    }
    if (!jobDescription.trim()) {
      setError("Paste the job description to match against.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      if (resumeFile) formData.append("resume_file", resumeFile);
      if (resumeText.trim()) formData.append("resume_text", resumeText.trim());
      formData.append("job_description", jobDescription.trim());

      const response = await fetch("/api/resume/match", {
        method: "POST",
        body: formData
      });
      const data = (await response.json()) as MatchResponse;
      if (!response.ok || data.error) {
        throw new Error(data.error || "Job match failed.");
      }
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Job match failed.");
    } finally {
      setLoading(false);
    }
  }

  const scoreColorClass =
    result && result.match_score >= 70
      ? "score-good"
      : result && result.match_score >= 45
      ? "score-mid"
      : "score-low";

  return (
    <article className="card">
      <h2>Match Resume to Job Description</h2>
      <p className="muted">
        Paste a job description and your resume to see your match score, missing keywords, and how to
        improve your chances.
      </p>

      <form onSubmit={handleSubmit} className="stack">
        <label className="field-label">Your resume</label>
        <input
          type="file"
          aria-label="Upload resume"
          accept=".txt,.pdf,.docx,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={(event) => setResumeFile(event.target.files?.[0] ?? null)}
        />
        <p className="muted small">— or —</p>
        <textarea
          rows={5}
          placeholder="Paste your resume text here"
          value={resumeText}
          onChange={(event) => setResumeText(event.target.value)}
        />

        <label className="field-label">Job description</label>
        <textarea
          rows={6}
          placeholder="Paste the full job description here"
          value={jobDescription}
          onChange={(event) => setJobDescription(event.target.value)}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Matching..." : "Match Resume to Job"}
        </button>
      </form>

      {error ? <p className="error">{error}</p> : null}

      {result ? (
        <div className="analysis">
          <div className={`ats-score-display ${scoreColorClass}`}>
            <span className="ats-score-number">{result.match_score}%</span>
            <span className="ats-score-grade">Match</span>
          </div>
          <p>{result.summary}</p>

          {result.matched_keywords.length > 0 ? (
            <>
              <h3>Matched Keywords</h3>
              <div className="keyword-chips">
                {result.matched_keywords.map((kw) => (
                  <span key={kw} className="chip chip-match">
                    {kw}
                  </span>
                ))}
              </div>
            </>
          ) : null}

          {result.missing_keywords.length > 0 ? (
            <>
              <h3>Missing Keywords</h3>
              <div className="keyword-chips">
                {result.missing_keywords.map((kw) => (
                  <span key={kw} className="chip chip-missing">
                    {kw}
                  </span>
                ))}
              </div>
            </>
          ) : null}

          {result.improvement_suggestions.length > 0 ? (
            <>
              <h3>How to Improve</h3>
              <ul>
                {result.improvement_suggestions.map((suggestion, i) => (
                  <li key={i}>{suggestion}</li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
