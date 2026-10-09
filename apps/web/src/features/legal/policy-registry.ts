export const LEGAL_EFFECTIVE_DATE = "20 September 2026";

export const POLICY_VERSIONS = {
  privacy: "2026-09-20.3",
  terms: "2026-09-20.2",
  cookies: "2026-09-20.1",
  data: "2026-09-17.1",
  contact: "2026-09-20.2",
  aeva: "2026-10-08.1",
  vartalap: "2026-09-17.1",
  subscription: "2026-09-17.1",
  privacyRequest: "2026-09-17.1",
} as const;

export const PRIVACY_CONTACT = "akbstudioofficial@gmail.com";
export const PROFESSIONAL_CONTACT = "anuragbhartiee25@gmail.com";

export const LEGAL_ROUTES = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Cookies", href: "/cookies" },
  { label: "Data Policy", href: "/data-policy" },
  { label: "Privacy requests", href: "/privacy/requests" },
] as const;

export const RETENTION_SCHEDULE = [
  {
    record: "Adult contact enquiries",
    period: "180 days",
    exception:
      "Longer only for a documented active recruitment, contractual, professional or collaboration relationship.",
  },
  {
    record: "Consented Aeva conversation text",
    period: "30 days maximum",
    exception:
      "Encrypted and redacted before storage; no transcript without opt-in.",
  },
  {
    record: "Aeva feedback",
    period: "90 days",
    exception: "Stored in the private Google workflow sheet.",
  },
  {
    record: "Consented anonymous journey summaries",
    period: "30 days maximum",
    exception:
      "Not linked to contact records; expired summaries are deleted opportunistically and by retention operations.",
  },
  {
    record: "Vartalap pending or unpublished submissions",
    period: "180 days",
    exception: "Rejected submissions are removed after 90 days.",
  },
  {
    record: "Subscriber preferences",
    period: "Until unsubscribe or purpose ends",
    exception: "A minimal suppression record may remain to honour an opt-out.",
  },
  {
    record: "Privacy and grievance cases",
    period: "365 days after closure",
    exception:
      "Longer only when necessary for a live dispute or legal obligation.",
  },
  {
    record: "Security and audit events",
    period: "365 days by default",
    exception:
      "Short-lived abuse keys expire much sooner; raw IP addresses are not retained by the app.",
  },
] as const;

export const PROVIDER_INVENTORY = [
  {
    provider: "Vercel",
    purpose: "Application hosting, delivery and platform logs",
    data: "Requests and limited technical metadata",
    location: "Provider-controlled global infrastructure",
  },
  {
    provider: "Neon",
    purpose: "Private application database",
    data: "Contact, consent, rights-request, Admin and opted-in Aeva records",
    location: "Configured project region and provider subprocessors",
  },
  {
    provider: "Google Gmail API",
    purpose: "Contact and operational email delivery",
    data: "Message fields needed for delivery and mailbox handling",
    location: "Google-controlled infrastructure",
  },
  {
    provider: "Google Sheets and Apps Script",
    purpose: "Vartalap, publication subscriptions and Aeva feedback",
    data: "Submitted fields, preferences and workflow status",
    location: "Google-controlled infrastructure",
  },
  {
    provider: "Cloudinary",
    purpose: "Owner-managed public media",
    data: "Uploaded media and technical metadata; no contact messages",
    location: "Provider-controlled global infrastructure",
  },
  {
    provider: "GitHub",
    purpose: "Versioned public content and approved repository discovery",
    data: "Published source content and public repository metadata",
    location: "GitHub-controlled global infrastructure",
  },
  {
    provider: "Cloudflare Turnstile",
    purpose: "Bot and abuse verification when enabled",
    data: "Network, browser and challenge signals",
    location: "Cloudflare-controlled global infrastructure",
  },
  {
    provider: "Configured AI provider",
    purpose: "Aeva answer generation and optional live-web grounding",
    data: "Question, optional job description and minimum approved public context needed for an answer",
    location: "Depends on the production provider and its subprocessors",
  },
] as const;
