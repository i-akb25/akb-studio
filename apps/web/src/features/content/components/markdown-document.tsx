import type { ReactNode } from "react";

type MarkdownDocumentProps = { markdown: string };

type Block =
  | { id: string; type: "heading"; level: number; text: string }
  | { id: string; type: "paragraph"; text: string }
  | { id: string; type: "code"; language?: string; text: string }
  | { id: string; type: "quote"; text: string }
  | { id: string; type: "list"; items: string[] };

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[`*_~[\]().,:;!?'"“”‘’]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function stableId(
  type: Block["type"],
  value: string,
  occurrence: number,
): string {
  const base = slugify(value).slice(0, 72) || type;
  return `${type}-${base}-${occurrence}`;
}

function parse(markdown: string): Block[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  const occurrences = new Map<string, number>();
  let paragraph: string[] = [];
  let list: string[] = [];

  const nextId = (type: Block["type"], value: string): string => {
    const key = `${type}:${value}`;
    const occurrence = (occurrences.get(key) ?? 0) + 1;
    occurrences.set(key, occurrence);
    return stableId(type, value, occurrence);
  };

  const flushParagraph = () => {
    const text = paragraph.join(" ").trim();
    if (text)
      blocks.push({ id: nextId("paragraph", text), type: "paragraph", text });
    paragraph = [];
  };

  const flushList = () => {
    if (list.length) {
      const items = [...list];
      blocks.push({ id: nextId("list", items.join("|")), type: "list", items });
    }
    list = [];
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";

    if (line.startsWith("```")) {
      flushParagraph();
      flushList();
      const language = line.slice(3).trim() || undefined;
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index]?.startsWith("```")) {
        code.push(lines[index] ?? "");
        index += 1;
      }
      const text = code.join("\n");
      blocks.push({
        id: nextId("code", `${language ?? ""}:${text}`),
        type: "code",
        language,
        text,
      });
      continue;
    }

    const heading = /^(#{2,4})\s+(.+)$/.exec(line);
    if (heading) {
      flushParagraph();
      flushList();
      const text = heading[2].trim();
      blocks.push({
        id: nextId("heading", text),
        type: "heading",
        level: heading[1].length,
        text,
      });
      continue;
    }

    if (line.startsWith("> ")) {
      flushParagraph();
      flushList();
      const text = line.slice(2).trim();
      blocks.push({ id: nextId("quote", text), type: "quote", text });
      continue;
    }

    const listItem = /^[-*]\s+(.+)$/.exec(line);
    if (listItem) {
      flushParagraph();
      list.push(listItem[1].trim());
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }

    paragraph.push(line.trim());
  }

  flushParagraph();
  flushList();
  return blocks;
}

function inline(text: string): ReactNode[] {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g);
  const occurrences = new Map<string, number>();

  return parts.map((part) => {
    const occurrence = (occurrences.get(part) ?? 0) + 1;
    occurrences.set(part, occurrence);
    const key = `${slugify(part).slice(0, 64) || "text"}-${occurrence}`;

    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={key}>{part.slice(1, -1)}</code>;
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }
    const link = /^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/.exec(part);
    if (link) {
      return (
        <a key={key} href={link[2]} target="_blank" rel="noreferrer noopener">
          {link[1]}
        </a>
      );
    }
    return <span key={key}>{part}</span>;
  });
}

export function MarkdownDocument({ markdown }: MarkdownDocumentProps) {
  return (
    <div className="akb-prose">
      {parse(markdown).map((block) => {
        if (block.type === "heading") {
          const id = slugify(block.text);
          if (block.level === 2)
            return (
              <h2 id={id} key={block.id}>
                {inline(block.text)}
              </h2>
            );
          if (block.level === 3)
            return (
              <h3 id={id} key={block.id}>
                {inline(block.text)}
              </h3>
            );
          return (
            <h4 id={id} key={block.id}>
              {inline(block.text)}
            </h4>
          );
        }
        if (block.type === "code") {
          return (
            <figure className="akb-code" key={block.id}>
              {block.language ? (
                <figcaption>{block.language}</figcaption>
              ) : null}
              <pre>
                <code>{block.text}</code>
              </pre>
            </figure>
          );
        }
        if (block.type === "quote")
          return <blockquote key={block.id}>{inline(block.text)}</blockquote>;
        if (block.type === "list")
          return (
            <ul key={block.id}>
              {block.items.map((item) => (
                <li key={`${block.id}-${slugify(item)}`}>{inline(item)}</li>
              ))}
            </ul>
          );
        return <p key={block.id}>{inline(block.text)}</p>;
      })}
    </div>
  );
}
