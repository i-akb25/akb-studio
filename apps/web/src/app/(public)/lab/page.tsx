import type { Metadata } from "next";
import { EngineeringLab } from "@/features/lab/components/engineering-lab";

export const metadata: Metadata = {
  title: "Engineering Lab | AKB Studio",
  description:
    "Deterministic, documented engineering demonstrations for controls, drone assumptions and secure web request flows.",
};

export default function EngineeringLabPage() {
  return (
    <main>
      <header className="mx-auto max-w-7xl border-b border-border px-5 pt-28 pb-16 sm:px-8 lg:px-12 lg:pt-40">
        <p className="font-mono text-xs tracking-[0.16em] text-accent-warm uppercase">
          Engineering lab / reproducible models
        </p>
        <h1 className="mt-6 max-w-5xl text-5xl leading-[0.96] font-semibold tracking-[-0.055em] sm:text-7xl">
          Change the assumptions. Inspect the response.
        </h1>
        <p className="mt-7 max-w-3xl text-lg leading-8 text-muted">
          These demonstrations expose their limits and reset to documented
          baselines. They do not manufacture project evidence, hide failure
          paths or turn estimates into claims.
        </p>
      </header>
      <EngineeringLab />
    </main>
  );
}
