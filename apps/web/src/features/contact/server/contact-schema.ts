import { z } from "zod";

import {
  CONTACT_AGE_GROUPS,
  CONTACT_CATEGORIES,
  CONTACT_POLICY_VERSION,
} from "@/features/contact/model";

const categoryValues = CONTACT_CATEGORIES.map((item) => item.value) as [
  (typeof CONTACT_CATEGORIES)[number]["value"],
  ...(typeof CONTACT_CATEGORIES)[number]["value"][],
];
const ageGroupValues = CONTACT_AGE_GROUPS.map((item) => item.value) as [
  (typeof CONTACT_AGE_GROUPS)[number]["value"],
  ...(typeof CONTACT_AGE_GROUPS)[number]["value"][],
];

const optionalText = (maximum: number) =>
  z
    .string()
    .trim()
    .max(maximum)
    .optional()
    .transform((value) => value || undefined);

const optionalHttpUrl = z
  .string()
  .trim()
  .max(500)
  .optional()
  .transform((value) => value || undefined)
  .refine((value) => {
    if (!value) return true;

    try {
      const url = new URL(value);
      return url.protocol === "https:" || url.protocol === "http:";
    } catch {
      return false;
    }
  }, "Use a complete http:// or https:// URL");

export const contactSubmissionSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    email: z.string().trim().toLowerCase().email().max(254),
    organisation: optionalText(120),
    category: z.enum(categoryValues),
    subject: z.string().trim().min(4).max(140),
    message: z.string().trim().min(20).max(4000),
    relevantUrl: optionalHttpUrl,
    ageGroup: z.enum(ageGroupValues),
    minorDeclaration: z.boolean().default(false),
    privacyAccepted: z.literal(true),
    followUpAccepted: z.boolean().default(false),
    policyVersion: z.literal(CONTACT_POLICY_VERSION),
    startedAt: z.number().int().positive(),
    website: z.string().trim().max(0).optional().default(""),
    turnstileToken: optionalText(2048),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.ageGroup !== "minor") return;
    if (!value.minorDeclaration) {
      context.addIssue({
        code: "custom",
        path: ["minorDeclaration"],
        message: "The under-18 safety declaration is required",
      });
    }
  });

export type ContactSubmission = z.infer<typeof contactSubmissionSchema>;
