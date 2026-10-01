import assert from "node:assert/strict";
import test from "node:test";
import {
  authScenarios,
  exploreDrone,
  simulatePid,
} from "../../src/features/lab/model";

test("PID simulation is deterministic and bounded", () => {
  const input = { kp: 1.2, ki: 0.35, kd: 0.08, setpoint: 60 };
  assert.deepEqual(simulatePid(input), simulatePid(input));
  assert.equal(simulatePid(input).length, 81);
  assert.ok(
    simulatePid(input).every((sample) => Math.abs(sample.control) <= 100),
  );
});

test("drone exploration stays inside documented input limits", () => {
  const low = exploreDrone({ payloadKg: -4, batteryMah: 100 });
  const high = exploreDrone({ payloadKg: 4, batteryMah: 20_000 });
  assert.equal(low.takeoffMassKg, 1.45);
  assert.equal(high.takeoffMassKg, 2.45);
  assert.ok(low.estimatedEnduranceMinutes > high.estimatedEnduranceMinutes);
});

test("every failed auth scenario stops before a protected write", () => {
  for (const [name, steps] of Object.entries(authScenarios)) {
    if (name === "valid") continue;
    assert.ok(steps.some((step) => step.state === "stop"));
    const database = steps.find((step) => step.stage === "Database");
    assert.notEqual(database?.state, "pass");
  }
});
