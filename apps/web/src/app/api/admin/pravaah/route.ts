import { NextResponse } from "next/server";

import { assertSameOrigin, canAdmin } from "@/features/admin/server/admin-auth";
import {
  FEATURE_RELATIONSHIPS,
  FEATURE_SOURCES,
  FEATURE_TYPES,
  type FeatureRelationship,
  type FeatureSource,
  type FeatureType,
} from "@/features/pravaah/model";
import {
  featureGitHubDiscovery,
  ignoreGitHubDiscovery,
  publishManualFeature,
  updateFeatureState,
} from "@/features/pravaah/server/feature-publisher";

export const runtime = "nodejs";

function value(form: FormData, name: string): string {
  return String(form.get(name) ?? "").trim();
}

function tags(form: FormData): string[] {
  return value(form, "tags")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 12);
}

function optionalHttpsUrl(raw: string): string | undefined {
  if (!raw) return undefined;
  const url = new URL(raw);
  if (url.protocol !== "https:") throw new Error("HTTPS URL required");
  return url.href;
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
    if (Number(request.headers.get("content-length") ?? 0) > 64 * 1024)
      return NextResponse.json({ error: "Request too large" }, { status: 413 });
    const form = await request.formData();
    const action = value(form, "action");

    if (action === "feature-github") {
      await featureGitHubDiscovery(value(form, "externalId"));
    } else if (action === "ignore-github") {
      await ignoreGitHubDiscovery(value(form, "externalId"));
    } else if (action === "toggle-pin") {
      await updateFeatureState({
        id: value(form, "id"),
        pinned: value(form, "pinned") === "true",
      });
    } else if (action === "hide" || action === "archive") {
      await updateFeatureState({
        id: value(form, "id"),
        status: action === "hide" ? "hidden" : "archived",
      });
    } else if (action === "publish-manual") {
      const source = value(form, "source");
      const type = value(form, "type");
      const sourceName = value(form, "sourceName");
      const title = value(form, "title");
      const excerpt = value(form, "excerpt");
      const author = value(form, "author");
      const relationship =
        source === "announcement" ? "studio" : value(form, "relationship");
      const mediaSrc = value(form, "mediaSrc");
      const mediaAlt = value(form, "mediaAlt");
      const status = value(form, "status");
      const canonicalUrl = optionalHttpsUrl(value(form, "canonicalUrl"));
      const publishedAt = value(form, "publishedAt");
      const externalSource = [
        "github",
        "linkedin",
        "x",
        "medium",
        "quora",
        "reddit",
        "other",
      ].includes(source);

      if (
        !FEATURE_SOURCES.includes(source as FeatureSource) ||
        !FEATURE_TYPES.includes(type as FeatureType) ||
        !FEATURE_RELATIONSHIPS.includes(relationship as FeatureRelationship) ||
        (source === "other" && sourceName.length < 2) ||
        (externalSource && !canonicalUrl) ||
        (source === "announcement") !== (type === "announcement") ||
        (["mention", "news"].includes(type) && relationship !== "about-akb") ||
        author.length < 2 ||
        (status === "scheduled" && !publishedAt) ||
        title.length < 3 ||
        excerpt.length < 10 ||
        (mediaSrc && !mediaSrc.startsWith("/")) ||
        (mediaSrc && mediaAlt.length < 3) ||
        !["published", "scheduled"].includes(status)
      ) {
        throw new Error("Invalid feature item");
      }

      await publishManualFeature({
        source: source as FeatureSource,
        sourceName: sourceName || undefined,
        type: type as FeatureType,
        title,
        excerpt,
        author,
        relationship: relationship as FeatureRelationship,
        canonicalUrl,
        mediaSrc: mediaSrc || undefined,
        mediaAlt: mediaAlt || undefined,
        publishedAt: publishedAt
          ? new Date(publishedAt).toISOString()
          : undefined,
        tags: tags(form),
        pinned: form.get("pinned") === "on",
        priority: Math.min(
          100,
          Math.max(0, Number(value(form, "priority") || 0)),
        ),
        status: status as "published" | "scheduled",
      });
    } else {
      throw new Error("Unsupported action");
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Invalid Pravaah operation" },
      { status: 400 },
    );
  }
}
