"use client";

import { RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import {
  type AuthScenario,
  authScenarios,
  exploreDrone,
  simulatePid,
} from "../model";

const pidDefaults = { kp: 1.2, ki: 0.35, kd: 0.08, setpoint: 60 };
const droneDefaults = { payloadKg: 0.25, batteryMah: 4_200 };

function RangeField({
  label,
  value,
  min,
  max,
  step,
  unit = "",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid gap-2 border-b border-border pb-4">
      <span className="flex items-center justify-between gap-4 text-sm">
        {label}
        <output className="font-mono text-xs text-accent-warm">
          {value}
          {unit}
        </output>
      </span>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function ResetButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 border border-border px-3 py-2 text-xs font-semibold uppercase"
    >
      <RotateCcw className="size-3.5" aria-hidden="true" /> Reset
    </button>
  );
}

export function EngineeringLab() {
  const [pid, setPid] = useState(pidDefaults);
  const [drone, setDrone] = useState(droneDefaults);
  const [scenario, setScenario] = useState<AuthScenario>("valid");
  const samples = useMemo(() => simulatePid(pid), [pid]);
  const droneResult = useMemo(() => exploreDrone(drone), [drone]);
  const points = samples
    .map((sample, index) => {
      const x = (index / (samples.length - 1)) * 600;
      const y = 190 - (Math.max(0, Math.min(100, sample.output)) / 100) * 170;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 sm:px-8 lg:px-12">
      <section className="grid gap-10 border-b border-border py-14 lg:grid-cols-[0.7fr_1.3fr]">
        <div>
          <p className="font-mono text-xs tracking-[0.14em] text-accent-warm uppercase">
            01 / Control response
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em]">
            PID tuning visualizer
          </h2>
          <p className="mt-4 text-sm leading-7 text-muted">
            A deterministic first-order plant model with a 0.1 second step,
            bounded controller output and integral anti-windup. It explains
            controller behaviour; it is not a flight controller.
          </p>
        </div>
        <div className="grid gap-8 xl:grid-cols-[0.62fr_1.38fr]">
          <div className="space-y-4">
            <RangeField
              label="Proportional"
              value={pid.kp}
              min={0}
              max={8}
              step={0.05}
              onChange={(kp) => setPid({ ...pid, kp })}
            />
            <RangeField
              label="Integral"
              value={pid.ki}
              min={0}
              max={4}
              step={0.05}
              onChange={(ki) => setPid({ ...pid, ki })}
            />
            <RangeField
              label="Derivative"
              value={pid.kd}
              min={0}
              max={3}
              step={0.01}
              onChange={(kd) => setPid({ ...pid, kd })}
            />
            <RangeField
              label="Setpoint"
              value={pid.setpoint}
              min={10}
              max={100}
              step={1}
              unit="%"
              onChange={(setpoint) => setPid({ ...pid, setpoint })}
            />
            <ResetButton onClick={() => setPid(pidDefaults)} />
          </div>
          <figure>
            <svg
              viewBox="0 0 600 210"
              role="img"
              aria-label="Simulated PID response over eight seconds"
              className="w-full border border-border bg-surface"
            >
              <title>Simulated PID response</title>
              <line
                x1="0"
                x2="600"
                y1={190 - pid.setpoint * 1.7}
                y2={190 - pid.setpoint * 1.7}
                className="stroke-foreground/25"
                strokeDasharray="8 8"
              />
              <polyline
                points={points}
                fill="none"
                className="stroke-accent-warm"
                strokeWidth="3"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            <figcaption className="mt-3 flex justify-between font-mono text-xs text-muted">
              <span>0 s</span>
              <span>Response / target {pid.setpoint}%</span>
              <span>8 s</span>
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="grid gap-10 border-b border-border py-14 lg:grid-cols-[0.7fr_1.3fr]">
        <div>
          <p className="font-mono text-xs tracking-[0.14em] text-accent-warm uppercase">
            02 / Flight assumptions
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em]">
            Drone parameter explorer
          </h2>
          <p className="mt-4 text-sm leading-7 text-muted">
            Uses the documented 3S 4,200 mAh project baseline, an 80%
            usable-energy assumption and a mass-scaled hover-power model.
            Results are estimates, not operational or safety guidance.
          </p>
        </div>
        <div className="grid gap-8 sm:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-5">
            <RangeField
              label="Payload"
              value={drone.payloadKg}
              min={0}
              max={1}
              step={0.05}
              unit=" kg"
              onChange={(payloadKg) => setDrone({ ...drone, payloadKg })}
            />
            <RangeField
              label="Battery"
              value={drone.batteryMah}
              min={3000}
              max={6000}
              step={100}
              unit=" mAh"
              onChange={(batteryMah) => setDrone({ ...drone, batteryMah })}
            />
            <ResetButton onClick={() => setDrone(droneDefaults)} />
          </div>
          <dl className="grid grid-cols-2 border-t border-border">
            {[
              ["Take-off mass", `${droneResult.takeoffMassKg} kg`],
              ["Hover power", `${droneResult.estimatedHoverPowerWatts} W`],
              [
                "Modelled endurance",
                `${droneResult.estimatedEnduranceMinutes} min`,
              ],
              [
                "Payload fraction",
                `${Math.round(droneResult.payloadRatio * 100)}%`,
              ],
            ].map(([label, value]) => (
              <div key={label} className="border-r border-b border-border p-5">
                <dt className="text-xs text-muted uppercase">{label}</dt>
                <dd className="mt-3 text-2xl font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="grid gap-10 py-14 lg:grid-cols-[0.7fr_1.3fr]">
        <div>
          <p className="font-mono text-xs tracking-[0.14em] text-accent-warm uppercase">
            03 / Request boundary
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em]">
            Authentication-flow debugger
          </h2>
          <p className="mt-4 text-sm leading-7 text-muted">
            A client-side state-machine walkthrough. It sends no credentials and
            does not probe the live authentication system.
          </p>
        </div>
        <div>
          <label className="grid gap-2 text-sm font-medium">
            Scenario
            <select
              value={scenario}
              onChange={(event) =>
                setScenario(event.target.value as AuthScenario)
              }
              className="max-w-md border border-border bg-surface p-3"
            >
              <option value="valid">Valid protected request</option>
              <option value="invalid-input">Invalid input</option>
              <option value="expired-session">Expired session</option>
              <option value="rate-limited">Rate limited</option>
              <option value="database-unavailable">Database unavailable</option>
            </select>
          </label>
          <ol className="mt-6 border-t border-border">
            {authScenarios[scenario].map((step, index) => (
              <li
                key={step.stage}
                className="grid gap-2 border-b border-border py-4 sm:grid-cols-[3rem_10rem_1fr]"
              >
                <span className="font-mono text-xs text-muted">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <strong
                  className={
                    step.state === "stop"
                      ? "text-red-500"
                      : step.state === "skip"
                        ? "text-muted"
                        : "text-accent-warm"
                  }
                >
                  {step.stage} / {step.state}
                </strong>
                <span className="text-sm text-muted">{step.detail}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}
