import { type FeatureManifest, featureManifestSchema } from "./model";

export function checkManifestVersion(
  current: unknown | null,
  expected: FeatureManifest,
) {
  if (current === null) return undefined;
  const parsed = featureManifestSchema.safeParse(current);
  if (!parsed.success) throw new Error("Feature registry is invalid");
  if (
    JSON.stringify(parsed.data) !==
    JSON.stringify(featureManifestSchema.parse(expected))
  )
    throw new Error(
      "Pravaah registry changed while saving. Refresh the Admin page before trying again.",
    );
  return parsed.data;
}
