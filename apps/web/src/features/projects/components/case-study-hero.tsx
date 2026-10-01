import { ArrowLeft, ArrowUpRight, CircleCheck, GitBranch } from "lucide-react";
import Link from "next/link";

import { projectDisciplineLabels } from "../data/project-registry";
import type { ProjectContentDocument } from "../server/project-content-schema";
import { ProjectIcon } from "./project-icon";
import { ProjectMedia } from "./project-media";

type CaseStudyHeroProps = {
  document: ProjectContentDocument;
};

function formatLabel(value: string): string {
  return value
    .split("-")
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

function ProjectSignalPlate({
  frontmatter,
}: Pick<ProjectContentDocument, "frontmatter">) {
  const nodes = frontmatter.systemFlow.length
    ? frontmatter.systemFlow.slice(0, 4)
    : frontmatter.technologies.slice(0, 4).map((technology) => ({
        label: technology.name,
        detail: technology.category
          ? `${formatLabel(technology.category)} responsibility`
          : "Project responsibility",
        icon: technology.icon,
      }));

  return (
    <div className="relative flex h-full min-h-[25rem] flex-col overflow-hidden rounded-[1.75rem] border border-foreground/12 bg-surface p-6 shadow-[0_30px_90px_rgba(55,37,20,0.11)] dark:shadow-[0_30px_90px_rgba(0,0,0,0.34)] sm:p-8">
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-45 [background-image:linear-gradient(to_right,color-mix(in_srgb,var(--foreground)_7%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_srgb,var(--foreground)_7%,transparent)_1px,transparent_1px)] [background-size:42px_42px]"
      />
      <div className="relative flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 font-mono text-[0.625rem] tracking-[0.16em] text-muted uppercase">
          <GitBranch
            aria-hidden="true"
            className="size-3.5"
            strokeWidth={1.7}
          />
          System plate
        </div>
        <span className="font-mono text-[0.625rem] tracking-[0.16em] text-muted-soft">
          P-{String(frontmatter.order).padStart(2, "0")}
        </span>
      </div>

      <ol className="relative my-auto space-y-3 py-8">
        {nodes.map((node, index) => (
          <li
            key={`${node.label}-${index}`}
            className="group grid grid-cols-[2.75rem_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-foreground/10 bg-background/78 p-3.5 backdrop-blur-[2px]"
          >
            <span className="grid size-11 place-items-center rounded-lg border border-foreground/10 bg-surface-subtle text-accent-warm">
              <ProjectIcon
                name={node.icon}
                aria-hidden="true"
                className="size-[18px]"
                strokeWidth={1.6}
              />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-foreground">
                {node.label}
              </span>
              <span className="mt-0.5 block truncate text-xs text-muted">
                {node.detail}
              </span>
            </span>
            <span className="font-mono text-[0.625rem] text-muted-soft">
              {String(index + 1).padStart(2, "0")}
            </span>
          </li>
        ))}
      </ol>

      <div className="relative flex items-center justify-between gap-5 border-t border-foreground/10 pt-5">
        <div>
          <p className="font-mono text-[0.625rem] tracking-[0.14em] text-muted uppercase">
            Coverage
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">
            {frontmatter.technologies.length} technologies
          </p>
        </div>
        <CircleCheck
          aria-label="Published case study"
          className="size-5 text-accent-warm"
          strokeWidth={1.6}
        />
      </div>
    </div>
  );
}

export function CaseStudyHero({ document }: CaseStudyHeroProps) {
  const { frontmatter, repository } = document;
  const leadVisual = frontmatter.visuals[0];
  const actions = frontmatter.links.filter(
    (link) => link.state === "available",
  );
  const facts = [
    frontmatter.period ? ["Period", frontmatter.period] : null,
    frontmatter.role ? ["Role", frontmatter.role] : null,
    ["Lifecycle", formatLabel(frontmatter.lifecycle)],
    repository.isAvailable ? ["Source", repository.fullName] : null,
  ].filter((fact): fact is string[] => fact !== null);

  return (
    <header className="relative overflow-hidden border-b border-foreground/10">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_78%_0%,color-mix(in_srgb,var(--accent-warm)_16%,transparent),transparent_62%)]"
      />
      <div className="relative mx-auto w-full max-w-[1440px] px-5 pt-8 pb-14 sm:px-6 sm:pt-12 sm:pb-18 lg:px-8 lg:pt-14 lg:pb-24 xl:px-10">
        <Link
          href="/projects"
          className="inline-flex min-h-11 items-center gap-2 rounded-sm text-sm font-medium text-muted transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-warm motion-reduce:transition-none"
        >
          <ArrowLeft aria-hidden="true" className="size-4" strokeWidth={1.7} />
          Project archive
        </Link>

        <div className="mt-8 grid items-stretch gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(25rem,0.92fr)] lg:gap-12 xl:gap-20">
          <div className="flex flex-col justify-center py-2 lg:py-8">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <p className="font-mono text-[0.6875rem] tracking-[0.17em] text-accent-warm uppercase">
                {frontmatter.categoryLabel}
              </p>
              <span
                aria-hidden="true"
                className="size-1 rotate-45 bg-accent-warm"
              />
              <p className="font-mono text-[0.6875rem] tracking-[0.12em] text-muted uppercase">
                {formatLabel(frontmatter.tier)} case study
              </p>
            </div>

            <h1 className="mt-7 max-w-4xl text-balance font-display text-[clamp(3rem,7vw,6.75rem)] leading-[0.88] font-semibold tracking-[-0.065em] text-foreground">
              {frontmatter.title}
            </h1>

            <p className="mt-8 max-w-3xl text-pretty text-lg leading-8 text-foreground/68 sm:text-xl sm:leading-9">
              {frontmatter.summary}
            </p>

            <div className="mt-8 flex flex-wrap gap-2">
              {frontmatter.disciplines.map((discipline) => (
                <span
                  key={discipline}
                  className="inline-flex min-h-9 items-center rounded-full border border-foreground/12 bg-surface/60 px-3.5 py-1.5 text-xs font-medium text-foreground/62"
                >
                  {projectDisciplineLabels[discipline]}
                </span>
              ))}
            </div>

            {actions.length ? (
              <div className="mt-9 flex flex-wrap gap-3">
                {actions.map((action, index) => (
                  <a
                    key={`${action.kind}-${action.href}`}
                    href={action.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold transition-[transform,background-color,color,border-color] duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-warm motion-reduce:transform-none motion-reduce:transition-none ${
                      index === 0
                        ? "bg-foreground text-background"
                        : "border border-foreground/16 bg-surface text-foreground hover:border-accent-warm"
                    }`}
                  >
                    {action.label}
                    <ArrowUpRight
                      aria-hidden="true"
                      className="size-4"
                      strokeWidth={1.7}
                    />
                  </a>
                ))}
              </div>
            ) : null}
          </div>

          <div className="relative">
            {leadVisual ? (
              <figure className="relative h-full min-h-[25rem] overflow-hidden rounded-[1.75rem] border border-foreground/12 bg-surface shadow-[0_30px_90px_rgba(55,37,20,0.14)] dark:shadow-[0_30px_90px_rgba(0,0,0,0.38)]">
                <ProjectMedia
                  src={leadVisual.src}
                  alt={leadVisual.alt}
                  sizes="(max-width: 1023px) calc(100vw - 2.5rem), 44vw"
                  priority
                  className="object-cover"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/5"
                />
                <figcaption className="absolute inset-x-0 bottom-0 p-6 text-sm leading-6 text-white/80 sm:p-8">
                  {leadVisual.caption}
                </figcaption>
              </figure>
            ) : (
              <ProjectSignalPlate frontmatter={frontmatter} />
            )}
          </div>
        </div>

        <dl className="mt-12 grid border-y border-foreground/10 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4">
          {facts.map(([label, value], index) => (
            <div
              key={label}
              className={`py-5 sm:px-5 lg:py-6 ${
                index > 0
                  ? "border-t border-foreground/10 sm:border-t-0 sm:border-l"
                  : ""
              } ${index === 2 ? "sm:border-t lg:border-t-0" : ""}`}
            >
              <dt className="font-mono text-[0.625rem] tracking-[0.15em] text-muted-soft uppercase">
                {label}
              </dt>
              <dd className="mt-2 text-sm leading-6 font-medium text-foreground/76">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </header>
  );
}
