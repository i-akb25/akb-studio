import "@/features/legal/legal-surface.css";

import type { Metadata } from "next";
import Link from "next/link";

import { PrivacyRequestForm } from "@/features/legal/components/privacy-request-form";
import {
  POLICY_VERSIONS,
  PRIVACY_CONTACT,
} from "@/features/legal/policy-registry";
import { createPageMetadata } from "@/features/seo/site-config";

export const metadata: Metadata = createPageMetadata({
  title: "Privacy requests",
  description:
    "Request access, correction, deletion, consent withdrawal or grievance review.",
  path: "/privacy/requests",
  noIndex: true,
});

export default function PrivacyRequestsPage() {
  return (
    <main className="privacy-request-page">
      <header>
        <p className="legal-page__kicker">LEGAL / RIGHTS DESK</p>
        <h1>Privacy requests</h1>
        <p>
          Use this route for access, correction, deletion, consent withdrawal,
          account or content removal, nomination handling, and grievances.
        </p>
        <dl>
          <div>
            <dt>Notice version</dt>
            <dd>{POLICY_VERSIONS.privacyRequest}</dd>
          </div>
          <div>
            <dt>Target response</dt>
            <dd>Within 30 days</dd>
          </div>
          <div>
            <dt>Contact</dt>
            <dd>{PRIVACY_CONTACT}</dd>
          </div>
        </dl>
      </header>

      <section aria-labelledby="privacy-request-form-heading">
        <div>
          <h2 id="privacy-request-form-heading">File a request</h2>
          <p>
            Give only enough detail to locate the record. Do not upload identity
            documents or send passwords, financial data or other sensitive
            material. AKB Studio may verify control of the relevant email before
            disclosure or deletion.
          </p>
          <p>
            Prefer email? Write to{" "}
            <a href={`mailto:${PRIVACY_CONTACT}`}>{PRIVACY_CONTACT}</a>. Read
            the <Link href="/privacy">Privacy Notice</Link> and{" "}
            <Link href="/data-policy">Data Policy</Link> first.
          </p>
        </div>
        <PrivacyRequestForm />
      </section>
    </main>
  );
}
