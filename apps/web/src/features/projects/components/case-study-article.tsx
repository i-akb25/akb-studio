import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Children, isValidElement, type ReactNode } from "react";
import Markdown, { type Components } from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

import { ProjectMedia, resolveProjectImage } from "./project-media";

export type ArticleSection = {
  id: string;
  title: string;
};

type CaseStudyArticleProps = {
  markdown: string;
  sections: readonly ArticleSection[];
};

function getNodeText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(getNodeText).join("");
  }

  if (isValidElement<{ children?: ReactNode }>(node)) {
    return getNodeText(node.props.children);
  }

  return "";
}

export function createHeadingId(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function getArticleSections(markdown: string): ArticleSection[] {
  return markdown
    .split("\n")
    .map((line) => /^##\s+(.+?)(?:\s+#+)?$/.exec(line.trim()))
    .filter((match): match is RegExpExecArray => match !== null)
    .map((match) => ({
      id: createHeadingId(match[1]),
      title: match[1],
    }));
}

function createMarkdownComponents(
  sectionNumberById: ReadonlyMap<string, number>,
): Components {
  return {
    h1({ children }) {
      return (
        <h2 className="mt-16 font-display text-3xl leading-tight font-semibold tracking-[-0.035em] text-foreground first:mt-0 sm:text-4xl">
          {children}
        </h2>
      );
    },
    h2({ children }) {
      const title = Children.toArray(children).map(getNodeText).join("");
      const id = createHeadingId(title);
      const sectionNumber = sectionNumberById.get(id);

      return (
        <h2
          id={id}
          className="mt-20 grid scroll-mt-28 grid-cols-[2rem_minmax(0,1fr)] gap-3 border-t border-foreground/10 pt-8 font-display text-3xl leading-tight font-semibold tracking-[-0.04em] text-foreground first:mt-0 sm:grid-cols-[2.5rem_minmax(0,1fr)] sm:text-4xl"
        >
          <span className="pt-1 font-mono text-[0.6875rem] leading-6 font-normal tracking-[0.12em] text-accent-warm">
            {sectionNumber ? String(sectionNumber).padStart(2, "0") : "•"}
          </span>
          <span>{children}</span>
        </h2>
      );
    },
    h3({ children }) {
      return (
        <h3 className="mt-10 font-display text-xl leading-snug font-semibold tracking-[-0.025em] text-foreground sm:text-2xl">
          {children}
        </h3>
      );
    },
    h4({ children }) {
      return (
        <h4 className="mt-8 text-base leading-7 font-semibold text-foreground">
          {children}
        </h4>
      );
    },
    p({ children }) {
      return (
        <p className="mt-5 max-w-3xl text-pretty text-base leading-8 text-foreground/70 sm:text-[1.0625rem]">
          {children}
        </p>
      );
    },
    strong({ children }) {
      return (
        <strong className="font-semibold text-foreground">{children}</strong>
      );
    },
    em({ children }) {
      return <em className="text-foreground/82">{children}</em>;
    },
    a({ href, children }) {
      if (!href) {
        return <span>{children}</span>;
      }

      if (href.startsWith("/") || href.startsWith("#")) {
        return (
          <Link
            href={href}
            className="rounded-sm font-medium text-foreground underline decoration-foreground/28 underline-offset-4 transition-colors duration-200 hover:decoration-foreground/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-warm motion-reduce:transition-none"
          >
            {children}
          </Link>
        );
      }

      try {
        if (new URL(href).protocol !== "https:") {
          return <span>{children}</span>;
        }
      } catch {
        return <span>{children}</span>;
      }

      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-baseline gap-1 rounded-sm font-medium text-foreground underline decoration-foreground/28 underline-offset-4 transition-colors duration-200 hover:decoration-foreground/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-warm motion-reduce:transition-none"
        >
          {children}
          <ArrowUpRight
            aria-hidden="true"
            className="inline size-3.5 shrink-0"
            strokeWidth={1.7}
          />
        </a>
      );
    },
    ul({ children }) {
      return <ul className="mt-6 max-w-3xl space-y-3 pl-1">{children}</ul>;
    },
    ol({ children }) {
      return <ol className="mt-6 max-w-3xl space-y-3 pl-1">{children}</ol>;
    },
    li({ children }) {
      return (
        <li className="grid grid-cols-[0.75rem_minmax(0,1fr)] gap-3 text-base leading-7 text-foreground/70 before:mt-[0.7rem] before:size-1.5 before:rotate-45 before:border before:border-accent-warm/60">
          <div>{children}</div>
        </li>
      );
    },
    blockquote({ children }) {
      return (
        <blockquote className="my-10 max-w-3xl border-l-2 border-accent-warm pl-6 font-display text-xl leading-8 tracking-[-0.015em] text-foreground/82 sm:pl-8 sm:text-2xl sm:leading-9">
          {children}
        </blockquote>
      );
    },
    code({ className, children }) {
      return className ? (
        <code className="font-mono text-[0.8125rem] leading-6 text-foreground/82">
          {children}
        </code>
      ) : (
        <code className="rounded-md border border-foreground/10 bg-foreground/[0.04] px-1.5 py-0.5 font-mono text-[0.85em] text-foreground">
          {children}
        </code>
      );
    },
    pre({ children }) {
      return (
        <pre className="my-8 max-w-3xl overflow-x-auto rounded-xl border border-foreground/10 bg-surface p-5 sm:p-6">
          {children}
        </pre>
      );
    },
    table({ children }) {
      return (
        <div className="my-10 max-w-4xl overflow-x-auto border-y border-foreground/10">
          <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
            {children}
          </table>
        </div>
      );
    },
    thead({ children }) {
      return (
        <thead className="border-b border-foreground/15">{children}</thead>
      );
    },
    th({ children }) {
      return (
        <th className="px-4 py-4 text-xs font-semibold tracking-[0.1em] text-foreground/58 uppercase first:pl-0">
          {children}
        </th>
      );
    },
    td({ children }) {
      return (
        <td className="border-b border-foreground/[0.07] px-4 py-4 align-top leading-6 text-foreground/68 first:pl-0">
          {children}
        </td>
      );
    },
    hr() {
      return (
        <hr className="my-14 max-w-3xl border-0 border-t border-foreground/10" />
      );
    },
    img({ src, alt }) {
      const source = typeof src === "string" ? src : "";

      if (!resolveProjectImage(source)) {
        return (
          <span className="my-8 block max-w-3xl border-y border-foreground/10 py-5 text-sm text-muted">
            Project image unavailable
          </span>
        );
      }

      return (
        <span className="my-10 block max-w-4xl">
          <span className="relative block aspect-[16/9] overflow-hidden rounded-2xl border border-foreground/10 bg-surface">
            <ProjectMedia
              src={source}
              alt={alt ?? ""}
              sizes="(max-width: 1023px) calc(100vw - 2.5rem), 56rem"
            />
          </span>
          {alt ? (
            <span className="mt-3 block text-xs leading-5 text-muted">
              {alt}
            </span>
          ) : null}
        </span>
      );
    },
  };
}

export function CaseStudyArticle({
  markdown,
  sections,
}: CaseStudyArticleProps) {
  const sectionNumberById = new Map(
    sections.map((section, index) => [section.id, index + 1]),
  );

  return (
    <Markdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeSanitize]}
      components={createMarkdownComponents(sectionNumberById)}
    >
      {markdown}
    </Markdown>
  );
}
