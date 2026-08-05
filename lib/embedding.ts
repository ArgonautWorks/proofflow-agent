import { GoogleGenAI } from "@google/genai";
import type { SemanticAlignment } from "@/lib/types";

export const GEMINI_EMBEDDING_MODEL = "gemini-embedding-2";
const EMBEDDING_DIMENSIONS = 128;

function cosineSimilarity(left: number[], right: number[]): number {
  if (left.length === 0 || left.length !== right.length) {
    throw new Error("Embedding vectors have incompatible dimensions");
  }
  let dot = 0;
  let leftSquared = 0;
  let rightSquared = 0;
  for (let index = 0; index < left.length; index += 1) {
    const leftValue = left[index];
    const rightValue = right[index];
    if (!Number.isFinite(leftValue) || !Number.isFinite(rightValue)) {
      throw new Error("Embedding vectors must be finite");
    }
    dot += leftValue * rightValue;
    leftSquared += leftValue * leftValue;
    rightSquared += rightValue * rightValue;
  }
  if (leftSquared === 0 || rightSquared === 0) throw new Error("Embedding vectors must be nonzero");
  return Math.max(-1, Math.min(1, dot / Math.sqrt(leftSquared * rightSquared)));
}

export function alignmentFromEmbeddings(
  embeddings: number[][],
  risks: string[],
): SemanticAlignment {
  if (risks.length === 0 || embeddings.length !== risks.length + 1) {
    throw new Error("Embedding response does not match the alignment inputs");
  }
  const action = embeddings[0];
  const scores = embeddings.slice(1).map((risk) => cosineSimilarity(action, risk));
  const bestIndex = scores.reduce(
    (best, score, index) => score > scores[best] ? index : best,
    0,
  );
  return {
    model: GEMINI_EMBEDDING_MODEL,
    score: Number(scores[bestIndex].toFixed(4)),
    matchedRisk: risks[bestIndex],
  };
}

export async function measurePriorityAlignment(input: {
  action: string;
  risks: string[];
}): Promise<SemanticAlignment> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini Embedding is not configured");
  const risks = input.risks.slice(0, 5);
  if (risks.length === 0) throw new Error("No risks are available for semantic alignment");
  const client = new GoogleGenAI({
    apiKey,
    httpOptions: {
      timeout: 8_000,
      retryOptions: { attempts: 1 },
    },
  });
  const contents = [input.action, ...risks].map((text) => ({
    parts: [{ text: text.slice(0, 500) }],
  }));
  const response = await client.models.embedContent({
    model: GEMINI_EMBEDDING_MODEL,
    contents,
    config: {
      taskType: "SEMANTIC_SIMILARITY",
      outputDimensionality: EMBEDDING_DIMENSIONS,
    },
  });
  const embeddings = (response.embeddings ?? []).map((embedding) => embedding.values ?? []);
  return alignmentFromEmbeddings(embeddings, risks);
}
