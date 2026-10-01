import { z } from "zod";

export const FEATURE_SOURCES = [
  "github",
  "linkedin",
  "x",
  "medium",
  "quora",
  "reddit",
  "other",
  "manual",
  "announcement",
] as const;

export const FEATURE_TYPES = [
  "project",
  "release",
  "post",
  "announcement",
  "mention",
  "news",
] as const;

export const FEATURE_RELATIONSHIPS = ["by-akb", "about-akb", "studio"] as const;

export const FEATURE_STATUSES = [
  "pending",
  "published",
  "scheduled",
  "hidden",
  "archived",
] as const;

const canonicalUrlSchema = z
  .string()
  .trim()
  .url()
  .max(2048)
  .transform((value, context) => {
    const url = new URL(value);

    if (url.protocol !== "https:" || url.username || url.password) {
      context.addIssue({
        code: "custom",
        message: "Canonical source URLs must use HTTPS without credentials",
      });
      return z.NEVER;
    }

    url.hash = "";
    for (const key of [...url.searchParams.keys()]) {
      if (key.toLowerCase().startsWith("utm_")) url.searchParams.delete(key);
    }

    return url.href;
  });

const sourceHosts: Partial<Record<(typeof FEATURE_SOURCES)[number], string[]>> =
  {
    github: ["github.com"],
    linkedin: ["linkedin.com"],
    x: ["x.com", "twitter.com"],
    medium: ["medium.com"],
    quora: ["quora.com"],
    reddit: ["reddit.com"],
  };

function hostMatches(
  hostname: string,
  allowedHosts: readonly string[],
): boolean {
  return allowedHosts.some(
    (allowed) => hostname === allowed || hostname.endsWith(`.${allowed}`),
  );
}

export const featureItemSchema = z
  .object({
    id: z.string().min(3).max(180),
    externalId: z.string().min(1).max(240).optional(),
    source: z.enum(FEATURE_SOURCES),
    sourceName: z.string().min(2).max(80).optional(),
    type: z.enum(FEATURE_TYPES),
    title: z.string().min(3).max(180),
    excerpt: z.string().min(10).max(700),
    canonicalUrl: canonicalUrlSchema.optional(),
    internalPath: z
      .string()
      .startsWith("/")
      .max(500)
      .refine(
        (value) =>
          !value.startsWith("//") &&
          !/^\/(?:admin|api|preview|private)(?:\/|$)/.test(value),
        "Internal context must point to a public AKB Studio route",
      )
      .optional(),
    media: z
      .object({
        src: z.string().startsWith("/").max(500),
        alt: z.string().min(3).max(240),
      })
      .optional(),
    publishedAt: z.string().datetime({ offset: true }).optional(),
    syncedAt: z.string().datetime({ offset: true }),
    author: z.string().min(2).max(120),
    relationship: z.enum(FEATURE_RELATIONSHIPS).default("by-akb"),
    tags: z.array(z.string().min(1).max(60)).max(12).default([]),
    pinned: z.boolean().default(false),
    priority: z.number().int().min(0).max(100).default(0),
    status: z.enum(FEATURE_STATUSES),
  })
  .superRefine((item, context) => {
    const allowedHosts = sourceHosts[item.source];
    const isExternalSource = [
      "github",
      "linkedin",
      "x",
      "medium",
      "quora",
      "reddit",
      "other",
    ].includes(item.source);

    if (isExternalSource && !item.canonicalUrl) {
      context.addIssue({
        code: "custom",
        message: `${item.source} entries require their original canonical URL`,
        path: ["canonicalUrl"],
      });
    }

    if (allowedHosts && item.canonicalUrl) {
      const hostname = new URL(item.canonicalUrl).hostname.toLowerCase();
      if (!hostMatches(hostname, allowedHosts)) {
        context.addIssue({
          code: "custom",
          message: `Canonical URL does not match the declared ${item.source} source`,
          path: ["canonicalUrl"],
        });
      }
    }
  });

export const featureManifestSchema = z.object({
  schemaVersion: z.literal(1),
  items: z.array(featureItemSchema).max(500),
  ignoredExternalIds: z.array(z.string().min(1).max(240)).max(1000).default([]),
});

export type FeatureItem = z.infer<typeof featureItemSchema>;
export type FeatureManifest = z.infer<typeof featureManifestSchema>;
export type FeatureSource = (typeof FEATURE_SOURCES)[number];
export type FeatureRelationship = (typeof FEATURE_RELATIONSHIPS)[number];
export type FeatureType = (typeof FEATURE_TYPES)[number];

export const EMPTY_FEATURE_MANIFEST: FeatureManifest = {
  schemaVersion: 1,
  items: [],
  ignoredExternalIds: [],
};

export function featureSourceLabel(
  source: FeatureSource,
  sourceName?: string,
): string {
  const labels: Record<FeatureSource, string> = {
    github: "GitHub",
    linkedin: "LinkedIn",
    x: "X",
    medium: "Medium",
    quora: "Quora",
    reddit: "Reddit",
    other: sourceName?.trim() || "Other",
    manual: "AKB Studio",
    announcement: "Announcement",
  };

  return labels[source];
}
