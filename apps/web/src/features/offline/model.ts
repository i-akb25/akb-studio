export type OfflineRecordKind = "collection" | "note" | "contact-draft";

export type OfflineRecord = {
  id: string;
  kind: OfflineRecordKind;
  title: string;
  body: string;
  url?: string;
  revision: number;
  updatedAt: string;
};

export function mergeOfflineRecords(
  local: OfflineRecord[],
  incoming: OfflineRecord[],
): OfflineRecord[] {
  const merged = new Map(local.map((record) => [record.id, record]));
  for (const record of incoming) {
    const current = merged.get(record.id);
    if (!current || record.revision > current.revision) {
      merged.set(record.id, record);
      continue;
    }
    if (
      record.revision === current.revision &&
      JSON.stringify(record) !== JSON.stringify(current)
    ) {
      const prefix = `${record.id}-conflict-${Date.parse(record.updatedAt) || 0}`;
      let conflictId = prefix;
      let suffix = 1;
      while (merged.has(conflictId)) {
        const existing = merged.get(conflictId);
        if (
          existing &&
          existing.body === record.body &&
          existing.url === record.url &&
          existing.revision === record.revision &&
          existing.kind === record.kind &&
          existing.updatedAt === record.updatedAt &&
          existing.title === `${record.title} (import conflict)`
        )
          break;
        conflictId = `${prefix}-${suffix++}`;
      }
      merged.set(conflictId, {
        ...record,
        id: conflictId,
        title: `${record.title} (import conflict)`,
      });
    }
  }
  return [...merged.values()].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
}

export function isOfflineRecord(value: unknown): value is OfflineRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<OfflineRecord>;
  return Boolean(
    typeof record.id === "string" &&
      record.id.length > 0 &&
      record.id.length <= 300 &&
      ["collection", "note", "contact-draft"].includes(record.kind ?? "") &&
      typeof record.title === "string" &&
      record.title.length <= 200 &&
      typeof record.body === "string" &&
      record.body.length <= 10_000 &&
      (record.url === undefined ||
        (typeof record.url === "string" && record.url.length <= 1_000)) &&
      typeof record.revision === "number" &&
      Number.isSafeInteger(record.revision) &&
      record.revision >= 1 &&
      typeof record.updatedAt === "string" &&
      Number.isFinite(Date.parse(record.updatedAt)),
  );
}
