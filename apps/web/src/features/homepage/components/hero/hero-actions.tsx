import { ArrowDown, Download } from "lucide-react";

export function HeroActions() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <a
        href="#featured-projects"
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-foreground px-5 py-3 text-sm font-medium text-background transition-[transform,opacity] duration-200 ease-out hover:-translate-y-0.5 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transform-none motion-reduce:transition-none"
      >
        Explore my work
        <ArrowDown aria-hidden="true" className="size-4" strokeWidth={1.75} />
      </a>

      <a
        href="/resume/anurag-kumar-bharti-resume.pdf"
        download
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-foreground/20 px-5 py-3 text-sm font-medium text-foreground transition-[border-color,background-color,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-foreground/35 hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transform-none motion-reduce:transition-none"
      >
        Download resume
        <Download aria-hidden="true" className="size-4" strokeWidth={1.75} />
      </a>
    </div>
  );
}
