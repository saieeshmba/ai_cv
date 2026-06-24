"use client";

import { useState } from "react";
import ChatAssistant from "@/components/ChatAssistant";
import AiDetector from "@/components/AiDetector";
import ResumeBuilder from "@/components/ResumeBuilder";
import AtsChecker from "@/components/AtsChecker";
import JobMatcher from "@/components/JobMatcher";

type TabId = "chat" | "detector" | "builder" | "ats" | "match";

const TABS: { id: TabId; label: string }[] = [
  { id: "chat", label: "Chat Assistant" },
  { id: "detector", label: "AI Usage Estimator" },
  { id: "builder", label: "Resume Builder" },
  { id: "ats", label: "ATS Score Checker" },
  { id: "match", label: "Match to Job" }
];

export default function Home(): JSX.Element {
  const [activeTab, setActiveTab] = useState<TabId>("builder");
  const [sharedResumeText, setSharedResumeText] = useState("");
  const [atsSeed, setAtsSeed] = useState(0);
  const [matchSeed, setMatchSeed] = useState(0);

  function sendToAts(text: string): void {
    setSharedResumeText(text);
    setAtsSeed((n) => n + 1);
    setActiveTab("ats");
  }

  function sendToMatch(text: string): void {
    setSharedResumeText(text);
    setMatchSeed((n) => n + 1);
    setActiveTab("match");
  }

  return (
    <main className="container">
      <header className="header">
        <h1>AI Career Toolkit</h1>
        <p>
          Groq-powered chat + seminar detection + AI usage estimation, plus a resume builder, ATS
          score checker, and job-match analyzer.
        </p>
      </header>

      <nav className="tabs no-print" aria-label="Feature tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`tab-btn ${activeTab === tab.id ? "tab-active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <section className={activeTab === "chat" ? "tab-panel" : "tab-panel hidden"}>
        <ChatAssistant />
      </section>

      <section className={activeTab === "detector" ? "tab-panel" : "tab-panel hidden"}>
        <AiDetector />
      </section>

      <section className={activeTab === "builder" ? "tab-panel" : "tab-panel hidden"}>
        <ResumeBuilder onUseForAts={sendToAts} onUseForMatch={sendToMatch} />
      </section>

      <section className={activeTab === "ats" ? "tab-panel" : "tab-panel hidden"}>
        <AtsChecker key={atsSeed} initialText={sharedResumeText} />
      </section>

      <section className={activeTab === "match" ? "tab-panel" : "tab-panel hidden"}>
        <JobMatcher key={matchSeed} initialResumeText={sharedResumeText} />
      </section>
    </main>
  );
}
