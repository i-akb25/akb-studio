import { NextResponse } from "next/server";
import {
  assertSameOrigin,
  canAdmin,
  getAdminSession,
} from "@/features/admin/server/admin-auth";
import { runAuditedMutation } from "@/features/admin/server/audit";
import { extractDocumentText } from "@/features/admin/server/document-parser";
import {
  deleteAdminMedia,
  prepareAdminMedia,
  uploadAdminMedia,
} from "@/features/media/server/cloudinary-media";
import { prisma } from "@/server/db/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!(await canAdmin("media:write")))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const session = await getAdminSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let uploadedProviderId: string | undefined;
  let uploadedResourceType: string | undefined;
  try {
    assertSameOrigin(request);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 403 });
  }
  try {
    const declaredBytes = Number(request.headers.get("content-length") ?? 0);
    if (declaredBytes > 4.5 * 1024 * 1024)
      return NextResponse.json(
        { error: "Upload is too large." },
        { status: 413 },
      );
    const form = await request.formData();
    const file = form.get("file");
    const altText = String(form.get("altText") ?? "").trim();
    const replaceId = String(form.get("replaceId") ?? "").trim() || undefined;
    const folder =
      String(form.get("folder") ?? "library")
        .replace(/[^a-z0-9-]/gi, "")
        .slice(0, 40) || "library";
    if (!(file instanceof File) || altText.length < 3 || altText.length > 240)
      throw new Error("A valid file and description are required");
    const prepared = await prepareAdminMedia(file);
    const replacement = replaceId
      ? await prisma.mediaAsset.findUnique({ where: { id: replaceId } })
      : null;
    if (replaceId && !replacement)
      return NextResponse.json(
        { error: "Replacement asset was not found." },
        { status: 404 },
      );
    const existing = await prisma.mediaAsset.findUnique({
      where: { checksum: prepared.checksum },
    });
    if (existing)
      return NextResponse.json({
        ok: true,
        asset: existing,
        deduplicated: true,
      });
    const extractedText = ["text/plain", "text/markdown"].includes(file.type)
      ? await extractDocumentText(file)
      : "";
    const uploaded = await uploadAdminMedia(
      file,
      folder,
      prepared.buffer,
      prepared.resourceType,
    );
    uploadedProviderId = uploaded.public_id;
    uploadedResourceType = prepared.resourceType;
    const data = {
      providerId: uploaded.public_id,
      version: String(uploaded.version),
      format: uploaded.format,
      mimeType: file.type,
      resourceType: prepared.resourceType,
      bytes: uploaded.bytes,
      width: uploaded.width,
      height: uploaded.height,
      checksum: prepared.checksum,
      originalName: file.name
        .normalize("NFKC")
        .replace(/[^a-zA-Z0-9._ -]/g, "")
        .slice(0, 120),
      secureUrl: uploaded.secure_url,
      altText,
      state: "READY" as const,
    };
    const asset = await runAuditedMutation(
      async (tx) => {
        const stored = replacement
          ? await tx.mediaAsset.update({
              where: { id: replacement.id },
              data,
            })
          : await tx.mediaAsset.create({ data });
        await tx.mediaExtraction.deleteMany({
          where: { mediaAssetId: stored.id },
        });
        if (extractedText)
          await tx.mediaExtraction.create({
            data: {
              mediaAssetId: stored.id,
              plainText: extractedText,
              contentHash: prepared.checksum,
            },
          });
        return stored;
      },
      (stored) => ({
        actorId: session.user.id,
        action: replacement ? "UPDATE" : "CREATE",
        entityType: "MediaAsset",
        entityId: stored.id,
      }),
    );
    uploadedProviderId = undefined;
    uploadedResourceType = undefined;
    if (replacement)
      await deleteAdminMedia(
        replacement.providerId,
        replacement.resourceType,
      ).catch(() => {});
    return NextResponse.json({ ok: true, asset }, { status: 201 });
  } catch {
    if (uploadedProviderId && uploadedResourceType)
      await deleteAdminMedia(uploadedProviderId, uploadedResourceType).catch(
        () => {},
      );
    return NextResponse.json(
      { error: "The media file could not be uploaded." },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  if (!(await canAdmin("media:write")))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const session = await getAdminSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    assertSameOrigin(request);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 403 });
  }
  const id = new URL(request.url).searchParams.get("id");
  if (!id)
    return NextResponse.json({ error: "Missing asset id" }, { status: 400 });
  const asset = await prisma.mediaAsset.findUnique({
    where: { id },
    include: {
      profileDp: true,
      projectCovers: true,
      galleryItems: true,
      projectMedia: true,
      reflections: true,
      siteAudioSettings: true,
    },
  });
  if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const references =
    asset.profileDp.length +
    asset.projectCovers.length +
    asset.galleryItems.length +
    asset.projectMedia.length +
    asset.reflections.length +
    asset.siteAudioSettings.length;
  if (references > 0)
    return NextResponse.json(
      { error: "Replace or detach this asset before deletion" },
      { status: 409 },
    );
  await runAuditedMutation(
    (tx) =>
      tx.mediaAsset.update({
        where: { id },
        data: { state: "DELETED", deletedAt: new Date() },
      }),
    (stored) => ({
      actorId: session.user.id,
      action: "DELETE",
      entityType: "MediaAsset",
      entityId: stored.id,
    }),
  );
  try {
    await deleteAdminMedia(asset.providerId, asset.resourceType);
  } catch {
    await runAuditedMutation(
      (tx) =>
        tx.mediaAsset.update({
          where: { id },
          data: { state: "QUARANTINED" },
        }),
      (stored) => ({
        actorId: session.user.id,
        action: "UPDATE",
        entityType: "MediaAsset",
        entityId: stored.id,
      }),
    );
    return NextResponse.json(
      {
        error:
          "The asset was removed from the site but provider cleanup must be retried.",
      },
      { status: 503 },
    );
  }
  return NextResponse.json({ ok: true });
}
