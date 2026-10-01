import Image from "next/image";

const explorationRoutes = [
  {
    index: "01",
    title: "Show me what you’ve built",
    context: "Selected projects, systems, and experiments",
    destination: "/aeva",
    route: "PROJECTS",
    mark: "projects",
  },
  {
    index: "02",
    title: "Walk me through your experience",
    context: "Industry, software, electrical, and automation work",
    destination: "/aeva",
    route: "EXPERIENCE",
    mark: "experience",
  },
  {
    index: "03",
    title: "What kind of engineer are you?",
    context: "The disciplines and capabilities that connect my work",
    destination: "/aeva",
    route: "CAPABILITIES",
    mark: "skills",
  },
  {
    index: "04",
    title: "What are you thinking about today?",
    context: "A daily reflection drawn from Sanskrit thought",
    destination: "/aeva",
    route: "REFLECTION",
    mark: "reflection",
  },
] as const;

type RouteMark = (typeof explorationRoutes)[number]["mark"];

function ExplorationMark({ mark }: { mark: RouteMark }) {
  if (mark === "experience") {
    return (
      <svg
        aria-hidden="true"
        className="size-5"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M4 18C7 17 7.5 13 10 12C12.5 11 14 14 17 12C19 10.5 19.5 7.5 19 5"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
        />

        <circle cx="4" cy="18" r="1.5" stroke="currentColor" />
        <circle cx="10" cy="12" r="1.5" stroke="currentColor" />
        <circle cx="17" cy="12" r="1.5" stroke="currentColor" />
        <circle cx="19" cy="5" r="1.5" stroke="currentColor" />
      </svg>
    );
  }

  if (mark === "skills") {
    return (
      <svg
        aria-hidden="true"
        className="size-5"
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle cx="12" cy="12" r="2.5" stroke="currentColor" />

        <circle cx="12" cy="4" r="1.5" stroke="currentColor" />
        <circle cx="20" cy="12" r="1.5" stroke="currentColor" />
        <circle cx="12" cy="20" r="1.5" stroke="currentColor" />
        <circle cx="4" cy="12" r="1.5" stroke="currentColor" />

        <path
          d="M12 5.5V9.5M18.5 12H14.5M12 14.5V18.5M9.5 12H5.5"
          stroke="currentColor"
          strokeWidth="1"
        />
      </svg>
    );
  }

  if (mark === "reflection") {
    return (
      <svg
        aria-hidden="true"
        className="size-5"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M12 20C12 14.5 8 13 5 12C8.5 11 10.5 8.5 12 5C13.5 8.5 15.5 11 19 12C16 13 12 14.5 12 20Z"
          stroke="currentColor"
          strokeWidth="1.1"
        />

        <path
          d="M12 5C9.5 6 8 5 7 3C9.5 3.3 11 2.5 12 1C13 2.5 14.5 3.3 17 3C16 5 14.5 6 12 5Z"
          stroke="currentColor"
          strokeWidth="0.9"
        />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="size-5" viewBox="0 0 24 24" fill="none">
      <rect
        x="4"
        y="5"
        width="16"
        height="14"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.1"
      />

      <path
        d="M8 9H16M8 12H13M8 15H11"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ArrowMark() {
  return (
    <svg aria-hidden="true" className="size-4" viewBox="0 0 20 20" fill="none">
      <path
        d="M5 15L15 5M8 5H15V12"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AevaInterfacePreview() {
  return (
    <div className="relative min-w-0">
      <div
        aria-hidden="true"
        className="absolute -inset-5 hidden text-foreground/[0.05] lg:block"
      >
        <svg
          aria-hidden="true"
          className="h-full w-full"
          viewBox="0 0 760 700"
          fill="none"
          preserveAspectRatio="none"
        >
          <path
            d="M73 78H210C255 78 270 110 270 150V196"
            stroke="currentColor"
            strokeWidth="0.7"
            strokeDasharray="4 9"
          />

          <path
            d="M690 603H535C493 603 476 570 476 532V493"
            stroke="currentColor"
            strokeWidth="0.7"
            strokeDasharray="4 9"
          />

          <circle cx="73" cy="78" r="4" stroke="currentColor" />
          <circle cx="270" cy="196" r="4" stroke="currentColor" />
          <circle cx="690" cy="603" r="4" stroke="currentColor" />
          <circle cx="476" cy="493" r="4" stroke="currentColor" />
        </svg>
      </div>

      <div className="relative overflow-hidden border border-foreground/10 bg-foreground/[0.02]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          <svg
            aria-hidden="true"
            className="absolute top-0 right-0 h-72 w-72 text-foreground/[0.03]"
            viewBox="0 0 300 300"
            fill="none"
          >
            <circle
              cx="250"
              cy="50"
              r="116"
              stroke="currentColor"
              strokeWidth="0.7"
            />

            <circle
              cx="250"
              cy="50"
              r="82"
              stroke="currentColor"
              strokeWidth="0.6"
              strokeDasharray="3 8"
            />

            <path
              d="M250 -66V166M134 50H366"
              stroke="currentColor"
              strokeWidth="0.5"
              strokeDasharray="2 9"
            />
          </svg>
        </div>

        <header className="relative flex flex-wrap items-start justify-between gap-5 border-b border-foreground/10 px-5 py-5 sm:px-7 sm:py-6">
          <div className="flex items-center gap-4">
            <Image
              src="/images/aeva/aeva-portrait.webp"
              alt="AI-generated fictional portrait representing Aeva"
              width={44}
              height={44}
              className="size-11 rounded-full border border-foreground/16 object-cover object-top"
            />

            <div>
              <p className="text-sm font-semibold tracking-[-0.01em] text-foreground">
                Aeva
              </p>

              <p className="mt-1 text-xs text-foreground/56">
                AI portfolio guide · available now
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-foreground/54">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-foreground/50"
            />
            Available now
          </div>
        </header>

        <div className="relative px-5 py-6 sm:px-7 sm:py-7">
          <div className="max-w-xl">
            <p className="font-mono text-[0.625rem] tracking-[0.13em] text-foreground/48 uppercase">
              Start somewhere
            </p>

            <h3 className="mt-3 max-w-lg text-2xl leading-tight font-semibold tracking-[-0.03em] text-foreground sm:text-3xl">
              What would you like to understand about my work?
            </h3>

            <p className="mt-3 max-w-lg text-sm leading-6 text-foreground/64">
              Start with a question. Aeva answers from approved portfolio
              sources, or from cited live web results when you choose to enable
              them.
            </p>
          </div>

          <nav
            aria-label="Explore Anurag's portfolio"
            className="mt-7 border-t border-foreground/10"
          >
            {explorationRoutes.map((route) => (
              <a
                key={route.index}
                href={route.destination}
                className="group grid min-h-[6rem] gap-4 border-b border-foreground/10 py-5 transition-colors duration-200 hover:bg-foreground/[0.025] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-foreground/60 sm:grid-cols-[3rem_1fr_auto] sm:items-center sm:px-3 motion-reduce:transition-none"
              >
                <div className="flex items-center gap-3 sm:block">
                  <span className="font-mono text-[0.625rem] text-foreground/42 sm:block">
                    {route.index}
                  </span>

                  <span className="mt-0 text-foreground/58 sm:mt-3 sm:block">
                    <ExplorationMark mark={route.mark} />
                  </span>
                </div>

                <div className="min-w-0">
                  <p className="text-base font-medium tracking-[-0.015em] text-foreground sm:text-lg">
                    {route.title}
                  </p>

                  <p className="mt-1.5 text-sm leading-6 text-foreground/58">
                    {route.context}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-5 sm:justify-end">
                  <span className="font-mono text-[0.625rem] tracking-[0.1em] text-foreground/42">
                    {route.route}
                  </span>

                  <span className="inline-flex size-9 items-center justify-center rounded-full border border-foreground/14 text-foreground/50 transition-[border-color,color,transform] duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:border-foreground/28 group-hover:text-foreground/80 motion-reduce:transform-none motion-reduce:transition-none">
                    <ArrowMark />
                  </span>
                </div>
              </a>
            ))}
          </nav>

          <footer className="mt-6 grid gap-5 border-t border-foreground/10 pt-6 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <p className="text-xs font-medium tracking-[0.1em] text-foreground/50 uppercase">
                Evidence first
              </p>

              <p className="mt-2 max-w-xl text-sm leading-6 text-foreground/60">
                Ask naturally, inspect the cited sources, and let Aeva say when
                the available evidence is not enough.
              </p>
            </div>

            <div
              aria-hidden="true"
              className="flex items-center gap-3 text-foreground/26"
            >
              <span className="font-mono text-[0.625rem] tracking-[0.1em]">
                INPUT
              </span>

              <span className="h-px w-8 bg-current" />

              <span className="size-1.5 rounded-full border border-current" />

              <span className="h-px w-8 bg-current" />

              <span className="font-mono text-[0.625rem] tracking-[0.1em]">
                ROUTE
              </span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
