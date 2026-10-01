export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(
    {
      status: "ok",
      application: "available",
      timestamp: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
