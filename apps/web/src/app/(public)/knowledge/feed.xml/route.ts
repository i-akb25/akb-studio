import { getPublishedKnowledge } from "@/features/content/server/content-source";
import { createRssFeed } from "@/features/seo/feed";

export const revalidate = 900;

export async function GET(): Promise<Response> {
  const records = await getPublishedKnowledge();
  const feed = createRssFeed({
    title: "AKB Studio Knowledge",
    description:
      "A technical archive of notes, research, reading and engineering learning paths.",
    path: "/knowledge/feed.xml",
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
