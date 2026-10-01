import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { CONTACT_POLICY_VERSION } from "../../src/features/contact/model";
import { contactSubmissionSchema } from "../../src/features/contact/server/contact-schema";

const root = process.cwd();

function minorSubmission(minorDeclaration: boolean) {
  return {
    name: "Release Test",
    email: "release-test@example.com",
    organisation: "",
    category: "student-guidance",
    subject: "Portfolio guidance question",
    message:
      "This is a clearly labelled test submission for release verification.",
    relevantUrl: "",
    ageGroup: "minor",
    minorDeclaration,
    privacyAccepted: true,
    followUpAccepted: false,
    policyVersion: CONTACT_POLICY_VERSION,
    startedAt: Date.now() - 10_000,
    website: "",
    turnstileToken: "",
  };
}

test("under-18 contact uses the approved safety declaration", () => {
  assert.equal(
    contactSubmissionSchema.safeParse(minorSubmission(true)).success,
    true,
  );
  assert.equal(
    contactSubmissionSchema.safeParse(minorSubmission(false)).success,
    false,
  );

  const form = readFileSync(
    join(root, "src/features/contact/components/contact-form.tsx"),
    "utf8",
  );
  assert.match(form, /minorDeclaration/);
  assert.doesNotMatch(form, /guardianName|guardianEmail/);
});

test("homepage keeps rolling text before the original final CTA", () => {
  const homepage = readFileSync(
    join(root, "src/app/(public)/page.tsx"),
    "utf8",
  );
  const rolling = homepage.indexOf("<RollingCollaboration />");
  const finalCta = homepage.indexOf("<FinalCta />");

  assert.ok(rolling >= 0);
  assert.ok(finalCta > rolling);
});
