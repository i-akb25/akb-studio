import "server-only";

import type { OperationsInitialData } from "@/features/admin/components/operations-console";
import { prisma } from "@/server/db/prisma";

export async function getOperationsInitialData(): Promise<OperationsInitialData> {
  const [profile, availability, projects, reflections, galleries] =
    await Promise.all([
      prisma.profile.findUnique({ where: { id: "primary" } }),
      prisma.availabilityStatus.findUnique({ where: { id: "current" } }),
      prisma.project.findMany({
        include: {
          technologies: { orderBy: { order: "asc" } },
          links: { orderBy: { order: "asc" } },
        },
        orderBy: { order: "asc" },
      }),
      prisma.reflection.findMany({ orderBy: { updatedAt: "desc" } }),
      prisma.gallery.findMany({ orderBy: { order: "asc" } }),
    ]);

  return {
    profile: profile
      ? {
          displayName: profile.displayName,
          headline: profile.headline,
          biography: profile.biography,
          location: profile.location,
          email: profile.email,
          dpAssetId: profile.dpAssetId,
          state: profile.state,
        }
      : null,
    availability: availability
      ? {
          label: availability.label,
          summary: availability.summary,
          available: availability.available,
          validUntil: availability.validUntil?.toISOString() ?? null,
          state: availability.state,
        }
      : null,
    projects: projects.map((project) => ({
      slug: project.slug,
      title: project.title,
      categoryLabel: project.categoryLabel,
      summary: project.summary,
      disciplines: project.disciplines,
      tier: project.tier,
      lifecycle: project.lifecycle,
      role: project.role,
      period: project.period,
      technologies: project.technologies.map((item) => item.name),
      repositoryUrl:
        project.links.find(
          (item) => item.kind === "repository" && item.state === "available",
        )?.url ?? null,
      demoUrl:
        project.links.find(
          (item) => item.kind === "demo" && item.state === "available",
        )?.url ?? null,
      coverAssetId: project.coverAssetId,
      order: project.order,
      homepageOrder: project.homepageOrder,
      featured: project.featured,
      aevaApproved: project.aevaApproved,
      state: project.state,
    })),
    reflections: reflections.map((reflection) => ({
      slug: reflection.slug,
      sanskrit: reflection.sanskrit,
      transliteration: reflection.transliteration,
      translation: reflection.translation,
      interpretation: reflection.interpretation,
      source: reflection.source,
      reflectionDate: reflection.reflectionDate?.toISOString() ?? null,
      state: reflection.state,
    })),
    galleries: galleries.map((gallery) => ({
      slug: gallery.slug,
      title: gallery.title,
      description: gallery.description,
      state: gallery.state,
    })),
  };
}
