import { NextResponse } from "next/server";
import { adminErrorResponse } from "@/features/admin/server/admin-api-response";
import { assertSameOrigin, canAdmin } from "@/features/admin/server/admin-auth";
import { extractDocumentText } from "@/features/admin/server/document-parser";
import { publishEditorial } from "@/features/admin/server/github-publisher";
import {
  type ContentSource,
  parseContentDiscipline,
  parseKnowledgeKind,
} from "@/features/content/model";
import { callPublishingService } from "@/features/publishing/server/publishing-service";

export const runtime = "nodejs";

const SOURCE_TYPES: ContentSource["type"][] = [
  "original",
  "project",
  "paper",
  "book",
  "documentation",
  "dataset",
  "website",
  "mixed",
];

function values(form: FormData, name: string): string[] {
  return String(form.get(name) ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export async function POST(request: Request) {
  if (!(await canAdmin("content:publish"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    assertSameOrigin(request);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 403 });
  }

  try {
    if (Number(request.headers.get("content-length") ?? 0) > 5 * 1024 * 1024)
      return NextResponse.json({ error: "Request too large" }, { status: 413 });
    const form = await request.formData();
    const kind = String(form.get("kind") ?? "");
    const knowledgeKind = parseKnowledgeKind(
      String(form.get("knowledgeKind") ?? "note"),
    );
    const title = String(form.get("title") ?? "").trim();
    const slug = String(form.get("slug") ?? "").trim();
    const description = String(form.get("description") ?? "").trim();
    const sourceLabel = String(form.get("sourceLabel") ?? "").trim();
    const sourceType = String(form.get("sourceType") ?? "original");
    const sourceUrlValue = String(form.get("sourceUrl") ?? "").trim();
    const sourceUrl = sourceUrlValue ? new URL(sourceUrlValue) : undefined;

    if (
      (kind !== "journal" && kind !== "knowledge") ||
      !knowledgeKind ||
      title.length < 3 ||
      title.length > 180 ||
      !/^[a-z0-9-]{2,160}$/.test(slug) ||
      description.length < 10 ||
      description.length > 500 ||
      sourceLabel.length < 2 ||
      sourceLabel.length > 180 ||
      !SOURCE_TYPES.includes(sourceType as ContentSource["type"]) ||
      (sourceUrl && sourceUrl.protocol !== "https:")
    ) {
      throw new Error("Invalid publication metadata");
    }

    let body = String(form.get("markdown") ?? "").trim();
    const file = form.get("document");
    if (file instanceof File && file.size > 0) {
      body = await extractDocumentText(file);
    }
    if (body.length < 20 || body.length > 120_000) {
      throw new Error("Invalid publication body");
    }

    const disciplines = values(form, "disciplines").map(parseContentDiscipline);
    if (disciplines.length === 0 || disciplines.some((value) => !value)) {
      throw new Error("Invalid discipline");
    }

    const result = await publishEditorial({
      kind,
      knowledgeKind,
      title,
      slug,
      description,
      sourceLabel,
      sourceType: sourceType as ContentSource["type"],
      sourceUrl: sourceUrl?.toString(),
      disciplines: disciplines.filter((value) => value !== undefined),
      topics: values(form, "topics"),
      tags: values(form, "tags"),
      body,
      attachments: String(form.get("attachments") ?? "").trim(),
    });

    let warning: string | undefined;
    if (form.get("notificationRequested") === "on") {
      const notification = await callPublishingService("publication_event", {
        publicationId: result.id,
        contentType: kind,
        slug,
        title,
        publishedAt: result.publishedAt,
        notificationRequested: true,
        scheduledAt: String(form.get("scheduledAt") ?? "").trim() || undefined,
      });
      if (!notification.ok)
        warning =
          "The content was published, but its notification could not be queued.";
    }

    return NextResponse.json({
      ok: true,
      canonicalPath: result.canonicalPath,
      warning,
    });
  } catch (error) {
    return adminErrorResponse(error, {
      event: "admin_content_publish_failed",
      fallback:
        "The content could not be published. Check the document, repository access and required metadata.",
    });
  }
}
