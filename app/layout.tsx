import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Generator Dashboard",
  description: "Groq-powered chat, seminar intent detection, and AI usage estimation."
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
