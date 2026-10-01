export function FeaturedProjectsLoading() {
  return (
    <section
      aria-label="Selected work"
      aria-busy="true"
      className="relative py-18 sm:py-20 lg:py-28 xl:py-32"
    >
      <output className="sr-only">Loading selected projects</output>
      <div
        aria-hidden="true"
        className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8 motion-safe:animate-pulse"
      >
        <div className="grid gap-7 border-b border-border pb-8 lg:grid-cols-[0.68fr_1.32fr] lg:gap-12 lg:pb-10 xl:gap-16">
          <div className="h-4 w-36 rounded-sm bg-foreground/10" />
          <div>
            <div className="h-10 w-4/5 rounded-sm bg-foreground/10" />
            <div className="mt-3 h-10 w-3/5 rounded-sm bg-foreground/10" />
            <div className="mt-6 h-4 w-full rounded-sm bg-foreground/5" />
            <div className="mt-3 h-4 w-4/5 rounded-sm bg-foreground/5" />
          </div>
        </div>
        <div className="mt-8 grid gap-5 lg:grid-cols-12">
          <div className="min-h-[36rem] rounded-[1.35rem] border border-border bg-foreground/[0.025] lg:col-span-7" />
          <div className="grid gap-5 lg:col-span-5">
            <div className="aspect-[4/3] min-h-72 rounded-[1.35rem] border border-border bg-foreground/[0.025]" />
            <div className="aspect-[4/3] min-h-72 rounded-[1.35rem] border border-border bg-foreground/[0.025]" />
          </div>
        </div>
      </div>
    </section>
  );
}
