import { getPublicSiteSettings } from "@/features/seo/server/site-settings";
import {
  createSocialImage,
  SOCIAL_IMAGE_SIZE,
} from "@/features/seo/social-image";

export const dynamic = "force-dynamic";

export const alt =
  "AKB Studio — engineering projects, field notes and technical knowledge";
export const size = SOCIAL_IMAGE_SIZE;
export const contentType = "image/png";

export default async function TwitterImage() {
  const settings = await getPublicSiteSettings();
  return createSocialImage({
    title: settings.authorName,
    description: settings.description,
    imageUrl: settings.socialImageUrl,
  });
}
