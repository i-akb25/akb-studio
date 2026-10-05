import "server-only";

import type { OperationsInitialData } from "@/features/admin/components/operations-console";
import { publishedProjects } from "@/features/projects/data/project-registry";
import { prisma } from "@/server/db/prisma";

export async function getOperationsInitialData(): Promise<OperationsInitialData> {
  const [
    siteConfiguration,
    profile,
    availability,
    projects,
    reflections,
    galleries,
    mediaAssets,
  ] = await Promise.all([
    prisma.siteConfiguration.findUnique({ where: { id: "primary" } }),
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
    prisma.gallery.findMany({
      include: {
        items: {
          include: { asset: true },
          orderBy: { order: "asc" },
        },
      },
      orderBy: { order: "asc" },
    }),
    prisma.mediaAsset.findMany({
      where: { state: "READY" },
      select: { id: true, originalName: true, altText: true, mimeType: true },
      orderBy: { createdAt: "desc" },
      take: 250,
    }),
  ]);

  const managedProjects = new Map(
    projects.map((project) => [project.slug, project]),
  );
  const projectRows: OperationsInitialData["projects"] = publishedProjects.map(
    (project) => {
      const managed = managedProjects.get(project.slug);
      if (managed) {
        managedProjects.delete(project.slug);
        return {
          slug: managed.slug,
          title: managed.title,
          categoryLabel: managed.categoryLabel,
          summary: managed.summary,
          disciplines: managed.disciplines,
          tier: managed.tier,
          lifecycle: managed.lifecycle,
          role: managed.role,
          period: managed.period,
          technologies: managed.technologies.map((item) => item.name),
          repositoryUrl:
            managed.links.find(
              (item) =>
                item.kind === "repository" && item.state === "available",
            )?.url ?? null,
          demoUrl:
            managed.links.find(
              (item) => item.kind === "demo" && item.state === "available",
            )?.url ?? null,
          coverAssetId: managed.coverAssetId,
          order: managed.order,
          homepageOrder: managed.homepageOrder,
          featured: managed.featured,
          aevaApproved: managed.aevaApproved,
          state: managed.state,
        };
      }
      const availableLink = (kind: "repository" | "demo") => {
        const link = project.links.find(
          (item) => item.kind === kind && item.state === "available",
        );
        return link && "href" in link ? (link.href ?? null) : null;
      };
      return {
        slug: project.slug,
        title: project.title,
        categoryLabel: project.categoryLabel,
        summary: project.summary,
        disciplines: [...project.disciplines],
        tier: project.tier,
        lifecycle: project.lifecycle,
        role: project.role ?? null,
        period: project.period ?? null,
        technologies: project.technologies.map((item) => item.name),
        repositoryUrl: availableLink("repository"),
        demoUrl: availableLink("demo"),
        coverAssetId: null,
        order: project.order,
        homepageOrder: project.homepageOrder ?? null,
        featured: project.homepageOrder !== undefined,
        aevaApproved: false,
        state: "PUBLISHED" as const,
      };
    },
  );
  for (const project of managedProjects.values()) {
    projectRows.push({
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
    });
  }

  return {
    siteConfiguration: siteConfiguration
      ? {
          siteName: siteConfiguration.siteName,
          authorName: siteConfiguration.authorName,
          description: siteConfiguration.description,
          professionalEmail: siteConfiguration.professionalEmail,
          generalEmail: siteConfiguration.generalEmail,
          socialImageAssetId: siteConfiguration.socialImageAssetId,
          socialImageAlt: siteConfiguration.socialImageAlt,
        }
      : null,
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
    projects: projectRows.sort((left, right) => left.order - right.order),
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
      items: gallery.items.map((item) => ({
        id: item.id,
        assetId: item.assetId,
        label: item.asset.originalName || item.altText,
        altText: item.altText,
        caption: item.caption,
        order: item.order,
      })),
    })),
    mediaAssets: mediaAssets.map((asset) => ({
      id: asset.id,
      label: asset.originalName || asset.altText || asset.id,
      mimeType: asset.mimeType,
    })),
  };
}
