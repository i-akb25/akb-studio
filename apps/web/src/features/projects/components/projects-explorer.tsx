"use client";

import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import { projectDisciplineLabels } from "../data/project-registry";
import {
  PROJECT_DISCIPLINES,
  type ProjectDiscipline,
  type ProjectLifecycle,
  type ProjectLink,
  type ProjectRecord,
  type ProjectTier,
} from "../types/project";

type ProjectsExplorerProps = {
  projects: readonly ProjectRecord[];
};

type ProjectFilter = "all" | ProjectDiscipline;

const tierOrder: readonly ProjectTier[] = [
  "flagship",
  "standard",
  "compact",
  "experiment",
];

const tierContent: Record<
  ProjectTier,
  {
    index: string;
    title: string;
    description: string;
  }
> = {
  flagship: {
    index: "A",
    title: "Flagship systems",
    description:
      "The projects with enough technical depth, evidence, and decision-making to support a complete engineering case study.",
  },
  standard: {
    index: "B",
    title: "Focused builds",
    description:
      "Projects centred on a specific system, technical problem, or implementation challenge.",
  },
  compact: {
    index: "C",
    title: "Project records",
    description:
      "Compact builds documented for their purpose, implementation, and practical learning.",
  },
  experiment: {
    index: "D",
    title: "Interface studies",
    description:
      "Creative frontend experiments kept separate from original engineering products.",
  },
};

const lifecycleLabels: Record<ProjectLifecycle, string> = {
  active: "Active",
  completed: "Completed",
  "in-progress": "In progress",
  "under-review": "Under review",
  archived: "Archived",
};

const unavailableLinkLabels: Record<
  Exclude<ProjectLink["state"], "available">,
  string
> = {
  planned: "Planned",
  "planned-public": "Public release planned",
  private: "Private",
  "under-review": "Under review",
  unavailable: "Unavailable",
};

function getCaseStudyLabel(project: ProjectRecord) {
  if (project.caseStudyState === "published") {
    return "Read case study";
  }

  if (project.caseStudyState === "under-review") {
    return "Case study under review";
  }

  if (project.caseStudyState === "unavailable") {
    return "Case study unavailable";
  }

  return "Case study in preparation";
}

function ProjectAction({ link }: { link: ProjectLink }) {
  if (link.state !== "available") {
    return (
      <span className="inline-flex min-h-11 items-center text-xs text-foreground/45">
        {link.label}: {unavailableLinkLabels[link.state]}
      </span>
    );
  }

  return (
    <a
      href={link.href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-foreground underline decoration-foreground/25 underline-offset-4 transition-colors duration-200 hover:decoration-foreground/75 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-4 focus-visible:ring-offset-background motion-reduce:transition-none"
    >
      {link.label}
      <ArrowUpRight aria-hidden="true" className="size-3.5" strokeWidth={1.7} />
    </a>
  );
}

function ProjectEntry({
  project,
  eagerCover,
}: {
  project: ProjectRecord;
  eagerCover: boolean;
}) {
  const caseStudyHref = `/projects/${project.slug}`;
  const hasPublishedCaseStudy = project.caseStudyState === "published";
  const hasProjectPage = project.publication === "published";

  return (
    <article
      aria-labelledby={`${project.slug}-title`}
      className="group grid gap-6 border-t border-foreground/10 py-8 sm:py-10 lg:grid-cols-[3.5rem_minmax(0,1fr)_15rem] lg:gap-8 xl:grid-cols-[4rem_minmax(0,1fr)_17rem]"
    >
      <div className="flex items-start justify-between lg:block">
        <span className="font-mono text-xs text-foreground/38">
          {project.order.toString().padStart(2, "0")}
        </span>

        <span
          aria-hidden="true"
          className="mt-1 hidden h-8 w-px bg-foreground/12 lg:block"
        />
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <p className="text-xs font-medium tracking-[0.12em] text-foreground/52 uppercase">
            {project.categoryLabel}
          </p>

          <span
            aria-hidden="true"
            className="size-1 rotate-45 bg-foreground/24"
          />

          <p className="text-xs text-foreground/48">
            {lifecycleLabels[project.lifecycle]}
          </p>
        </div>

        {hasProjectPage ? (
          <h3
            id={`${project.slug}-title`}
            className="mt-4 text-2xl leading-tight font-semibold tracking-[-0.035em] text-foreground sm:text-3xl"
          >
            <Link
              href={caseStudyHref}
              className="rounded-sm transition-colors duration-200 hover:text-foreground/68 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-4 focus-visible:ring-offset-background motion-reduce:transition-none"
            >
              {project.title}
            </Link>
          </h3>
        ) : (
          <h3
            id={`${project.slug}-title`}
            className="mt-4 text-2xl leading-tight font-semibold tracking-[-0.035em] text-foreground sm:text-3xl"
          >
            {project.title}
          </h3>
        )}

        <p className="mt-4 max-w-2xl text-pretty text-sm leading-7 text-foreground/68 sm:text-base">
          {project.summary}
        </p>

        {project.cover ? (
          <div className="relative mt-7 aspect-[16/9] max-w-3xl overflow-hidden rounded-[1.1rem] border border-foreground/10 bg-foreground/[0.025]">
            <Image
              src={project.cover.src}
              alt={project.cover.alt}
              fill
              loading={eagerCover ? "eager" : "lazy"}
              sizes="(max-width: 1023px) calc(100vw - 2.5rem), 55vw"
              className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.012] motion-reduce:transform-none motion-reduce:transition-none"
            />

            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-black/10"
            />
          </div>
        ) : null}

        <ul
          aria-label={`${project.title} technologies`}
          className="mt-6 flex flex-wrap gap-x-5 gap-y-2"
        >
          {project.technologies.map((technology) => (
            <li
              key={technology.name}
              className="text-xs leading-5 text-foreground/58"
            >
              {technology.name}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex min-w-0 flex-col border-t border-foreground/10 pt-5 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-7">
        <div>
          <p className="text-[0.6875rem] font-medium tracking-[0.14em] text-foreground/44 uppercase">
            Disciplines
          </p>

          <ul className="mt-3 space-y-1.5">
            {project.disciplines.map((discipline) => (
              <li key={discipline} className="text-sm text-foreground/68">
                {projectDisciplineLabels[discipline]}
              </li>
            ))}
          </ul>
        </div>

        {project.period || project.role ? (
          <dl className="mt-6 space-y-4">
            {project.period ? (
              <div>
                <dt className="text-[0.6875rem] font-medium tracking-[0.12em] text-foreground/44 uppercase">
                  Period
                </dt>
                <dd className="mt-1.5 text-sm leading-6 text-foreground/68">
                  {project.period}
                </dd>
              </div>
            ) : null}

            {project.role ? (
              <div>
                <dt className="text-[0.6875rem] font-medium tracking-[0.12em] text-foreground/44 uppercase">
                  Role
                </dt>
                <dd className="mt-1.5 text-sm leading-6 text-foreground/68">
                  {project.role}
                </dd>
              </div>
            ) : null}
          </dl>
        ) : null}

        <div className="mt-7 flex flex-wrap gap-x-5 gap-y-1 lg:mt-auto lg:flex-col lg:items-start lg:gap-y-1">
          {project.links.map((link) => (
            <ProjectAction
              key={`${project.slug}-${link.kind}-${link.label}`}
              link={link}
            />
          ))}

          {hasProjectPage ? (
            <Link
              href={caseStudyHref}
              className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-foreground underline decoration-foreground/25 underline-offset-4 transition-colors duration-200 hover:decoration-foreground/75 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-4 focus-visible:ring-offset-background motion-reduce:transition-none"
            >
              {hasPublishedCaseStudy ? "Read case study" : "View project"}
              <ArrowUpRight
                aria-hidden="true"
                className="size-3.5"
                strokeWidth={1.7}
              />
            </Link>
          ) : (
            <span className="inline-flex min-h-11 items-center text-xs text-foreground/45">
              {getCaseStudyLabel(project)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export function ProjectsExplorer({ projects }: ProjectsExplorerProps) {
  const [activeFilter, setActiveFilter] = useState<ProjectFilter>("all");

  const filteredProjects = useMemo(() => {
    if (activeFilter === "all") {
      return projects;
    }

    return projects.filter((project) =>
      project.disciplines.includes(activeFilter),
    );
  }, [activeFilter, projects]);

  const groupedProjects = useMemo(
    () =>
      tierOrder
        .map((tier) => ({
          tier,
          projects: filteredProjects.filter((project) => project.tier === tier),
        }))
        .filter((group) => group.projects.length > 0),
    [filteredProjects],
  );
  const firstCoverSlug = groupedProjects
    .flatMap((group) => group.projects)
    .find((project) => project.cover)?.slug;

  return (
    <section
      aria-labelledby="project-archive-heading"
      className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
    >
      <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
        <div>
          <h2
            id="project-archive-heading"
            className="text-2xl font-semibold tracking-[-0.03em] text-foreground sm:text-3xl"
          >
            Project archive
          </h2>

          <p className="mt-4 max-w-md text-sm leading-7 text-foreground/64">
            Filter by engineering discipline. Projects spanning multiple systems
            remain visible wherever their work genuinely overlaps.
          </p>
        </div>

        <fieldset>
          <legend className="text-xs font-medium tracking-[0.14em] text-foreground/48 uppercase">
            Filter by discipline
          </legend>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              aria-pressed={activeFilter === "all"}
              onClick={() => setActiveFilter("all")}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-foreground/12 px-4 py-2 text-sm font-medium text-foreground/68 transition-colors duration-200 hover:border-foreground/28 hover:text-foreground aria-pressed:border-foreground aria-pressed:bg-foreground aria-pressed:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-4 focus-visible:ring-offset-background motion-reduce:transition-none"
            >
              All
              <span className="ml-2 font-mono text-[0.625rem] opacity-60">
                {projects.length.toString().padStart(2, "0")}
              </span>
            </button>

            {PROJECT_DISCIPLINES.map((discipline) => {
              const count = projects.filter((project) =>
                project.disciplines.includes(discipline),
              ).length;

              return (
                <button
                  key={discipline}
                  type="button"
                  aria-pressed={activeFilter === discipline}
                  onClick={() => setActiveFilter(discipline)}
                  className="inline-flex min-h-11 items-center justify-center rounded-md border border-foreground/12 px-4 py-2 text-sm font-medium text-foreground/68 transition-colors duration-200 hover:border-foreground/28 hover:text-foreground aria-pressed:border-foreground aria-pressed:bg-foreground aria-pressed:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-4 focus-visible:ring-offset-background motion-reduce:transition-none"
                >
                  {projectDisciplineLabels[discipline]}
                  <span className="ml-2 font-mono text-[0.625rem] opacity-60">
                    {count.toString().padStart(2, "0")}
                  </span>
                </button>
              );
            })}
          </div>

          <p aria-live="polite" className="mt-4 text-xs text-foreground/46">
            Showing {filteredProjects.length}{" "}
            {filteredProjects.length === 1 ? "project" : "projects"}
          </p>
        </fieldset>
      </div>

      <div className="mt-16 sm:mt-20">
        {filteredProjects.length === 0 ? (
          <div className="grid gap-5 border-y border-foreground/10 py-10 sm:py-14 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
            <p className="font-mono text-xs tracking-[0.12em] text-muted uppercase">
              {projects.length === 0
                ? "Publication status"
                : "Discipline filter"}
            </p>
            <div>
              <h3 className="font-display text-2xl tracking-[-0.03em] text-foreground">
                {projects.length === 0
                  ? "No projects are published yet."
                  : "No projects in this discipline yet."}
              </h3>
              <p className="mt-4 max-w-xl text-sm leading-7 text-muted">
                {projects.length === 0
                  ? "Project records will appear here once they are ready to share."
                  : "Choose another discipline or return to the complete archive."}
              </p>
              {projects.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setActiveFilter("all")}
                  className="mt-5 inline-flex min-h-11 items-center rounded-sm text-sm font-semibold text-foreground underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-4 focus-visible:ring-offset-background"
                >
                  Show all projects
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
        {groupedProjects.map(({ tier, projects: tierProjects }) => {
          const content = tierContent[tier];

          return (
            <section
              key={tier}
              aria-labelledby={`${tier}-projects-heading`}
              className="mt-20 first:mt-0"
            >
              <header className="grid gap-5 border-b border-foreground/10 pb-7 lg:grid-cols-[3.5rem_minmax(0,1fr)_15rem] lg:gap-8 xl:grid-cols-[4rem_minmax(0,1fr)_17rem]">
                <span className="font-mono text-xs text-foreground/38">
                  {content.index}
                </span>

                <div>
                  <h2
                    id={`${tier}-projects-heading`}
                    className="text-xl font-semibold tracking-[-0.025em] text-foreground sm:text-2xl"
                  >
                    {content.title}
                  </h2>

                  <p className="mt-3 max-w-2xl text-sm leading-6 text-foreground/60">
                    {content.description}
                  </p>
                </div>

                <p className="self-end font-mono text-xs text-foreground/40 lg:text-right">
                  {tierProjects.length.toString().padStart(2, "0")} entries
                </p>
              </header>

              <ol>
                {tierProjects.map((project) => (
                  <li key={project.slug}>
                    <ProjectEntry
                      project={project}
                      eagerCover={project.slug === firstCoverSlug}
                    />
                  </li>
                ))}
              </ol>
            </section>
          );
        })}
      </div>
    </section>
  );
}
