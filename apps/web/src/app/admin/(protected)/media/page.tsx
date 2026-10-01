import { MediaConsole } from "@/features/admin/components/media-console";
import { SiteAudioConsole } from "@/features/media/components/site-audio-console";
import { prisma } from "@/server/db/prisma";

export default async function MediaPage() {
  const [audio, audioAssets] = await Promise.all([
    prisma.siteAudioSetting
      .findUnique({
        where: { id: "portfolio" },
        select: { assetId: true, title: true, artist: true, enabled: true },
      })
      .catch(() => null),
    prisma.mediaAsset.findMany({
      where: { state: "READY", mimeType: { startsWith: "audio/" } },
      select: { id: true, originalName: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);
  return (
    <main className="akb-admin-page">
      <header className="akb-admin-page__header">
        <p className="akb-kicker">Media library</p>
        <h1>Upload controlled assets</h1>
        <p>
          Uploads use the card-free Cloudinary plan. SVG and oversized files are
          rejected.
        </p>
      </header>
      <MediaConsole />
      <SiteAudioConsole initial={audio ?? undefined} assets={audioAssets} />
    </main>
  );
}
