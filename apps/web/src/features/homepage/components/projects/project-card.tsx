import Image from "next/image";
import Link from "next/link";

import {
  ProjectHoverPanel,
  type ProjectTechnology,
} from "./project-hover-panel";

type ProjectCardProps = {
  index: string;
  title: string;
  category: string;
  image: string;
  imageAlt: string;
  technologies: readonly ProjectTechnology[];
  liveUrl?: string;
  repositoryUrl?: string;
  caseStudyUrl?: string;
};

export function ProjectCard({
  index,
  title,
  category,
  image,
  imageAlt,
  technologies,
  liveUrl,
  repositoryUrl,
  caseStudyUrl,
}: ProjectCardProps) {
  const hasActions = Boolean(liveUrl || repositoryUrl || caseStudyUrl);

  return (
    <article className="group min-w-0">
      <div className="relative aspect-[4/3] min-h-[18rem] overflow-hidden rounded-[1.35rem] border border-foreground/10 bg-foreground/[0.025]">
        <Image
          src={image}
          alt={imageAlt}
          fill
          sizes="(max-width: 639px) calc(100vw - 2.5rem), (max-width: 1023px) 50vw, 33vw"
          className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.018] group-focus-within:scale-[1.018] motion-reduce:transform-none motion-reduce:transition-none"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-black/14"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[58%] bg-gradient-to-t from-black/90 via-black/58 to-transparent"
        />

        <div className="absolute inset-x-0 bottom-0 z-10 p-5 sm:p-6">
          <div className="flex items-end justify-between gap-6">
            <div className="min-w-0">
              <p className="font-mono text-[0.6875rem] tracking-[0.08em] text-white/58">
                {index}
              </p>

              <h3 className="mt-2 text-xl leading-tight font-semibold tracking-[-0.025em] text-white sm:text-2xl">
                {title}
              </h3>

              <p className="mt-1.5 text-xs font-medium tracking-[0.08em] text-white/66 uppercase">
                {category}
              </p>
            </div>

            {hasActions ? (
              <span
                aria-hidden="true"
                className="hidden size-9 shrink-0 items-center justify-center rounded-full border border-white/22 text-sm text-white/68 lg:inline-flex"
              >
                ↗
              </span>
            ) : null}
          </div>
        </div>

        <div className="absolute inset-0 z-20 hidden bg-black/90 p-6 opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100 group-focus-within:opacity-100 lg:block motion-reduce:transition-none">
          <ProjectHoverPanel
            technologies={technologies}
            liveUrl={liveUrl}
            repositoryUrl={repositoryUrl}
            caseStudyUrl={caseStudyUrl}
          />
        </div>
      </div>

      <div className="mt-4 lg:hidden">
        {technologies.length > 0 ? (
          <ul
            aria-label={`${title} technologies`}
            className="flex flex-wrap gap-x-4 gap-y-2"
          >
            {technologies.slice(0, 5).map((technology) => (
              <li
                key={technology.name}
                className="text-xs leading-5 text-foreground/62"
              >
                {technology.name}
              </li>
            ))}
          </ul>
        ) : null}

        {hasActions ? (
          <div className="mt-4 flex flex-wrap gap-4">
            {caseStudyUrl ? (
              <Link
                href={caseStudyUrl}
                aria-label={`View ${title} project`}
                className="inline-flex min-h-11 items-center text-sm font-medium text-foreground underline decoration-foreground/30 underline-offset-4 transition-colors duration-200 hover:decoration-foreground/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-4 focus-visible:ring-offset-background motion-reduce:transition-none"
              >
                View project
                <span aria-hidden="true" className="ml-1.5">
                  ↗
                </span>
              </Link>
            ) : null}
            {liveUrl ? (
              <a
                href={liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center text-sm font-medium text-foreground underline decoration-foreground/30 underline-offset-4 transition-colors duration-200 hover:decoration-foreground/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-4 focus-visible:ring-offset-background motion-reduce:transition-none"
              >
                Live website
                <span aria-hidden="true" className="ml-1.5">
                  ↗
                </span>
              </a>
            ) : null}

            {repositoryUrl ? (
              <a
                href={repositoryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center text-sm font-medium text-foreground underline decoration-foreground/30 underline-offset-4 transition-colors duration-200 hover:decoration-foreground/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-4 focus-visible:ring-offset-background motion-reduce:transition-none"
              >
                Repository
                <span aria-hidden="true" className="ml-1.5">
                  ↗
                </span>
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
