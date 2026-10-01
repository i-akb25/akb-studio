import "@/features/legal/legal-surface.css";

import type { Metadata } from "next";
import Link from "next/link";

import {
  LegalPage,
  type LegalSection,
} from "@/features/legal/components/legal-page";
import {
  POLICY_VERSIONS,
  PRIVACY_CONTACT,
} from "@/features/legal/policy-registry";
import { createPageMetadata } from "@/features/seo/site-config";

export const metadata: Metadata = createPageMetadata({
  title: "Terms",
  description: "Terms for using AKB Studio, Aeva and public submission routes.",
  path: "/terms",
});

const sections: readonly LegalSection[] = [
  {
    title: "Agreement and operator",
    content: (
      <p>
        These terms apply to AKB Studio, operated by Anurag Kumar Bharti in
        Bihar, India. By using an interactive feature, you agree to these terms
        and the notices presented with that feature. Browsing public pages alone
        does not create an employment, agency, advisory, fiduciary, contractual
        or professional relationship.
      </p>
    ),
  },
  {
    title: "Permitted use",
    content: (
      <p>
        You may browse public work, download the public résumé, ask Aeva about
        approved material, subscribe to publication notices, participate in
        moderated Vartalap and send genuine professional, technical,
        collaboration, guidance, support or privacy requests.
      </p>
    ),
  },
  {
    title: "Prohibited conduct",
    content: (
      <ul>
        <li>Spam, harassment, impersonation, fraud or unlawful material.</li>
        <li>
          Malware, automated scraping, denial-of-service or bypass attempts.
        </li>
        <li>
          Attempts to extract prompts, credentials, private data or Admin
          content.
        </li>
        <li>Submitting data or content that you lack authority to share.</li>
        <li>Misrepresenting AI output or portfolio content as a guarantee.</li>
      </ul>
    ),
  },
  {
    title: "Submissions and moderation",
    content: (
      <>
        <p>
          You remain responsible for submitted text and links. A submission does
          not guarantee a reply, publication, employment, collaboration or
          outcome. AKB Studio may reject, remove or restrict content or requests
          that are abusive, unsafe, irrelevant or unlawful.
        </p>
        <p>
          If a Vartalap question is selected for publication, only the approved
          display name or “Anonymous reader”, question and response are shown.
          The private email is not published.
        </p>
      </>
    ),
  },
  {
    title: "Minors and safety declaration",
    content: (
      <p>
        Interactive routes are intended for adults unless the route explicitly
        supports a minor workflow. An under-18 visitor must complete the safety
        declaration and must not submit identity documents, school records,
        precise location, home address, financial information, health data or
        other sensitive material.
      </p>
    ),
  },
  {
    title: "Aeva AI limitations",
    content: (
      <p>
        Aeva is an AI system and can be incomplete, inaccurate or unavailable.
        Portfolio answers are designed to use approved evidence and citations;
        live-web answers depend on third-party sources. Aeva does not provide
        legal, medical, financial, employment, safety or other professional
        advice. Verify important claims from primary sources and use independent
        judgment.
      </p>
    ),
  },
  {
    title: "Intellectual property",
    content: (
      <p>
        Unless a project, repository or external source says otherwise, AKB
        Studio’s original writing, design, illustrations, code presentation and
        branding remain owned by Anurag Kumar Bharti. Open-source code is
        governed by the licence in its repository. Viewing, linking or
        downloading a public résumé does not transfer ownership or grant a
        broader licence.
      </p>
    ),
  },
  {
    title: "External services",
    content: (
      <p>
        External profiles, repositories, links and providers are governed by
        their own terms. AKB Studio does not control their content, availability
        or data practices. See the <Link href="/data-policy">Data Policy</Link>{" "}
        for the current provider inventory.
      </p>
    ),
  },
  {
    title: "Availability and liability",
    content: (
      <p>
        The service may change, suspend integrations or limit abusive traffic.
        Reasonable care is taken with public information, but no uninterrupted
        availability, completeness or fitness for a particular purpose is
        promised. Nothing excludes liability or statutory rights that cannot
        lawfully be excluded under applicable Indian law.
      </p>
    ),
  },
  {
    title: "Termination, law and contact",
    content: (
      <>
        <p>
          Access to interactive features may be restricted for a breach of these
          terms or a security risk. These terms are governed by Indian law, with
          competent courts in Bihar subject to mandatory applicable law.
        </p>
        <p>
          Legal notices, questions and grievances can be sent to{" "}
          <a href={`mailto:${PRIVACY_CONTACT}`}>{PRIVACY_CONTACT}</a>. Material
          revisions receive a new version and effective date.
        </p>
      </>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal / Site use"
      title="Terms"
      summary="The conditions for using the public portfolio, Aeva, publication signals and submission routes."
      version={POLICY_VERSIONS.terms}
      sections={sections}
    />
  );
}
