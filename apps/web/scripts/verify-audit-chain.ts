import { createHash } from "node:crypto";
import { prisma } from "../src/server/db/prisma-client";

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

async function main() {
  const entries = await prisma.auditLog.findMany({
    where: { entryHash: { not: null } },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });

  let prior: string | null = null;
  for (const [index, entry] of entries.entries()) {
    if (index > 0 && entry.previousHash !== prior)
      throw new Error(`Broken audit link at ${entry.id}`);
    const expected = createHash("sha256")
      .update(
        canonical({
          actorId: entry.actorId,
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId,
          before: entry.before,
          after: entry.after,
          createdAt: entry.createdAt.toISOString(),
          previousHash: entry.previousHash,
        }),
      )
      .digest("hex");
    if (expected !== entry.entryHash)
      throw new Error(`Audit hash mismatch at ${entry.id}`);
    prior = entry.entryHash;
  }

  console.log(`Verified ${entries.length} chained audit event(s).`);
  await prisma.$disconnect();
}

void main().catch(async (error) => {
  console.error(
    error instanceof Error ? error.message : "Audit verification failed",
  );
  await prisma.$disconnect().catch(() => {});
  process.exitCode = 1;
});
