import "@/features/legal/legal-surface.css";

import type { Metadata } from "next";

import {
  LegalPage,
  type LegalSection,
} from "@/features/legal/components/legal-page";
import { PrivacyPreferences } from "@/features/legal/components/privacy-preferences";
import { POLICY_VERSIONS } from "@/features/legal/policy-registry";
import { createPageMetadata } from "@/features/seo/site-config";

export const metadata: Metadata = createPageMetadata({
  title: "Cookie Policy",
  description:
    "Cookies, local browser storage and optional analytics controls used by AKB Studio.",
  path: "/cookies",
});

const sections: readonly LegalSection[] = [
  {
    title: "Current position",
    content: (
      <p>
        AKB Studio does not run advertising cookies, cross-site tracking,
        fingerprinting or third-party analytics. Optional first-party journey
        summaries remain off until you enable them below.
      </p>
    ),
  },
  {
    title: "Essential cookies",
    content: (
      <p>
        Better Auth uses secure, HttpOnly cookies for the owner-only Admin.
        These are necessary for authentication, session security and logout.
        They are not available to public page scripts and are not used for
        advertising. Cloudflare Turnstile may set or read limited security
        storage when bot verification is enabled on a protected form.
      </p>
    ),
  },
  {
    title: "Local browser storage",
    content: (
      <p>
        The theme choice and the preference below are stored locally in your
        browser. Unshared Aeva conversation state exists only in the current
        page session. Clearing site data removes these local choices. No name,
        email or contact message is placed in local storage.
      </p>
    ),
  },
  {
    title: "Optional analytics",
    content: (
      <>
        <p>
          Optional analytics store only approved page categories, project and
          article slugs, page counts, bounded attention time, and conversion
          totals for resume, project, article, Aeva and contact actions. They
          expire after 30 days. They do not store names, email addresses, IP
          addresses, user agents, prompts, messages or arbitrary URLs, and are
          never joined to contact records. Withdrawing consent stops future
          collection and removes the random browser-session identifier.
        </p>
        <PrivacyPreferences />
      </>
    ),
  },
  {
    title: "Storage inventory",
    content: (
      <div className="legal-page__table-wrap">
        <table className="legal-page__table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Purpose</th>
              <th>Duration</th>
              <th>Required</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Admin session cookie</td>
              <td>Owner authentication and session security</td>
              <td>Configured session lifetime</td>
              <td>Yes, for Admin only</td>
            </tr>
            <tr>
              <td>Theme local storage</td>
              <td>Remember light or dark appearance</td>
              <td>Until cleared</td>
              <td>No</td>
            </tr>
            <tr>
              <td>Privacy preference local storage</td>
              <td>Remember the optional analytics choice and policy version</td>
              <td>Until cleared or replaced</td>
              <td>No</td>
            </tr>
            <tr>
              <td>Turnstile security storage</td>
              <td>Bot and abuse verification</td>
              <td>Provider controlled</td>
              <td>Only when the challenge is enabled</td>
            </tr>
            <tr>
              <td>Anonymous journey session storage</td>
              <td>Hold a random identifier only after analytics consent</td>
              <td>Until the browser tab session ends</td>
              <td>No</td>
            </tr>
          </tbody>
        </table>
      </div>
    ),
  },
];

export default function CookiePolicyPage() {
  return (
    <LegalPage
      eyebrow="Legal / Browser storage"
      title="Cookie Policy"
      summary="A precise inventory of cookies, local storage and the control reserved for optional analytics."
      version={POLICY_VERSIONS.cookies}
      sections={sections}
    />
  );
}
