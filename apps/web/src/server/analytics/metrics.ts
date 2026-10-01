import "server-only";

import { prisma } from "@/server/db/prisma";
import { logger, safeErrorFields } from "@/server/logging/logger";

function utcDay(now = new Date()) {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

export function normalizeMetricTarget(value?: string): string {
  const target = value?.trim().toLowerCase() ?? "";
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(target) ? target.slice(0, 120) : "";
}

export async function recordAnalyticsMetric(input: {
  kind: string;
  target?: string;
  value?: number;
  failed?: boolean;
}) {
  const now = new Date();
  const capturedOn = utcDay(now);
  const target = normalizeMetricTarget(input.target);
  const value = Math.max(0, Math.min(Math.round(input.value ?? 0), 86_400_000));
  try {
    await prisma.analyticsMetric.upsert({
      where: {
        capturedOn_kind_target: { capturedOn, kind: input.kind, target },
      },
      create: {
        capturedOn,
        kind: input.kind,
        target,
        count: 1,
        totalValue: value,
        failures: input.failed ? 1 : 0,
        lastSeenAt: now,
      },
      update: {
        count: { increment: 1 },
        totalValue: { increment: value },
        failures: { increment: input.failed ? 1 : 0 },
        lastSeenAt: now,
      },
    });
  } catch (error) {
    logger.warn({
      event: "analytics_metric_write_failed",
      kind: input.kind,
      ...safeErrorFields(error),
    });
  }
}

export async function recordOperationalHealth(input: {
  key: string;
  status: "healthy" | "degraded" | "critical" | "disabled";
  summary?: string;
  latencyMs?: number;
}) {
  const now = new Date();
  const failed = input.status === "degraded" || input.status === "critical";
  try {
    const current = await prisma.operationalHealth.findUnique({
      where: { key: input.key },
      select: { consecutiveFailures: true },
    });
    await prisma.operationalHealth.upsert({
      where: { key: input.key },
      create: {
        key: input.key,
        status: input.status,
        summary: input.summary,
        latencyMs: input.latencyMs,
        consecutiveFailures: failed ? 1 : 0,
        lastSuccessAt: failed || input.status === "disabled" ? null : now,
        lastFailureAt: failed ? now : null,
        lastCheckedAt: now,
      },
      update: {
        status: input.status,
        summary: input.summary,
        latencyMs: input.latencyMs,
        consecutiveFailures: failed
          ? (current?.consecutiveFailures ?? 0) + 1
          : 0,
        ...(failed
          ? { lastFailureAt: now }
          : input.status === "healthy"
            ? { lastSuccessAt: now }
            : {}),
        lastCheckedAt: now,
      },
    });
  } catch (error) {
    logger.warn({
      event: "operational_health_write_failed",
      component: input.key,
      ...safeErrorFields(error),
    });
  }
}
