import {
  OperationsConsole,
  type OperationsInitialData,
} from "@/features/admin/components/operations-console";
import { getDatabaseHealth } from "@/server/db/database-health";
import { prisma } from "@/server/db/prisma";

export default async function OperationsPage() {
  const [database, profile, availability, projects, reflections, galleries] =
    await Promise.all([
      getDatabaseHealth(),
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

  const initialData: OperationsInitialData = {
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
  return (
    <main className="akb-admin-page">
      <header className="akb-admin-page__header">
        <p className="akb-kicker">Controlled data</p>
        <h1>Portfolio operations</h1>
        <p>
          Edit structured About, project, reflection, availability and gallery
          records. Git-backed editorial bodies remain in the publishing
          workflow.
        </p>
      </header>
      <section aria-labelledby="database-capacity-heading">
        <h2 id="database-capacity-heading">Database capacity</h2>
        {database.available &&
        database.bytes !== null &&
        database.percent !== null ? (
          <p>
            {(database.bytes / 1024 / 1024).toFixed(1)} MB of 500 MB used (
            {database.percent.toFixed(1)}%).
            {database.warning === "critical"
              ? " Critical: act before the free allowance is exhausted."
              : null}
            {database.warning === "warning"
              ? " Warning: schedule cleanup and verify the latest export."
              : null}
            {database.warning === "notice"
              ? " Notice: review growth and retention."
              : null}
          </p>
        ) : (
          <p>
            Database capacity is temporarily unavailable. Public fallbacks are
            unaffected.
          </p>
        )}
      </section>
      <OperationsConsole initialData={initialData} />
    </main>
  );
}
