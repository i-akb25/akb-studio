import "server-only";

import type { AuditAction, Prisma } from "@generated/prisma/client";
import { runAuditedMutation } from "@/features/admin/server/audit";
import { prisma } from "@/server/db/prisma";
import { type FeatureManifest, featureManifestSchema } from "../model";

function summary(manifest: FeatureManifest) {
  return {
    itemCount: manifest.items.length,
    ignoredExternalIdCount: manifest.ignoredExternalIds.length,
  };
}

export async function readStoredFeatureManifest(): Promise<
  FeatureManifest | undefined
> {
  try {
    const record = await prisma.pravaahRegistry.findUnique({
      where: { id: "primary" },
      select: { manifest: true },
    });
    if (!record) return undefined;
    const parsed = featureManifestSchema.safeParse(record.manifest);
    return parsed.success ? parsed.data : undefined;
  } catch {
    // Production remains readable from the Git-backed fallback when Neon is
    // unavailable or the migration has not reached an environment yet.
    return undefined;
  }
}

export async function saveStoredFeatureManifest(input: {
  manifest: FeatureManifest;
  action: AuditAction;
  entityId?: string;
  message: string;
}): Promise<void> {
  const manifest = featureManifestSchema.parse(input.manifest);
  const result = await runAuditedMutation(
    async (tx) => {
      const previous = await tx.pravaahRegistry.findUnique({
        where: { id: "primary" },
        select: { manifest: true },
      });
      const saved = await tx.pravaahRegistry.upsert({
        where: { id: "primary" },
        create: {
          id: "primary",
          manifest: manifest as Prisma.InputJsonValue,
        },
        update: { manifest: manifest as Prisma.InputJsonValue },
        select: { id: true },
      });
      const parsedPrevious = previous
        ? featureManifestSchema.safeParse(previous.manifest)
        : undefined;
      return {
        id: saved.id,
        before: parsedPrevious?.success
          ? summary(parsedPrevious.data)
          : undefined,
      };
    },
    (saved) => ({
      action: input.action,
      entityType: "PravaahRegistry",
      entityId: input.entityId || saved.id,
      ...(saved.before ? { before: saved.before } : {}),
      after: { ...summary(manifest), operation: input.message },
    }),
  );
  void result;
}
