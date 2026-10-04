import { PravaahConsole } from "@/features/admin/components/pravaah-console";
import { getFeatureManifest } from "@/features/pravaah/server/feature-source";
import { getGitHubDiscoveries } from "@/features/pravaah/server/github-adapter";

export default async function AdminPravaahPage() {
  const [manifest, discoveries] = await Promise.all([
    getFeatureManifest(),
    getGitHubDiscoveries(),
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
      anonymousNoteConfigured={Boolean(
        process.env.AKB_ANONYMOUS_NOTE_URL?.trim(),
      )}
    />
  );
}
