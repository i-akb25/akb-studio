import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import { decryptAevaText } from "@/features/aeva/server/encryption";
import { callPublishingService } from "@/features/publishing/server/publishing-service";
import { prisma } from "@/server/db/prisma";
import {
  feedbackRecordSchema,
  type SubmissionItem,
  type SubmissionResource,
  type submissionMutation,
} from "../core/submissions-contract";
import { recordAudit, runAuditedMutation } from "./audit";

export class SubmissionError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
function conflict(): never {
  throw new SubmissionError(
    "This record changed or was removed. Refresh before trying again.",
    409,
  );
}
const feedbackErrors: Record<string, string> = {
  publishing_service_not_configured:
    "Publishing service configuration is incomplete. Check its three server environment variables.",
  publishing_service_invalid_url:
    "The publishing service URL must be the HTTPS script.google.com Web App URL ending in /exec.",
  unsupported_action:
    "Update the existing Apps Script deployment with the supplied Code.gs.",
  record_changed:
    "This feedback changed. Refresh it before saving or deleting.",
  record_not_found: "This feedback was already removed. Refresh the list.",
  sheet_header_mismatch:
    "Feedback sheet headers do not match. Existing rows have not been rearranged.",
  unauthorized:
    "The publishing service rejected authentication. Check the private service-health logs.",
};
async function publishing<T>(
  action: Parameters<typeof callPublishingService>[0],
  payload: Record<string, unknown>,
) {
  const result = await callPublishingService<T>(action, payload);
  if (!result.ok)
    throw new SubmissionError(
      feedbackErrors[result.error ?? ""] ??
        "The publishing service did not confirm this request. Refresh the record before retrying.",
      result.error === "record_changed" ? 409 : 503,
    );
  return result.data;
}
function feedbackItem(
  row: z.infer<typeof feedbackRecordSchema>,
): SubmissionItem {
  return {
    id: row.feedbackId,
    title: `${row.kind === "report" ? "Chat report" : "Feedback"}: ${row.reason || row.rating}`,
    state: row.status,
    createdAt: row.submittedAt,
    revision: row.revision,
    body: row.message,
    ownerNote: row.ownerNote,
    ...(row.transcriptConsented && row.kind === "report" && row.reportExcerpt
      ? { excerpt: row.reportExcerpt }
      : {}),
  };
}
const contactSelect = {
  id: true,
  reference: true,
  subject: true,
  name: true,
  email: true,
  state: true,
  createdAt: true,
  updatedAt: true,
} as const;
const chatWhere = {
  shared: true,
  consentVersion: { not: null },
  retentionUntil: { gt: new Date() },
};
function chatRevision(chat: {
  endedAt: Date | null;
  _count: { messages: number };
}) {
  return createHash("sha256")
    .update(
      `${chat.endedAt?.toISOString() ?? "active"}:${chat._count.messages}`,
    )
    .digest("hex");
}
export async function listSubmissions(
  resource: SubmissionResource,
  cursor?: string,
) {
  if (resource === "feedback") {
    const data = z
      .object({
        items: z.array(feedbackRecordSchema).max(25),
        nextCursor: z.number().int().min(2).nullable(),
      })
      .parse(
        await publishing("admin_feedback_list", {
          ...(cursor ? { cursor: Number(cursor) } : {}),
        }),
      );
    return {
      items: data.items.map(feedbackItem),
      nextCursor: data.nextCursor?.toString() ?? null,
    };
  }
  const paging = {
    take: 26,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: [{ createdAt: "desc" as const }, { id: "desc" as const }],
  };
  if (resource === "contacts") {
    const rows = await prisma.contactSubmission.findMany({
      ...paging,
      select: contactSelect,
    });
    return {
      items: rows.slice(0, 25).map(
        (row): SubmissionItem => ({
          id: row.id,
          title: row.subject,
          state: row.state,
          createdAt: row.createdAt.toISOString(),
          revision: row.updatedAt.toISOString(),
          description: `${row.name} · ${row.email} · ${row.reference}`,
        }),
      ),
      nextCursor: rows.length > 25 ? rows[24].id : null,
    };
  }
  const rows = await prisma.aevaConversation.findMany({
    ...paging,
    where: { ...chatWhere, retentionUntil: { gt: new Date() } },
    select: {
      id: true,
      mode: true,
      createdAt: true,
      endedAt: true,
      _count: { select: { messages: true } },
    },
  });
  return {
    items: rows.slice(0, 25).map(
      (row): SubmissionItem => ({
        id: row.id,
        title: `Shared ${row.mode} conversation`,
        state: row.endedAt ? "ended" : "active",
        createdAt: row.createdAt.toISOString(),
        revision: chatRevision(row),
        description: `${row._count.messages} saved messages`,
      }),
    ),
    nextCursor: rows.length > 25 ? rows[24].id : null,
  };
}
export async function getSubmission(
  resource: SubmissionResource,
  id: string,
): Promise<SubmissionItem> {
  if (resource === "feedback")
    return feedbackItem(
      feedbackRecordSchema.parse(
        await publishing("admin_feedback_get", { id }),
      ),
    );
  if (resource === "contacts") {
    const row = await prisma.contactSubmission.findUnique({
      where: { id },
      select: {
        ...contactSelect,
        message: true,
        retentionUntil: true,
        deliveryStatus: true,
        notes: {
          orderBy: { createdAt: "desc" },
          take: 50,
          select: { id: true, body: true, createdAt: true },
        },
      },
    });
    if (!row) throw new SubmissionError("Record not found.", 404);
    return {
      id: row.id,
      title: row.subject,
      state: row.state,
      createdAt: row.createdAt.toISOString(),
      revision: row.updatedAt.toISOString(),
      description: `${row.name} · ${row.email} · ${row.reference} · Delivery: ${row.deliveryStatus} · Retention: ${row.retentionUntil.toISOString().slice(0, 10)}`,
      body: row.message,
      notes: row.notes.map((n) => ({
        ...n,
        createdAt: n.createdAt.toISOString(),
      })),
    };
  }
  const row = await prisma.aevaConversation.findFirst({
    where: { id, ...chatWhere, retentionUntil: { gt: new Date() } },
    select: {
      id: true,
      mode: true,
      createdAt: true,
      endedAt: true,
      _count: { select: { messages: true } },
      messages: {
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        take: 1000,
        select: { id: true, role: true, encryptedBody: true },
      },
    },
  });
  if (!row)
    throw new SubmissionError("Shared, unexpired conversation not found.", 404);
  return {
    id: row.id,
    title: `Shared ${row.mode} conversation`,
    state: row.endedAt ? "ended" : "active",
    createdAt: row.createdAt.toISOString(),
    revision: chatRevision(row),
    description:
      "Only explicitly shared, retained messages are available. At most 1,000 messages are shown.",
    messages: row.messages.map((m) => ({
      id: m.id,
      role: m.role,
      text: decryptAevaText(m.encryptedBody),
    })),
  };
}
export async function mutateSubmission(
  input: z.infer<typeof submissionMutation>,
  actorId: string,
) {
  if ("confirmation" in input && input.confirmation !== input.id)
    throw new SubmissionError(
      "Type the selected record ID to confirm deletion.",
      400,
    );
  if (input.action.startsWith("feedback-")) {
    const operationId = randomUUID();
    await recordAudit({
      actorId,
      action: "UPDATE",
      entityType: "FeedbackChangeRequested",
      entityId: input.id,
      after: { operationId, operation: input.action },
    });
    const action =
      input.action === "feedback-delete"
        ? "admin_feedback_delete"
        : "admin_feedback_update";
    await publishing(action, {
      ...input,
      action: undefined,
      actorId,
      operationId,
    });
    await recordAudit({
      actorId,
      action: input.action === "feedback-delete" ? "DELETE" : "UPDATE",
      entityType: "AevaFeedback",
      entityId: input.id,
      after: { operationId },
    });
    return;
  }
  await runAuditedMutation(
    async (tx) => {
      if (input.action === "chat-delete") {
        const chat = await tx.aevaConversation.findFirst({
          where: { id: input.id, shared: true },
          select: {
            id: true,
            endedAt: true,
            _count: { select: { messages: true } },
          },
        });
        if (!chat || chatRevision(chat) !== input.revision) conflict();
        if (!chat.endedAt)
          throw new SubmissionError(
            "End this shared conversation before deleting it.",
            409,
          );
        await tx.aevaConversation.delete({ where: { id: chat.id } });
        return;
      }
      const current = await tx.contactSubmission.findUnique({
        where: { id: input.id },
        select: { id: true, state: true, updatedAt: true },
      });
      if (!current || current.updatedAt.toISOString() !== input.revision)
        conflict();
      if (input.action === "contact-delete") {
        const removed = await tx.contactSubmission.deleteMany({
          where: { id: input.id, updatedAt: current.updatedAt },
        });
        if (removed.count !== 1) conflict();
      } else if (input.action === "contact-update") {
        const saved = await tx.contactSubmission.updateMany({
          where: { id: input.id, updatedAt: current.updatedAt },
          data: { state: input.state, updatedAt: new Date() },
        });
        if (saved.count !== 1) conflict();
        if (input.note)
          await tx.contactNote.create({
            data: { submissionId: input.id, body: input.note, actorId },
          });
        if (input.state !== current.state)
          await tx.contactStatusEvent.create({
            data: {
              submissionId: input.id,
              fromState: current.state,
              toState: input.state,
              actorId,
            },
          });
      }
    },
    () => ({
      actorId,
      action: input.action.endsWith("delete") ? "DELETE" : "UPDATE",
      entityType:
        input.action === "chat-delete"
          ? "AevaConversation"
          : "ContactSubmission",
      entityId: input.id,
    }),
  );
}
