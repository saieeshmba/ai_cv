import { ResumeData } from "./types";

function section(title: string, body: string): string {
  return body.trim() ? `${title.toUpperCase()}\n${body.trim()}\n` : "";
}

/** Renders structured resume form data as clean, ATS-friendly plain text. */
export function resumeDataToText(data: ResumeData): string {
  const headerLines = [data.full_name, data.job_title].filter(Boolean).join(" — ");
  const contactLine = [data.location, data.email, data.phone, data.linkedin, data.website]
    .filter(Boolean)
    .join(" | ");

  const experienceBody = data.experience
    .map((exp) => {
      const headline = [exp.title, exp.company].filter(Boolean).join(", ");
      const dates = [exp.start_date, exp.end_date].filter(Boolean).join(" - ");
      const meta = [headline, exp.location, dates].filter(Boolean).join(" | ");
      const bullets = exp.bullets
        .filter((b) => b.trim())
        .map((b) => `• ${b.trim()}`)
        .join("\n");
      return [meta, bullets].filter(Boolean).join("\n");
    })
    .filter(Boolean)
    .join("\n\n");

  const educationBody = data.education
    .map((edu) => {
      const headline = [edu.degree, edu.school].filter(Boolean).join(", ");
      const dates = [edu.start_date, edu.end_date].filter(Boolean).join(" - ");
      const meta = [headline, edu.location, dates].filter(Boolean).join(" | ");
      return [meta, edu.details?.trim()].filter(Boolean).join("\n");
    })
    .filter(Boolean)
    .join("\n\n");

  const projectsBody = data.projects
    .map((p) => {
      const headline = [p.name, p.link].filter(Boolean).join(" | ");
      return [headline, p.description?.trim()].filter(Boolean).join("\n");
    })
    .filter(Boolean)
    .join("\n\n");

  const skillsBody = data.skills.filter(Boolean).join(", ");
  const certificationsBody = data.certifications.filter(Boolean).join(", ");

  return [
    headerLines,
    contactLine,
    "",
    section("Summary", data.summary),
    section("Experience", experienceBody),
    section("Education", educationBody),
    section("Skills", skillsBody),
    section("Projects", projectsBody),
    section("Certifications", certificationsBody)
  ]
    .filter((line) => line !== undefined)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function emptyResumeData(): ResumeData {
  return {
    full_name: "",
    job_title: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    website: "",
    summary: "",
    skills: [],
    experience: [
      {
        title: "",
        company: "",
        location: "",
        start_date: "",
        end_date: "",
        bullets: [""]
      }
    ],
    education: [
      {
        degree: "",
        school: "",
        location: "",
        start_date: "",
        end_date: "",
        details: ""
      }
    ],
    projects: [],
    certifications: []
  };
}
