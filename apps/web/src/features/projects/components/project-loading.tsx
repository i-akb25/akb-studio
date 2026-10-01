export function ProjectLoading({ detail = false }: { detail?: boolean }) {
  return (
    <main
      aria-busy="true"
      className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-6 sm:py-24 lg:px-8"
    >
      <output className="sr-only">
        {detail ? "Loading case study" : "Loading project archive"}
      </output>
      <div aria-hidden="true" className="motion-safe:animate-pulse">
        <div className="grid gap-12 border-b border-border pb-14 lg:grid-cols-[1.35fr_0.65fr] lg:gap-20">
          <div>
            <div className="h-3 w-32 rounded-sm bg-foreground/10" />
            <div className="mt-8 h-11 w-4/5 rounded-sm bg-foreground/10 sm:h-14" />
            <div className="mt-3 h-11 w-3/5 rounded-sm bg-foreground/10 sm:h-14" />
            <div className="mt-7 h-4 w-full rounded-sm bg-foreground/5" />
            <div className="mt-3 h-4 w-4/5 rounded-sm bg-foreground/5" />
          </div>
          <div className="space-y-7 self-end border-t border-border pt-6 lg:border-t-0 lg:border-l lg:pl-8">
            {["first", "second", "third"].map((row) => (
              <div
                key={row}
                className="flex items-center justify-between gap-8"
              >
                <div className="h-3 w-24 rounded-sm bg-foreground/10" />
                <div className="h-3 w-10 rounded-sm bg-foreground/5" />
              </div>
            ))}
          </div>
        </div>
        <div className="mt-14 grid gap-12 lg:grid-cols-[0.35fr_1fr] lg:gap-20">
          <div className="h-5 w-40 rounded-sm bg-foreground/10" />
          <div className="space-y-4">
            <div className="h-7 w-2/3 rounded-sm bg-foreground/10" />
            <div className="h-4 w-full rounded-sm bg-foreground/5" />
            <div className="h-4 w-full rounded-sm bg-foreground/5" />
            <div className="h-4 w-3/4 rounded-sm bg-foreground/5" />
            {!detail ? (
              <div className="mt-8 aspect-[16/9] rounded-xl border border-border bg-foreground/[0.025]" />
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
