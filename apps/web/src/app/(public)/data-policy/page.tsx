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
  title: "Data Policy",
  description: "The principles I follow when handling data in AKB Studio.",
  path: "/data-policy",
});

const sections: readonly LegalSection[] = [
  {
    title: "Collect less",
    content: (
      <p>
        I ask only for information needed to provide a feature or answer a
        request. Public forms are not intended for identity documents, financial
        information, health records, precise location, or private attachments.
      </p>
    ),
  },
  {
    title: "Keep purposes separate",
    content: (
      <p>
        An enquiry, publication subscription, Vartalap contribution, privacy
        request, and optional Aeva share serve different purposes. A submission
        for one purpose is not silently reused for another.
      </p>
    ),
  },
  {
    title: "Protect private records",
    content: (
      <p>
        Private operational records are kept behind authenticated access. Public
        content and private submissions are treated as separate data classes.
        Service providers receive only the information needed for hosting,
        delivery, storage, abuse prevention, or an optional AI answer.
      </p>
    ),
  },
  {
    title: "Retain with an end date",
    content: (
      <p>
        Personal records receive a defined retention period based on their
        purpose. Expired records are removed by controlled maintenance, subject
        to a documented legal or security hold when one is genuinely required.
      </p>
    ),
  },
  {
    title: "Delete carefully",
    content: (
      <p>
        A deletion request is verified, scoped, applied to eligible active
        records, and allowed to reach protected backups through expiry. I keep
        only the minimum evidence needed to record that the request was
        completed.
      </p>
    ),
  },
  {
    title: "Request a change",
    content: (
      <p>
        To request access, correction, deletion, consent withdrawal, or a
        grievance review, use the{" "}
        <Link href="/privacy/requests">privacy request form</Link>. The current{" "}
        <Link href="/privacy">Privacy Notice</Link> explains how I handle the
        request itself.
      </p>
    ),
  },
];

export default function DataPolicyPage() {
  return (
    <LegalPage
      eyebrow="Legal / Data principles"
      title="Data Policy"
      summary="The practical rules I follow to collect less, separate purposes, limit access, and delete data responsibly."
      version={POLICY_VERSIONS.data}
      sections={sections}
    />
  );
}
