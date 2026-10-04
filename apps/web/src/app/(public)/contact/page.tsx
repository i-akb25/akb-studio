import "@/features/contact/contact-surface.css";

import type { Metadata } from "next";

import { ContactPage } from "@/features/contact/components/contact-page";
import { getPublicSiteSettings } from "@/features/seo/server/site-settings";
import { createPageMetadata } from "@/features/seo/site-config";

export const metadata: Metadata = createPageMetadata({
  title: "Contact",
  description:
    "Contact Anurag Kumar Bharti about engineering roles, projects, collaboration, product work or student guidance.",
  path: "/contact",
});

function turnstileSiteKey(): string | undefined {
  const key = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  return key || undefined;
}

export default async function ContactRoute() {
  const settings = await getPublicSiteSettings();
  return (
    <ContactPage
      turnstileSiteKey={turnstileSiteKey()}
      generalEmail={settings.generalEmail}
    />
  );
}
