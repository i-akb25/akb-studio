import "@/features/legal/legal-surface.css";

import { createHash } from "node:crypto";
import type { Metadata } from "next";

import { GuardianConsentForm } from "@/features/legal/components/guardian-consent-form";
import { createPageMetadata } from "@/features/seo/site-config";
import { prisma } from "@/server/db/prisma";

export const metadata: Metadata = {
  ...createPageMetadata({
    title: "Guardian consent",
    description: "Review an under-18 AKB Studio contact request.",
    path: "/guardian-consent",
    noIndex: true,
  }),
  referrer: "no-referrer",
};

export const dynamic = "force-dynamic";

export default async function GuardianConsentPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token = "" } = await searchParams;
  const tokenHash = token
    ? createHash("sha256").update(token).digest("hex")
    : "invalid";
  const consent = await prisma.consentRecord.findFirst({
    where: {
      verificationTokenHash: tokenHash,
      consentType: "guardian_consent",
      granted: false,
      verifiedAt: null,
      verificationExpiresAt: { gt: new Date() },
      submission: { state: "PENDING_GUARDIAN" },
    },
    select: {
      guardianName: true,
      verificationExpiresAt: true,
      submission: {
        select: {
          name: true,
          category: true,
          subject: true,
          reference: true,
        },
      },
    },
  });

  return (
    <main className="guardian-consent">
      <p className="legal-page__kicker">LEGAL / GUARDIAN REVIEW</p>
      <h1>{consent ? "Review this request" : "Link unavailable"}</h1>
      {consent ? (
        <>
          <p>
            Hello {consent.guardianName}. {consent.submission.name} identified
            you as their guardian for the enquiry below.
          </p>
          <dl className="guardian-consent__meta">
            <div className="guardian-consent__meta-row">
              <dt>Reference</dt>
              <dd>{consent.submission.reference}</dd>
            </div>
            <div className="guardian-consent__meta-row">
              <dt>Category</dt>
              <dd>{consent.submission.category}</dd>
            </div>
            <div className="guardian-consent__meta-row">
              <dt>Subject</dt>
              <dd>{consent.submission.subject}</dd>
            </div>
            <div className="guardian-consent__meta-row">
              <dt>Expiry</dt>
              <dd>{consent.verificationExpiresAt?.toISOString()}</dd>
            </div>
          </dl>
          <p>
            Approval permits AKB Studio to receive the visitor’s name, email,
            category, subject, message and any optional organisation or public
            URL, use them only to handle the enquiry, and retain the delivered
            record for up to 180 days. The data is not used for advertising,
            profiling, publication or subscription enrolment.
          </p>
          <GuardianConsentForm token={token} />
        </>
      ) : (
        <p>
          This one-time link is invalid, expired or already used. Unapproved
          requests are removed after seven days.
        </p>
      )}
    </main>
  );
}
