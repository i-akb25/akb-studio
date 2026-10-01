import Link from "next/link";
import type { ReactNode } from "react";

import {
  LEGAL_EFFECTIVE_DATE,
  LEGAL_ROUTES,
  PRIVACY_CONTACT,
} from "@/features/legal/policy-registry";

export type LegalSection = {
  id?: string;
  title: string;
  content: ReactNode;
};

type LegalPageProps = {
  eyebrow: string;
  title: string;
  summary: string;
  version: string;
  sections: readonly LegalSection[];
};

export function LegalPage({
  eyebrow,
  title,
  summary,
  version,
  sections,
}: LegalPageProps) {
  const sectionId = (section: LegalSection, index: number) =>
    section.id ??
    `${String(index + 1).padStart(2, "0")}-${section.title
      .toLocaleLowerCase("en-IN")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")}`;

  return (
    <main className="legal-page">
      <header className="legal-page__hero">
        <div>
          <p className="legal-page__kicker">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="legal-page__summary">{summary}</p>
        </div>
        <dl className="legal-page__meta">
          <div>
            <dt>Effective</dt>
            <dd>{LEGAL_EFFECTIVE_DATE}</dd>
          </div>
          <div>
            <dt>Version</dt>
            <dd>{version}</dd>
          </div>
          <div>
            <dt>Operator</dt>
            <dd>Anurag Kumar Bharti</dd>
          </div>
        </dl>
      </header>

      <div className="legal-page__body">
        <ol className="legal-page__index" aria-label={`${title} contents`}>
          {sections.map((section, index) => (
            <li key={section.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <a href={`#${sectionId(section, index)}`}>{section.title}</a>
            </li>
          ))}
        </ol>

        <div className="legal-page__sections">
          {sections.map((section, index) => (
            <section
              id={sectionId(section, index)}
              key={section.title}
              tabIndex={-1}
            >
              <span className="legal-page__number" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="legal-page__content">
                <h2>{section.title}</h2>
                {section.content}
              </div>
            </section>
          ))}
        </div>
      </div>

      <footer className="legal-page__footer">
        <div>
          <p>
            Questions or rights requests:{" "}
            <a href={`mailto:${PRIVACY_CONTACT}`}>{PRIVACY_CONTACT}</a>
          </p>
          <nav aria-label="Legal documents">
            {LEGAL_ROUTES.map((route) => (
              <Link href={route.href} key={route.href}>
                {route.label}
              </Link>
            ))}
          </nav>
        </div>
        <Link href="/contact">Contact AKB Studio</Link>
      </footer>
    </main>
  );
}
