import { safeHealthSummary } from "@/features/admin/core/service-health-summary";
import {
  isSubmissionOwner,
  privateResponseHeaders,
} from "@/features/admin/core/submissions-contract";
import { getAdminSession } from "@/features/admin/server/admin-auth";
import { prisma } from "@/server/db/prisma";

export const dynamic = "force-dynamic";
export async function GET() {
  try {
    if (!isSubmissionOwner(await getAdminSession()))
      return Response.json(
        { error: "Owner access and two-factor authentication required." },
        { status: 403, headers: privateResponseHeaders },
      );
    const records = await prisma.operationalHealth.findMany({
      take: 100,
      orderBy: { lastCheckedAt: "desc" },
      select: {
        key: true,
        status: true,
        summary: true,
        latencyMs: true,
        consecutiveFailures: true,
        lastCheckedAt: true,
        lastSuccessAt: true,
        lastFailureAt: true,
      },
    });
    const data = records.map((row) => ({
      ...row,
      summary: safeHealthSummary(row.summary),
    }));
    return Response.json(
      { ok: true, data },
      { headers: privateResponseHeaders },
    );
  } catch {
    return Response.json(
      { error: "Service health could not be loaded." },
      { status: 503, headers: privateResponseHeaders },
    );
  }
}
