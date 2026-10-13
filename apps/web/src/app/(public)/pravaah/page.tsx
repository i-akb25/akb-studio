import "@/features/pravaah/pravaah-surface.css";

import type { Metadata } from "next";

import { resolveAnonymousNoteUrl } from "@/features/pravaah/anonymous-note";
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

export default async function PravaahRoute() {
  const signals = await getPublishedFeatureItems();

  return (
    <PravaahPage
      signals={signals}
      anonymousNoteUrl={resolveAnonymousNoteUrl(
        process.env.AKB_ANONYMOUS_NOTE_URL,
      )}
    />
  );
}
