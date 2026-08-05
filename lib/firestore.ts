import { createHash } from "node:crypto";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import type { AuditResult } from "@/lib/types";

function serviceAccount() {
  const encoded = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (!encoded) throw new Error("Firestore is not configured");
  const parsed = JSON.parse(Buffer.from(encoded, "base64").toString("utf8"));
  if (parsed.project_id !== "proofflow-agent" || parsed.type !== "service_account") {
    throw new Error("Unexpected Firebase service account");
  }
  return parsed;
}

function database() {
  const app = getApps()[0] ?? initializeApp({ credential: cert(serviceAccount()), projectId: "proofflow-agent" });
  return getFirestore(app);
}

export async function enforceRateLimit(ip: string): Promise<void> {
  const secret = process.env.RATE_LIMIT_SECRET;
  if (!secret) throw new Error("Rate limiting is not configured");
  const day = new Date().toISOString().slice(0, 10);
  const ipHash = createHash("sha256").update(`${secret}:${ip}`).digest("hex").slice(0, 24);
  const db = database();
  const globalRef = db.collection("proof_flow_limits").doc(`global_${day}`);
  const clientRef = db.collection("proof_flow_limits").doc(`client_${day}_${ipHash}`);

  await db.runTransaction(async (transaction) => {
    const [globalSnapshot, clientSnapshot] = await Promise.all([
      transaction.get(globalRef),
      transaction.get(clientRef),
    ]);
    const globalCount = Number(globalSnapshot.data()?.count ?? 0);
    const clientCount = Number(clientSnapshot.data()?.count ?? 0);
    if (globalCount >= 50) throw new Error("Daily public audit capacity has been reached");
    if (clientCount >= 3) throw new Error("This client has reached today's audit limit");
    transaction.set(globalRef, { count: globalCount + 1, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    transaction.set(clientRef, { count: clientCount + 1, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  });
}

export async function enforcePaidCapacity(): Promise<void> {
  const day = new Date().toISOString().slice(0, 10);
  const ref = database().collection("proof_flow_limits").doc(`paid_${day}`);
  await database().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const count = Number(snapshot.data()?.count ?? 0);
    if (count >= 25) throw new Error("Daily paid audit capacity has been reached");
    transaction.set(ref, { count: count + 1, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  });
}

export async function persistAudit(result: Omit<AuditResult, "id">): Promise<AuditResult> {
  const ref = database().collection("proof_flow_audits").doc();
  const complete = { ...result, id: ref.id };
  await ref.set({ ...complete, persistedAt: FieldValue.serverTimestamp() });
  return complete;
}

export async function readAudit(id: string): Promise<AuditResult | null> {
  if (!/^[A-Za-z0-9]{10,40}$/.test(id)) return null;
  const snapshot = await database().collection("proof_flow_audits").doc(id).get();
  if (!snapshot.exists) return null;
  const data = snapshot.data();
  if (!data) return null;
  const { persistedAt: _persistedAt, ...audit } = data;
  void _persistedAt;
  return audit as AuditResult;
}

export async function verifyFirestore(): Promise<boolean> {
  await database().collection("proof_flow_system").doc("health").set({
    lastCheckedAt: FieldValue.serverTimestamp(),
    service: "proofflow-agent",
  }, { merge: true });
  return true;
}
