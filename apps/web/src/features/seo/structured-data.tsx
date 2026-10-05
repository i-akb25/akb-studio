import {
  AUTHOR_NAME,
  absoluteSiteUrl,
  SITE_NAME,
  SOCIAL_PROFILES,
} from "./site-config";

type JsonLdValue = Record<string, unknown>;

function serializeJsonLd(value: JsonLdValue): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export function StructuredData({ data }: { data: JsonLdValue }) {
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is escaped before insertion and contains server-owned data only.
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}

export function personStructuredData(): JsonLdValue | null {
  const siteUrl = absoluteSiteUrl("/");
  if (!siteUrl) return null;

  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${siteUrl}#person`,
    name: AUTHOR_NAME,
    alternateName: [
      "Anurag Aryan",
      "Ace",
      "Ace AKB",
      "Ace-AKB",
      "AKB NITP",
      "Anurag NITP",
    ],
    url: siteUrl,
    jobTitle: ["Software Engineer", "Electrical & Automation Engineer"],
    alumniOf: {
      "@type": "CollegeOrUniversity",
      name: "National Institute of Technology Patna",
      alternateName: "NIT Patna",
    },
    sameAs: SOCIAL_PROFILES,
  };
}

export function websiteStructuredData(): JsonLdValue | null {
  const siteUrl = absoluteSiteUrl("/");
  if (!siteUrl) return null;

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}#website`,
    name: SITE_NAME,
    url: siteUrl,
    inLanguage: "en-IN",
    publisher: { "@id": `${siteUrl}#person` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

type ArticleStructuredDataInput = {
  path: string;
  title: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  image?: string;
  topics: readonly string[];
  sourceUrl?: string;
};

export function articleStructuredData({
  path,
  title,
  description,
  publishedAt,
  updatedAt,
  image,
  topics,
  sourceUrl,
}: ArticleStructuredDataInput): JsonLdValue | null {
  const url = absoluteSiteUrl(path);
  const siteUrl = absoluteSiteUrl("/");
  if (!url || !siteUrl) return null;

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url,
    mainEntityOfPage: url,
    datePublished: publishedAt,
    dateModified: updatedAt ?? publishedAt,
    author: { "@id": `${siteUrl}#person` },
    publisher: { "@id": `${siteUrl}#person` },
    isPartOf: { "@id": `${siteUrl}#website` },
    inLanguage: "en-IN",
    keywords: topics.join(", "),
    ...(image ? { image: absoluteSiteUrl(image) ?? image } : {}),
    ...(sourceUrl ? { citation: sourceUrl } : {}),
  };
}

type ProjectStructuredDataInput = {
  path: string;
  title: string;
  description: string;
  publishedAt?: string;
  updatedAt?: string;
  image?: string;
  technologies: readonly string[];
  repositoryUrl?: string;
};

export function projectStructuredData({
  path,
  title,
  description,
  publishedAt,
  updatedAt,
  image,
  technologies,
  repositoryUrl,
}: ProjectStructuredDataInput): JsonLdValue | null {
  const url = absoluteSiteUrl(path);
  const siteUrl = absoluteSiteUrl("/");
  if (!url || !siteUrl) return null;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Project",
        "@id": `${url}#project`,
        name: title,
        description,
        url,
        founder: { "@id": `${siteUrl}#person` },
        keywords: technologies.join(", "),
        subjectOf: { "@id": `${url}#case-study` },
        ...(image ? { image: absoluteSiteUrl(image) ?? image } : {}),
        ...(repositoryUrl ? { sameAs: repositoryUrl } : {}),
      },
      {
        "@type": "CreativeWork",
        "@id": `${url}#case-study`,
        name: `${title} case study`,
        description,
        url,
        mainEntity: { "@id": `${url}#project` },
        author: { "@id": `${siteUrl}#person` },
        isPartOf: { "@id": `${siteUrl}#website` },
        isAccessibleForFree: true,
        ...(publishedAt ? { datePublished: publishedAt } : {}),
        ...(updatedAt ? { dateModified: updatedAt } : {}),
        ...(image ? { image: absoluteSiteUrl(image) ?? image } : {}),
      },
    ],
  };
}
