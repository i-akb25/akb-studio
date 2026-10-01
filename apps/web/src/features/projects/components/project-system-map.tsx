import { ArrowDown, Route } from "lucide-react";

import type { ProjectContentDocument } from "../server/project-content-schema";
import { ProjectIcon } from "./project-icon";

type ProjectSystemMapProps = {
  nodes: ProjectContentDocument["frontmatter"]["systemFlow"];
};

export function ProjectSystemMap({ nodes }: ProjectSystemMapProps) {
  if (!nodes.length) {
    return null;
  }

  return (
    <section aria-labelledby="project-system-map" className="my-16 sm:my-20">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="font-mono text-[0.6875rem] tracking-[0.17em] text-accent-warm uppercase">
            Architecture route
          </p>
          <h2
            id="project-system-map"
            className="mt-3 font-display text-3xl leading-tight font-semibold tracking-[-0.04em] text-foreground sm:text-4xl"
          >
            How responsibility moves through the system.
          </h2>
        </div>
        <Route
          aria-hidden="true"
          className="size-6 text-muted-soft"
          strokeWidth={1.4}
        />
      </div>

      <ol className="mt-8 grid gap-3 lg:grid-cols-2">
        {nodes.map((node, index) => (
          <li
            key={`${node.label}-${index}`}
            className="relative grid min-h-36 grid-cols-[3rem_minmax(0,1fr)] gap-4 rounded-2xl border border-foreground/10 bg-surface p-5 sm:p-6"
          >
            <span className="grid size-12 place-items-center rounded-xl border border-foreground/10 bg-background text-accent-warm">
              <ProjectIcon
                name={node.icon}
                aria-hidden="true"
                className="size-5"
                strokeWidth={1.5}
              />
            </span>
            <div>
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-display text-lg font-semibold tracking-[-0.025em] text-foreground">
                  {node.label}
                </h3>
                <span className="font-mono text-[0.625rem] text-muted-soft">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted">{node.detail}</p>
            </div>
            {index < nodes.length - 1 ? (
              <ArrowDown
                aria-hidden="true"
                className="absolute -bottom-2.5 left-8 z-10 size-5 rounded-full border border-foreground/10 bg-background p-1 text-muted lg:hidden"
                strokeWidth={1.5}
              />
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
