import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import {
  getHomepageProjects,
  type HomepageProject,
} from "@/features/projects/server/resolve-project-registry";
import type {
  ProjectLink,
  ProjectRecord,
} from "@/features/projects/types/project";

import { CurrentProject } from "./current-project";
import { ProjectCard } from "./project-card";

function getAvailableLink(
  project: ProjectRecord,
  kind: ProjectLink["kind"],
): string | undefined {
  for (const link of project.links) {
    if (link.kind === kind && link.state === "available") {
      return link.href;
    }
  }

  return undefined;
}

function HomepageProjectCard({ project }: { project: HomepageProject }) {
  return (
    <ProjectCard
      index={project.homepageOrder.toString().padStart(2, "0")}
      title={project.title}
      category={project.categoryLabel}
      image={project.cover.src}
      imageAlt={project.cover.alt}
      technologies={project.technologies}
      liveUrl={getAvailableLink(project, "demo")}
      repositoryUrl={getAvailableLink(project, "repository")}
      caseStudyUrl={`/projects/${project.slug}`}
    />
  );
}

export async function FeaturedProjects() {
  let displayProjects: readonly HomepageProject[] = [];
  let unavailable = false;

  try {
    displayProjects = await getHomepageProjects();
  } catch {
    unavailable = true;
  }

  return (
    <section
      id="featured-projects"
      aria-labelledby="featured-projects-heading"
      className="relative py-18 sm:py-20 lg:py-28 xl:py-32"
    >
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="grid gap-7 border-b border-foreground/10 pb-8 lg:grid-cols-[0.68fr_1.32fr] lg:gap-12 lg:pb-10 xl:gap-16">
          <div className="flex items-start gap-3">
            <span className="font-mono text-xs text-foreground/48">03</span>

            <span
              aria-hidden="true"
              className="mt-2 h-px w-10 bg-foreground/15"
            />

            <span
              aria-hidden="true"
              className="mt-[0.375rem] size-1.5 rotate-45 border border-foreground/25"
            />

            <p className="text-sm font-medium tracking-[0.14em] text-foreground/60 uppercase">
              Selected work
            </p>
          </div>

          <div className="max-w-3xl">
            <h2
              id="featured-projects-heading"
              className="text-balance text-3xl leading-tight font-semibold tracking-[-0.035em] text-foreground sm:text-4xl lg:text-[2.75rem] xl:text-5xl"
            >
              Some things I&apos;ve built, tested, broken, and learned from.
            </h2>

            <p className="mt-4 max-w-2xl text-pretty text-base leading-7 text-foreground/70 sm:text-lg sm:leading-8">
              I&apos;m keeping this selection intentional. It’s a selective look
              at the projects that best show how I approach problems, work
              through constraints, and turn ideas into systems that actually
              work.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-12 lg:grid-rows-2">
          <div className="min-w-0 lg:col-span-7 lg:row-span-2">
            <CurrentProject />
          </div>

          {displayProjects.slice(0, 2).map((project) => (
            <div key={project.slug} className="min-w-0 lg:col-span-5">
              <HomepageProjectCard project={project} />
            </div>
          ))}

          {displayProjects.length === 0 ? (
            <div className="flex min-h-56 flex-col justify-end border-y border-foreground/10 px-5 py-8 lg:col-span-5 lg:row-span-2 sm:px-6">
              <p className="font-mono text-xs tracking-[0.12em] text-muted uppercase">
                Selected work
              </p>
              <h3 className="mt-4 font-display text-2xl tracking-[-0.03em] text-foreground">
                {unavailable
                  ? "Project records are temporarily unavailable."
                  : "No featured projects are published yet."}
              </h3>
              <p className="mt-4 max-w-md text-sm leading-7 text-muted">
                {unavailable
                  ? "The rest of the site remains available. You can try the project archive again shortly."
                  : "Published selections will appear here when they are ready."}
              </p>
            </div>
          ) : null}
        </div>

        {displayProjects.length > 2 ? (
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {displayProjects.slice(2).map((project) => (
              <div key={project.slug} className="min-w-0">
                <HomepageProjectCard project={project} />
              </div>
            ))}
          </div>
        ) : null}

        <div className="mt-7 flex flex-col gap-5 border-t border-foreground/10 pt-5 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
          <p className="max-w-xl text-sm leading-6 text-foreground/60">
            The complete archive separates flagship systems, focused builds,
            smaller project records, and interface studies without presenting
            them as equal work.
          </p>

          <div className="flex shrink-0 items-center justify-between gap-7 sm:justify-end">
            <Link
              href="/projects"
              className="inline-flex min-h-11 items-center gap-2 rounded-sm text-sm font-semibold text-foreground underline decoration-foreground/25 underline-offset-4 transition-colors duration-200 hover:decoration-foreground/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-4 focus-visible:ring-offset-background motion-reduce:transition-none"
            >
              Explore all projects
              <ArrowUpRight
                aria-hidden="true"
                className="size-4"
                strokeWidth={1.7}
              />
            </Link>

            <div
              aria-hidden="true"
              className="hidden shrink-0 items-center gap-3 text-foreground/28 md:flex"
            >
              <span className="size-1.5 rounded-full border border-current" />
              <span className="h-px w-12 bg-current" />
              <span className="font-mono text-[0.625rem] tracking-[0.1em]">
                {displayProjects.length.toString().padStart(2, "0")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
