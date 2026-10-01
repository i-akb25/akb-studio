import { BadgeCheck } from "lucide-react";

import type { ProjectContentDocument } from "../server/project-content-schema";

type ProjectMetricsProps = {
  metrics: ProjectContentDocument["frontmatter"]["metrics"];
};

export function ProjectMetrics({ metrics }: ProjectMetricsProps) {
  if (!metrics.length) {
    return null;
  }

  return (
    <section
      aria-labelledby="project-measurements"
      className="border-b border-foreground/10"
    >
      <div className="mx-auto w-full max-w-[1440px] px-5 py-14 sm:px-6 sm:py-18 lg:px-8 lg:py-20 xl:px-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(13rem,0.38fr)_minmax(0,1fr)] lg:gap-14">
          <div>
            <p className="font-mono text-[0.6875rem] tracking-[0.17em] text-accent-warm uppercase">
              Test record
            </p>
            <h2
              id="project-measurements"
              className="mt-4 max-w-sm font-display text-3xl leading-tight font-semibold tracking-[-0.04em] text-foreground sm:text-4xl"
            >
              Results from the tested configuration.
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-6 text-muted">
              These values describe the recorded build, not a general product
              specification.
            </p>
          </div>

          <div className="grid divide-y divide-foreground/10 border-y border-foreground/10 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-3">
            {metrics.map((metric) => (
              <article
                key={`${metric.value}-${metric.label}`}
                className="flex min-h-64 flex-col px-1 py-7 sm:px-6 sm:py-8 xl:min-h-72"
              >
                <div className="flex items-center justify-between gap-4">
                  <BadgeCheck
                    aria-hidden="true"
                    className="size-4 text-accent-warm"
                    strokeWidth={1.6}
                  />
                  <span className="font-mono text-[0.625rem] tracking-[0.13em] text-muted-soft uppercase">
                    Verified result
                  </span>
                </div>
                <p className="mt-10 font-display text-5xl leading-none font-semibold tracking-[-0.06em] text-foreground sm:text-6xl">
                  {metric.value}
                </p>
                <p className="mt-4 text-sm font-semibold text-foreground/78">
                  {metric.label}
                </p>
                <p className="mt-3 text-xs leading-5 text-muted">
                  {metric.context}
                </p>
                <p className="mt-auto border-t border-foreground/10 pt-4 text-[0.6875rem] leading-5 text-muted-soft">
                  Basis: {metric.evidence}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
