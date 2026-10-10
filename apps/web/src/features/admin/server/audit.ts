import "server-only";

import { type AuditAction, Prisma } from "@generated/prisma/client";
import { prisma } from "@/server/db/prisma";
import { hashAuditEntry } from "./audit-integrity";

type AuditInput = {
  actorId?: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  before?: Prisma.InputJsonValue;
  after?: Prisma.InputJsonValue;
};

async function lockAuditChain(tx: Prisma.TransactionClient) {
  await tx.$queryRaw(Prisma.sql`SELECT pg_advisory_xact_lock(109545, 2202)`);
}

async function appendAudit(
  tx: Prisma.TransactionClient,
  input: AuditInput,
  locked = false,
) {
  if (!locked) await lockAuditChain(tx);
  const previous = await tx.auditLog.findFirst({
    where: { entryHash: { not: null } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: { entryHash: true },
  });
  const createdAt = new Date();
  const safeInput =
    input.entityType === "ContactSubmission"
      ? { ...input, before: undefined, after: undefined }
      : input;
  const previousHash = previous?.entryHash ?? null;
  const payload = {
    actorId: safeInput.actorId ?? null,
    action: safeInput.action,
    entityType: safeInput.entityType,
    entityId: safeInput.entityId ?? null,
    before: safeInput.before ?? null,
    after: safeInput.after ?? null,
    createdAt,
    previousHash,
  };
  const entryHash = hashAuditEntry(payload);
  return tx.auditLog.create({
    data: { ...safeInput, createdAt, previousHash, entryHash },
  });
}

export async function recordAudit(input: AuditInput) {
  return prisma.$transaction((tx) => appendAudit(tx, input));
}

export async function recordAuditInTransaction(
  tx: Prisma.TransactionClient,
  input: AuditInput,
) {
  return appendAudit(tx, input);
}

export async function runAuditedMutation<T>(
  mutation: (tx: Prisma.TransactionClient) => Promise<T>,
  audit: (result: T) => AuditInput,
) {
  return prisma.$transaction(async (tx) => {
    await lockAuditChain(tx);
    const result = await mutation(tx);
    await appendAudit(tx, audit(result), true);
    return result;
  });
}
