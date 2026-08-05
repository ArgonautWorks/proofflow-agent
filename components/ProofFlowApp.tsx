"use client";

import { FormEvent, useMemo, useState } from "react";
import type { AuditCounts, AuditResult, RequirementStatus } from "@/lib/types";

const DEFAULT_RULES = "https://allthingsagentichackathon.devpost.com/rules";
const DEFAULT_REPO = "https://github.com/ArgonautWorks/proofflow-agent";

const icons = {
  arrow: <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h9M8.5 3.5 13 8l-4.5 4.5" /></svg>,
  check: <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3 8.5 3 3L13 4.8" /></svg>,
  download: <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2v8m-3-3 3 3 3-3M3 13.5h10" /></svg>,
  github: <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.8a6.2 6.2 0 0 0-2 12.1c.3.1.4-.1.4-.3v-1.2c-1.8.4-2.2-.8-2.2-.8-.3-.8-.8-1-1-1.1-.6-.4.1-.4.1-.4.7.1 1.1.7 1.1.7.6 1.1 1.7.8 2.1.6.1-.5.2-.8.5-1-1.5-.2-3-.7-3-3.1 0-.7.2-1.2.7-1.7-.1-.2-.3-.8.1-1.7 0 0 .6-.2 1.8.7a6 6 0 0 1 3.4 0c1.2-.9 1.8-.7 1.8-.7.4.9.2 1.5.1 1.7.5.5.7 1 .7 1.7 0 2.4-1.5 2.9-3 3.1.3.2.5.6.5 1.2v1.8c0 .2.1.4.5.3A6.2 6.2 0 0 0 8 1.8Z" /></svg>,
};

function statusLabel(status: RequirementStatus) {
  return status === "verified" ? "Verified" : status === "partial" ? "Partial" : "Missing";
}

function countRequirements(audit: AuditResult | null): AuditCounts {
  const counts: AuditCounts = { verified: 0, partial: 0, missing: 0 };
  audit?.requirements.forEach((item) => { counts[item.status] += 1; });
  return counts;
}

export function ProofFlowApp() {
  const [rulesUrl, setRulesUrl] = useState(DEFAULT_RULES);
  const [repoUrl, setRepoUrl] = useState(DEFAULT_REPO);
  const [projectUrl, setProjectUrl] = useState("");
  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | RequirementStatus>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const counts = useMemo(() => countRequirements(audit), [audit]);
  const requirements = audit?.requirements.filter((item) => activeFilter === "all" || item.status === activeFilter) ?? [];

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rulesUrl, repoUrl, projectUrl }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Audit failed");
      setAudit(body.audit);
      setActiveFilter("all");
      requestAnimationFrame(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Audit failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <nav className="nav shell">
        <a className="brand" href="#top" aria-label="ProofFlow home">
          <span className="brand-mark"><i /><i /><i /></span>
          <span>PROOF/FLOW</span>
        </a>
        <div className="nav-links">
          <a href="#workflow">Workflow</a>
          <a href="#architecture">Architecture</a>
          <a href="https://github.com/ArgonautWorks/proofflow-agent" target="_blank" rel="noreferrer">Source</a>
        </div>
        <span className="live-pill"><b /> FIRESTORE LIVE</span>
      </nav>

      <section className="hero shell" id="top">
        <div className="eyebrow"><span>01</span> Autonomous submission operations</div>
        <div className="hero-grid">
          <div>
            <h1>Turn binding rules into <em>judge-ready proof.</em></h1>
            <p className="lede">ProofFlow reads the fine print, inspects the actual build, verifies live evidence, and locks a submission ledger—without another spreadsheet.</p>
            <div className="tech-row">
              <span>GEMINI 3.6 FLASH</span><span>GOOGLE GENAI SDK</span><span>FIRESTORE</span>
            </div>
          </div>
          <div className="hero-aside">
            <div className="signal"><span>AGENT STATE</span><b>READY</b></div>
            <p>Rules → requirements → evidence → action pack</p>
            <div className="mini-flow"><i>R</i><hr /><i>E</i><hr /><i>V</i><hr /><i>L</i></div>
          </div>
        </div>
      </section>

      <section className="agent-console shell" id="workflow">
        <div className="console-head">
          <div><span className="section-number">02</span><h2>Launch an evidence run</h2></div>
          <p>One bounded workflow. Four autonomous actions. A durable result.</p>
        </div>
        <div className="console-grid">
          <div className="workflow-rail">
            {[
              ["01", "INGEST", "Read and fingerprint the binding rules"],
              ["02", "REASON", "Extract material obligations with Gemini"],
              ["03", "VERIFY", "Probe the repository and live deployment"],
              ["04", "LOCK", "Persist an evidence ledger in Firestore"],
            ].map(([number, label, detail], index) => (
              <div className="workflow-step" key={label}>
                <span>{number}</span><div><b>{label}</b><p>{detail}</p></div><i className={loading && index === 1 ? "pulse" : ""} />
              </div>
            ))}
          </div>
          <form className="audit-form" onSubmit={submit}>
            <div className="field">
              <label htmlFor="rules">Official rules URL <span>required</span></label>
              <input id="rules" type="url" value={rulesUrl} onChange={(event) => setRulesUrl(event.target.value)} required />
              <small>Devpost binding rules page</small>
            </div>
            <div className="field">
              <label htmlFor="repo">Public repository <span>required</span></label>
              <input id="repo" type="url" value={repoUrl} onChange={(event) => setRepoUrl(event.target.value)} required />
              <small>GitHub repository root</small>
            </div>
            <div className="field">
              <label htmlFor="project">Live project URL <span>optional</span></label>
              <input id="project" type="url" value={projectUrl} onChange={(event) => setProjectUrl(event.target.value)} placeholder="https://your-project.vercel.app" />
              <small>Vercel deployment for an availability probe</small>
            </div>
            {error && <div className="error-box" role="alert">{error}</div>}
            <button className="run-button" type="submit" disabled={loading}>
              <span>{loading ? "AGENT RUNNING" : "RUN AUTONOMOUS AUDIT"}</span>{loading ? <i className="spinner" /> : icons.arrow}
            </button>
            <p className="form-note">Public sources only · 3 runs per client/day · no repository writes</p>
          </form>
        </div>
      </section>

      <section className={`results shell ${audit ? "has-results" : ""}`} id="results">
        {!audit ? (
          <div className="results-empty">
            <div className="empty-grid" />
            <span>RESULTS LEDGER</span>
            <h2>Your proof map will land here.</h2>
            <p>Run the agent to replace assumptions with traceable requirements, verified artifacts, and next actions.</p>
          </div>
        ) : (
          <>
            <div className="result-header">
              <div className="score-ring" style={{ "--score": `${audit.score * 3.6}deg` } as React.CSSProperties}>
                <div><strong>{audit.score}</strong><span>/100</span></div>
              </div>
              <div className="result-title">
                <div className="eyebrow"><span>03</span> Evidence ledger · {audit.overallStatus}</div>
                <h2>{audit.projectName}</h2>
                <p>{audit.executiveSummary}</p>
              </div>
              <div className="result-actions">
                <a className="download-button" href={`/api/runs/${audit.id}/report`}>{icons.download} Download pack</a>
                <a className="icon-button" href={audit.sourceSnapshot.repository.url} target="_blank" rel="noreferrer" aria-label="Open repository">{icons.github}</a>
              </div>
            </div>

            <div className="metrics">
              {(["verified", "partial", "missing"] as RequirementStatus[]).map((status) => (
                <button key={status} className={`${status} ${activeFilter === status ? "active" : ""}`} onClick={() => setActiveFilter(activeFilter === status ? "all" : status)}>
                  <strong>{counts[status]}</strong><span>{statusLabel(status)}</span>
                </button>
              ))}
              <div className="source-lock"><span>RULES LOCK</span><code>{audit.sourceSnapshot.rules.sha256.slice(0, 12)}…</code></div>
            </div>

            <div className="ledger-head"><span>Requirement</span><span>Evidence state</span><span>Next action</span></div>
            <div className="ledger">
              {requirements.map((item) => (
                <article className="requirement" key={item.id}>
                  <div className="requirement-main">
                    <span className={`status-dot ${item.status}`} />
                    <div><small>{item.id} · {item.category} · {item.severity}</small><h3>{item.title}</h3><p>{item.requirement}</p></div>
                  </div>
                  <div className="evidence-cell">
                    <span className={`status-tag ${item.status}`}>{statusLabel(item.status)}</span>
                    {item.evidence.length ? item.evidence.map((evidence) => <code key={evidence}>{evidence}</code>) : <em>No evidence found</em>}
                    <p>{item.rationale}</p>
                  </div>
                  <div className="next-cell"><span>{icons.arrow}</span><p>{item.nextAction}</p></div>
                </article>
              ))}
            </div>

            <div className="action-log">
              <div><span className="section-number">04</span><h2>Agent action log</h2></div>
              <div className="action-grid">
                {audit.actionsPerformed.map((action, index) => (
                  <div key={action.label}><span>{String(index + 1).padStart(2, "0")}</span><b>{action.label}</b><p>{action.detail}</p><i className={action.status} /></div>
                ))}
              </div>
            </div>
          </>
        )}
      </section>

      <section className="architecture shell" id="architecture">
        <div className="console-head"><div><span className="section-number">05</span><h2>Built for auditable autonomy</h2></div><p>Every model judgment stays attached to deterministic evidence.</p></div>
        <div className="architecture-grid">
          <div className="arch-flow">
            <div className="arch-node source"><span>01</span><b>PUBLIC SOURCES</b><p>Rules · GitHub · deployment</p></div>
            <i>{icons.arrow}</i>
            <div className="arch-node model"><span>02</span><b>GEMINI 3.6</b><p>Structured requirement reasoning</p></div>
            <i>{icons.arrow}</i>
            <div className="arch-node cloud"><span>03</span><b>FIRESTORE</b><p>Durable evidence ledger</p></div>
          </div>
          <div className="principles">
            <div><span>STRICT</span><p>Missing evidence is never rewritten as confidence.</p></div>
            <div><span>BOUNDED</span><p>Allowlisted public sources and daily capacity limits.</p></div>
            <div><span>PORTABLE</span><p>Every run exports a judge-readable Markdown pack.</p></div>
          </div>
        </div>
      </section>

      <footer className="shell">
        <div className="brand"><span className="brand-mark"><i /><i /><i /></span><span>PROOF/FLOW</span></div>
        <p>Built by ArgonautWorks for the All Things Agentic Hackathon.</p>
        <a href="https://github.com/ArgonautWorks/proofflow-agent" target="_blank" rel="noreferrer">VIEW PUBLIC SOURCE {icons.arrow}</a>
      </footer>
    </main>
  );
}
