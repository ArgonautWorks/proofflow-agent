import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // @x402/next loads the Bazaar extension at request time with a
  // webpack-ignored dynamic import. Explicitly trace that runtime-only
  // dependency (and the small set of packages it resolves) into the paid
  // route's Vercel function bundle.
  outputFileTracingIncludes: {
    "/api/v1/audits": [
      "./node_modules/@x402/core/**/*",
      "./node_modules/@x402/extensions/**/*",
      "./node_modules/fast-deep-equal/**/*",
      "./node_modules/fast-uri/**/*",
      "./node_modules/json-schema-traverse/**/*",
      "./node_modules/require-from-string/**/*",
    ],
  },
};

export default nextConfig;
