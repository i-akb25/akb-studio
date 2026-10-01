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
      merged.set(
        `${record.id}-conflict-${Date.parse(record.updatedAt) || Date.now()}`,
        {
          ...record,
          id: `${record.id}-conflict-${Date.parse(record.updatedAt) || Date.now()}`,
          title: `${record.title} (import conflict)`,
        },
      );
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
      ["collection", "note", "contact-draft"].includes(record.kind ?? "") &&
      typeof record.title === "string" &&
      typeof record.body === "string" &&
      typeof record.revision === "number" &&
      typeof record.updatedAt === "string",
  );
}
