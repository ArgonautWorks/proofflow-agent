import { GemmaCoreApp } from "@/components/GemmaCoreApp";

export const metadata = {
  title: "Gemma Core — autonomous evidence audit | ProofFlow",
  description: "An isolated Gemma-first ProofFlow mode for public-source competition evidence audits.",
  alternates: { canonical: "/gemma-core" },
};

export default function GemmaCorePage() {
  return <GemmaCoreApp />;
}
