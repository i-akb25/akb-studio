import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { adminErrorResponse } from "@/features/admin/server/admin-api-response";
import {
  assertSameOrigin,
  canAdmin,
  getAdminSession,
} from "@/features/admin/server/admin-auth";
import { runAuditedMutation } from "@/features/admin/server/audit";
import { prisma } from "@/server/db/prisma";
import { readJsonBody } from "@/server/security/request";

const inputSchema = z
  .object({
    assetId: z.string().cuid(),
    title: z.string().trim().min(1).max(120),
    artist: z.string().trim().max(120).optional(),
    enabled: z.boolean(),
  })
  .strict();

export async function POST(request: Request) {
  if (!(await canAdmin("media:write")))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const session = await getAdminSession();
  if (!session || session.role !== "owner")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    assertSameOrigin(request);
    const input = inputSchema.parse(await readJsonBody(request, 4_096));
    const asset = await prisma.mediaAsset.findFirst({
      where: {
        id: input.assetId,
        state: "READY",
        mimeType: { startsWith: "audio/" },
      },
      select: { id: true },
    });
    if (!asset)
      return NextResponse.json(
        { error: "Choose a ready audio asset from the media library." },
        { status: 409 },
      );
    const setting = await runAuditedMutation(
      (tx) =>
        tx.siteAudioSetting.upsert({
          where: { id: "portfolio" },
          create: {
            id: "portfolio",
            assetId: asset.id,
            title: input.title,
            artist: input.artist || null,
            enabled: input.enabled,
          },
          update: {
            assetId: asset.id,
            title: input.title,
            artist: input.artist || null,
            enabled: input.enabled,
          },
        }),
      (result) => ({
        actorId: session.user.id,
        action: "UPDATE",
        entityType: "SiteAudioSetting",
        entityId: result.id,
      }),
    );
    revalidatePath("/");
    revalidatePath("/api/site-audio");
    return NextResponse.json({ ok: true, setting });
  } catch (error) {
    return adminErrorResponse(error, {
      event: "admin_site_audio_save_failed",
      fallback:
        "The music setting could not be saved. Confirm that the selected audio asset is still available.",
    });
  }
}
