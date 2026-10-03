import { ArrowLeft, ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ProjectRecord } from "../types/project";

export function ProjectOverview({ project }: { project: ProjectRecord }) {
  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-28 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
      <Link
        href="/projects"
        className="inline-flex min-h-11 items-center gap-2 text-sm text-foreground/65 underline decoration-foreground/25 underline-offset-4"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Project archive
      </Link>

      <article className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1.25fr)_minmax(17rem,0.75fr)] lg:gap-16">
        <div>
          <p className="text-xs font-medium tracking-[0.14em] text-foreground/52 uppercase">
            {project.categoryLabel}
          </p>
          <h1 className="mt-5 max-w-4xl text-balance text-4xl font-semibold tracking-[-0.045em] text-foreground sm:text-5xl lg:text-6xl">
            {project.title}
          </h1>
          <p className="mt-7 max-w-3xl text-pretty text-base leading-8 text-foreground/72 sm:text-lg">
            {project.summary}
          </p>

          {project.cover ? (
            <div className="relative mt-10 aspect-[16/9] overflow-hidden rounded-[1.25rem] border border-foreground/10 bg-foreground/[0.025]">
              <Image
                src={project.cover.src}
                alt={project.cover.alt}
                fill
                priority
                sizes="(max-width: 1023px) calc(100vw - 2.5rem), 66vw"
                className="object-cover"
              />
            </div>
          ) : null}
        </div>

        <aside className="border-t border-foreground/12 pt-7 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
          <p className="font-mono text-xs tracking-[0.14em] text-foreground/48 uppercase">
            Project record
          </p>
          <dl className="mt-6 space-y-5">
            <div>
              <dt className="text-xs text-foreground/45 uppercase">Status</dt>
              <dd className="mt-1 text-sm text-foreground/72">
                {project.lifecycle.replaceAll("-", " ")}
              </dd>
            </div>
            {project.period ? (
              <div>
                <dt className="text-xs text-foreground/45 uppercase">Period</dt>
                <dd className="mt-1 text-sm text-foreground/72">
                  {project.period}
                </dd>
              </div>
            ) : null}
            {project.role ? (
              <div>
                <dt className="text-xs text-foreground/45 uppercase">Role</dt>
                <dd className="mt-1 text-sm leading-6 text-foreground/72">
                  {project.role}
                </dd>
              </div>
            ) : null}
          </dl>

          <h2 className="mt-8 text-xs text-foreground/45 uppercase">
            Technologies
          </h2>
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
            {project.technologies.map((technology) => (
              <li key={technology.name} className="text-sm text-foreground/72">
                {technology.name}
              </li>
            ))}
          </ul>

          <div className="mt-8 space-y-1">
            {project.links.map((link) =>
              link.state === "available" ? (
                <a
                  key={`${link.kind}-${link.label}`}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-11 items-center justify-between gap-4 text-sm font-medium text-foreground underline decoration-foreground/25 underline-offset-4"
                >
                  {link.label}
                  <ArrowUpRight aria-hidden="true" className="size-4" />
                </a>
              ) : null,
            )}
          </div>

          <p className="mt-8 border-t border-foreground/10 pt-6 text-sm leading-7 text-foreground/58">
            The detailed case study is not currently available. This verified
            project record remains accessible while its supporting document is
            prepared or the private content source is temporarily unavailable.
          </p>
        </aside>
      </article>
    </main>
  );
}
