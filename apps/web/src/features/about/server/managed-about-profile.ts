import "server-only";

import { getAboutProfile } from "@/features/about/data/about-profile";
import type {
  AboutInterestEntry,
  AboutProfile,
} from "@/features/about/types/about";
import { prisma } from "@/server/db/prisma";

export async function getManagedAboutProfile(): Promise<AboutProfile> {
  const fallback = await getAboutProfile();
  if (!process.env.DATABASE_URL) return fallback;

  try {
    const [profile, galleries] = await Promise.all([
      prisma.profile.findFirst({
        where: { id: "primary", state: "PUBLISHED" },
        include: { dpAsset: true },
      }),
      prisma.gallery.findMany({
        where: { state: "PUBLISHED" },
        include: {
          items: { include: { asset: true }, orderBy: { order: "asc" } },
        },
        orderBy: { order: "asc" },
      }),
    ]);
    const interests: AboutInterestEntry[] = galleries.flatMap((gallery) => {
      const readyItems = gallery.items
        .filter((item) => item.asset.state === "READY")
        .slice(0, 25);
      const images = readyItems.map((item) => ({
        src: item.asset.secureUrl,
        alt: item.altText,
        width: item.asset.width ?? 1600,
        height: item.asset.height ?? 1200,
      }));
      const cover = readyItems[0];
      if (!cover) return [];
      return [
        {
          id: gallery.id,
          title: gallery.title,
          note: cover.caption ?? gallery.description ?? "",
          media: images[0],
          images,
        },
      ];
    });
    return {
      ...fallback,
      ...(profile
        ? {
            name: profile.displayName,
            headline: profile.headline,
            introduction: profile.biography,
          }
        : {}),
      profileImage:
        profile?.dpAsset?.state === "READY"
          ? {
              src: profile.dpAsset.secureUrl,
              alt: profile.dpAsset.altText,
              width: profile.dpAsset.width ?? 1200,
              height: profile.dpAsset.height ?? 1200,
            }
          : fallback.profileImage,
      interests: interests.length ? interests : fallback.interests,
    };
  } catch {
    return fallback;
  }
}
