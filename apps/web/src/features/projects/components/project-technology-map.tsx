import type { ProjectContentDocument } from "../server/project-content-schema";
import { ProjectIcon } from "./project-icon";

type ProjectTechnologyMapProps = {
  technologies: ProjectContentDocument["frontmatter"]["technologies"];
};

function formatCategory(value: string | undefined): string {
  if (!value) {
    return "System tool";
  }

  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

export function ProjectTechnologyMap({
  technologies,
}: ProjectTechnologyMapProps) {
  return (
    <section
      aria-labelledby="project-technology-map"
      className="my-16 sm:my-20"
    >
      <p className="font-mono text-[0.6875rem] tracking-[0.17em] text-accent-warm uppercase">
        Technology map
      </p>
      <h2
        id="project-technology-map"
        className="mt-3 max-w-2xl font-display text-3xl leading-tight font-semibold tracking-[-0.04em] text-foreground sm:text-4xl"
      >
        Tools are shown by the responsibility they carry.
      </h2>

      <ul className="mt-8 grid border-t border-foreground/10 sm:grid-cols-2 xl:grid-cols-3">
        {technologies.map((technology) => (
          <li
            key={technology.name}
            className="grid min-h-28 grid-cols-[2.75rem_minmax(0,1fr)] items-center gap-4 border-b border-foreground/10 py-5 sm:px-5 sm:nth-[2n]:border-l xl:nth-[2n]:border-l-0 xl:nth-[3n+2]:border-x"
          >
            <span className="grid size-11 place-items-center rounded-lg border border-foreground/10 bg-surface text-accent-warm">
              <ProjectIcon
                name={technology.icon}
                aria-hidden="true"
                className="size-[18px]"
                strokeWidth={1.6}
              />
            </span>
            <span>
              <span className="block text-sm font-semibold text-foreground/82">
                {technology.name}
              </span>
              <span className="mt-1 block font-mono text-[0.625rem] tracking-[0.12em] text-muted-soft uppercase">
                {formatCategory(technology.category)}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
