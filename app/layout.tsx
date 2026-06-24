import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Career Toolkit",
  description:
    "Groq-powered chat, seminar intent detection, AI usage estimation, resume builder, ATS score checker, and job-match analyzer."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
