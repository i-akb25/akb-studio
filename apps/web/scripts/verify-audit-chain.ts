import { verifyAuditEntries } from "../src/features/admin/server/audit-integrity";
import { prisma } from "../src/server/db/prisma-client";

async function main() {
  const entries = await prisma.auditLog.findMany({
    where: { entryHash: { not: null } },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });

  const result = verifyAuditEntries(entries);
  if (!result.valid)
    throw new Error(`Audit verification failed at ${result.errorId}`);
  console.log(
    `Verified ${result.count} chained audit event(s)${result.checkpointed ? " from the retained checkpoint" : ""}.`,
  );
  await prisma.$disconnect();
}

void main().catch(async (error) => {
  console.error(
    error instanceof Error ? error.message : "Audit verification failed",
  );
  await prisma.$disconnect().catch(() => {});
  process.exitCode = 1;
});
