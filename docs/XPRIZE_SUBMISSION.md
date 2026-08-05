# ProofFlow — Gemini XPRIZE business narrative

Submission category: **Small Business Services**  
Business start date: **August 5, 2026**  
Submitter: **Individual, Netherlands**

## Impact and category fit

Small teams lose time and opportunity at the last mile of grants, tenders, hackathons, and other rule-bound submissions. Requirements live across rules pages, repositories, deployments, video instructions, and evidence checklists. A missed obligation can invalidate otherwise good work, while professional compliance help is often too expensive for a new business. ProofFlow gives a small operator an on-demand evidence analyst. It reads the binding rules and public project artifacts, then returns a structured ledger showing what is supported, what is missing, and the next concrete action. This makes a professional-services workflow accessible as a low-cost machine service.

## Business model

ProofFlow has a free browser interface for evaluation and an accountless paid agent endpoint. An autonomous customer sends one audit request to `POST /api/v1/audits` and pays **$0.05 USDC on Base** through x402. One successful payment corresponds to one successfully delivered audit; there is no subscription, account, API key, or sales call. The handler validates inputs and checks capacity before payment settlement, so invalid inputs, capacity failures, and model failures are not charged. The price remains fixed during initial demand testing.

## Future operations

The business will retain the free judge/demo path, the paid endpoint, strict capacity controls, and an exact settlement monitor. Distribution focuses on machine-readable discovery and relevant buyer directories rather than paid advertising. Expansion is evidence-gated: externally settled audits justify more integrations and capacity; zero calls after a defined discovery window stops inventory expansion and moves effort to other validated channels. Gemini calls have bounded timeouts and an availability fallback, while schema validation fails closed instead of delivering invented evidence.

## AI tools and deployed intelligence

The deployed service calls **Gemini 3.6 Flash** through the official `@google/genai` SDK, with Gemini 3.5 Flash Lite as an availability fallback. Gemini maps requirements to repository and deployment evidence and assigns status, severity, rationale, and next actions. JSON Schema constrains generation and Zod independently validates the response. Codex assisted with research, engineering, deployment, and operations, but it is not an LLM dependency inside the customer-facing runtime.

## Sustainability and viability

Current realized revenue is **$0**, current expenses are **$0**, and the business is not yet commercially validated. It runs on no-cost service tiers, uses public-source inputs, and has no paid acquisition or paid labor. Its metered model work is only performed for a bounded audit, and paid settlement occurs only after the result is ready. That design targets low marginal cost and prevents charging for upstream failures. Viability will be judged from independently settled customer requests—not listings, self-payments, probes, internal tests, or judge traffic. The attached P&L therefore reports zero rather than projecting unearned revenue.

## How the business operates with AI

An agent-run workflow performs source validation, rules ingestion, repository inspection, deployment probing, Gemini reasoning, Gemma operational prioritization, evidence-ledger generation, Firestore persistence, health checking, machine-readable discovery, and revenue monitoring. The human established the business goal and eligibility boundaries; the operating workflow executes research, build, deployment, distribution, and monitoring through software and APIs. For each audit, Gemini makes the key semantic decisions: which rule a fact supports, whether evidence is sufficient, how severe a gap is, why it matters, and what action resolves it. Gemma then selects one existing validated action index through a forced function call. Deterministic controls constrain both stages and preserve traceability.

## Live production proof

ProofFlow is deployed at <https://proofflow-agent.vercel.app>. A public health request performs a server-authenticated Firestore write before reporting that Firestore is connected. Production audit `TiuPE6fJv3JuAamQvAIp` can be read as [JSON](https://proofflow-agent.vercel.app/api/runs/TiuPE6fJv3JuAamQvAIp) and as a generated [Markdown evidence pack](https://proofflow-agent.vercel.app/api/runs/TiuPE6fJv3JuAamQvAIp/report). The attached production-evidence PDF shows the no-cost Google Cloud configuration and a persisted audit document. The current public repository contains 25 passing tests plus lint and production-build checks.

## Google Cloud and Gemini integration

Cloud Firestore in the Google/Firebase project `proofflow-agent` stores audit records, pseudonymous rate-limit counters, and health state. Browser clients cannot read the private database; server routes use Firebase Admin credentials stored only in the deployment environment. The primary live call in `lib/gemini.ts` submits collected evidence to Gemini, requests the explicit audit schema, falls back only on model availability errors, and rejects malformed output. The secondary call in `lib/gemma.ts` gives Gemma 4 only the validated risks and action list, forces the `select_next_action` function, rejects an invented index, and falls back deterministically without invalidating the audit.

## Pre-existing resources

No ProofFlow business, codebase, customer list, audience, revenue, or proprietary dataset existed before August 5, 2026. The public first commit and repository history establish the start date. The project uses standard open-source frameworks, the Gemini API, Google Cloud Firestore, GitHub's public API, Vercel, Base/x402 payment infrastructure, and public contest pages. These general-purpose resources were available before the business; the product implementation and operating artifacts were created after the XPRIZE start date.

## Financial and user disclosure

Through this package date, ProofFlow has **0 external users, 0 paying users, $0 revenue, $0 cost of goods sold, $0 marketing expense, and $0 additional expense**. Internal development runs, automated tests, operator audits, unpaid directory challenge probes, and judging activity are excluded. There is no related-party revenue and no testimonial claim. The business reports significant learning from building and operating a fully deployed, payment-capable service, while explicitly separating technical readiness from customer validation.
