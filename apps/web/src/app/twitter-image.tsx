import {
  createSocialImage,
  SOCIAL_IMAGE_SIZE,
} from "@/features/seo/social-image";

export const alt =
  "AKB Studio — engineering projects, field notes and technical knowledge";
export const size = SOCIAL_IMAGE_SIZE;
export const contentType = "image/png";

export default function TwitterImage() {
  return createSocialImage();
}
