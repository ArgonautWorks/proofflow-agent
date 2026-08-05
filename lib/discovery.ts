export const SITE_ORIGIN = "https://proofflow-agent.vercel.app";

export const SITE_DESCRIPTION =
  "Audit Devpost hackathon and grant submissions against binding rules, public GitHub evidence, and live deployments with Gemini.";

export const SOFTWARE_APPLICATION_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "ProofFlow Agent",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: SITE_ORIGIN,
  description: SITE_DESCRIPTION,
  isAccessibleForFree: true,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "Three free browser audits per client each day; an optional agent API is available for $0.05 USDC per successful audit.",
  },
};
