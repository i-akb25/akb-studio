import { getPublishedJournal } from "@/features/content/server/content-source";
import { createRssFeed } from "@/features/seo/feed";

export const revalidate = 900;

export async function GET(): Promise<Response> {
  const records = await getPublishedJournal();
  const feed = createRssFeed({
    title: "AKB Studio Engineering Journal",
    description:
      "Engineering decisions, investigations, experiments and lessons from Anurag Kumar Bharti.",
    path: "/journal/feed.xml",
    records,
  });

  if (!feed) {
    return new Response("Canonical site URL is not configured", {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }

  return new Response(feed, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control":
        "public, max-age=0, s-maxage=900, stale-while-revalidate=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
