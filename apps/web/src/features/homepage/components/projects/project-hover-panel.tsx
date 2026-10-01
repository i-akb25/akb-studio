import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import type {
  ProjectTechnology,
  TechnologyIcon,
} from "@/features/projects/types/project";

export type { ProjectTechnology } from "@/features/projects/types/project";

type ProjectHoverPanelProps = {
  technologies: readonly ProjectTechnology[];
  liveUrl?: string;
  repositoryUrl?: string;
  caseStudyUrl?: string;
};

function TechnologyMark({ icon }: { icon: TechnologyIcon }) {
  if (icon === "database") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        className="size-4"
      >
        <ellipse cx="12" cy="5" rx="7" ry="3" stroke="currentColor" />

        <path
          d="M5 5v6c0 1.7 3.1 3 7 3s7-1.3 7-3V5M5 11v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"
          stroke="currentColor"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (icon === "server") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        className="size-4"
      >
        <rect
          x="4"
          y="4"
          width="16"
          height="6"
          rx="1.5"
          stroke="currentColor"
        />

        <rect
          x="4"
          y="14"
          width="16"
          height="6"
          rx="1.5"
          stroke="currentColor"
        />

        <path
          d="M8 7h.01M8 17h.01M12 7h5M12 17h5"
          stroke="currentColor"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (icon === "ai") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        className="size-4"
      >
        <circle cx="12" cy="12" r="3" stroke="currentColor" />
        <circle cx="12" cy="4.5" r="1.5" stroke="currentColor" />
        <circle cx="19" cy="12" r="1.5" stroke="currentColor" />
        <circle cx="12" cy="19.5" r="1.5" stroke="currentColor" />
        <circle cx="5" cy="12" r="1.5" stroke="currentColor" />

        <path d="M12 6v3M17.5 12H15M12 15v3M9 12H6.5" stroke="currentColor" />
      </svg>
    );
  }

  if (icon === "hardware") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        className="size-4"
      >
        <rect
          x="7"
          y="7"
          width="10"
          height="10"
          rx="1.5"
          stroke="currentColor"
        />

        <path
          d="M9 3v4M15 3v4M9 17v4M15 17v4M3 9h4M3 15h4M17 9h4M17 15h4"
          stroke="currentColor"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (icon === "network") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        className="size-4"
      >
        <circle cx="12" cy="5" r="2" stroke="currentColor" />
        <circle cx="5" cy="18" r="2" stroke="currentColor" />
        <circle cx="19" cy="18" r="2" stroke="currentColor" />

        <path d="M11 7 6 16M13 7l5 9M7 18h10" stroke="currentColor" />
      </svg>
    );
  }

  if (icon === "tool") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        className="size-4"
      >
        <path
          d="M14.5 6.5a4.5 4.5 0 0 0-5.7 5.7L4 17l3 3 4.8-4.8a4.5 4.5 0 0 0 5.7-5.7l-2.8 2.8-3-3 2.8-2.8Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-4">
      <path
        d="m8 8-4 4 4 4M16 8l4 4-4 4M14 5l-4 14"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ProjectHoverPanel({
  technologies,
  liveUrl,
  repositoryUrl,
  caseStudyUrl,
}: ProjectHoverPanelProps) {
  const hasActions = Boolean(liveUrl || repositoryUrl || caseStudyUrl);

  return (
    <div className="flex h-full flex-col justify-end">
      {technologies.length > 0 ? (
        <div>
          <p className="text-[0.6875rem] font-medium tracking-[0.14em] text-white/58 uppercase">
            Built with
          </p>

          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-3">
            {technologies.slice(0, 6).map((technology) => (
              <li
                key={technology.name}
                className="flex items-center gap-2 text-xs font-medium text-white/82"
              >
                <span className="text-white/58">
                  <TechnologyMark icon={technology.icon} />
                </span>

                {technology.name}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {hasActions ? (
        <div className="mt-6 flex flex-wrap gap-2.5">
          {caseStudyUrl ? (
            <Link
              href={caseStudyUrl}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-white/24 px-4 py-2 text-xs font-semibold tracking-[0.04em] text-white transition-colors duration-200 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black motion-reduce:transition-none"
            >
              Read case study
              <ArrowUpRight
                aria-hidden="true"
                className="size-3.5"
                strokeWidth={1.7}
              />
            </Link>
          ) : null}
          {liveUrl ? (
            <a
              href={liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open live website in a new tab"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-white/20 bg-white px-4 py-2 text-xs font-semibold tracking-[0.04em] text-black transition-opacity duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black motion-reduce:transition-none"
            >
              Live website
              <ArrowUpRight
                aria-hidden="true"
                className="size-3.5"
                strokeWidth={1.7}
              />
            </a>
          ) : null}

          {repositoryUrl ? (
            <a
              href={repositoryUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open project repository in a new tab"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-white/24 px-4 py-2 text-xs font-semibold tracking-[0.04em] text-white transition-colors duration-200 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black motion-reduce:transition-none"
            >
              Repository
              <ArrowUpRight
                aria-hidden="true"
                className="size-3.5"
                strokeWidth={1.7}
              />
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
