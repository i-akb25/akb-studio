export type PidInput = {
  kp: number;
  ki: number;
  kd: number;
  setpoint: number;
};

export type PidSample = {
  time: number;
  output: number;
  control: number;
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function simulatePid(input: PidInput): PidSample[] {
  const kp = clamp(input.kp, 0, 8);
  const ki = clamp(input.ki, 0, 4);
  const kd = clamp(input.kd, 0, 3);
  const setpoint = clamp(input.setpoint, 10, 100);
  const samples: PidSample[] = [];
  const dt = 0.1;
  const plantTimeConstant = 0.8;
  let output = 0;
  let integral = 0;
  let previousError = setpoint;

  for (let step = 0; step <= 80; step += 1) {
    const error = setpoint - output;
    integral = clamp(integral + error * dt, -100, 100);
    const derivative = (error - previousError) / dt;
    const control = clamp(
      kp * error + ki * integral + kd * derivative,
      -100,
      100,
    );
    output += ((control - output) / plantTimeConstant) * dt;
    samples.push({
      time: Number((step * dt).toFixed(1)),
      output: Number(output.toFixed(3)),
      control: Number(control.toFixed(3)),
    });
    previousError = error;
  }
  return samples;
}

export type DroneInput = { payloadKg: number; batteryMah: number };

export function exploreDrone(input: DroneInput) {
  const payloadKg = clamp(input.payloadKg, 0, 1);
  const batteryMah = clamp(input.batteryMah, 3_000, 6_000);
  const baseMassKg = 1.45;
  const voltage = 11.1;
  const usableFraction = 0.8;
  const basePowerWatts = 150;
  const takeoffMassKg = baseMassKg + payloadKg;
  const powerWatts = basePowerWatts * (takeoffMassKg / baseMassKg) ** 1.5;
  const usableWattHours = (batteryMah / 1_000) * voltage * usableFraction;
  const enduranceMinutes = (usableWattHours / powerWatts) * 60;
  return {
    takeoffMassKg: Number(takeoffMassKg.toFixed(2)),
    estimatedHoverPowerWatts: Math.round(powerWatts),
    estimatedEnduranceMinutes: Number(enduranceMinutes.toFixed(1)),
    payloadRatio: Number((payloadKg / takeoffMassKg).toFixed(2)),
  };
}

export type AuthScenario =
  | "valid"
  | "invalid-input"
  | "expired-session"
  | "rate-limited"
  | "database-unavailable";

export const authScenarios: Record<
  AuthScenario,
  readonly { stage: string; state: "pass" | "stop" | "skip"; detail: string }[]
> = {
  valid: [
    { stage: "Origin", state: "pass", detail: "Same-origin request accepted." },
    {
      stage: "Validation",
      state: "pass",
      detail: "Schema and size limits pass.",
    },
    {
      stage: "Rate limit",
      state: "pass",
      detail: "Request is inside its budget.",
    },
    {
      stage: "Session",
      state: "pass",
      detail: "Signed session and 2FA are valid.",
    },
    { stage: "Database", state: "pass", detail: "The transaction commits." },
    {
      stage: "Response",
      state: "pass",
      detail: "A minimal success response is returned.",
    },
  ],
  "invalid-input": [
    { stage: "Origin", state: "pass", detail: "Same-origin request accepted." },
    {
      stage: "Validation",
      state: "stop",
      detail: "Strict schema rejects unknown or malformed fields.",
    },
    {
      stage: "Rate limit",
      state: "skip",
      detail: "No protected operation runs.",
    },
    { stage: "Session", state: "skip", detail: "No session data is used." },
    { stage: "Database", state: "skip", detail: "No write is attempted." },
    {
      stage: "Response",
      state: "pass",
      detail: "A controlled 400 response is returned.",
    },
  ],
  "expired-session": [
    { stage: "Origin", state: "pass", detail: "Same-origin request accepted." },
    { stage: "Validation", state: "pass", detail: "Request shape is valid." },
    {
      stage: "Rate limit",
      state: "pass",
      detail: "Request is inside its budget.",
    },
    {
      stage: "Session",
      state: "stop",
      detail: "Expired authentication cannot authorize the action.",
    },
    { stage: "Database", state: "skip", detail: "No write is attempted." },
    {
      stage: "Response",
      state: "pass",
      detail: "The client is sent to sign in again.",
    },
  ],
  "rate-limited": [
    { stage: "Origin", state: "pass", detail: "Same-origin request accepted." },
    { stage: "Validation", state: "pass", detail: "Request shape is valid." },
    {
      stage: "Rate limit",
      state: "stop",
      detail: "The current window has no remaining capacity.",
    },
    {
      stage: "Session",
      state: "skip",
      detail: "The protected action is not evaluated.",
    },
    {
      stage: "Database",
      state: "skip",
      detail: "No domain write is attempted.",
    },
    {
      stage: "Response",
      state: "pass",
      detail: "A 429 response includes a retry interval.",
    },
  ],
  "database-unavailable": [
    { stage: "Origin", state: "pass", detail: "Same-origin request accepted." },
    { stage: "Validation", state: "pass", detail: "Request shape is valid." },
    {
      stage: "Rate limit",
      state: "pass",
      detail: "Request is inside its budget.",
    },
    { stage: "Session", state: "pass", detail: "Authentication is valid." },
    {
      stage: "Database",
      state: "stop",
      detail: "The transaction fails without a partial domain write.",
    },
    {
      stage: "Response",
      state: "pass",
      detail: "A controlled unavailable state is returned.",
    },
  ],
};
