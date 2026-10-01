import type { Metadata } from "next";
import Link from "next/link";

import { ProjectsExplorer } from "@/features/projects/components/projects-explorer";
import { projectDisciplineLabels } from "@/features/projects/data/project-registry";
import { getProjectRegistry } from "@/features/projects/server/resolve-project-registry";
import { PROJECT_DISCIPLINES } from "@/features/projects/types/project";
import { createPageMetadata } from "@/features/seo/site-config";

export const revalidate = 3600;

export function generateMetadata(): Metadata {
  return createPageMetadata({
    title: "Projects",
    description:
      "Engineering projects across software, electrical systems, robotics, automation and AI, presented through their problems, constraints, decisions, implementation and evidence.",
    path: "/projects",
  });
}

function getCoverageWidth(count: number, maximumCount: number): `${number}%` {
  if (count === 0 || maximumCount === 0) {
    return "0%";
  }

  return `${Math.max((count / maximumCount) * 100, 8)}%`;
}

export default async function ProjectsPage() {
  const publishedProjects = await getProjectRegistry();
  const disciplineCounts = PROJECT_DISCIPLINES.map((discipline) => ({
    discipline,
    count: publishedProjects.filter((project) =>
      project.disciplines.includes(discipline),
    ).length,
  }));
  const maximumDisciplineCount = Math.max(
    ...disciplineCounts.map(({ count }) => count),
  );

  return (
    <main>
      <section
        aria-labelledby="projects-heading"
        className="relative overflow-hidden border-b border-foreground/10"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
            backgroundSize: "4rem 4rem",
          }}
        />

        <div className="relative mx-auto grid w-full max-w-7xl gap-14 px-5 pt-28 pb-16 sm:px-6 sm:pt-32 sm:pb-20 lg:grid-cols-[1.35fr_0.65fr] lg:gap-20 lg:px-8 lg:pt-40 lg:pb-24">
          <div className="max-w-4xl">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-foreground/48">07</span>

              <span aria-hidden="true" className="h-px w-10 bg-foreground/15" />

              <span
                aria-hidden="true"
                className="size-1.5 rotate-45 border border-foreground/25"
              />

              <p className="text-sm font-medium tracking-[0.14em] text-foreground/60 uppercase">
                Selected work
              </p>
            </div>

            <h1
              id="projects-heading"
              className="mt-8 max-w-4xl text-balance text-4xl leading-[1.05] font-semibold tracking-[-0.045em] text-foreground sm:text-5xl lg:text-6xl xl:text-[4.5rem]"
            >
              Engineering work, shown through the decisions behind it.
            </h1>

            <p className="mt-7 max-w-2xl text-pretty text-base leading-7 text-foreground/70 sm:text-lg sm:leading-8">
              I present each project through the problem, constraints,
              decisions, available evidence, and what I learned while building
              it.
            </p>
          </div>

          <aside
            aria-labelledby="discipline-coverage-heading"
            className="self-end border-t border-foreground/12 pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8"
          >
            <div className="flex items-center justify-between gap-4">
              <h2
                id="discipline-coverage-heading"
                className="text-xs font-semibold tracking-[0.14em] text-foreground/60 uppercase"
              >
                Discipline coverage
              </h2>

              <span className="font-mono text-xs text-foreground/40">
                {publishedProjects.length.toString().padStart(2, "0")} records
              </span>
            </div>

            <dl className="mt-6 space-y-5">
              {disciplineCounts.map(({ discipline, count }) => (
                <div
                  key={discipline}
                  className="relative flex items-center justify-between gap-4 pb-3 before:absolute before:bottom-0 before:left-0 before:z-10 before:h-px before:w-[var(--coverage-width)] before:bg-foreground/52 after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-foreground/10"
                  style={
                    {
                      "--coverage-width": getCoverageWidth(
                        count,
                        maximumDisciplineCount,
                      ),
                    } as React.CSSProperties
                  }
                >
                  <dt className="text-sm text-foreground/70">
                    {projectDisciplineLabels[discipline]}
                  </dt>

                  <dd className="font-mono text-xs text-foreground/48">
                    {count.toString().padStart(2, "0")}
                  </dd>
                </div>
              ))}
            </dl>
          </aside>
        </div>
      </section>

      <aside className="mx-auto flex max-w-7xl flex-col justify-between gap-5 border-b border-foreground/10 px-5 py-8 sm:flex-row sm:items-center sm:px-6 lg:px-8">
        <div>
          <p className="font-mono text-xs tracking-[0.14em] text-foreground/48 uppercase">
            Engineering lab
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground/68">
            Change documented control, drone and secure-request assumptions in
            deterministic demonstrations.
          </p>
        </div>
        <Link
          href="/lab"
          className="shrink-0 border border-foreground/18 px-4 py-3 text-sm font-semibold"
        >
          Open the lab
        </Link>
      </aside>

      <ProjectsExplorer projects={publishedProjects} />
    </main>
  );
}
