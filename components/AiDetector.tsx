"use client";

import { FormEvent, useState } from "react";
import { AiEstimate } from "@/lib/types";

type AnalyzeResponse = {
  error?: string;
  filename: string;
  extracted_characters: number;
  estimate: AiEstimate;
};

export default function AiDetector(): JSX.Element {
  const [file, setFile] = useState<File | null>(null);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);

  async function handleAnalyze(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!file || analyzeLoading) return;

    setAnalyzeLoading(true);
    setAnalysisError("");
    setAnalysis(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData
      });
      const data = (await response.json()) as AnalyzeResponse;
      if (!response.ok || data.error) {
        throw new Error(data.error || "File analysis failed.");
      }
      setAnalysis(data);
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setAnalyzeLoading(false);
    }
  }

  return (
    <article className="card">
      <h2>File AI Usage Estimator</h2>
      <form onSubmit={handleAnalyze} className="stack">
        <input
          type="file"
          aria-label="Upload file"
          accept=".txt,.pdf,.docx,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
        <button type="submit" disabled={!file || analyzeLoading}>
          {analyzeLoading ? "Analyzing..." : "Analyze file"}
        </button>
      </form>

      {analysisError ? <p className="error">{analysisError}</p> : null}
      {!analysis && !analysisError ? (
        <p className="muted">Upload TXT, PDF, or DOCX to estimate AI usage.</p>
      ) : null}

      {analysis ? (
        <div className="analysis">
          <p>
            <strong>File:</strong> {analysis.filename}
          </p>
          <p>
            <strong>Extracted characters:</strong> {analysis.extracted_characters}
          </p>
          <p>
            <strong>Estimated AI %:</strong> {analysis.estimate.estimated_ai_percentage}
          </p>
          <p>
            <strong>Estimated Human %:</strong> {analysis.estimate.estimated_human_percentage}
          </p>
          <p>
            <strong>Confidence:</strong> {analysis.estimate.confidence}
          </p>
          <p>
            <strong>Rationale:</strong> {analysis.estimate.rationale}
          </p>
          {analysis.estimate.flagged_segments.length > 0 ? (
            <div>
              <strong>Flagged segments (sample):</strong>
              <ul>
                {analysis.estimate.flagged_segments.map((segment, index) => (
                  <li key={index}>{segment}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <p className="muted">
            Note: AI percentages are estimates and should not be treated as absolute truth.
          </p>
        </div>
      ) : null}
    </article>
  );
}
