import type { Metadata } from "next";

export const SITE_NAME = "AKB Studio";
export const AUTHOR_NAME = "Anurag Kumar Bharti";
export const DEFAULT_DESCRIPTION =
  "Anurag Kumar Bharti's engineering profile, project case studies, field journal and technical knowledge archive.";
export const DEFAULT_SOCIAL_IMAGE_PATH =
  "/images/projects/akb-studio/cover.webp";
export const DEFAULT_TWITTER_IMAGE_PATH =
  "/images/projects/akb-studio/cover.webp";
export const SOCIAL_IMAGE_ALT =
  "AKB Studio — engineering projects, field notes and technical knowledge";
export const SOCIAL_PROFILES = [
  "https://github.com/i-akb25",
  "https://www.linkedin.com/in/anuragkumarbharti",
  "https://x.com/i_official_akb",
] as const;

type Environment = Readonly<Record<string, string | undefined>>;

const PLACEHOLDER_HOSTS = new Set([
  "example.invalid",
  "your-project.vercel.app",
]);

function parseSiteOrigin(value: string): URL {
  const url = new URL(value);

  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/" ||
    PLACEHOLDER_HOSTS.has(url.hostname)
  ) {
    throw new Error("The canonical site URL must be a production HTTPS origin");
  }

  return url;
}

export function getSiteOrigin(
  environment: Environment = process.env,
): URL | undefined {
  const configured = environment.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return parseSiteOrigin(configured);

  const vercelProductionHost =
    environment.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercelProductionHost) {
    return parseSiteOrigin(`https://${vercelProductionHost}`);
  }

  if (environment.VERCEL_ENV === "production") {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL or VERCEL_PROJECT_PRODUCTION_URL is required for a production deployment",
    );
  }

  return undefined;
}

export function absoluteSiteUrl(
  path: string,
  environment: Environment = process.env,
): string | undefined {
  const origin = getSiteOrigin(environment);
  return origin ? new URL(path, origin).href : undefined;
}

type PageMetadataInput = {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  image?: string;
  imageAlt?: string;
  noIndex?: boolean;
};

export function createPageMetadata({
  title,
  description,
  path,
  type = "website",
  image = DEFAULT_SOCIAL_IMAGE_PATH,
  imageAlt = SOCIAL_IMAGE_ALT,
  noIndex = false,
}: PageMetadataInput): Metadata {
  if (!path.startsWith("/") || path.startsWith("//")) {
    throw new Error("Canonical metadata paths must be root-relative");
  }

  const canonical = absoluteSiteUrl(path) ?? path;
  const socialImage = absoluteSiteUrl(image) ?? image;
  const twitterImage =
    image === DEFAULT_SOCIAL_IMAGE_PATH
      ? (absoluteSiteUrl(DEFAULT_TWITTER_IMAGE_PATH) ??
        DEFAULT_TWITTER_IMAGE_PATH)
      : socialImage;

  return {
    title,
    description,
    alternates: { canonical },
    robots: noIndex
      ? { index: false, follow: false, noarchive: true }
      : { index: true, follow: true },
    openGraph: {
      type,
      siteName: SITE_NAME,
      locale: "en_IN",
      title,
      description,
      url: canonical,
      images: [
        {
          url: socialImage,
          width: 1200,
          height: 630,
          alt: imageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: twitterImage, alt: imageAlt }],
    },
  };
}
