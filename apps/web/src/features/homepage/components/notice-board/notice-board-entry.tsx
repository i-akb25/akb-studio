import { MapPin, Pin, Route } from "lucide-react";

const update = {
  date: "20 SEPTEMBER 2026",
  title: "I’m open to the right engineering challenge.",
  body: "I’m especially interested in work that brings software, automation, applied AI, and real-world engineering constraints together.",
  focus: "Engineering roles",
  status: "Available",
  location: "India · Remote",
} as const;

export function NoticeBoardEntry() {
  return (
    <article className="relative overflow-hidden border border-foreground/10 bg-foreground/[0.025] px-5 py-6 sm:px-7 sm:py-7 lg:px-8 lg:py-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-[38%] text-foreground/[0.055] sm:block"
      >
        <svg
          aria-hidden="true"
          className="h-full w-full"
          viewBox="0 0 420 320"
          fill="none"
          preserveAspectRatio="xMidYMid slice"
        >
          <path
            d="M378 22C310 38 266 78 267 122C268 162 320 178 322 219C324 259 283 284 235 300"
            stroke="currentColor"
            strokeWidth="0.8"
            strokeDasharray="4 9"
          />

          <circle
            cx="378"
            cy="22"
            r="7"
            stroke="currentColor"
            strokeWidth="0.8"
          />

          <circle
            cx="267"
            cy="122"
            r="7"
            stroke="currentColor"
            strokeWidth="0.8"
          />

          <circle
            cx="322"
            cy="219"
            r="7"
            stroke="currentColor"
            strokeWidth="0.8"
          />

          <circle
            cx="235"
            cy="300"
            r="7"
            stroke="currentColor"
            strokeWidth="0.8"
          />

          <path
            d="M344 74H404M291 160H350M244 254H296"
            stroke="currentColor"
            strokeWidth="0.6"
          />
        </svg>
      </div>

      <div className="relative z-10">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-foreground/10 pb-5">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-9 items-center justify-center rounded-full border border-foreground/12 text-foreground/58">
              <Pin aria-hidden="true" className="size-4" strokeWidth={1.5} />
            </span>

            <div>
              <p className="font-mono text-[0.625rem] tracking-[0.12em] text-foreground/48 uppercase">
                Field note / 001
              </p>

              <p className="mt-1 text-xs text-foreground/58">
                Current build record
              </p>
            </div>
          </div>

          <time
            dateTime="2026-08-31"
            className="font-mono text-xs tracking-[0.08em] text-foreground/54"
          >
            {update.date}
          </time>
        </header>

        <div className="grid gap-7 pt-6 sm:grid-cols-[1.3fr_0.7fr] sm:gap-8 lg:gap-10">
          <div>
            <h3 className="max-w-xl text-2xl leading-tight font-semibold tracking-[-0.03em] text-foreground sm:text-3xl">
              {update.title}
            </h3>

            <p className="mt-3 max-w-2xl text-pretty text-sm leading-7 text-foreground/70 sm:text-base">
              {update.body}
            </p>
          </div>

          <dl className="border-t border-foreground/10 pt-5 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-6">
            <div>
              <dt className="flex items-center gap-2 text-xs font-medium tracking-[0.1em] text-foreground/52 uppercase">
                <Route
                  aria-hidden="true"
                  className="size-3.5"
                  strokeWidth={1.5}
                />
                Current focus
              </dt>

              <dd className="mt-2 text-sm font-medium text-foreground/76">
                {update.focus}
              </dd>
            </div>

            <div className="mt-5">
              <dt className="text-xs font-medium tracking-[0.1em] text-foreground/52 uppercase">
                Status
              </dt>

              <dd className="mt-2 flex items-center gap-2 text-sm text-foreground/72">
                <span
                  aria-hidden="true"
                  className="size-1.5 rounded-full bg-foreground/55"
                />
                {update.status}
              </dd>
            </div>

            <div className="mt-5">
              <dt className="flex items-center gap-2 text-xs font-medium tracking-[0.1em] text-foreground/52 uppercase">
                <MapPin
                  aria-hidden="true"
                  className="size-3.5"
                  strokeWidth={1.5}
                />
                Waypoint
              </dt>

              <dd className="mt-2 text-sm text-foreground/68">
                {update.location}
              </dd>
            </div>
          </dl>
        </div>

        <footer className="mt-6 flex items-center gap-3 border-t border-foreground/10 pt-5 text-foreground/28">
          <span
            aria-hidden="true"
            className="size-1.5 rounded-full border border-current"
          />

          <span aria-hidden="true" className="h-px w-10 bg-current" />

          <span className="font-mono text-[0.625rem] tracking-[0.12em]">
            CURRENT WAYPOINT
          </span>

          <span aria-hidden="true" className="h-px flex-1 bg-current" />
        </footer>
      </div>
    </article>
  );
}
