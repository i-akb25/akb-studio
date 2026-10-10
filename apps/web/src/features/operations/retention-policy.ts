export const DAY_MS = 86_400_000;

export function boundedRetentionDays(
  value: string | undefined,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  const parsed = Number(value ?? fallback);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(minimum, Math.min(maximum, Math.floor(parsed)));
}

export function retentionDeadline(now: Date, days: number): Date {
  return new Date(now.getTime() + days * DAY_MS);
}

export function retentionCutoff(now: Date, days: number): Date {
  return new Date(now.getTime() - days * DAY_MS);
}
