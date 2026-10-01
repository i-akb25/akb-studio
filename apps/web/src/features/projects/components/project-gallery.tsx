import { ScanLine } from "lucide-react";

import type { ProjectContentDocument } from "../server/project-content-schema";
import { ProjectMedia } from "./project-media";

type ProjectGalleryProps = {
  visuals: ProjectContentDocument["frontmatter"]["visuals"];
};

const aspectClassName = {
  landscape: "aspect-[16/10]",
  portrait: "aspect-[4/5]",
  square: "aspect-square",
} as const;

export function ProjectGallery({ visuals }: ProjectGalleryProps) {
  const galleryVisuals = visuals.slice(1);

  if (!galleryVisuals.length) {
    return null;
  }

  return (
    <section aria-labelledby="project-gallery" className="my-16 sm:my-20">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="font-mono text-[0.6875rem] tracking-[0.17em] text-accent-warm uppercase">
            Field evidence
          </p>
          <h2
            id="project-gallery"
            className="mt-3 font-display text-3xl leading-tight font-semibold tracking-[-0.04em] text-foreground sm:text-4xl"
          >
            Interfaces, hardware and recorded output.
          </h2>
        </div>
        <ScanLine
          aria-hidden="true"
          className="size-6 text-muted-soft"
          strokeWidth={1.4}
        />
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {galleryVisuals.map((visual, index) => (
          <figure
            key={`${visual.src}-${index}`}
            className={
              index === 0 && galleryVisuals.length > 2 ? "md:col-span-2" : ""
            }
          >
            <div
              className={`relative overflow-hidden rounded-2xl border border-foreground/10 bg-surface ${
                index === 0 && galleryVisuals.length > 2
                  ? "aspect-[16/8]"
                  : aspectClassName[visual.aspect]
              }`}
            >
              <ProjectMedia
                src={visual.src}
                alt={visual.alt}
                sizes={
                  index === 0 && galleryVisuals.length > 2
                    ? "(max-width: 1279px) calc(100vw - 2.5rem), 64rem"
                    : "(max-width: 767px) calc(100vw - 2.5rem), 32rem"
                }
                className="object-cover transition-transform duration-500 hover:scale-[1.015] motion-reduce:transition-none"
              />
            </div>
            <figcaption className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-3 text-xs leading-5 text-muted">
              <span className="font-mono text-[0.625rem] text-muted-soft">
                {String(index + 2).padStart(2, "0")}
              </span>
              {visual.caption}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
