import "server-only";

import { cache } from "react";
import {
  AUTHOR_NAME,
  absoluteSiteUrl,
  DEFAULT_DESCRIPTION,
  SITE_NAME,
  SOCIAL_IMAGE_ALT,
} from "@/features/seo/site-config";
import { prisma } from "@/server/db/prisma";

export type PublicSiteSettings = {
  siteName: string;
  authorName: string;
  description: string;
  professionalEmail: string;
  generalEmail: string;
  socialImageAssetId: string | null;
  socialImageUrl: string | null;
  socialImageAlt: string;
};

const fallback: PublicSiteSettings = {
  siteName: SITE_NAME,
  authorName: AUTHOR_NAME,
  description: DEFAULT_DESCRIPTION,
  professionalEmail: "anuragbhartiee25@gmail.com",
  generalEmail: "akbstudioofficial@gmail.com",
  socialImageAssetId: null,
  socialImageUrl:
    absoluteSiteUrl("/images/projects/akb-studio/cover.webp") ?? null,
  socialImageAlt: SOCIAL_IMAGE_ALT,
};

export const getPublicSiteSettings = cache(
  async (): Promise<PublicSiteSettings> => {
    if (!process.env.DATABASE_URL) return fallback;
    try {
      const settings = await prisma.siteConfiguration.findUnique({
        where: { id: "primary" },
        include: { socialImageAsset: true },
      });
      if (!settings) return fallback;
      const usableImage =
        settings.socialImageAsset?.state === "READY" &&
        settings.socialImageAsset.mimeType.startsWith("image/")
          ? settings.socialImageAsset
          : null;
      return {
        siteName: settings.siteName,
        authorName: settings.authorName,
        description: settings.description,
        professionalEmail: settings.professionalEmail,
        generalEmail: settings.generalEmail,
        socialImageAssetId: usableImage?.id ?? null,
        socialImageUrl: usableImage?.secureUrl ?? fallback.socialImageUrl,
        socialImageAlt:
          settings.socialImageAlt || usableImage?.altText || SOCIAL_IMAGE_ALT,
      };
    } catch {
      return fallback;
    }
  },
);
