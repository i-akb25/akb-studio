import { ExperienceTimeline } from "./experience-timeline";

const resumeSummary = [
  {
    label: "Foundation",
    value: "Electrical Engineering",
  },
  {
    label: "Industry",
    value: "Electrical & Automation",
  },
  {
    label: "Software",
    value: "Full-stack development",
  },
  {
    label: "Working across",
    value: "Physical + digital systems",
  },
] as const;

export function ExperiencePreview() {
  return (
    <section
      id="experience"
      aria-labelledby="experience-heading"
      className="relative py-16 sm:py-20 lg:py-24 xl:py-28"
    >
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="grid gap-7 border-b border-foreground/10 pb-8 lg:grid-cols-[0.68fr_1.32fr] lg:gap-12 lg:pb-10 xl:gap-16">
          <div className="flex items-start gap-3">
            <span className="font-mono text-xs text-foreground/48">02</span>

            <span
              aria-hidden="true"
              className="mt-2 h-px w-10 bg-foreground/15"
            />

            <span
              aria-hidden="true"
              className="mt-[0.375rem] size-1.5 rounded-full border border-foreground/25"
            />

            <p className="text-sm font-medium tracking-[0.14em] text-foreground/60 uppercase">
              Experience
            </p>
          </div>

          <div className="max-w-3xl">
            <h2
              id="experience-heading"
              className="text-balance text-3xl leading-tight font-semibold tracking-[-0.035em] text-foreground sm:text-4xl lg:text-[2.75rem] xl:text-5xl"
            >
              I&apos;ve moved between industrial systems and software
              environments, and each one changed how I approach engineering.
            </h2>

            <p className="mt-4 max-w-2xl text-pretty text-base leading-7 text-foreground/70 sm:text-lg sm:leading-8">
              From substations and automation systems to full-stack product
              development, I&apos;ve learned to look at problems through both
              physical constraints and software architecture.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1.4fr_0.6fr] lg:gap-12 xl:gap-16">
          <div>
            <div className="flex items-end justify-between gap-6 border-b border-foreground/10 pb-5">
              <div>
                <p className="text-xs font-medium tracking-[0.12em] text-foreground/58 uppercase">
                  Professional route
                </p>

                <p className="mt-2 font-mono text-xs leading-5 tracking-[0.04em] text-foreground/56 sm:text-sm">
                  Bettiah(BR) → Patna(BR) → Bettiah(BR) → Nagpur(MH) → Dolvi(MH)
                </p>
              </div>

              <div
                aria-hidden="true"
                className="hidden items-center gap-2 text-foreground/24 sm:flex"
              >
                <span className="size-1.5 rounded-full border border-current" />
                <span className="h-px w-12 bg-current" />
                <span className="size-1.5 rounded-full border border-current" />
              </div>
            </div>

            <div className="mt-6">
              <ExperienceTimeline />
            </div>
          </div>

          <aside
            aria-labelledby="quick-resume-heading"
            className="self-start border-t border-foreground/10 pt-7 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8 xl:pl-10"
          >
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="size-1.5 rotate-45 border border-foreground/30"
              />

              <p className="text-xs font-medium tracking-[0.13em] text-foreground/58 uppercase">
                Quick resume
              </p>
            </div>

            <h3
              id="quick-resume-heading"
              className="mt-4 text-2xl leading-tight font-semibold tracking-[-0.025em] text-foreground sm:text-3xl"
            >
              The common thread is systems thinking.
            </h3>

            <p className="mt-4 text-sm leading-6 text-foreground/68 sm:text-base sm:leading-7">
              My roles have been different, but they all taught me to think
              about reliability, constraints, dependencies, and when to take a
              pause to find how one decision affects the rest of the system.
            </p>

            <dl className="mt-6 border-y border-foreground/10">
              {resumeSummary.map((item) => (
                <div
                  key={item.label}
                  className="grid gap-2 border-b border-foreground/10 py-4 last:border-b-0 sm:grid-cols-[7rem_1fr] sm:gap-4 lg:grid-cols-1 xl:grid-cols-[7rem_1fr]"
                >
                  <dt className="text-xs font-medium tracking-[0.1em] text-foreground/54 uppercase">
                    {item.label}
                  </dt>

                  <dd className="text-sm leading-6 text-foreground/74">
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>

            <div
              aria-hidden="true"
              className="mt-6 flex items-center gap-3 text-foreground/28"
            >
              <span className="font-mono text-[0.625rem] tracking-[0.12em]">
                2021
              </span>

              <span className="h-px flex-1 bg-current" />

              <span className="size-1.5 rounded-full border border-current" />

              <span className="h-px flex-1 bg-current" />

              <span className="font-mono text-[0.625rem] tracking-[0.12em]">
                NOW
              </span>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
