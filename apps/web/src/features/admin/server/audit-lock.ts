import { Prisma } from "@generated/prisma/client";

export async function lockAuditChain(
  tx: Pick<Prisma.TransactionClient, "$executeRaw">,
) {
  // PostgreSQL returns void for this lock. Execute it without decoding a row.
  // It remains held until the surrounding transaction commits or rolls back.
  await tx.$executeRaw(Prisma.sql`SELECT pg_advisory_xact_lock(109545, 2202)`);
}
