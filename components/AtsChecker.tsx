"use client";

import { FormEvent, useEffect, useState } from "react";
import { AtsScoreResult } from "@/lib/types";

type Props = {
  initialText?: string;
};

type AtsResponse = AtsScoreResult & { error?: string; filename?: string };

export default function AtsChecker({ initialText = "" }: Props): JSX.Element {
  const [file, setFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState(initialText);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AtsResponse | null>(null);

  useEffect(() => {
    if (initialText) {
      setResumeText(initialText);
      setFile(null);
      setResult(null);
    }
  }, [initialText]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (loading) return;
    if (!file && !resumeText.trim()) {
      setError("Upload a resume file or paste your resume text.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      if (file) formData.append("file", file);
      if (resumeText.trim()) formData.append("resume_text", resumeText.trim());

      const response = await fetch("/api/resume/ats-score", {
        method: "POST",
        body: formData
      });
      const data = (await response.json()) as AtsResponse;
      if (!response.ok || data.error) {
        throw new Error(data.error || "ATS scoring failed.");
      }
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ATS scoring failed.");
    } finally {
      setLoading(false);
    }
  }

  const scoreColorClass =
    result && result.score >= 70 ? "score-good" : result && result.score >= 45 ? "score-mid" : "score-low";

  return (
    <article className="card">
      <h2>ATS Score Checker</h2>
      <p className="muted">
        Upload a resume (TXT, PDF, or DOCX) or paste its text to see how well it would survive an
        Applicant Tracking System scan.
      </p>

      <form onSubmit={handleSubmit} className="stack">
        <input
          type="file"
          aria-label="Upload resume"
          accept=".txt,.pdf,.docx,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
        <p className="muted small">— or —</p>
        <textarea
          rows={6}
          placeholder="Paste your resume text here"
          value={resumeText}
          onChange={(event) => setResumeText(event.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Scoring..." : "Check ATS Score"}
        </button>
      </form>

      {error ? <p className="error">{error}</p> : null}

      {result ? (
        <div className="analysis">
          <div className={`ats-score-display ${scoreColorClass}`}>
            <span className="ats-score-number">{result.score}</span>
            <span className="ats-score-grade">{result.grade}</span>
          </div>
          <p className="muted">
            {result.word_count} words analyzed{result.filename ? ` from "${result.filename}"` : ""}.
          </p>

          <h3>Checklist</h3>
          <ul className="ats-checklist">
            {result.checks.map((check) => (
              <li key={check.id} className={check.passed ? "check-pass" : "check-fail"}>
                <span className="check-icon">{check.passed ? "✓" : "✕"}</span>
                <div>
                  <strong>{check.label}</strong>
                  <p>{check.detail}</p>
                </div>
              </li>
            ))}
          </ul>

          {result.ai_tips.length > 0 ? (
            <>
              <h3>AI Tips</h3>
              <ul>
                {result.ai_tips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </>
          ) : null}

          <p className="muted">
            Note: this is a heuristic estimate based on common ATS parsing patterns, not an official
            score from any specific vendor&apos;s ATS software.
          </p>
        </div>
      ) : null}
    </article>
  );
}
