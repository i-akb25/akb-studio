import { prisma } from "../src/server/db/prisma-client";

function safeErrorFields(error: unknown) {
  if (!(error instanceof Error)) return { errorType: "unknown" };
  return {
    errorType: error.name.slice(0, 80),
    errorCode:
      "code" in error && typeof error.code === "string"
        ? error.code.slice(0, 80)
        : undefined,
  };
}

async function recordPublishingHealth(
  status: "healthy" | "critical",
  summary: string,
) {
  const now = new Date();
  const current = await prisma.operationalHealth.findUnique({
    where: { key: "scheduled_publishing" },
    select: { consecutiveFailures: true },
  });
  const failed = status === "critical";
  await prisma.operationalHealth.upsert({
    where: { key: "scheduled_publishing" },
    create: {
      key: "scheduled_publishing",
      status,
      summary,
      consecutiveFailures: failed ? 1 : 0,
      lastSuccessAt: failed ? null : now,
      lastFailureAt: failed ? now : null,
      lastCheckedAt: now,
    },
    update: {
      status,
      summary,
      consecutiveFailures: failed ? (current?.consecutiveFailures ?? 0) + 1 : 0,
      ...(failed ? { lastFailureAt: now } : { lastSuccessAt: now }),
      lastCheckedAt: now,
    },
  });
}

async function main() {
  const now = new Date();

  try {
    const [projects, reflections, editorial] = await prisma.$transaction([
      prisma.project.updateMany({
        where: { state: "SCHEDULED", scheduledAt: { lte: now } },
        data: { state: "PUBLISHED", publishedAt: now },
      }),
      prisma.reflection.updateMany({
        where: { state: "SCHEDULED", scheduledAt: { lte: now } },
        data: { state: "PUBLISHED", publishedAt: now },
      }),
      prisma.editorialDocument.updateMany({
        where: { state: "SCHEDULED", scheduledAt: { lte: now } },
        data: { state: "PUBLISHED", publishedAt: now },
      }),
    ]);
    await recordPublishingHealth(
      "healthy",
      "Scheduled publication run completed",
    );
    process.stdout.write(
      `${JSON.stringify({
        publishedAt: now.toISOString(),
        projects: projects.count,
        reflections: reflections.count,
        editorialDocuments: editorial.count,
      })}\n`,
    );
  } catch (error) {
    try {
      await recordPublishingHealth(
        "critical",
        "Scheduled publication run failed",
      );
    } catch {}
    process.stderr.write(
      `${JSON.stringify({
        event: "scheduled_publishing_failed",
        ...safeErrorFields(error),
      })}\n`,
    );
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error) => {
  process.stderr.write(
    `${JSON.stringify({
      event: "scheduled_publishing_unhandled_failure",
      ...safeErrorFields(error),
    })}\n`,
  );
  process.exitCode = 1;
});
