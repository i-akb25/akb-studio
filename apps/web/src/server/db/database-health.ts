import "server-only";

import { prisma } from "@/server/db/prisma";

const FREE_ALLOWANCE_BYTES = 500 * 1024 * 1024;

export type DatabaseHealth = {
  available: boolean;
  bytes: number | null;
  allowanceBytes: number;
  percent: number | null;
  warning: "none" | "notice" | "warning" | "critical" | "unavailable";
};

function withTimeout<T>(promise: Promise<T>, milliseconds: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("database_timeout")), milliseconds),
    ),
  ]);
}

export async function getDatabaseHealth(): Promise<DatabaseHealth> {
  if (!process.env.DATABASE_URL) {
    return {
      available: false,
      bytes: null,
      allowanceBytes: FREE_ALLOWANCE_BYTES,
      percent: null,
      warning: "unavailable",
    };
  }

  try {
    const rows = await withTimeout(
      prisma.$queryRaw<Array<{ bytes: bigint }>>`
        SELECT pg_database_size(current_database())::bigint AS bytes
      `,
      2_500,
    );
    const bytes = Number(rows[0]?.bytes ?? 0);
    const percent = (bytes / FREE_ALLOWANCE_BYTES) * 100;
    const warning =
      percent >= 90
        ? "critical"
        : percent >= 80
          ? "warning"
          : percent >= 60
            ? "notice"
            : "none";
    return {
      available: true,
      bytes,
      allowanceBytes: FREE_ALLOWANCE_BYTES,
      percent,
      warning,
    };
  } catch {
    return {
      available: false,
      bytes: null,
      allowanceBytes: FREE_ALLOWANCE_BYTES,
      percent: null,
      warning: "unavailable",
    };
  }
}
