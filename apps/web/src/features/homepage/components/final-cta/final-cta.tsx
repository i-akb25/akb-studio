import { ArrowUpRight } from "lucide-react";

export function FinalCta() {
  return (
    <section
      id="next-waypoint"
      aria-labelledby="next-waypoint-heading"
      className="relative overflow-hidden py-16 sm:py-20 lg:py-24"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_76%_42%,var(--accent-warm-soft),transparent_28%)] opacity-30 dark:opacity-[0.14]"
      />

      <div className="relative mx-auto w-full max-w-[1440px] px-5 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex items-center gap-4 font-mono text-[0.625rem] tracking-[0.2em] text-muted uppercase">
          <span
            aria-hidden="true"
            className="size-1.5 rounded-full bg-accent-warm"
          />
          <p>Next destination</p>
          <span aria-hidden="true" className="h-px flex-1 bg-border-strong" />
          <p className="hidden sm:block">Ideas travel further together</p>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.6fr)_minmax(11rem,0.48fr)_minmax(14rem,0.5fr)] lg:items-center lg:gap-8 xl:gap-12">
          <div>
            <h2
              id="next-waypoint-heading"
              className="max-w-5xl text-balance font-serif text-[clamp(2.5rem,5vw,5.6rem)] leading-[0.98] font-medium tracking-[-0.045em] text-foreground"
            >
              Have a role, project, or engineering problem worth discussing?
            </h2>

            <p className="mt-6 max-w-3xl text-pretty text-base leading-7 text-muted sm:text-lg sm:leading-8">
              I&apos;m interested in work where engineering judgment matters:
              systems that need to be understood properly, built carefully, and
              improved with evidence rather than noise.
            </p>
          </div>

          <div className="flex items-center gap-4 text-accent-warm lg:justify-center">
            <p className="-rotate-3 font-serif text-3xl leading-[0.92] italic tracking-[-0.04em] sm:text-4xl">
              Good
              <br />
              engineering
              <br />
              travels far.
            </p>
            <span
              aria-hidden="true"
              className="hidden h-px min-w-10 flex-1 bg-current opacity-45 lg:block"
            />
          </div>

          <div className="lg:justify-self-end">
            <a
              href="/contact"
              className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition-opacity duration-200 hover:opacity-88 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-4 focus-visible:ring-offset-background sm:w-auto lg:min-w-56 motion-reduce:transition-none"
            >
              Start a conversation
              <ArrowUpRight
                aria-hidden="true"
                className="size-4"
                strokeWidth={1.6}
              />
            </a>

            <p className="mt-5 font-mono text-[0.625rem] leading-5 tracking-[0.18em] text-muted uppercase">
              Same curiosity.
              <br />A brighter tomorrow.
            </p>
          </div>
        </div>

        <div className="mt-12 grid gap-7 border-t border-border pt-7 sm:grid-cols-3 lg:mt-14">
          <div>
            <p className="font-mono text-[0.625rem] tracking-[0.14em] text-muted uppercase">
              Looking for
            </p>
            <p className="mt-3 max-w-sm text-base leading-7 text-foreground">
              Meaningful engineering work and difficult problems.
            </p>
          </div>

          <div>
            <p className="font-mono text-[0.625rem] tracking-[0.14em] text-muted uppercase">
              Open to
            </p>
            <p className="mt-3 max-w-sm text-base leading-7 text-foreground">
              Roles, collaboration, research, and serious ideas.
            </p>
          </div>

          <div>
            <p className="font-mono text-[0.625rem] tracking-[0.14em] text-muted uppercase">
              Current route
            </p>
            <p className="mt-3 max-w-sm text-base leading-7 text-foreground">
              Building AKB Studio and continuing to learn across systems.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
