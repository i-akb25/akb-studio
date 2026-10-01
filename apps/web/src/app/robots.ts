import type { MetadataRoute } from "next";
import { absoluteSiteUrl } from "@/features/seo/site-config";

export default function robots(): MetadataRoute.Robots {
  const sitemap = absoluteSiteUrl("/sitemap.xml");

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/api/",
        "/preview/",
        "/private/",
        "/_next/",
        "/guardian-consent",
        "/privacy/requests",
      ],
    },
    ...(sitemap ? { sitemap } : {}),
    ...(absoluteSiteUrl("/") ? { host: absoluteSiteUrl("/") } : {}),
  };
}
