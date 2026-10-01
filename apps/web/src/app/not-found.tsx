import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-5 py-24 sm:px-8">
      <p className="font-mono text-xs tracking-[0.16em] text-foreground/50 uppercase">
        Route 404 · Signal lost
      </p>
      <h1 className="mt-6 max-w-3xl text-5xl leading-none font-semibold tracking-[-0.05em] text-foreground sm:text-7xl">
        This path does not lead to a published field note.
      </h1>
      <p className="mt-7 max-w-xl text-base leading-7 text-foreground/68 sm:text-lg">
        The address may be outdated, private, or unavailable. Return to the main
        route or continue through the published work.
      </p>
      <nav aria-label="404 recovery" className="mt-10 flex flex-wrap gap-5">
        <Link className="font-semibold underline underline-offset-4" href="/">
          Return home
        </Link>
        <Link
          className="text-foreground/70 underline underline-offset-4"
          href="/projects"
        >
          Browse projects
        </Link>
        <Link
          className="text-foreground/70 underline underline-offset-4"
          href="/journal"
        >
          Read the Journal
        </Link>
      </nav>
    </main>
  );
}
