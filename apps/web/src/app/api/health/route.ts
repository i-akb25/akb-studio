import { recordOperationalHealth } from "@/server/analytics/metrics";
import { getDatabaseHealth } from "@/server/db/database-health";

export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  const database = await getDatabaseHealth();
  const latencyMs = Date.now() - startedAt;
  await recordOperationalHealth({
    key: "database",
    status: database.available ? "healthy" : "critical",
    summary: database.available
      ? "Database query succeeded"
      : "Database query failed",
    latencyMs,
  });
  return Response.json(
    {
      status: database.available ? "ok" : "degraded",
      application: "available",
      database: database.available ? "available" : "unavailable",
      timestamp: new Date().toISOString(),
    },
    {
      status: database.available ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
