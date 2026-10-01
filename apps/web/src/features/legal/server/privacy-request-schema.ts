import { z } from "zod";

import {
  PRIVACY_REQUEST_POLICY_VERSION,
  PRIVACY_REQUEST_TYPES,
} from "@/features/legal/privacy-request-model";

const typeValues = PRIVACY_REQUEST_TYPES.map((item) => item.value) as [
  (typeof PRIVACY_REQUEST_TYPES)[number]["value"],
  ...(typeof PRIVACY_REQUEST_TYPES)[number]["value"][],
];

const optionalText = (maximum: number) =>
  z
    .string()
    .trim()
    .max(maximum)
    .optional()
    .transform((value) => value || undefined);

export const privacyRequestSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    email: z.string().trim().toLowerCase().email().max(254),
    type: z.enum(typeValues),
    details: z.string().trim().min(20).max(4_000),
    relatedReference: optionalText(100),
    resourceUrl: optionalText(500).refine((value) => {
      if (!value) return true;
      try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
      } catch {
        return false;
      }
    }, "Use a complete http:// or https:// URL"),
    noticeAccepted: z.literal(true),
    policyVersion: z.literal(PRIVACY_REQUEST_POLICY_VERSION),
    startedAt: z.number().int().positive(),
    website: z.string().trim().max(0).optional().default(""),
  })
  .strict();

export type PrivacyRequestInput = z.infer<typeof privacyRequestSchema>;
