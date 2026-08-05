import { NextResponse } from "next/server";

export function auditErrorResponse(error: unknown) {
  const rawMessage = error && typeof error === "object" && "message" in error
    ? (error as { message: unknown }).message
    : "Audit failed";
  const message = typeof rawMessage === "string" ? rawMessage : JSON.stringify(rawMessage);
  const status = /temporarily unavailable|high demand|503|504|timed? out/i.test(message)
    ? 503
    : /limit|capacity/i.test(message)
      ? 429
      : /URL|HTTPS|GitHub|Devpost|Repository|rules page/i.test(message)
        ? 400
        : 500;
  return NextResponse.json(
    { error: message, retryable: status === 503, charged: false },
    { status, headers: status === 503 ? { "Retry-After": "30" } : undefined },
  );
}
