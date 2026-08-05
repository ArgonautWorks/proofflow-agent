import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ProofFlow Agent — Submission compliance, autonomously",
  description: "Gemini-powered evidence mapping for hackathon and grant submissions.",
  metadataBase: new URL("https://proofflow-agent.vercel.app"),
  openGraph: {
    title: "ProofFlow Agent",
    description: "From binding rules to judge-ready proof — while you build.",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
