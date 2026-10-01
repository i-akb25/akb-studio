import Link from "next/link";
import type { ReactNode } from "react";

type ProjectRouteStateProps = {
  label: string;
  title: string;
  description: string;
  children?: ReactNode;
};

export function ProjectRouteState({
  label,
  title,
  description,
  children,
}: ProjectRouteStateProps) {
  return (
    <main className="relative border-b border-border">
      <div className="mx-auto grid min-h-[58vh] w-full max-w-7xl items-center gap-12 px-5 py-20 sm:px-6 sm:py-28 lg:grid-cols-[1.35fr_0.65fr] lg:gap-20 lg:px-8">
        <div>
          <div className="flex items-center gap-3 text-muted">
            <span
              aria-hidden="true"
              className="size-1.5 rotate-45 border border-accent-warm"
            />
            <p className="font-mono text-xs tracking-[0.14em] uppercase">
              {label}
            </p>
          </div>
          <h1 className="mt-7 max-w-2xl text-balance font-display text-4xl leading-[1.1] font-semibold tracking-[-0.04em] text-foreground sm:text-5xl">
            {title}
          </h1>
          <p className="mt-6 max-w-xl text-pretty text-base leading-8 text-muted">
            {description}
          </p>
          {children ? (
            <div className="mt-8 flex flex-wrap items-center gap-5">
              {children}
            </div>
          ) : null}
        </div>
        <aside
          aria-label="Continue exploring"
          className="border-t border-border pt-6 lg:border-t-0 lg:border-l lg:py-6 lg:pl-8"
        >
          <p className="font-mono text-xs tracking-[0.14em] text-muted uppercase">
            Continue exploring
          </p>
          <Link
            href="/projects"
            className="mt-4 flex min-h-11 items-center justify-between gap-5 rounded-sm py-2 text-sm font-semibold text-foreground underline decoration-border-strong underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-4 focus-visible:ring-offset-background"
          >
            Project archive <span aria-hidden="true">↗</span>
          </Link>
          <Link
            href="/"
            className="mt-2 flex min-h-11 items-center justify-between gap-5 rounded-sm py-2 text-sm text-muted underline decoration-border-strong underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-4 focus-visible:ring-offset-background"
          >
            Back to the studio <span aria-hidden="true">↗</span>
          </Link>
        </aside>
      </div>
    </main>
  );
}
