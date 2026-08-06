"use client";

import { type FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import type { AuditCounts, AuditResult, RequirementStatus } from "@/lib/types";

function countRequirements(audit: AuditResult | null): AuditCounts {
  const counts: AuditCounts = { verified: 0, partial: 0, missing: 0 };
  audit?.requirements.forEach((item) => { counts[item.status] += 1; });
  return counts;
}

export function GemmaCoreApp() {
  const [rulesUrl, setRulesUrl] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [projectUrl, setProjectUrl] = useState("");
  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const counts = useMemo(() => countRequirements(audit), [audit]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/gemma-core", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rulesUrl, repoUrl, projectUrl }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Gemma Core audit failed");
      setAudit(body.audit);
      requestAnimationFrame(() => document.getElementById("gemma-results")?.scrollIntoView({ behavior: "smooth" }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gemma Core audit failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="gemma-core-page">
      <nav className="nav shell">
        <Link className="brand" href="/" aria-label="ProofFlow home">
          <span className="brand-mark"><i /><i /><i /></span><span>PROOF/FLOW</span>
        </Link>
        <div className="nav-links"><Link href="/">Default audit</Link><Link href="/building-proofflow">Build story</Link><a href="https://github.com/ArgonautWorks/proofflow-agent" target="_blank" rel="noreferrer">Source</a></div>
        <span className="live-pill"><b /> GEMMA CORE</span>
      </nav>

      <section className="hero shell" id="top">
        <div className="eyebrow"><span>GC-01</span> Isolated competition mode</div>
        <div className="hero-grid">
          <div>
            <h1>Give the agent sources.<em>Keep the work off your plate.</em></h1>
            <p className="lede">Gemma Core independently reads public contest rules, checks a public repository and optional live URL, then returns a persisted evidence ledger with one ready-to-execute priority.</p>
            <div className="tech-row"><span>GEMMA 4 26B</span><span>GEMMA-4-26B-A4B-IT</span><span>FORCED FUNCTION CALL</span><span>FIRESTORE</span></div>
          </div>
          <aside className="hero-aside">
            <div className="signal"><span>SEMANTIC CORE</span><b>GEMMA ONLY</b></div>
            <p>This isolated route uses <code>gemma-4-26b-a4b-it</code> as its only semantic reasoning model. It does not fall back to Gemini.</p>
            <div className="mini-flow"><i>S</i><hr /><i>G</i><hr /><i>B</i><hr /><i>P</i></div>
          </aside>
        </div>
      </section>

      <section className="agent-console shell" aria-labelledby="gemma-run-title">
        <div className="console-head"><div><span className="section-number">GC-02</span><h2 id="gemma-run-title">Start an autonomous evidence run</h2></div><p>Public sources in. A source-bound action pack out.</p></div>
        <div className="console-grid">
          <div className="workflow-rail">
            {[
              ["01", "INGEST", "Lock official rules and public project evidence"],
              ["02", "REASON", "Gemma maps source-bound requirements"],
              ["03", "BIND", "A forced function call selects one existing action"],
              ["04", "PERSIST", "Store a durable, model-labeled evidence ledger"],
            ].map(([number, label, detail], index) => <div className="workflow-step" key={label}><span>{number}</span><div><b>{label}</b><p>{detail}</p></div><i className={loading && index === 1 ? "pulse" : ""} /></div>)}
          </div>
          <form className="audit-form" onSubmit={submit}>
            <div className="field"><label htmlFor="gemma-rules">Official rules URL <span>required</span></label><input id="gemma-rules" type="url" value={rulesUrl} onChange={(event) => setRulesUrl(event.target.value)} placeholder="https://your-contest.devpost.com/rules" required /><small>Official Devpost rules page</small></div>
            <div className="field"><label htmlFor="gemma-repo">Public repository <span>required</span></label><input id="gemma-repo" type="url" value={repoUrl} onChange={(event) => setRepoUrl(event.target.value)} placeholder="https://github.com/org/project" required /><small>Public GitHub repository root</small></div>
            <div className="field"><label htmlFor="gemma-project">Live project URL <span>optional</span></label><input id="gemma-project" type="url" value={projectUrl} onChange={(event) => setProjectUrl(event.target.value)} placeholder="https://your-project.vercel.app" /><small>Vercel or Devpost URL for an availability probe</small></div>
            {error && <div className="error-box" role="alert">{error}</div>}
            <button className="run-button" type="submit" disabled={loading}><span>{loading ? "GEMMA CORE RUNNING" : "RUN GEMMA CORE"}</span><span aria-hidden="true">→</span></button>
            <p className="form-note">Public sources only · free rate-limited beta · no account required</p>
          </form>
        </div>
      </section>

      <section className="results shell" id="gemma-results">
        {!audit ? <div className="results-empty"><div className="empty-grid" /><span>GEMMA CORE LEDGER</span><h2>A live ledger appears after a real run.</h2><p>No scores, audit IDs, or sample evidence are shown until this route completes an actual source check.</p></div> : <>
          <div className="result-header">
            <div className="score-ring" style={{ "--score": `${audit.score * 3.6}deg` } as React.CSSProperties}><div><strong>{audit.score}</strong><span>/100</span></div></div>
            <div className="result-title"><div className="eyebrow"><span>GC-03</span> Gemma Core evidence ledger · {audit.overallStatus}</div><h2>{audit.projectName}</h2><p>{audit.executiveSummary}</p></div>
            <div className="result-actions"><a className="download-button" href={`/api/runs/${audit.id}/report`}>DOWNLOAD PACK</a></div>
          </div>
          <div className="metrics">
            {(["verified", "partial", "missing"] as RequirementStatus[]).map((status) => <div className={status} key={status}><strong>{counts[status]}</strong><span>{status}</span></div>)}
            <div className="source-lock"><span>MODEL PROVENANCE</span><code>{audit.model}</code></div>
          </div>
          {audit.operationalPriority && <div className="priority-brief"><div><span>GEMMA-BOUND OPERATIONAL PRIORITY</span><small>{audit.operationalPriority.model}</small></div><h3>{audit.operationalPriority.action}</h3><p>{audit.operationalPriority.rationale}</p></div>}
          <div className="ledger-head"><span>Requirement</span><span>Evidence state</span><span>Next action</span></div>
          <div className="ledger">{audit.requirements.map((item) => <article className="requirement" key={item.id}><div className="requirement-main"><span className={`status-dot ${item.status}`} /><div><small>{item.id} · {item.category} · {item.severity}</small><h3>{item.title}</h3><p>{item.requirement}</p></div></div><div className="evidence-cell"><span className={`status-tag ${item.status}`}>{item.status}</span>{item.evidence.length ? item.evidence.map((evidence) => <code key={evidence}>{evidence}</code>) : <em>No collected evidence</em>}<p>{item.rationale}</p></div><div className="next-cell"><span>→</span><p>{item.nextAction}</p></div></article>)}</div>
        </>}
      </section>
    </main>
  );
}
