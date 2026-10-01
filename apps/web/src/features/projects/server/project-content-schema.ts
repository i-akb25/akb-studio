import { z } from "zod";

import { PROJECT_DISCIPLINES } from "../types/project";

export const PORTFOLIO_SCHEMA_VERSION = 1;
export const PORTFOLIO_MANIFEST_PATH = "content/projects.json";

export const REQUIRED_CASE_STUDY_SECTIONS = [
  "Overview",
  "Problem",
  "Constraints",
  "Approach",
  "Architecture",
  "Engineering decisions",
  "Evidence",
  "Limitations",
  "Outcome",
  "Next steps",
] as const;

const trimmedText = (minimum: number, maximum: number) =>
  z.string().trim().min(minimum).max(maximum);

const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Expected a lowercase kebab-case slug");

const httpsUrlSchema = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => {
    try {
      return new URL(value).protocol === "https:";
    } catch {
      return false;
    }
  }, "Expected a valid HTTPS URL");

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected a YYYY-MM-DD date");

const tierSchema = z.enum(["flagship", "standard", "compact", "experiment"]);

const lifecycleSchema = z.enum([
  "active",
  "completed",
  "in-progress",
  "under-review",
  "archived",
]);

const publicationSchema = z.enum(["published", "draft", "hidden"]);

const caseStudyStatusSchema = z.enum(["draft", "under-review", "published"]);

const technologyIconSchema = z.enum([
  "code",
  "database",
  "server",
  "ai",
  "hardware",
  "network",
  "tool",
]);

const technologyCategorySchema = z.enum([
  "language",
  "framework",
  "platform",
  "database",
  "hardware",
  "protocol",
  "tool",
]);

const repositoryReferenceSchema = z
  .object({
    owner: trimmedText(1, 39),
    name: trimmedText(1, 100),
  })
  .strict();

const manifestTechnologySchema = z
  .object({
    name: trimmedText(1, 40),
    icon: technologyIconSchema,
  })
  .strict();

const availableLinkSchema = z
  .object({
    kind: z.enum(["demo", "repository", "documentation"]),
    label: trimmedText(1, 80),
    state: z.literal("available"),
    href: httpsUrlSchema,
  })
  .strict();

const unavailableLinkSchema = z
  .object({
    kind: z.enum(["demo", "repository", "documentation"]),
    label: trimmedText(1, 80),
    state: z.enum([
      "planned",
      "planned-public",
      "private",
      "under-review",
      "unavailable",
    ]),
  })
  .strict();

const manifestLinkSchema = z.union([
  availableLinkSchema,
  unavailableLinkSchema,
]);

const manifestCoverSchema = z
  .object({
    src: trimmedText(1, 240).refine(
      (value) =>
        value.startsWith("/") ||
        (() => {
          try {
            return new URL(value).protocol === "https:";
          } catch {
            return false;
          }
        })(),
      "Cover sources must be root-relative paths or HTTPS URLs",
    ),
    alt: trimmedText(1, 180),
  })
  .strict();

const metricSchema = z
  .object({
    value: trimmedText(1, 32),
    label: trimmedText(1, 80),
    context: trimmedText(1, 220),
    evidence: trimmedText(1, 220),
  })
  .strict();

const systemFlowNodeSchema = z
  .object({
    label: trimmedText(1, 60),
    detail: trimmedText(1, 160),
    icon: technologyIconSchema,
  })
  .strict();

const projectVisualSchema = z
  .object({
    src: trimmedText(1, 2048).refine(
      (value) =>
        value.startsWith("/images/") ||
        (() => {
          try {
            return new URL(value).protocol === "https:";
          } catch {
            return false;
          }
        })(),
      "Visual sources must be local image paths or HTTPS URLs",
    ),
    alt: trimmedText(1, 180),
    caption: trimmedText(1, 240),
    aspect: z.enum(["landscape", "portrait", "square"]).default("landscape"),
  })
  .strict();

const caseStudyReferenceSchema = z
  .object({
    status: caseStudyStatusSchema,
    document: z
      .string()
      .trim()
      .max(180)
      .regex(
        /^content\/case-studies\/[a-z0-9]+(?:-[a-z0-9]+)*\.md$/,
        "Expected a case-study document path",
      ),
    reviewedAt: dateSchema.nullable(),
  })
  .strict()
  .superRefine((caseStudy, context) => {
    if (caseStudy.status === "published" && !caseStudy.reviewedAt) {
      context.addIssue({
        code: "custom",
        message: "Published case studies require reviewedAt",
        path: ["reviewedAt"],
      });
    }

    if (caseStudy.status !== "published" && caseStudy.reviewedAt !== null) {
      context.addIssue({
        code: "custom",
        message: "Unpublished case studies must use reviewedAt: null",
        path: ["reviewedAt"],
      });
    }
  });

export const projectManifestEntrySchema = z
  .object({
    order: z.number().int().positive().max(9999),
    slug: slugSchema,
    title: trimmedText(1, 100),
    categoryLabel: trimmedText(1, 120),
    summary: trimmedText(40, 400),
    tier: tierSchema,
    lifecycle: lifecycleSchema,
    disciplines: z
      .array(z.enum(PROJECT_DISCIPLINES))
      .min(1)
      .max(PROJECT_DISCIPLINES.length),
    publication: publicationSchema,
    homepageOrder: z.number().int().positive().max(99).optional(),
    period: trimmedText(1, 80).optional(),
    role: trimmedText(1, 160),
    repository: repositoryReferenceSchema.nullable(),
    technologies: z.array(manifestTechnologySchema).max(20),
    links: z.array(manifestLinkSchema).max(12),
    cover: manifestCoverSchema.nullable(),
    metrics: z.array(metricSchema).max(8).default([]),
    systemFlow: z.array(systemFlowNodeSchema).max(7).default([]),
    visuals: z.array(projectVisualSchema).max(8).default([]),
    caseStudy: caseStudyReferenceSchema,
  })
  .strict()
  .superRefine((project, context) => {
    const expectedDocument = `content/case-studies/${project.slug}.md`;

    if (project.caseStudy.document !== expectedDocument) {
      context.addIssue({
        code: "custom",
        message: `Case-study path must be ${expectedDocument}`,
        path: ["caseStudy", "document"],
      });
    }

    if (project.homepageOrder !== undefined && !project.cover) {
      context.addIssue({
        code: "custom",
        message: "Homepage projects require a cover",
        path: ["cover"],
      });
    }
  });

export const projectContentManifestSchema = z
  .object({
    schemaVersion: z.literal(PORTFOLIO_SCHEMA_VERSION),
    projects: z.array(projectManifestEntrySchema).min(1).max(500),
  })
  .strict()
  .superRefine((manifest, context) => {
    const slugs = new Set<string>();
    const orders = new Set<number>();
    const homepageOrders = new Set<number>();

    for (const [index, project] of manifest.projects.entries()) {
      if (slugs.has(project.slug)) {
        context.addIssue({
          code: "custom",
          message: `Duplicate project slug "${project.slug}"`,
          path: ["projects", index, "slug"],
        });
      }

      if (orders.has(project.order)) {
        context.addIssue({
          code: "custom",
          message: `Duplicate project order ${project.order}`,
          path: ["projects", index, "order"],
        });
      }

      if (
        project.homepageOrder !== undefined &&
        homepageOrders.has(project.homepageOrder)
      ) {
        context.addIssue({
          code: "custom",
          message: `Duplicate homepage order ${project.homepageOrder}`,
          path: ["projects", index, "homepageOrder"],
        });
      }

      slugs.add(project.slug);
      orders.add(project.order);

      if (project.homepageOrder !== undefined) {
        homepageOrders.add(project.homepageOrder);
      }
    }
  });

const compatibleTechnologySchema = z
  .object({
    name: trimmedText(1, 40),
    icon: technologyIconSchema,
    category: technologyCategorySchema.optional(),
  })
  .strict();

const compatibleCoverSchema = z
  .object({
    path: trimmedText(1, 240),
    src: trimmedText(1, 240),
    alt: trimmedText(1, 180),
    caption: trimmedText(1, 240).optional(),
  })
  .strict();

export const projectContentFrontmatterSchema = z
  .object({
    schemaVersion: z.literal(PORTFOLIO_SCHEMA_VERSION),
    status: caseStudyStatusSchema,
    publication: publicationSchema,
    order: z.number().int().positive().max(9999),
    slug: slugSchema,
    title: trimmedText(1, 100),
    summary: trimmedText(40, 400),
    categoryLabel: trimmedText(1, 120),
    tier: tierSchema,
    lifecycle: lifecycleSchema,
    disciplines: z
      .array(z.enum(PROJECT_DISCIPLINES))
      .min(1)
      .max(PROJECT_DISCIPLINES.length),
    period: trimmedText(1, 80).optional(),
    role: trimmedText(1, 160).optional(),
    publishedAt: dateSchema.optional(),
    updatedAt: dateSchema.optional(),
    homepageOrder: z.number().int().positive().max(99).optional(),
    technologies: z.array(compatibleTechnologySchema).max(20).default([]),
    links: z.array(manifestLinkSchema).max(12).default([]),
    demoUrl: httpsUrlSchema.optional(),
    cover: compatibleCoverSchema.optional(),
    metrics: z.array(metricSchema).max(8).default([]),
    systemFlow: z.array(systemFlowNodeSchema).max(7).default([]),
    visuals: z.array(projectVisualSchema).max(8).default([]),
  })
  .strict();

const publicRepositorySchema = z
  .object({
    owner: trimmedText(1, 100),
    name: trimmedText(1, 100),
    fullName: trimmedText(1, 220),
    htmlUrl: httpsUrlSchema,
    defaultBranch: trimmedText(1, 255),
    updatedAt: trimmedText(1, 40),
    isAvailable: z.boolean(),
  })
  .strict();

const safeSourceSchema = z
  .object({
    path: trimmedText(1, 80),
    sha: z.string().regex(/^[a-f0-9]{40}$/),
    htmlUrl: httpsUrlSchema,
  })
  .strict();

export const projectContentDocumentSchema = z
  .object({
    frontmatter: projectContentFrontmatterSchema,
    markdown: z.string().trim().min(1).max(200_000),
    repository: publicRepositorySchema,
    source: safeSourceSchema,
  })
  .strict()
  .superRefine((document, context) => {
    if (document.frontmatter.status !== "published") {
      return;
    }

    for (const requiredSection of REQUIRED_CASE_STUDY_SECTIONS) {
      const heading = `## ${requiredSection}`.toLowerCase();
      const hasSection = document.markdown
        .split("\n")
        .some((line) => line.trim().toLowerCase() === heading);

      if (!hasSection) {
        context.addIssue({
          code: "custom",
          message: `Published case studies require a "## ${requiredSection}" section`,
          path: ["markdown"],
        });
      }
    }
  });

export type ProjectManifestEntry = z.infer<typeof projectManifestEntrySchema>;

export type ProjectContentManifest = z.infer<
  typeof projectContentManifestSchema
>;

export type ProjectContentFrontmatter = z.infer<
  typeof projectContentFrontmatterSchema
>;

export type ProjectContentDocument = z.infer<
  typeof projectContentDocumentSchema
>;
