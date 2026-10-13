const databaseMessages: Record<string, { message: string; status: number }> = {
  P1001: {
    message: "The database is temporarily unreachable. Try again shortly.",
    status: 503,
  },
  P1017: {
    message: "The database connection closed unexpectedly. Try again.",
    status: 503,
  },
  P2002: {
    message: "A record with the same unique value already exists.",
    status: 409,
  },
  P2003: {
    message: "A referenced record or media asset does not exist.",
    status: 409,
  },
  P2010: {
    message:
      "A database query failed. Share this reference with the maintainer; refreshing alone may not resolve it.",
    status: 500,
  },
  P2021: {
    message:
      "The required database table is not available yet. Apply the approved production migration and try again.",
    status: 503,
  },
  P2022: {
    message:
      "The database schema is missing a required column. Apply the approved production migration and try again.",
    status: 503,
  },
  P2024: {
    message:
      "The database is busy or a connection could not be acquired. Try again shortly.",
    status: 503,
  },
  P2025: {
    message: "The record no longer exists. Refresh the page and try again.",
    status: 404,
  },
  P2028: {
    message:
      "The database transaction could not complete. Refresh the record before retrying.",
    status: 503,
  },
  P2034: {
    message:
      "A concurrent database update prevented this change. Refresh the record before retrying.",
    status: 409,
  },
};

export function databaseFailure(code: string | undefined) {
  return code && Object.hasOwn(databaseMessages, code)
    ? databaseMessages[code]
    : undefined;
}
