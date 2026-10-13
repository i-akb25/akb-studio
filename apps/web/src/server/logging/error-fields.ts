function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

export function safeErrorFields(error: unknown) {
  if (!(error instanceof Error)) return { errorType: "unknown" };
  const coded = record(error);
  const meta = record(coded.meta);
  const cause = record(record(meta.driverAdapterError).cause);
  const sqlState = cause.originalCode ?? cause.code ?? meta.code;
  const kind = cause.kind;
  return {
    errorType: error.name.slice(0, 80),
    errorCode:
      typeof coded.code === "string" ? coded.code.slice(0, 80) : undefined,
    databaseCode:
      typeof sqlState === "string" && /^[0-9A-Z]{5}$/.test(sqlState)
        ? sqlState
        : undefined,
    databaseErrorKind:
      typeof kind === "string" &&
      [
        "UnsupportedNativeDataType",
        "postgres",
        "TransactionAlreadyClosed",
        "ConnectionClosed",
        "ConnectionError",
        "UniqueConstraintViolation",
        "ForeignKeyConstraintViolation",
      ].includes(kind)
        ? kind
        : undefined,
    unsupportedDatabaseType:
      kind === "UnsupportedNativeDataType" && cause.type === "void"
        ? "void"
        : undefined,
  };
}
