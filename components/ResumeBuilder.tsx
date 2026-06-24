"use client";

import { useMemo, useState } from "react";
import { ResumeData, ResumeExperience, ResumeEducation, ResumeProject } from "@/lib/types";
import { resumeDataToText, emptyResumeData } from "@/lib/resume-text";

type Props = {
  onUseForAts: (resumeText: string) => void;
  onUseForMatch: (resumeText: string) => void;
};

function downloadTextFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export default function ResumeBuilder({ onUseForAts, onUseForMatch }: Props): JSX.Element {
  const [data, setData] = useState<ResumeData>(emptyResumeData());
  const [enhancingKey, setEnhancingKey] = useState<string | null>(null);
  const [enhanceError, setEnhanceError] = useState("");

  const resumeText = useMemo(() => resumeDataToText(data), [data]);

  function updateField<K extends keyof ResumeData>(key: K, value: ResumeData[K]): void {
    setData((current) => ({ ...current, [key]: value }));
  }

  function updateExperience(index: number, patch: Partial<ResumeExperience>): void {
    setData((current) => {
      const experience = [...current.experience];
      experience[index] = { ...experience[index], ...patch };
      return { ...current, experience };
    });
  }

  function updateEducation(index: number, patch: Partial<ResumeEducation>): void {
    setData((current) => {
      const education = [...current.education];
      education[index] = { ...education[index], ...patch };
      return { ...current, education };
    });
  }

  function updateProject(index: number, patch: Partial<ResumeProject>): void {
    setData((current) => {
      const projects = [...current.projects];
      projects[index] = { ...projects[index], ...patch };
      return { ...current, projects };
    });
  }

  function addExperience(): void {
    setData((current) => ({
      ...current,
      experience: [
        ...current.experience,
        { title: "", company: "", location: "", start_date: "", end_date: "", bullets: [""] }
      ]
    }));
  }

  function removeExperience(index: number): void {
    setData((current) => ({
      ...current,
      experience: current.experience.filter((_, i) => i !== index)
    }));
  }

  function addBullet(expIndex: number): void {
    setData((current) => {
      const experience = [...current.experience];
      experience[expIndex] = {
        ...experience[expIndex],
        bullets: [...experience[expIndex].bullets, ""]
      };
      return { ...current, experience };
    });
  }

  function updateBullet(expIndex: number, bulletIndex: number, value: string): void {
    setData((current) => {
      const experience = [...current.experience];
      const bullets = [...experience[expIndex].bullets];
      bullets[bulletIndex] = value;
      experience[expIndex] = { ...experience[expIndex], bullets };
      return { ...current, experience };
    });
  }

  function removeBullet(expIndex: number, bulletIndex: number): void {
    setData((current) => {
      const experience = [...current.experience];
      experience[expIndex] = {
        ...experience[expIndex],
        bullets: experience[expIndex].bullets.filter((_, i) => i !== bulletIndex)
      };
      return { ...current, experience };
    });
  }

  function addEducation(): void {
    setData((current) => ({
      ...current,
      education: [
        ...current.education,
        { degree: "", school: "", location: "", start_date: "", end_date: "", details: "" }
      ]
    }));
  }

  function removeEducation(index: number): void {
    setData((current) => ({
      ...current,
      education: current.education.filter((_, i) => i !== index)
    }));
  }

  function addProject(): void {
    setData((current) => ({
      ...current,
      projects: [...current.projects, { name: "", description: "", link: "" }]
    }));
  }

  function removeProject(index: number): void {
    setData((current) => ({
      ...current,
      projects: current.projects.filter((_, i) => i !== index)
    }));
  }

  async function enhanceText(
    key: string,
    section: "summary" | "bullet",
    text: string,
    onSuccess: (improved: string) => void
  ): Promise<void> {
    if (!text.trim()) {
      setEnhanceError("Write something first, then enhance it with AI.");
      return;
    }
    setEnhanceError("");
    setEnhancingKey(key);
    try {
      const response = await fetch("/api/resume/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, text, job_title: data.job_title })
      });
      const result = await response.json();
      if (!response.ok || result.error) {
        throw new Error(result.error || "Enhancement failed.");
      }
      onSuccess(result.improved_text as string);
    } catch (error) {
      setEnhanceError(error instanceof Error ? error.message : "Enhancement failed.");
    } finally {
      setEnhancingKey(null);
    }
  }

  function handlePrint(): void {
    window.print();
  }

  function handleDownloadTxt(): void {
    const filename = `${(data.full_name || "resume").replace(/\s+/g, "_").toLowerCase()}.txt`;
    downloadTextFile(filename, resumeText);
  }

  return (
    <article className="card resume-builder">
      <h2>Resume Builder</h2>
      <p className="muted">
        Fill in your details, optionally enhance any text with AI, then preview and export.
      </p>

      <div className="resume-builder-grid">
        <div className="stack resume-form">
          <fieldset className="form-fieldset">
            <legend>Contact</legend>
            <div className="form-row">
              <input
                placeholder="Full name"
                value={data.full_name}
                onChange={(e) => updateField("full_name", e.target.value)}
              />
              <input
                placeholder="Target job title (e.g. Frontend Engineer)"
                value={data.job_title}
                onChange={(e) => updateField("job_title", e.target.value)}
              />
            </div>
            <div className="form-row">
              <input
                placeholder="Email"
                value={data.email}
                onChange={(e) => updateField("email", e.target.value)}
              />
              <input
                placeholder="Phone"
                value={data.phone}
                onChange={(e) => updateField("phone", e.target.value)}
              />
            </div>
            <div className="form-row">
              <input
                placeholder="Location (City, Country)"
                value={data.location}
                onChange={(e) => updateField("location", e.target.value)}
              />
              <input
                placeholder="LinkedIn URL"
                value={data.linkedin}
                onChange={(e) => updateField("linkedin", e.target.value)}
              />
            </div>
            <input
              placeholder="Website / Portfolio URL"
              value={data.website}
              onChange={(e) => updateField("website", e.target.value)}
            />
          </fieldset>

          <fieldset className="form-fieldset">
            <legend>Summary</legend>
            <textarea
              rows={3}
              placeholder="2-3 sentences pitching your experience and strengths."
              value={data.summary}
              onChange={(e) => updateField("summary", e.target.value)}
            />
            <button
              type="button"
              className="secondary-btn"
              disabled={enhancingKey === "summary"}
              onClick={() =>
                enhanceText("summary", "summary", data.summary, (improved) =>
                  updateField("summary", improved)
                )
              }
            >
              {enhancingKey === "summary" ? "Enhancing..." : "✨ Enhance with AI"}
            </button>
          </fieldset>

          <fieldset className="form-fieldset">
            <legend>Skills</legend>
            <input
              placeholder="Comma-separated, e.g. React, TypeScript, SQL, Agile"
              value={data.skills.join(", ")}
              onChange={(e) =>
                updateField(
                  "skills",
                  e.target.value.split(",").map((s) => s.trim()).filter((s, i, arr) =>
                    s.length > 0 || i === arr.length - 1
                  )
                )
              }
            />
          </fieldset>

          <fieldset className="form-fieldset">
            <legend>Experience</legend>
            {data.experience.map((exp, expIndex) => (
              <div className="repeatable-block" key={expIndex}>
                <div className="form-row">
                  <input
                    placeholder="Job title"
                    value={exp.title}
                    onChange={(e) => updateExperience(expIndex, { title: e.target.value })}
                  />
                  <input
                    placeholder="Company"
                    value={exp.company}
                    onChange={(e) => updateExperience(expIndex, { company: e.target.value })}
                  />
                </div>
                <div className="form-row">
                  <input
                    placeholder="Location"
                    value={exp.location}
                    onChange={(e) => updateExperience(expIndex, { location: e.target.value })}
                  />
                  <input
                    placeholder="Start date"
                    value={exp.start_date}
                    onChange={(e) => updateExperience(expIndex, { start_date: e.target.value })}
                  />
                  <input
                    placeholder="End date (or Present)"
                    value={exp.end_date}
                    onChange={(e) => updateExperience(expIndex, { end_date: e.target.value })}
                  />
                </div>

                {exp.bullets.map((bullet, bulletIndex) => {
                  const key = `bullet-${expIndex}-${bulletIndex}`;
                  return (
                    <div className="bullet-row" key={bulletIndex}>
                      <textarea
                        rows={2}
                        placeholder="Led migration to TypeScript, reducing runtime bugs by 30%"
                        value={bullet}
                        onChange={(e) => updateBullet(expIndex, bulletIndex, e.target.value)}
                      />
                      <div className="bullet-actions">
                        <button
                          type="button"
                          className="secondary-btn small"
                          disabled={enhancingKey === key}
                          onClick={() =>
                            enhanceText(key, "bullet", bullet, (improved) =>
                              updateBullet(expIndex, bulletIndex, improved)
                            )
                          }
                        >
                          {enhancingKey === key ? "..." : "✨ Enhance"}
                        </button>
                        <button
                          type="button"
                          className="danger-btn small"
                          onClick={() => removeBullet(expIndex, bulletIndex)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
                <div className="form-row">
                  <button type="button" className="secondary-btn small" onClick={() => addBullet(expIndex)}>
                    + Add bullet
                  </button>
                  <button
                    type="button"
                    className="danger-btn small"
                    onClick={() => removeExperience(expIndex)}
                  >
                    Remove this job
                  </button>
                </div>
                <hr className="divider" />
              </div>
            ))}
            <button type="button" className="secondary-btn" onClick={addExperience}>
              + Add experience
            </button>
          </fieldset>

          <fieldset className="form-fieldset">
            <legend>Education</legend>
            {data.education.map((edu, eduIndex) => (
              <div className="repeatable-block" key={eduIndex}>
                <div className="form-row">
                  <input
                    placeholder="Degree"
                    value={edu.degree}
                    onChange={(e) => updateEducation(eduIndex, { degree: e.target.value })}
                  />
                  <input
                    placeholder="School"
                    value={edu.school}
                    onChange={(e) => updateEducation(eduIndex, { school: e.target.value })}
                  />
                </div>
                <div className="form-row">
                  <input
                    placeholder="Location"
                    value={edu.location}
                    onChange={(e) => updateEducation(eduIndex, { location: e.target.value })}
                  />
                  <input
                    placeholder="Start date"
                    value={edu.start_date}
                    onChange={(e) => updateEducation(eduIndex, { start_date: e.target.value })}
                  />
                  <input
                    placeholder="End date"
                    value={edu.end_date}
                    onChange={(e) => updateEducation(eduIndex, { end_date: e.target.value })}
                  />
                </div>
                <input
                  placeholder="Details (GPA, honors, relevant coursework)"
                  value={edu.details}
                  onChange={(e) => updateEducation(eduIndex, { details: e.target.value })}
                />
                <button
                  type="button"
                  className="danger-btn small"
                  onClick={() => removeEducation(eduIndex)}
                >
                  Remove
                </button>
                <hr className="divider" />
              </div>
            ))}
            <button type="button" className="secondary-btn" onClick={addEducation}>
              + Add education
            </button>
          </fieldset>

          <fieldset className="form-fieldset">
            <legend>Projects (optional)</legend>
            {data.projects.map((proj, projIndex) => (
              <div className="repeatable-block" key={projIndex}>
                <div className="form-row">
                  <input
                    placeholder="Project name"
                    value={proj.name}
                    onChange={(e) => updateProject(projIndex, { name: e.target.value })}
                  />
                  <input
                    placeholder="Link (optional)"
                    value={proj.link}
                    onChange={(e) => updateProject(projIndex, { link: e.target.value })}
                  />
                </div>
                <textarea
                  rows={2}
                  placeholder="Brief description and impact"
                  value={proj.description}
                  onChange={(e) => updateProject(projIndex, { description: e.target.value })}
                />
                <button
                  type="button"
                  className="danger-btn small"
                  onClick={() => removeProject(projIndex)}
                >
                  Remove
                </button>
                <hr className="divider" />
              </div>
            ))}
            <button type="button" className="secondary-btn" onClick={addProject}>
              + Add project
            </button>
          </fieldset>

          <fieldset className="form-fieldset">
            <legend>Certifications</legend>
            <input
              placeholder="Comma-separated, e.g. AWS Certified Developer, PMP"
              value={data.certifications.join(", ")}
              onChange={(e) =>
                updateField(
                  "certifications",
                  e.target.value.split(",").map((s) => s.trim()).filter((s, i, arr) =>
                    s.length > 0 || i === arr.length - 1
                  )
                )
              }
            />
          </fieldset>

          {enhanceError ? <p className="error">{enhanceError}</p> : null}
        </div>

        <div className="resume-preview-pane">
          <div className="preview-actions no-print">
            <button type="button" onClick={handlePrint}>
              Download PDF
            </button>
            <button type="button" className="secondary-btn" onClick={handleDownloadTxt}>
              Download .txt
            </button>
            <button
              type="button"
              className="secondary-btn"
              onClick={() => onUseForAts(resumeText)}
            >
              Check ATS Score →
            </button>
            <button
              type="button"
              className="secondary-btn"
              onClick={() => onUseForMatch(resumeText)}
            >
              Match to a Job →
            </button>
          </div>
          <div id="resume-print-area" className="resume-preview">
            <header className="resume-preview-header">
              <h3>{data.full_name || "Your Name"}</h3>
              {data.job_title ? <p className="resume-job-title">{data.job_title}</p> : null}
              <p className="resume-contact">
                {[data.location, data.email, data.phone, data.linkedin, data.website]
                  .filter(Boolean)
                  .join("  •  ")}
              </p>
            </header>

            {data.summary ? (
              <section>
                <h4>Summary</h4>
                <p>{data.summary}</p>
              </section>
            ) : null}

            {data.experience.some((e) => e.title || e.company) ? (
              <section>
                <h4>Experience</h4>
                {data.experience.map((exp, i) => (
                  <div className="resume-entry" key={i}>
                    <div className="resume-entry-head">
                      <strong>
                        {exp.title}
                        {exp.title && exp.company ? ", " : ""}
                        {exp.company}
                      </strong>
                      <span>
                        {[exp.start_date, exp.end_date].filter(Boolean).join(" – ")}
                      </span>
                    </div>
                    {exp.location ? <p className="resume-entry-sub">{exp.location}</p> : null}
                    <ul>
                      {exp.bullets.filter((b) => b.trim()).map((b, bi) => (
                        <li key={bi}>{b}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </section>
            ) : null}

            {data.education.some((e) => e.degree || e.school) ? (
              <section>
                <h4>Education</h4>
                {data.education.map((edu, i) => (
                  <div className="resume-entry" key={i}>
                    <div className="resume-entry-head">
                      <strong>
                        {edu.degree}
                        {edu.degree && edu.school ? ", " : ""}
                        {edu.school}
                      </strong>
                      <span>{[edu.start_date, edu.end_date].filter(Boolean).join(" – ")}</span>
                    </div>
                    {edu.details ? <p className="resume-entry-sub">{edu.details}</p> : null}
                  </div>
                ))}
              </section>
            ) : null}

            {data.skills.filter(Boolean).length > 0 ? (
              <section>
                <h4>Skills</h4>
                <p>{data.skills.filter(Boolean).join(" · ")}</p>
              </section>
            ) : null}

            {data.projects.some((p) => p.name) ? (
              <section>
                <h4>Projects</h4>
                {data.projects.map((p, i) => (
                  <div className="resume-entry" key={i}>
                    <div className="resume-entry-head">
                      <strong>{p.name}</strong>
                      {p.link ? <span>{p.link}</span> : null}
                    </div>
                    {p.description ? <p className="resume-entry-sub">{p.description}</p> : null}
                  </div>
                ))}
              </section>
            ) : null}

            {data.certifications.filter(Boolean).length > 0 ? (
              <section>
                <h4>Certifications</h4>
                <p>{data.certifications.filter(Boolean).join(" · ")}</p>
              </section>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
