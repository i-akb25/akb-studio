import { POLICY_VERSIONS } from "@/features/legal/policy-registry";

export const PRIVACY_REQUEST_TYPES = [
  { value: "ACCESS", label: "Access my data" },
  { value: "CORRECTION", label: "Correct or complete data" },
  { value: "DELETION", label: "Delete personal data" },
  { value: "CONSENT_WITHDRAWAL", label: "Withdraw consent" },
  { value: "GRIEVANCE", label: "Raise a privacy grievance" },
  { value: "ACCOUNT_DELETION", label: "Delete an account" },
  { value: "CONTENT_DELETION", label: "Remove submitted content" },
  { value: "NOMINATION", label: "Nomination or representative request" },
] as const;

export const PRIVACY_REQUEST_POLICY_VERSION = POLICY_VERSIONS.privacyRequest;

export type PrivacyRequestResponse = {
  ok: boolean;
  message: string;
  reference?: string;
};
