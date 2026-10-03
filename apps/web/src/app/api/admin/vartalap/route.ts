import { NextResponse } from "next/server";
import { adminErrorResponse } from "@/features/admin/server/admin-api-response";
import { assertSameOrigin, canAdmin } from "@/features/admin/server/admin-auth";
import { callPublishingService } from "@/features/publishing/server/publishing-service";
import { readJsonBody } from "@/server/security/request";
export async function GET() {
  if (!(await canAdmin("contact:moderate")))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const result = await callPublishingService("admin_vartalap_list", {});
    return NextResponse.json(result, { status: result.ok ? 200 : 503 });
  } catch (error) {
    return adminErrorResponse(error, {
      event: "admin_vartalap_list_failed",
      fallback: "The Vartalap service is not available.",
      fallbackStatus: 503,
    });
  }
}
export async function POST(request: Request) {
  if (!(await canAdmin("contact:moderate")))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    assertSameOrigin(request);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 403 });
  }
  const body = (await readJsonBody(request, 8_192).catch(() => null)) as {
    questionId?: unknown;
    reply?: unknown;
    public?: unknown;
  } | null;
  const questionId = String(body?.questionId ?? "");
  const reply = String(body?.reply ?? "");
  if (
    !/^[a-zA-Z0-9._:-]{3,120}$/.test(questionId) ||
    reply.length < 1 ||
    reply.length > 4000
  )
    return NextResponse.json({ error: "Invalid reply" }, { status: 400 });
  try {
    const result = await callPublishingService("admin_vartalap_reply", {
      questionId,
      reply,
      public: body?.public === true,
    });
    return NextResponse.json(result, { status: result.ok ? 200 : 503 });
  } catch (error) {
    return adminErrorResponse(error, {
      event: "admin_vartalap_reply_failed",
      fallback: "The Vartalap response could not be saved.",
      fallbackStatus: 503,
    });
  }
}
