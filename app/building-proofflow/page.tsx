import type { Metadata } from "next";
import Link from "next/link";
import { SITE_ORIGIN } from "@/lib/discovery";

const STORY_PATH = "/building-proofflow";
const STORY_URL = `${SITE_ORIGIN}${STORY_PATH}`;

export const metadata: Metadata = {
  title: "Building ProofFlow: from binding rules to a judge-ready evidence ledger",
  description:
    "How ProofFlow combines Gemini structured reasoning, Gemma action prioritization, deterministic source checks, and Firestore without inventing evidence.",
  alternates: { canonical: STORY_PATH },
  openGraph: {
    title: "Building ProofFlow",
    description: "A practical build story about turning binding hackathon rules into a source-cited evidence ledger.",
    type: "article",
    url: STORY_URL,
    siteName: "ProofFlow Agent",
  },
  twitter: {
    card: "summary",
    title: "Building ProofFlow",
    description: "Gemini reasoning, deterministic verification, and an evidence-first audit pipeline.",
  },
};

const stages = [
  {
    number: "01",
    title: "Lock the rules",
    text: "ProofFlow accepts an official public rules page, validates the destination, removes URL fragments, and fingerprints the retrieved content so every audit names its binding source.",
  },
  {
    number: "02",
    title: "Extract obligations",
    text: "Gemini 3.6 Flash receives bounded source material and returns schema-constrained requirements. The orchestration uses an 18-second request limit, disables automatic retries, and permits one Gemini 3.5 Flash Lite availability fallback.",
  },
  {
    number: "03",
    title: "Verify artifacts",
    text: "Server-side checks inspect the submitted public GitHub repository and live deployment. Deterministic fetches establish what exists before model reasoning maps evidence to each requirement.",
  },
  {
    number: "04",
    title: "Choose the handoff",
    text: "Gemma 4 receives only the validated risk and action lists, then must call one bounded function with an existing action index. An invalid or unavailable response falls back to the first validated action without weakening the audit.",
  },
  {
    number: "05",
    title: "Persist the ledger",
    text: "The final score, requirement findings, risks, selected operational priority, source fingerprints, and model provenance are stored in private-by-default Firestore and rendered as JSON or a portable Markdown report.",
  },
];

export default function BuildingProofFlow() {
  return (
    <main className="story-page">
      <nav className="nav shell" aria-label="Build story navigation">
        <Link className="brand" href="/">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          PROOFFLOW / BUILD LOG
        </Link>
        <div className="nav-links">
          <a href="#pipeline">Pipeline</a>
          <a href="#boundaries">Boundaries</a>
          <a href="#artifacts">Artifacts</a>
        </div>
        <Link className="story-back" href="/">Run an audit →</Link>
      </nav>

      <article className="story shell">
        <header className="story-hero">
          <p className="eyebrow"><span>BUILD STORY</span> · 05 AUGUST 2026</p>
          <h1>Building an agent that knows when evidence is <em>missing.</em></h1>
          <p className="story-deck">
            Hackathon rules are prose. Submission evidence is scattered across repositories,
            deployments, and demos. ProofFlow turns both into a source-cited ledger while
            keeping the model inside a deliberately narrow reasoning role.
          </p>
          <div className="story-meta">
            <span>BY ARGONAUTWORKS</span>
            <span>7 MIN READ</span>
            <span>GEMINI · GEMMA · FIRESTORE · NEXT.JS</span>
          </div>
        </header>

        <section className="story-intro">
          <p className="story-dropcap">
            A polished demo can still miss a mandatory disclosure, an eligible track, or the
            exact evidence a judge needs. The hard part is not summarizing a rules page. It is
            preserving the line between what a source proves and what a model merely finds
            plausible.
          </p>
          <div className="story-thesis">
            <span>THE DESIGN RULE</span>
            <strong>Reason over evidence. Never manufacture it.</strong>
          </div>
        </section>

        <section className="story-section" id="pipeline">
          <div className="story-section-head">
            <span>01 / PIPELINE</span>
            <h2>Five bounded stages</h2>
          </div>
          <div className="story-stages">
            {stages.map((stage) => (
              <div className="story-stage" key={stage.number}>
                <span>{stage.number}</span>
                <h3>{stage.title}</h3>
                <p>{stage.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="story-section" id="boundaries">
          <div className="story-section-head">
            <span>02 / BOUNDARIES</span>
            <h2>What the agent refuses to blur</h2>
          </div>
          <div className="story-boundaries">
            <div>
              <b>Public inputs only</b>
              <p>The audit reads the official rules URL, a public GitHub repository, and a public deployment. Credentials are never sent to Gemini or the browser.</p>
            </div>
            <div>
              <b>Missing stays missing</b>
              <p>Every requirement is marked verified, partial, or missing. The model cannot convert an absent artifact into a passing finding.</p>
            </div>
            <div>
              <b>Read-only by design</b>
              <p>ProofFlow recommends the next concrete action but does not write to the audited repository or silently change a submission.</p>
            </div>
          </div>
          <blockquote>
            “The most useful agent is not the one that sounds certain. It is the one that can
            show exactly why it is certain—and stop where the evidence stops.”
          </blockquote>
        </section>

        <section className="story-section" id="artifacts">
          <div className="story-section-head">
            <span>03 / ARTIFACTS</span>
            <h2>Inspect the working system</h2>
          </div>
          <div className="story-artifacts">
            <Link href="/"><span>LIVE APPLICATION</span><b>Run the free browser audit</b><i>↗</i></Link>
            <a href="https://github.com/ArgonautWorks/proofflow-agent"><span>PUBLIC SOURCE</span><b>Read the production implementation</b><i>↗</i></a>
            <a href="https://youtu.be/kqhoyUaeGdI"><span>DEMO VIDEO</span><b>Watch an end-to-end audit</b><i>↗</i></a>
            <Link href="/api/runs/IxlFsvwqGZJ8ZHhQJ9dy/report"><span>SAMPLE OUTPUT</span><b>Open the Gemma-prioritized evidence pack</b><i>↗</i></Link>
          </div>
        </section>

        <aside className="story-disclosure">
          <span>HACKATHON DISCLOSURE</span>
          <p>I created this piece of content for the purposes of entering the All Things Agentic Hackathon.</p>
          <small>
            ProofFlow is an early-stage ArgonautWorks experiment. At publication it has no
            claimed customers or realized revenue; the judge-facing browser experience remains free.
          </small>
        </aside>
      </article>

      <footer className="shell">
        <div className="brand"><span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>PROOFFLOW AGENT</div>
        <p>Built by ArgonautWorks · Evidence over assertion</p>
        <a href="/openapi.json">AGENT API SPEC →</a>
      </footer>
    </main>
  );
}
