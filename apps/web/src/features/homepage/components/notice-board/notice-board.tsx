import { NoticeBoardEntry } from "./notice-board-entry";

export function NoticeBoard() {
  return (
    <section
      id="notice-board"
      aria-labelledby="notice-board-heading"
      className="relative py-14 sm:py-16 lg:py-20"
    >
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="relative border-y border-foreground/10 py-8 sm:py-10 lg:py-12">
          <div
            aria-hidden="true"
            className="absolute top-0 left-0 h-px w-20 bg-foreground/30"
          />

          <div
            aria-hidden="true"
            className="absolute right-0 bottom-0 h-px w-12 bg-foreground/20"
          />

          <div className="grid gap-8 lg:grid-cols-[0.68fr_1.32fr] lg:items-start lg:gap-12 xl:gap-16">
            <div>
              <div className="flex items-start gap-3">
                <span className="font-mono text-xs text-foreground/48">05</span>

                <span
                  aria-hidden="true"
                  className="mt-2 h-px w-10 bg-foreground/15"
                />

                <span
                  aria-hidden="true"
                  className="mt-[0.375rem] size-1.5 rotate-45 border border-foreground/30"
                />

                <p className="text-sm font-medium tracking-[0.14em] text-foreground/60 uppercase">
                  Current waypoint
                </p>
              </div>

              <div className="mt-5 max-w-md">
                <h2
                  id="notice-board-heading"
                  className="text-balance text-3xl leading-tight font-semibold tracking-[-0.035em] text-foreground sm:text-4xl"
                >
                  A small place for what I&apos;m working on right now.
                </h2>

                <p className="mt-4 max-w-sm text-pretty text-sm leading-6 text-foreground/66 sm:text-base sm:leading-7">
                  Think of this as a field note rather than an announcement
                  wall: one current update, kept short and visible.
                </p>
              </div>

              <div
                aria-hidden="true"
                className="mt-7 hidden max-w-sm items-center gap-3 text-foreground/28 lg:flex"
              >
                <span className="font-mono text-[0.625rem] tracking-[0.12em]">
                  ROUTE
                </span>

                <span className="h-px flex-1 bg-current" />

                <span className="size-1.5 rounded-full border border-current" />

                <span className="h-px w-10 bg-current" />

                <span className="font-mono text-[0.625rem] tracking-[0.12em]">
                  NOW
                </span>
              </div>
            </div>

            <div className="min-w-0 lg:border-l lg:border-foreground/10 lg:pl-10 xl:pl-12">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className="size-1.5 rounded-full bg-foreground/45"
                  />

                  <p className="text-[0.6875rem] font-medium tracking-[0.12em] text-foreground/52 uppercase">
                    Pinned dispatch
                  </p>
                </div>

                <span
                  aria-hidden="true"
                  className="font-mono text-[0.625rem] tracking-[0.1em] text-foreground/36"
                >
                  LIVE
                </span>
              </div>

              <NoticeBoardEntry />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
