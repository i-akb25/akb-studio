import "server-only";

import { prisma } from "@/server/db/prisma";

// Conservative local warning budget, not a claim about the provider's plan.
const STORAGE_WARNING_BUDGET_BYTES = 500 * 1024 * 1024;

export type DatabaseHealth = {
  available: boolean;
  bytes: number | null;
  allowanceBytes: number;
  percent: number | null;
  warning: "none" | "notice" | "warning" | "critical" | "unavailable";
};

async function withTimeout<T>(
  promise: Promise<T>,
  milliseconds: number,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("database_timeout")),
          milliseconds,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

export async function getDatabaseHealth(): Promise<DatabaseHealth> {
  if (!process.env.DATABASE_URL) {
    return {
      available: false,
      bytes: null,
      allowanceBytes: STORAGE_WARNING_BUDGET_BYTES,
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
    const percent = (bytes / STORAGE_WARNING_BUDGET_BYTES) * 100;
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
      allowanceBytes: STORAGE_WARNING_BUDGET_BYTES,
      percent,
      warning,
    };
  } catch {
    return {
      available: false,
      bytes: null,
      allowanceBytes: STORAGE_WARNING_BUDGET_BYTES,
      percent: null,
      warning: "unavailable",
    };
  }
}
