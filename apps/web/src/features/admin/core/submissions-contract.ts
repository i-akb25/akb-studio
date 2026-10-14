import { z } from "zod";

export const contactStates = [
  "NEW",
  "IN_REVIEW",
  "WAITING",
  "CLOSED",
  "REJECTED",
  "PENDING_GUARDIAN",
] as const;
export const feedbackStates = [
  "new",
  "reviewed",
  "resolved",
  "archived",
] as const;
export const resourceSchema = z.enum(["contacts", "feedback", "chats"]);
const id = z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/);
const deletion = { id, confirmation: id, revision: z.string().min(1).max(100) };
export const submissionMutation = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("contact-update"),
      id,
      revision: z.string().datetime(),
      state: z.enum(contactStates),
      note: z.string().trim().max(2000),
    })
    .strict(),
  z.object({ action: z.literal("contact-delete"), ...deletion }).strict(),
  z
    .object({
      action: z.literal("feedback-update"),
      id,
      revision: z.string().regex(/^[a-f0-9]{64}$/),
      status: z.enum(feedbackStates),
      ownerNote: z.string().trim().max(2000),
    })
    .strict(),
  z.object({ action: z.literal("feedback-delete"), ...deletion }).strict(),
  z.object({ action: z.literal("chat-delete"), ...deletion }).strict(),
]);
export function isSubmissionOwner(
  session: { role: string; user: { twoFactorEnabled?: boolean | null } } | null,
): boolean {
  return session?.role === "owner" && session.user.twoFactorEnabled === true;
}
export const privateResponseHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
};
export const feedbackRecordSchema = z.object({
  feedbackId: id,
  rating: z.string().max(30),
  message: z.string().max(2000),
  reason: z.string().max(80),
  kind: z.string().max(30),
  submittedAt: z.string().max(80),
  status: z.enum(feedbackStates),
  ownerNote: z.string().max(2001),
  updatedAt: z.string().max(80),
  revision: z.string().regex(/^[a-f0-9]{64}$/),
  transcriptConsented: z.boolean(),
  reportExcerpt: z.string().max(4001).optional(),
});
export type SubmissionItem = {
  id: string;
  title: string;
  state: string;
  createdAt: string;
  revision: string;
  description?: string;
  body?: string;
  ownerNote?: string;
  excerpt?: string;
  notes?: { id: string; body: string; createdAt: string }[];
  messages?: { id: string; role: string; text: string | null }[];
};
export type SubmissionResource = z.infer<typeof resourceSchema>;
