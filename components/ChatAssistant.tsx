"use client";

import { FormEvent, useMemo, useState } from "react";
import { SeminarDetails, IntentType } from "@/lib/types";

type ChatResponse = {
  answer?: string;
  error?: string;
  intent?: IntentType;
  seminar_details?: SeminarDetails;
};

type Message = { role: "user" | "assistant"; content: string };

export default function ChatAssistant(): JSX.Element {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState("");
  const [seminarDetails, setSeminarDetails] = useState<SeminarDetails | null>(null);

  const hasMessages = useMemo(() => messages.length > 0, [messages]);

  async function handleChatSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed || chatLoading) return;

    const nextMessages: Message[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setPrompt("");
    setChatError("");
    setChatLoading(true);
    setSeminarDetails(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: trimmed, messages: nextMessages })
      });
      const data = (await response.json()) as ChatResponse;

      if (!response.ok || data.error) {
        throw new Error(data.error || "Unable to get chat response.");
      }

      if (data.seminar_details) {
        setSeminarDetails(data.seminar_details);
      }

      setMessages((current) => [
        ...current,
        { role: "assistant", content: data.answer || "No response provided." }
      ]);
    } catch (error) {
      setChatError(error instanceof Error ? error.message : "Chat request failed.");
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <article className="card">
      <h2>Chat Assistant</h2>
      <form onSubmit={handleChatSubmit} className="stack">
        <textarea
          aria-label="Prompt"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Ask any question… or ask seminar details."
          rows={4}
        />
        <button type="submit" disabled={chatLoading}>
          {chatLoading ? "Thinking..." : "Send"}
        </button>
      </form>

      {chatError ? <p className="error">{chatError}</p> : null}

      <div className="messages" aria-live="polite">
        {!hasMessages ? (
          <p className="muted">No messages yet.</p>
        ) : (
          messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className={`message ${message.role}`}>
              <strong>{message.role === "user" ? "You" : "Assistant"}:</strong>
              <p>{message.content}</p>
            </div>
          ))
        )}
      </div>

      {seminarDetails ? (
        <div className="seminar">
          <h3>Structured Seminar Details</h3>
          <ul>
            <li>
              <strong>Topic/Title:</strong> {seminarDetails.topic_or_title}
            </li>
            <li>
              <strong>Speaker:</strong> {seminarDetails.speaker}
            </li>
            <li>
              <strong>Date/Time:</strong> {seminarDetails.date_time}
            </li>
            <li>
              <strong>Venue:</strong> {seminarDetails.venue}
            </li>
            <li>
              <strong>Agenda/Summary:</strong> {seminarDetails.agenda_or_summary}
            </li>
            <li>
              <strong>Key Takeaways:</strong> {seminarDetails.key_takeaways}
            </li>
          </ul>
        </div>
      ) : null}
    </article>
  );
}
