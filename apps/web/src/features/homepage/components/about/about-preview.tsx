import { AboutPortrait } from "./about-portrait";

const principles = [
  {
    index: "01",
    label: "Forward with purpose",
    value:
      "I try to understand how the parts influence one another before deciding what should change.",
  },
  {
    index: "02",
    label: "Build with curiosity",
    value:
      "I prefer clear decisions, maintainable structure, and evidence over unnecessary complexity.",
  },
  {
    index: "03",
    label: "Move with intent",
    value:
      "Moving across software, automation, hardware, AI, and new environments keeps changing how I think about engineering.",
  },
] as const;

export function AboutPreview() {
  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      className="relative py-16 sm:py-20 lg:py-24 xl:py-28"
    >
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="grid gap-7 border-b border-foreground/10 pb-8 lg:grid-cols-[0.68fr_1.32fr] lg:gap-12 lg:pb-10 xl:gap-16">
          <div className="flex items-start gap-3">
            <span className="font-mono text-xs text-foreground/48">01</span>

            <span
              aria-hidden="true"
              className="mt-2 h-px w-10 bg-foreground/15"
            />

            <span
              aria-hidden="true"
              className="mt-[0.375rem] size-1.5 rounded-full border border-foreground/25"
            />

            <p className="text-sm font-medium tracking-[0.14em] text-foreground/60 uppercase">
              About the journey
            </p>
          </div>

          <div className="max-w-3xl">
            <h2
              id="about-heading"
              className="text-balance text-3xl leading-tight font-semibold tracking-[-0.035em] text-foreground sm:text-4xl lg:text-[2.75rem] xl:text-5xl"
            >
              I like understanding how things work before deciding how they
              should be built.
            </h2>

            <p className="mt-4 max-w-2xl text-pretty text-base leading-7 text-foreground/70 sm:text-lg sm:leading-8">
              My path started with electrical engineering and gradually moved
              through automation, robotics, software, and intelligent systems. I
              still think of those areas as connected rather than separate.
            </p>
          </div>
        </div>

        <div className="mt-8 grid items-start gap-10 lg:grid-cols-[1fr_1.08fr] lg:gap-12 xl:gap-16">
          <AboutPortrait />

          <div className="lg:pt-1">
            <div className="max-w-2xl">
              <p className="text-pretty text-base leading-7 text-foreground/70 sm:text-lg sm:leading-8">
                I&apos;m drawn to the parts of engineering where software has to
                respect physical constraints, systems have to remain
                understandable as they grow, and good solutions depend more on
                sound decisions than on chasing the newest tool.
              </p>

              <p className="mt-4 text-pretty text-base leading-7 text-foreground/70 sm:text-lg sm:leading-8">
                Travel has shaped that thinking more than I expected. Different
                places make you notice different infrastructure, habits,
                trade-offs, and ways of solving everyday problems. I tend to
                carry those observations back into my work, whether I’m thinking
                about software architecture, automation, interfaces, or how
                people interact with a system.
              </p>

              <p className="mt-4 text-pretty text-base leading-7 text-foreground/70 sm:text-lg sm:leading-8">
                This portfolio is where I bring that journey together: the
                projects, decisions, mistakes, experiments, and ideas that have
                influenced how I work.
              </p>
            </div>

            <div className="mt-8 border-y border-foreground/10">
              {principles.map((principle) => (
                <div
                  key={principle.index}
                  className="grid gap-3 border-b border-foreground/10 py-4 last:border-b-0 sm:grid-cols-[3rem_8rem_1fr] sm:gap-5 sm:py-5"
                >
                  <span className="font-mono text-xs text-foreground/46">
                    {principle.index}
                  </span>

                  <p className="text-xs font-medium tracking-[0.1em] text-foreground/58 uppercase">
                    {principle.label}
                  </p>

                  <p className="text-sm leading-6 text-foreground/70 sm:text-base sm:leading-7">
                    {principle.value}
                  </p>
                </div>
              ))}
            </div>

            <div
              aria-hidden="true"
              className="mt-6 flex items-center gap-3 text-foreground/24"
            >
              <span className="size-1.5 rounded-full border border-current" />
              <span className="h-px w-12 bg-current" />
              <span className="font-mono text-[0.625rem] tracking-[0.12em]">
                ALWAYS IN MOTION
              </span>
              <span className="h-px flex-1 bg-current" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
