# ProofFlow XPRIZE evidence index

Evidence package date: **August 5, 2026**

## Public production evidence

- Application: <https://proofflow-agent.vercel.app>
- Firestore-writing health endpoint: <https://proofflow-agent.vercel.app/api/health>
- Persisted audit JSON: <https://proofflow-agent.vercel.app/api/runs/TiuPE6fJv3JuAamQvAIp>
- Persisted audit evidence pack: <https://proofflow-agent.vercel.app/api/runs/TiuPE6fJv3JuAamQvAIp/report>
- Public source: <https://github.com/ArgonautWorks/proofflow-agent>
- Demo video: <https://youtu.be/kqhoyUaeGdI>

## Source evidence

- `lib/gemini.ts`: official Google GenAI SDK, primary and fallback Gemini models, schema-constrained output
- `lib/gemma.ts`: Gemma 4 operational-priority selection constrained to an existing action index through a forced function call
- `lib/firestore.ts`: server-only Firestore writes, audit persistence, counters, and health state
- `app/api/v1/audits/route.ts`: paid audit request lifecycle
- `tests/`: 25 automated tests covering model-action binding, discovery, x402, A2A, report generation, monitoring, and security
- `docs/BUILD_PROVENANCE.md`: repository start date and first-commit record

## Financial evidence

The attached production evidence shows that the Google Cloud/Firebase project is on the no-cost Spark plan and has no linked billing account. The Google AI Studio screenshot records the selected ProofFlow Agent project and free-tier usage dashboard; the dashboard currently exposes no aggregated usage data, so it is not presented as proof of request volume. Live application behavior and persisted Firestore data provide independent proof that the service is operating.

The accompanying `xprize-profit-and-loss.csv` reports $0 revenue and $0 expenses. Directory listings, unpaid payment challenges, internal tests, operator runs, and judge traffic are excluded from revenue and customer counts.
