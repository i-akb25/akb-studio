import { ArrowUpRight, Search as SearchIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { createPageMetadata } from "@/features/seo/site-config";

export const metadata: Metadata = createPageMetadata({
  title: "Search",
  description:
    "Search AKB Studio projects, engineering experience, writing, knowledge, and portfolio routes.",
  path: "/search",
  noIndex: true,
});

const searchEntries = [
  {
    title: "Home",
    href: "/",
    description:
      "An overview of my engineering work, experience, capabilities, current route, and daily reflection.",
    keywords: "home portfolio overview engineering anurag akb studio",
  },
  {
    title: "Projects",
    href: "/projects",
    description:
      "Software, electrical, automation, robotics, AI, and systems projects with evidence and trade-offs.",
    keywords:
      "projects software electrical automation robotics artificial intelligence systems drone codevet adhayan",
  },
  {
    title: "Pravaah",
    href: "/pravaah",
    description:
      "A continuing stream of published work, external posts, engineering updates, and public activity.",
    keywords: "pravaah updates activity posts github linkedin social",
  },
  {
    title: "Journal",
    href: "/journal",
    description:
      "Field notes, engineering observations, project decisions, and lessons from work in progress.",
    keywords: "journal writing field notes decisions lessons articles",
  },
  {
    title: "Knowledge",
    href: "/knowledge",
    description:
      "Structured technical explanations, references, and reusable engineering knowledge.",
    keywords: "knowledge technical reference learning guides engineering",
  },
  {
    title: "Aeva",
    href: "/aeva",
    description:
      "Ask my disclosed AI portfolio guide a question grounded in approved portfolio sources.",
    keywords: "aeva ask assistant ai portfolio chat question search",
  },
  {
    title: "About",
    href: "/about",
    description:
      "My background, engineering journey, disciplines, interests, and creative practice.",
    keywords: "about profile journey education experience interests anurag",
  },
  {
    title: "Contact",
    href: "/contact",
    description:
      "Start a conversation about a role, project, collaboration, research, or difficult engineering problem.",
    keywords: "contact hire role project collaboration research conversation",
  },
] as const;

type SearchPageProps = {
  searchParams: Promise<{
    q?: string | string[];
  }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const parameters = await searchParams;
  const rawQuery = Array.isArray(parameters.q) ? parameters.q[0] : parameters.q;
  const query = rawQuery?.trim() ?? "";
  const normalizedQuery = query.toLocaleLowerCase("en-IN");

  const results = normalizedQuery
    ? searchEntries.filter((entry) =>
        `${entry.title} ${entry.description} ${entry.keywords}`
          .toLocaleLowerCase("en-IN")
          .includes(normalizedQuery),
      )
    : searchEntries;

  return (
    <main className="min-h-[70vh] py-16 sm:py-20 lg:py-24">
      <div className="mx-auto w-full max-w-5xl px-5 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 font-mono text-[0.625rem] tracking-[0.18em] text-muted uppercase">
          <span
            aria-hidden="true"
            className="size-1.5 rounded-full bg-accent-warm"
          />
          Route finder
          <span aria-hidden="true" className="h-px flex-1 bg-border" />
        </div>

        <h1 className="mt-8 max-w-3xl text-balance font-display text-4xl leading-[1.04] font-semibold tracking-[-0.045em] text-foreground sm:text-5xl lg:text-6xl">
          Search the studio.
        </h1>

        <p className="mt-5 max-w-2xl text-pretty text-base leading-7 text-muted sm:text-lg">
          Find projects, experience, writing, technical knowledge, or ask Aeva
          when your question needs context rather than a keyword.
        </p>

        <search className="mt-9 block">
          <form action="/search" className="flex flex-col gap-3 sm:flex-row">
            <label htmlFor="site-search" className="sr-only">
              Search AKB Studio
            </label>
            <div className="relative flex-1">
              <SearchIcon
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted"
                strokeWidth={1.7}
              />
              <input
                id="site-search"
                name="q"
                type="search"
                defaultValue={query}
                placeholder="Try “robotics”, “experience”, or “CodeVet”"
                className="min-h-13 w-full rounded-full border border-border-strong bg-surface py-3 pr-5 pl-12 text-base text-foreground outline-none transition-colors placeholder:text-muted-soft focus:border-accent-warm"
              />
            </div>
            <button
              type="submit"
              className="inline-flex min-h-13 items-center justify-center rounded-full bg-foreground px-7 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-88"
            >
              Search
            </button>
          </form>
        </search>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <p className="font-mono text-[0.625rem] tracking-[0.14em] text-muted uppercase">
            {normalizedQuery
              ? `${results.length} result${results.length === 1 ? "" : "s"} for “${query}”`
              : "Published routes"}
          </p>
          {normalizedQuery ? (
            <Link
              href="/search"
              className="text-sm font-medium text-muted underline decoration-border-strong underline-offset-4 transition-colors hover:text-foreground"
            >
              Clear search
            </Link>
          ) : null}
        </div>

        {results.length > 0 ? (
          <ul className="divide-y divide-border">
            {results.map((entry, index) => (
              <li key={entry.href}>
                <Link
                  href={entry.href}
                  className="group grid gap-4 py-6 transition-colors hover:bg-surface-subtle sm:grid-cols-[3rem_1fr_auto] sm:items-center sm:px-3"
                >
                  <span className="font-mono text-[0.625rem] text-muted-soft">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>
                    <span className="block text-lg font-semibold tracking-[-0.02em] text-foreground sm:text-xl">
                      {entry.title}
                    </span>
                    <span className="mt-2 block max-w-2xl text-sm leading-6 text-muted">
                      {entry.description}
                    </span>
                  </span>
                  <ArrowUpRight
                    aria-hidden="true"
                    className="size-5 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    strokeWidth={1.6}
                  />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="py-12">
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-foreground">
              No published route matches that search.
            </h2>
            <p className="mt-3 max-w-xl text-base leading-7 text-muted">
              Try a broader term, or ask Aeva to connect your question with the
              relevant parts of my work.
            </p>
            <Link
              href="/aeva"
              className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full border border-border-strong bg-surface px-5 py-2 text-sm font-semibold text-foreground transition-colors hover:border-accent-warm"
            >
              Talk to Aeva
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
