import { createHash } from "node:crypto";

export type AuditIntegrityEntry = {
  id: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  before: unknown;
  after: unknown;
  previousHash: string | null;
  entryHash: string | null;
  createdAt: Date;
};

export type AuditIntegrityResult = {
  valid: boolean;
  count: number;
  checkpointed: boolean;
  headHash: string | null;
  errorId?: string;
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

export function hashAuditEntry(
  entry: Omit<AuditIntegrityEntry, "id" | "entryHash">,
): string {
  return createHash("sha256")
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
}

export function verifyAuditEntries(
  entries: readonly AuditIntegrityEntry[],
): AuditIntegrityResult {
  const ordered = [...entries].sort(
    (left, right) =>
      left.createdAt.getTime() - right.createdAt.getTime() ||
      left.id.localeCompare(right.id),
  );
  let prior: string | null = null;
  for (const [index, entry] of ordered.entries()) {
    if (!entry.entryHash) {
      return {
        valid: false,
        count: ordered.length,
        checkpointed: Boolean(ordered[0]?.previousHash),
        headHash: prior,
        errorId: entry.id,
      };
    }
    if (index > 0 && entry.previousHash !== prior) {
      return {
        valid: false,
        count: ordered.length,
        checkpointed: Boolean(ordered[0]?.previousHash),
        headHash: prior,
        errorId: entry.id,
      };
    }
    if (hashAuditEntry(entry) !== entry.entryHash) {
      return {
        valid: false,
        count: ordered.length,
        checkpointed: Boolean(ordered[0]?.previousHash),
        headHash: prior,
        errorId: entry.id,
      };
    }
    prior = entry.entryHash;
  }
  return {
    valid: true,
    count: ordered.length,
    checkpointed: Boolean(ordered[0]?.previousHash),
    headHash: prior,
  };
}
