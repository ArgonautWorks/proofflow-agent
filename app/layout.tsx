import type { Metadata } from "next";
import {
  SITE_DESCRIPTION,
  SITE_ORIGIN,
  SOFTWARE_APPLICATION_JSON_LD,
} from "@/lib/discovery";
import "./globals.css";

export const metadata: Metadata = {
  title: "ProofFlow Agent — Hackathon submission compliance audit",
  description: SITE_DESCRIPTION,
  metadataBase: new URL(SITE_ORIGIN),
  alternates: { canonical: "/" },
  keywords: [
    "hackathon submission audit",
    "Devpost compliance checklist",
    "grant application evidence",
    "Gemini audit agent",
    "submission evidence ledger",
  ],
  robots: { index: true, follow: true },
  openGraph: {
    title: "ProofFlow Agent — Judge-ready submission evidence",
    description: SITE_DESCRIPTION,
    type: "website",
    url: SITE_ORIGIN,
    siteName: "ProofFlow Agent",
  },
  twitter: { card: "summary", title: "ProofFlow Agent", description: SITE_DESCRIPTION },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(SOFTWARE_APPLICATION_JSON_LD).replaceAll("<", "\\u003c"),
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
