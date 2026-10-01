import { prisma } from "@/server/db/prisma";
import { logger, safeErrorFields } from "@/server/logging/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const setting = await prisma.siteAudioSetting.findFirst({
      where: {
        id: "portfolio",
        enabled: true,
        asset: { state: "READY", mimeType: { startsWith: "audio/" } },
      },
      select: {
        title: true,
        artist: true,
        asset: { select: { secureUrl: true, mimeType: true } },
      },
    });
    if (!setting)
      return new Response(null, {
        status: 204,
        headers: {
          "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
        },
      });
    return Response.json(
      {
        title: setting.title,
        artist: setting.artist,
        url: setting.asset.secureUrl,
        mimeType: setting.asset.mimeType,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
        },
      },
    );
  } catch (error) {
    logger.warn({ event: "site_audio_read_failed", ...safeErrorFields(error) });
    return new Response(null, {
      status: 204,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
