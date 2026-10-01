import { NextResponse } from "next/server";

import { POLICY_VERSIONS } from "@/features/legal/policy-registry";
import { callPublishingService } from "@/features/publishing/server/publishing-service";
import { consumeRateLimit } from "@/server/security/rate-limit";
import {
  clientAddress,
  hasTrustedOrigin,
  RequestSecurityError,
  readJsonBody,
} from "@/server/security/request";

export const runtime = "nodejs";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(request: Request) {
  if (!hasTrustedOrigin(request))
    return NextResponse.json({ error: "Invalid request" }, { status: 403 });
  const limit = await consumeRateLimit({
    scope: "subscription:address",
    identifier: clientAddress(request),
    limit: 5,
    windowMs: 15 * 60 * 1_000,
  });
  if (!limit.allowed)
    return NextResponse.json(
      { error: "Too many requests. Please wait before trying again." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );

  let body: unknown;
  try {
    body = await readJsonBody(request, 10_000);
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: error instanceof RequestSecurityError ? error.status : 400 },
    );
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const value = body as Record<string, unknown>;
  const email = String(value.email ?? "")
    .trim()
    .toLowerCase();
  const website = String(value.website ?? "").trim();
  const journal = value.journal !== false;
  const knowledge = value.knowledge !== false;
  const noticeAccepted = value.noticeAccepted === true;
  const policyVersion = String(value.policyVersion ?? "");

  if (website) {
    return NextResponse.json({ ok: true });
  }

  if (email.length > 254 || !EMAIL.test(email)) {
    return NextResponse.json(
      { error: "Enter a valid email address" },
      { status: 400 },
    );
  }
  const emailLimit = await consumeRateLimit({
    scope: "subscription:email",
    identifier: email,
    limit: 3,
    windowMs: 15 * 60 * 1_000,
  });
  if (!emailLimit.allowed)
    return NextResponse.json(
      { error: "Too many requests. Please wait before trying again." },
      {
        status: 429,
        headers: { "Retry-After": String(emailLimit.retryAfter) },
      },
    );

  if (!journal && !knowledge) {
    return NextResponse.json(
      { error: "Choose at least one notification type" },
      { status: 400 },
    );
  }

  if (!noticeAccepted || policyVersion !== POLICY_VERSIONS.subscription) {
    return NextResponse.json(
      { error: "Review and accept the current publication notice" },
      { status: 400 },
    );
  }

  let result: Awaited<ReturnType<typeof callPublishingService>>;
  try {
    result = await callPublishingService("subscribe", {
      email,
      journal,
      knowledge,
      noticeAccepted,
      policyVersion,
    });
  } catch {
    return NextResponse.json(
      { error: "Subscription service is temporarily unavailable" },
      { status: 503 },
    );
  }

  if (!result.ok) {
    return NextResponse.json(
      { error: "Subscription service is temporarily unavailable" },
      { status: 503 },
    );
  }

  return NextResponse.json({
    ok: true,
    message: "Subscription preferences saved.",
  });
}
