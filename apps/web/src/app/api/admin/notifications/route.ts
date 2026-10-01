import { NextResponse } from "next/server";
import { assertSameOrigin, canAdmin } from "@/features/admin/server/admin-auth";
import { callPublishingService } from "@/features/publishing/server/publishing-service";
import { readJsonBody } from "@/server/security/request";

export async function GET() {
  if (!(await canAdmin("content:publish")))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(
    await callPublishingService("admin_notification_state", {}),
  );
}
export async function POST(request: Request) {
  if (!(await canAdmin("content:publish")))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    assertSameOrigin(request);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 403 });
  }
  const body = (await readJsonBody(request, 4_096).catch(() => null)) as {
    action?: string;
    key?: string;
    value?: unknown;
  } | null;
  if (body?.action === "send")
    return NextResponse.json(
      await callPublishingService("admin_send_notifications", {}),
    );
  if (body?.action === "setting" && body.key)
    return NextResponse.json(
      await callPublishingService("admin_set_setting", {
        key: body.key,
        value: body.value,
      }),
    );
  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
