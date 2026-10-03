import { NextResponse } from "next/server";
import { z } from "zod";
import {
  assertSameOrigin,
  getAdminSession,
} from "@/features/admin/server/admin-auth";
import { runAuditedMutation } from "@/features/admin/server/audit";
import { readJsonBody } from "@/server/security/request";

const state = z.enum(["DRAFT", "SCHEDULED", "PUBLISHED", "ARCHIVED"]);
const base = z.object({
  resource: z.string(),
  action: z.string().default("upsert"),
});
const profile = base.extend({
  resource: z.literal("profile"),
  displayName: z.string().trim().min(2).max(100),
  headline: z.string().trim().min(3).max(180),
  biography: z.string().trim().min(20).max(5000),
  location: z.string().trim().max(120).optional(),
  email: z.string().email().optional(),
  dpAssetId: z.string().optional(),
  state,
});
const availability = base.extend({
  resource: z.literal("availability"),
  label: z.string().trim().min(2).max(100),
  summary: z.string().trim().min(5).max(500),
  available: z.boolean(),
  validUntil: z.string().datetime(),
  state,
});
const reflection = base.extend({
  resource: z.literal("reflection"),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  sanskrit: z.string().min(1).max(1000),
  transliteration: z.string().min(1).max(1500),
  translation: z.string().min(1).max(2000),
  interpretation: z.string().min(1).max(5000),
  source: z.string().max(500).optional(),
  reflectionDate: z.string().datetime().optional(),
  state,
});
const project = base.extend({
  resource: z.literal("project"),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(2).max(160),
  categoryLabel: z.string().min(2).max(180),
  summary: z.string().min(20).max(2000),
  disciplines: z
    .array(z.enum(["software", "electrical", "robotics", "automation", "ai"]))
    .min(1)
    .max(5),
  tier: z.enum(["flagship", "standard", "compact", "experiment"]),
  lifecycle: z.string().min(2).max(80),
  role: z.string().max(200).optional(),
  period: z.string().max(80).optional(),
  technologies: z.array(z.string().min(1).max(60)).max(30),
  repositoryUrl: z.string().url().optional(),
  demoUrl: z.string().url().optional(),
  coverAssetId: z.string().optional(),
  order: z.number().int().min(0).max(1000),
  featured: z.boolean(),
  aevaApproved: z.boolean(),
  state,
});
const gallery = base.extend({
  resource: z.literal("gallery"),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(2).max(120),
  description: z.string().max(1000).optional(),
  state,
});
const galleryItem = base.extend({
  resource: z.literal("gallery-item"),
  gallerySlug: z.string(),
  assetId: z.string(),
  altText: z.string().min(3).max(240),
  caption: z.string().max(500).optional(),
  order: z.number().int().min(0).max(1000),
});
const contact = base.extend({
  resource: z.literal("contact"),
  id: z.string(),
  state: z.enum([
    "NEW",
    "IN_REVIEW",
    "WAITING",
    "CLOSED",
    "REJECTED",
    "PENDING_GUARDIAN",
  ]),
  note: z.string().max(1000).optional(),
});
const operation = z.discriminatedUnion("resource", [
  profile,
  availability,
  reflection,
  project,
  gallery,
  galleryItem,
  contact,
]);

function jsonBody(value: unknown) {
  return operation.parse(value);
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (
    !session?.user.twoFactorEnabled ||
    !["owner", "editor", "moderator"].includes(session.role)
  )
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    assertSameOrigin(request);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 403 });
  }
  try {
    const input = jsonBody(await readJsonBody(request, 32_768));
    if (input.resource === "profile") {
      const result = await runAuditedMutation(
        (tx) =>
          tx.profile.upsert({
            where: { id: "primary" },
            create: {
              id: "primary",
              displayName: input.displayName,
              headline: input.headline,
              biography: input.biography,
              location: input.location,
              email: input.email,
              dpAssetId: input.dpAssetId,
              state: input.state,
              publishedAt: input.state === "PUBLISHED" ? new Date() : null,
            },
            update: {
              displayName: input.displayName,
              headline: input.headline,
              biography: input.biography,
              location: input.location,
              email: input.email,
              dpAssetId: input.dpAssetId || null,
              state: input.state,
              publishedAt: input.state === "PUBLISHED" ? new Date() : null,
            },
          }),
        (saved) => ({
          actorId: session.user.id,
          action: "UPDATE",
          entityType: "Profile",
          entityId: saved.id,
        }),
      );
      return NextResponse.json({ ok: true, result });
    }
    if (input.resource === "availability") {
      const validUntil = new Date(input.validUntil);
      if (input.state === "PUBLISHED" && validUntil <= new Date())
        return NextResponse.json(
          { error: "Published availability requires a future expiry time" },
          { status: 400 },
        );
      const result = await runAuditedMutation(
        (tx) =>
          tx.availabilityStatus.upsert({
            where: { id: "current" },
            create: {
              id: "current",
              label: input.label,
              summary: input.summary,
              available: input.available,
              state: input.state,
              validFrom: input.state === "PUBLISHED" ? new Date() : null,
              validUntil,
              publishedAt: input.state === "PUBLISHED" ? new Date() : null,
            },
            update: {
              label: input.label,
              summary: input.summary,
              available: input.available,
              state: input.state,
              validFrom: input.state === "PUBLISHED" ? new Date() : null,
              validUntil,
              publishedAt: input.state === "PUBLISHED" ? new Date() : null,
            },
          }),
        (saved) => ({
          actorId: session.user.id,
          action: "UPDATE",
          entityType: "AvailabilityStatus",
          entityId: saved.id,
        }),
      );
      return NextResponse.json({ ok: true, result });
    }
    if (input.resource === "reflection") {
      const result = await runAuditedMutation(
        (tx) =>
          tx.reflection.upsert({
            where: { slug: input.slug },
            create: {
              slug: input.slug,
              sanskrit: input.sanskrit,
              transliteration: input.transliteration,
              translation: input.translation,
              interpretation: input.interpretation,
              source: input.source,
              reflectionDate: input.reflectionDate
                ? new Date(input.reflectionDate)
                : null,
              state: input.state,
              publishedAt: input.state === "PUBLISHED" ? new Date() : null,
            },
            update: {
              sanskrit: input.sanskrit,
              transliteration: input.transliteration,
              translation: input.translation,
              interpretation: input.interpretation,
              source: input.source,
              reflectionDate: input.reflectionDate
                ? new Date(input.reflectionDate)
                : null,
              state: input.state,
              publishedAt: input.state === "PUBLISHED" ? new Date() : null,
            },
          }),
        (saved) => ({
          actorId: session.user.id,
          action: "UPDATE",
          entityType: "Reflection",
          entityId: saved.id,
        }),
      );
      return NextResponse.json({ ok: true, result });
    }
    if (input.resource === "project") {
      const result = await runAuditedMutation(
        async (database) => {
          const saved = await database.project.upsert({
            where: { slug: input.slug },
            create: {
              slug: input.slug,
              title: input.title,
              categoryLabel: input.categoryLabel,
              summary: input.summary,
              disciplines: input.disciplines,
              tier: input.tier,
              lifecycle: input.lifecycle,
              role: input.role,
              period: input.period,
              coverAssetId: input.coverAssetId,
              order: input.order,
              featured: input.featured,
              aevaApproved: input.aevaApproved,
              state: input.state,
              publishedAt: input.state === "PUBLISHED" ? new Date() : null,
            },
            update: {
              title: input.title,
              categoryLabel: input.categoryLabel,
              summary: input.summary,
              disciplines: input.disciplines,
              tier: input.tier,
              lifecycle: input.lifecycle,
              role: input.role,
              period: input.period,
              coverAssetId: input.coverAssetId || null,
              order: input.order,
              featured: input.featured,
              aevaApproved: input.aevaApproved,
              state: input.state,
              publishedAt: input.state === "PUBLISHED" ? new Date() : null,
            },
          });
          await database.projectTechnology.deleteMany({
            where: { projectId: saved.id },
          });
          await database.projectTechnology.createMany({
            data: input.technologies.map((name, order) => ({
              projectId: saved.id,
              name,
              icon: "tool",
              order,
            })),
          });
          await database.projectLink.deleteMany({
            where: { projectId: saved.id },
          });
          const links = [
            {
              kind: "repository",
              label: "Repository",
              url: input.repositoryUrl,
            },
            { kind: "demo", label: "Live demo", url: input.demoUrl },
          ]
            .filter(
              (item): item is { kind: string; label: string; url: string } =>
                Boolean(item.url),
            )
            .map((item, order) => ({
              ...item,
              projectId: saved.id,
              state: "available",
              order,
            }));
          if (links.length)
            await database.projectLink.createMany({ data: links });
          return saved;
        },
        (saved) => ({
          actorId: session.user.id,
          action: "UPDATE",
          entityType: "Project",
          entityId: saved.id,
        }),
      );
      return NextResponse.json({ ok: true, result });
    }
    if (input.resource === "gallery") {
      const result = await runAuditedMutation(
        (tx) =>
          tx.gallery.upsert({
            where: { slug: input.slug },
            create: {
              slug: input.slug,
              title: input.title,
              description: input.description,
              state: input.state,
            },
            update: {
              title: input.title,
              description: input.description,
              state: input.state,
            },
          }),
        (saved) => ({
          actorId: session.user.id,
          action: "UPDATE",
          entityType: "Gallery",
          entityId: saved.id,
        }),
      );
      return NextResponse.json({ ok: true, result });
    }
    if (input.resource === "gallery-item") {
      const result = await runAuditedMutation(
        async (tx) => {
          const gallery = await tx.gallery.findUniqueOrThrow({
            where: { slug: input.gallerySlug },
          });
          return tx.galleryItem.upsert({
            where: {
              galleryId_assetId: {
                galleryId: gallery.id,
                assetId: input.assetId,
              },
            },
            create: {
              galleryId: gallery.id,
              assetId: input.assetId,
              altText: input.altText,
              caption: input.caption,
              order: input.order,
            },
            update: {
              altText: input.altText,
              caption: input.caption,
              order: input.order,
            },
          });
        },
        (saved) => ({
          actorId: session.user.id,
          action: "UPDATE",
          entityType: "GalleryItem",
          entityId: saved.id,
        }),
      );
      return NextResponse.json({ ok: true, result });
    }
    if (session.role !== "owner" && session.role !== "moderator")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const result = await runAuditedMutation(
      async (tx) => {
        const current = await tx.contactSubmission.findUniqueOrThrow({
          where: { id: input.id },
        });
        const saved = await tx.contactSubmission.update({
          where: { id: input.id },
          data: { state: input.state },
        });
        await tx.contactStatusEvent.create({
          data: {
            submissionId: saved.id,
            fromState: current.state,
            toState: saved.state,
            note: input.note,
            actorId: session.user.id,
          },
        });
        return saved;
      },
      (saved) => ({
        actorId: session.user.id,
        action: "UPDATE",
        entityType: "ContactSubmission",
        entityId: saved.id,
      }),
    );
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "The submitted fields are invalid." },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "The operation could not be completed." },
      { status: 400 },
    );
  }
}
