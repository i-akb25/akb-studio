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
    scope: "vartalap:address",
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
  const website = String(value.website ?? "").trim();

  if (website) {
    return NextResponse.json({ ok: true });
  }

  const name = String(value.name ?? "").trim();
  const email = String(value.email ?? "")
    .trim()
    .toLowerCase();
  const question = String(value.question ?? "").trim();
  const contentId = String(value.contentId ?? "").trim();
  const contentTypeValue = String(value.contentType ?? "").trim();
  const contentSlug = String(value.contentSlug ?? "").trim();
  const anonymous = value.anonymous === true;
  const noticeAccepted = value.noticeAccepted === true;
  const policyVersion = String(value.policyVersion ?? "");

  if (
    name.length < 1 ||
    name.length > 80 ||
    email.length > 254 ||
    !EMAIL.test(email) ||
    question.length < 5 ||
    question.length > 2000 ||
    !/^[a-zA-Z0-9._:-]{1,100}$/.test(contentId) ||
    !/^[a-z-]{1,32}$/.test(contentTypeValue) ||
    !/^[a-z0-9-]{1,160}$/.test(contentSlug) ||
    !noticeAccepted ||
    policyVersion !== POLICY_VERSIONS.vartalap
  ) {
    return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
  }
  const emailLimit = await consumeRateLimit({
    scope: "vartalap:email",
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

  let result: Awaited<ReturnType<typeof callPublishingService>>;
  try {
    result = await callPublishingService("vartalap_submit", {
      name,
      email,
      question,
      contentId,
      contentType: contentTypeValue,
      contentSlug,
      anonymous,
      noticeAccepted,
      policyVersion,
    });
  } catch {
    return NextResponse.json(
      { error: "Vartalap service is temporarily unavailable" },
      { status: 503 },
    );
  }

  if (!result.ok) {
    return NextResponse.json(
      { error: "Vartalap service is temporarily unavailable" },
      { status: 503 },
    );
  }

  return NextResponse.json({
    ok: true,
    message: "Your question has been submitted for review.",
  });
}
