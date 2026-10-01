import { SkillDomain } from "./skill-domain";

const skillDomains = [
  {
    index: "01",
    title: "Software Engineering",
    shortLabel: "Software",
    description:
      "I build full-stack applications with an emphasis on maintainable architecture, clear data flow, secure boundaries, and production-ready delivery.",
    skills: [
      "TypeScript",
      "React",
      "Next.js",
      "Node.js",
      "REST APIs",
      "PostgreSQL",
    ],
    icon: "software",
  },
  {
    index: "02",
    title: "AI & Intelligent Systems",
    shortLabel: "Intelligence",
    description:
      "I use AI where it improves the system rather than treating it as a feature on its own, combining retrieval, orchestration, computer vision, and application logic.",
    skills: [
      "RAG",
      "Semantic Search",
      "Prompt Orchestration",
      "Computer Vision",
      "AI Integration",
    ],
    icon: "ai",
  },
  {
    index: "03",
    title: "Electrical & Automation",
    shortLabel: "Automation",
    description:
      "My electrical engineering foundation keeps me connected to physical systems, controls, machines, industrial environments, and the constraints software eventually has to respect.",
    skills: [
      "Electrical Systems",
      "Automation",
      "Control Systems",
      "Electrical Machines",
      "Industrial Systems",
    ],
    icon: "automation",
  },
  {
    index: "04",
    title: "Embedded Systems & Robotics",
    shortLabel: "Embedded",
    description:
      "I enjoy the boundary where software becomes physical: sensors, controllers, embedded computation, autonomous behavior, and robotic systems.",
    skills: [
      "Arduino",
      "Raspberry Pi",
      "Sensors",
      "Embedded Control",
      "Robotics",
      "Autonomous Systems",
    ],
    icon: "embedded",
  },
] as const;

export function SkillsSnapshot() {
  return (
    <section
      id="skills"
      aria-labelledby="skills-heading"
      className="relative py-16 sm:py-20 lg:py-24 xl:py-28"
    >
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="grid gap-7 border-b border-foreground/10 pb-8 lg:grid-cols-[0.68fr_1.32fr] lg:gap-12 lg:pb-10 xl:gap-16">
          <div className="flex items-start gap-3">
            <span className="font-mono text-xs text-foreground/48">04</span>

            <span
              aria-hidden="true"
              className="mt-2 h-px w-10 bg-foreground/15"
            />

            <span
              aria-hidden="true"
              className="mt-[0.375rem] size-1.5 rotate-45 border border-foreground/25"
            />

            <p className="text-sm font-medium tracking-[0.14em] text-foreground/60 uppercase">
              Engineering domains
            </p>
          </div>

          <div className="max-w-3xl">
            <h2
              id="skills-heading"
              className="text-balance text-3xl leading-tight font-semibold tracking-[-0.035em] text-foreground sm:text-4xl lg:text-[2.75rem] xl:text-5xl"
            >
              My work sits where several engineering disciplines meet.
            </h2>

            <p className="mt-4 max-w-2xl text-pretty text-base leading-7 text-foreground/70 sm:text-lg sm:leading-8">
              I do not think of these as separate skill lists. Software,
              intelligence, automation, and hardware often become different
              parts of the same system, and understanding those connections is
              where I find the work most interesting.
            </p>
          </div>
        </div>

        <div className="relative mt-8 lg:mt-10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-0 bottom-0 left-1/2 hidden -translate-x-1/2 lg:block"
          >
            <div className="relative h-full w-px bg-foreground/10">
              <span className="absolute top-1/4 left-1/2 size-2 -translate-x-1/2 rotate-45 border border-foreground/25 bg-background" />
              <span className="absolute top-1/2 left-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-foreground/30 bg-background" />
              <span className="absolute top-3/4 left-1/2 size-2 -translate-x-1/2 rotate-45 border border-foreground/25 bg-background" />
            </div>
          </div>

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 hidden lg:block"
          >
            <svg
              aria-hidden="true"
              className="h-full w-full text-foreground/10"
              viewBox="0 0 1200 640"
              fill="none"
              preserveAspectRatio="none"
            >
              <g
                stroke="currentColor"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              >
                <path
                  d="M530 150H600"
                  strokeWidth="0.8"
                  strokeDasharray="3 8"
                />
                <path
                  d="M670 150H600"
                  strokeWidth="0.8"
                  strokeDasharray="3 8"
                />

                <path
                  d="M530 490H600"
                  strokeWidth="0.8"
                  strokeDasharray="3 8"
                />
                <path
                  d="M670 490H600"
                  strokeWidth="0.8"
                  strokeDasharray="3 8"
                />
              </g>
            </svg>
          </div>

          <div className="relative z-10 grid gap-5 lg:grid-cols-2 lg:gap-x-12 lg:gap-y-6 xl:gap-x-16">
            {skillDomains.map((domain) => (
              <SkillDomain key={domain.index} domain={domain} />
            ))}
          </div>

          <div className="relative z-20 mt-7 flex justify-center lg:mt-8">
            <div className="flex items-center gap-3 border-y border-foreground/10 bg-background px-4 py-2.5">
              <span
                aria-hidden="true"
                className="size-1.5 rounded-full bg-foreground/45"
              />

              <p className="text-[0.6875rem] font-medium tracking-[0.12em] text-foreground/58 uppercase">
                One connected engineering system
              </p>

              <span
                aria-hidden="true"
                className="size-1.5 rotate-45 border border-foreground/30"
              />
            </div>
          </div>
        </div>

        <div
          aria-hidden="true"
          className="mt-8 flex items-center gap-3 text-foreground/28"
        >
          <span className="font-mono text-[0.625rem] tracking-[0.12em]">
            SOFTWARE
          </span>

          <span className="h-px flex-1 bg-current" />

          <span className="size-1.5 rounded-full border border-current" />

          <span className="h-px flex-1 bg-current" />

          <span className="font-mono text-[0.625rem] tracking-[0.12em]">
            PHYSICAL SYSTEMS
          </span>
        </div>
      </div>
    </section>
  );
}
