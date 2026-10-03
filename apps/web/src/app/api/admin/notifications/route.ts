import { NextResponse } from "next/server";
import { adminErrorResponse } from "@/features/admin/server/admin-api-response";
import { assertSameOrigin, canAdmin } from "@/features/admin/server/admin-auth";
import { callPublishingService } from "@/features/publishing/server/publishing-service";
import { readJsonBody } from "@/server/security/request";

export async function GET() {
  if (!(await canAdmin("content:publish")))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const result = await callPublishingService("admin_notification_state", {});
    return NextResponse.json(result, { status: result.ok ? 200 : 503 });
  } catch (error) {
    return adminErrorResponse(error, {
      event: "admin_notification_state_failed",
      fallback: "The notification service is not available.",
      fallbackStatus: 503,
    });
  }
}
export async function POST(request: Request) {
  if (!(await canAdmin("content:publish")))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    assertSameOrigin(request);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 403 });
  }
  try {
    const body = (await readJsonBody(request, 4_096).catch(() => null)) as {
      action?: string;
      key?: string;
      value?: unknown;
    } | null;
    const result =
      body?.action === "send"
        ? await callPublishingService("admin_send_notifications", {})
        : body?.action === "setting" && body.key
          ? await callPublishingService("admin_set_setting", {
              key: body.key,
              value: body.value,
            })
          : null;
    if (!result)
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    return NextResponse.json(result, { status: result.ok ? 200 : 503 });
  } catch (error) {
    return adminErrorResponse(error, {
      event: "admin_notification_operation_failed",
      fallback: "The notification change could not be completed.",
      fallbackStatus: 503,
    });
  }
}
