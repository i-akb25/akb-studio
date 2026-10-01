import { recordOperationalHealth } from "../src/server/analytics/metrics";
import { prisma } from "../src/server/db/prisma-client";
import { logger, safeErrorFields } from "../src/server/logging/logger";

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
    await recordOperationalHealth({
      key: "scheduled_publishing",
      status: "healthy",
      summary: "Scheduled publication run completed",
    });
    process.stdout.write(
      `${JSON.stringify({
        publishedAt: now.toISOString(),
        projects: projects.count,
        reflections: reflections.count,
        editorialDocuments: editorial.count,
      })}\n`,
    );
  } catch (error) {
    await recordOperationalHealth({
      key: "scheduled_publishing",
      status: "critical",
      summary: "Scheduled publication run failed",
    });
    logger.error({
      event: "scheduled_publishing_failed",
      ...safeErrorFields(error),
    });
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error) => {
  logger.error({
    event: "scheduled_publishing_unhandled_failure",
    ...safeErrorFields(error),
  });
  process.exitCode = 1;
});
