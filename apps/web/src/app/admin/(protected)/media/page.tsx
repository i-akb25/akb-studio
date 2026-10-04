import { MediaConsole } from "@/features/admin/components/media-console";
import { SiteAudioConsole } from "@/features/media/components/site-audio-console";
import { prisma } from "@/server/db/prisma";

export default async function MediaPage() {
  const [audio, assets] = await Promise.all([
    prisma.siteAudioSetting
      .findUnique({
        where: { id: "portfolio" },
        select: { assetId: true, title: true, artist: true, enabled: true },
      })
      .catch(() => null),
    prisma.mediaAsset.findMany({
      where: { state: "READY" },
      select: {
        id: true,
        originalName: true,
        mimeType: true,
        bytes: true,
        secureUrl: true,
        altText: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);
  const audioAssets = assets
    .filter((asset) => asset.mimeType.startsWith("audio/"))
    .map(({ id, originalName }) => ({ id, originalName }));
  return (
    <main className="akb-admin-page">
      <header className="akb-admin-page__header">
        <p className="akb-kicker">Media library</p>
        <h1>Media and portfolio music</h1>
        <p>
          Upload files first. The returned asset ID is what connects media to a
          project, profile, gallery, reflection or the public music control.
        </p>
      </header>
      <div className="akb-admin-guide">
        <strong>How this page works</strong>
        <p>
          Upload creates an asset. Replace updates one existing asset. Portfolio
          music only accepts an uploaded audio asset and never starts without a
          visitor action.
        </p>
      </div>
      <MediaConsole assets={assets} />
      <SiteAudioConsole initial={audio ?? undefined} assets={audioAssets} />
    </main>
  );
}
