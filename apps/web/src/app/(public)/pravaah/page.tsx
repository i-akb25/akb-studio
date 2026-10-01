import "@/features/pravaah/pravaah-surface.css";

import type { Metadata } from "next";

import { PravaahPage } from "@/features/pravaah/components/pravaah-page";
import { getPublishedFeatureItems } from "@/features/pravaah/server/feature-source";
import { createPageMetadata } from "@/features/seo/site-config";

export const revalidate = 900;

export const metadata: Metadata = createPageMetadata({
  title: "Pravaah",
  description:
    "Posts, public mentions, releases and announcements curated by AKB Studio.",
  path: "/pravaah",
});

function anonymousNoteUrl(): string | undefined {
  const value = process.env.AKB_ANONYMOUS_NOTE_URL?.trim();
  if (!value) return undefined;

  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" ? parsed.href : undefined;
  } catch {
    return undefined;
  }
}

export default async function PravaahRoute() {
  const signals = await getPublishedFeatureItems();

  return (
    <PravaahPage signals={signals} anonymousNoteUrl={anonymousNoteUrl()} />
  );
}
