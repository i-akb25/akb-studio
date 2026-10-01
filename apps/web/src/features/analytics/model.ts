export const JOURNEY_CATEGORIES = [
  "home",
  "projects",
  "journal",
  "knowledge",
  "pravaah",
  "about",
  "resume",
  "lab",
] as const;

export type JourneyCategory = (typeof JOURNEY_CATEGORIES)[number];

export const ANALYTICS_EVENTS = [
  "resume_download",
  "project_open",
  "article_open",
  "aeva_open",
  "aeva_success",
  "aeva_failure",
  "contact_open",
  "contact_submit_success",
  "contact_submit_failure",
] as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];

export function publicJourneyTarget(pathname: string): {
  category: JourneyCategory;
  projectSlug?: string;
} | null {
  if (!/^\/(?:[a-z0-9-]+\/?)*$/.test(pathname)) return null;
  if (pathname === "/") return { category: "home" };
  const project = pathname.match(/^\/projects\/([a-z0-9]+(?:-[a-z0-9]+)*)$/);
  if (project) return { category: "projects", projectSlug: project[1] };
  for (const category of JOURNEY_CATEGORIES.slice(1)) {
    if (pathname === `/${category}` || pathname.startsWith(`/${category}/`))
      return { category };
  }
  return null;
}
