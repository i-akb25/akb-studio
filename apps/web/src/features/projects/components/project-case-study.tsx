import { ArrowUpRight, BookOpenText } from "lucide-react";
import Link from "next/link";

import type { ProjectContentDocument } from "../server/project-content-schema";
import { CaseStudyArticle, getArticleSections } from "./case-study-article";
import { CaseStudyHero } from "./case-study-hero";
import { ProjectGallery } from "./project-gallery";
import { ProjectMetrics } from "./project-metrics";
import { ProjectSystemMap } from "./project-system-map";
import { ProjectTechnologyMap } from "./project-technology-map";

type ProjectCaseStudyProps = {
  document: ProjectContentDocument;
};

function formatReviewDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

export function ProjectCaseStudy({ document }: ProjectCaseStudyProps) {
  const { frontmatter } = document;
  const sections = getArticleSections(document.markdown);

  return (
    <main>
      <CaseStudyHero document={document} />
      <ProjectMetrics metrics={frontmatter.metrics} />

      <div className="mx-auto grid w-full max-w-[1440px] gap-12 px-5 py-16 sm:px-6 sm:py-20 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-16 lg:px-8 lg:py-24 xl:grid-cols-[16rem_minmax(0,1fr)] xl:gap-24 xl:px-10">
        <aside>
          <div className="lg:sticky lg:top-28">
            <div className="flex items-center gap-2 text-muted">
              <BookOpenText
                aria-hidden="true"
                className="size-4"
                strokeWidth={1.6}
              />
              <p className="font-mono text-[0.6875rem] tracking-[0.15em] uppercase">
                Field notes
              </p>
            </div>

            <nav aria-label="Case-study sections" className="mt-5">
              <ol className="space-y-0.5 border-l border-foreground/10 pl-4">
                {sections.map((section, index) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="grid min-h-10 grid-cols-[1.75rem_minmax(0,1fr)] items-center rounded-sm text-sm text-muted transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-warm motion-reduce:transition-none"
                    >
                      <span className="font-mono text-[0.625rem] text-muted-soft">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span>{section.title}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </div>
        </aside>

        <article className="min-w-0 max-w-5xl">
          <ProjectSystemMap nodes={frontmatter.systemFlow} />
          <CaseStudyArticle markdown={document.markdown} sections={sections} />
          <ProjectGallery visuals={frontmatter.visuals} />
          <ProjectTechnologyMap technologies={frontmatter.technologies} />

          <footer className="mt-20 grid gap-7 border-t border-foreground/10 pt-8 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <div>
              <p className="font-mono text-[0.6875rem] tracking-[0.15em] text-accent-warm uppercase">
                Editorial integrity
              </p>
              <p className="mt-3 max-w-xl text-xs leading-5 text-muted">
                Technical claims are curated against retained project records
                and reviewed before publication. Sensitive operational data
                remains excluded from public examples.
              </p>
              {frontmatter.publishedAt ? (
                <p className="mt-2 text-xs leading-5 text-muted-soft">
                  Last reviewed{" "}
                  <time dateTime={frontmatter.publishedAt}>
                    {formatReviewDate(frontmatter.publishedAt)}
                  </time>
                  .
                </p>
              ) : null}
            </div>

            <Link
              href="/projects"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-foreground/14 px-5 text-sm font-semibold text-foreground transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-accent-warm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-warm motion-reduce:transform-none motion-reduce:transition-none"
            >
              All projects
              <ArrowUpRight
                aria-hidden="true"
                className="size-4"
                strokeWidth={1.7}
              />
            </Link>
          </footer>
        </article>
      </div>
    </main>
  );
}
