import { PravaahConsole } from "@/features/admin/components/pravaah-console";
import { getFeatureManifest } from "@/features/pravaah/server/feature-source";
import { getGitHubDiscoveries } from "@/features/pravaah/server/github-adapter";
import { prisma } from "@/server/db/prisma";

export default async function AdminPravaahPage() {
  const [manifest, discoveries, mediaAssets] = await Promise.all([
    getFeatureManifest(),
    getGitHubDiscoveries(),
    prisma.mediaAsset.findMany({
      where: { state: "READY", mimeType: { startsWith: "image/" } },
      select: { id: true, originalName: true, altText: true, secureUrl: true },
      orderBy: { createdAt: "desc" },
      take: 250,
    }),
  ]);
  const knownExternalIds = new Set(
    manifest.items
      .map((item) => item.externalId)
      .filter((id): id is string => Boolean(id)),
  );
  const ignored = new Set(manifest.ignoredExternalIds);
  const pending = discoveries.filter(
    (item) =>
      item.externalId &&
      !knownExternalIds.has(item.externalId) &&
      !ignored.has(item.externalId),
  );

  return (
    <PravaahConsole
      items={manifest.items}
      discoveries={pending}
      mediaAssets={mediaAssets.map((asset) => ({
        id: asset.id,
        label: asset.originalName || asset.altText || asset.id,
        alt: asset.altText,
        url: asset.secureUrl,
      }))}
      anonymousNoteConfigured={Boolean(
        process.env.AKB_ANONYMOUS_NOTE_URL?.trim(),
      )}
    />
  );
}
