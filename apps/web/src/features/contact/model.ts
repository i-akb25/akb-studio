import { POLICY_VERSIONS } from "@/features/legal/policy-registry";

export const CONTACT_CATEGORIES = [
  { value: "full-time", label: "Full-time opportunity" },
  { value: "freelance", label: "Freelance / contract project" },
  { value: "collaboration", label: "Collaboration" },
  { value: "engineering", label: "Engineering / technical project" },
  { value: "product", label: "Product / software discussion" },
  { value: "student-guidance", label: "Student guidance / career question" },
  { value: "management-support", label: "AKB Studio management / support" },
  { value: "general", label: "General enquiry" },
] as const;

export type ContactCategory = (typeof CONTACT_CATEGORIES)[number]["value"];

export const CONTACT_POLICY_VERSION = POLICY_VERSIONS.contact;

export const CONTACT_AGE_GROUPS = [
  { value: "adult", label: "I am 18 or older" },
  { value: "minor", label: "I am under 18" },
] as const;

export function contactCategoryLabel(category: ContactCategory): string {
  return (
    CONTACT_CATEGORIES.find((item) => item.value === category)?.label ??
    "General enquiry"
  );
}

export type ContactResponse = {
  ok: boolean;
  code?: "duplicate" | "invalid" | "rate_limited" | "unavailable";
  message: string;
  reference?: string;
};
