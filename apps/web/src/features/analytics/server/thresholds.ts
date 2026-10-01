export type AlertLevel = "healthy" | "warning" | "critical";

export type OperationalAlert = {
  id: string;
  level: AlertLevel;
  label: string;
  detail: string;
};

export function failureAlert(input: {
  id: string;
  label: string;
  count: number;
  warningAt: number;
  criticalAt: number;
}): OperationalAlert {
  const level =
    input.count >= input.criticalAt
      ? "critical"
      : input.count >= input.warningAt
        ? "warning"
        : "healthy";
  return {
    id: input.id,
    level,
    label: input.label,
    detail: `${input.count} failure${input.count === 1 ? "" : "s"} in the current reporting window.`,
  };
}

export function freshnessAlert(input: {
  id: string;
  label: string;
  observedAt?: Date | null;
  warningAfterHours: number;
  criticalAfterHours: number;
  now?: Date;
}): OperationalAlert {
  if (!input.observedAt)
    return {
      id: input.id,
      level: "warning",
      label: input.label,
      detail: "No successful verification has been recorded.",
    };
  const ageHours =
    ((input.now ?? new Date()).getTime() - input.observedAt.getTime()) /
    3_600_000;
  const level =
    ageHours >= input.criticalAfterHours
      ? "critical"
      : ageHours >= input.warningAfterHours
        ? "warning"
        : "healthy";
  return {
    id: input.id,
    level,
    label: input.label,
    detail: `Last verified ${Math.max(0, Math.floor(ageHours))} hour${Math.floor(ageHours) === 1 ? "" : "s"} ago.`,
  };
}
