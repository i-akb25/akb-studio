import "@/features/legal/legal-surface.css";

import type { Metadata } from "next";
import Link from "next/link";
import {
  LegalPage,
  type LegalSection,
} from "@/features/legal/components/legal-page";
import { POLICY_VERSIONS } from "@/features/legal/policy-registry";
import { createPageMetadata } from "@/features/seo/site-config";

export const metadata: Metadata = createPageMetadata({
  title: "Privacy Notice",
  description: "How I handle information shared through AKB Studio.",
  path: "/privacy",
});

const sections: readonly LegalSection[] = [
  {
    title: "What I collect",
    content: (
      <p>
        I collect only the information you choose to submit for an enquiry,
        privacy request, publication update, Vartalap contribution, feedback, or
        an optional Aeva conversation share. Please do not send sensitive
        personal documents or information that is not needed for your request.
      </p>
    ),
  },
  {
    title: "How I use it",
    content: (
      <p>
        I use submitted information only to provide the feature you requested,
        reply to you, prevent abuse, meet legal obligations, and keep essential
        operational records. I do not sell personal information, use it for
        targeted advertising, or add contact enquiries to a mailing list.
      </p>
    ),
  },
  {
    title: "Aeva and external services",
    content: (
      <p>
        Aeva is an AI assistant. Questions may be processed with relevant public
        portfolio material to prepare an answer. Live web search is optional and
        clearly identified before use. Conversation text is kept only when you
        deliberately choose to share it. A job description pasted into the
        recruiter tools is processed for that response and is not stored by the
        recruiter subsystem. If you request an AI-generated interview, the job
        description may be sent to the configured AI provider with the minimum
        relevant public portfolio context.
      </p>
    ),
  },
  {
    title: "Optional journey summaries",
    content: (
      <p>
        First-party analytics run only after you enable them in Cookie
        Preferences. They record approved page categories, project slugs, page
        counts and bounded attention time for up to 30 days. They do not retain
        IP addresses, user agents or arbitrary URLs and are never joined to a
        contact enquiry.
      </p>
    ),
  },
  {
    title: "Retention and deletion",
    content: (
      <p>
        I keep personal information only for the stated purpose and remove it on
        the applicable schedule. Short-lived security records expire much
        sooner. Backups follow their own protected expiry cycle, so a deletion
        may take time to reach every backup copy.
      </p>
    ),
  },
  {
    title: "Your choices and rights",
    content: (
      <p>
        You may ask for access, correction, deletion, consent withdrawal, or
        grievance review. I may need to verify that the request relates to you
        before disclosing or changing a record. Use the{" "}
        <Link href="/privacy/requests">privacy request form</Link> to begin.
      </p>
    ),
  },
  {
    title: "Visitors under 18",
    content: (
      <p>
        An under-18 visitor may use the contact form only after completing the
        safety declaration. Minors must not submit identity documents, school
        records, financial or health information, a home address, or a precise
        location. I process the enquiry only to respond to the stated request.
      </p>
    ),
  },
  {
    title: "Security and questions",
    content: (
      <p>
        I use access controls, encryption where appropriate, validation, abuse
        protection, and limited retention. No online service can promise zero
        risk. For a privacy question, use the{" "}
        <Link href="/contact">contact page</Link> and choose the privacy or
        legal category.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal / Privacy"
      title="Privacy Notice"
      summary="What I collect, why I use it, how long I keep it, and the choices available to you."
      version={POLICY_VERSIONS.privacy}
      sections={sections}
    />
  );
}
