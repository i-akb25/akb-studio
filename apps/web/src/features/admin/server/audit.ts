import "server-only";

import { createHash } from "node:crypto";
import type { AuditAction, Prisma } from "@generated/prisma/client";
import { prisma } from "@/server/db/prisma";

type AuditInput = {
  actorId?: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  before?: Prisma.InputJsonValue;
  after?: Prisma.InputJsonValue;
};

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

async function appendAudit(tx: Prisma.TransactionClient, input: AuditInput) {
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
    createdAt: createdAt.toISOString(),
    previousHash,
  };
  const entryHash = createHash("sha256")
    .update(canonical(payload))
    .digest("hex");
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
    const result = await mutation(tx);
    await appendAudit(tx, audit(result));
    return result;
  });
}
