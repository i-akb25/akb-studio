import type { PublishedContentSummary } from "@/features/content/model";
import { AUTHOR_NAME, absoluteSiteUrl, SITE_NAME } from "./site-config";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function createRssFeed(input: {
  title: string;
  description: string;
  path: string;
  records: readonly PublishedContentSummary[];
}): string | null {
  const siteUrl = absoluteSiteUrl("/");
  const feedUrl = absoluteSiteUrl(input.path);
  if (!siteUrl || !feedUrl) return null;

  const items = input.records
    .map((record) => {
      const itemUrl = absoluteSiteUrl(record.canonicalPath);
      if (!itemUrl) return "";

      return [
        "<item>",
        `<title>${escapeXml(record.title)}</title>`,
        `<link>${escapeXml(itemUrl)}</link>`,
        `<guid isPermaLink="true">${escapeXml(itemUrl)}</guid>`,
        `<description>${escapeXml(record.description)}</description>`,
        `<pubDate>${new Date(record.publishedAt).toUTCString()}</pubDate>`,
        `<dc:creator>${escapeXml(AUTHOR_NAME)}</dc:creator>`,
        ...record.tags.map((tag) => `<category>${escapeXml(tag)}</category>`),
        "</item>",
      ].join("");
    })
    .join("");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">',
    "<channel>",
    `<title>${escapeXml(input.title)}</title>`,
    `<link>${escapeXml(siteUrl)}</link>`,
    `<description>${escapeXml(input.description)}</description>`,
    `<language>en-IN</language>`,
    `<generator>${escapeXml(SITE_NAME)}</generator>`,
    `<atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />`,
    items,
    "</channel>",
    "</rss>",
  ].join("");
}
