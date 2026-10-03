import { NextResponse } from "next/server";
import { z } from "zod";
import { adminErrorResponse } from "@/features/admin/server/admin-api-response";
import {
  assertSameOrigin,
  getAdminSession,
} from "@/features/admin/server/admin-auth";
import { runAuditedMutation } from "@/features/admin/server/audit";
import { getStudioHealthFindings } from "@/features/admin/server/studio-health";
import { prisma } from "@/server/db/prisma";
import { readJsonBody } from "@/server/security/request";

const inputSchema = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("add-note"),
      submissionId: z.string().cuid(),
      body: z.string().trim().min(2).max(2_000),
    })
    .strict(),
  z
    .object({
      action: z.literal("add-meeting"),
      submissionId: z.string().cuid(),
      occurredAt: z.string().datetime(),
      summary: z.string().trim().min(2).max(2_000),
      nextStep: z.string().trim().max(1_000).optional(),
    })
    .strict(),
  z
    .object({
      action: z.literal("add-reminder"),
      submissionId: z.string().cuid(),
      dueAt: z.string().datetime(),
      note: z.string().trim().min(2).max(1_000),
    })
    .strict(),
  z
    .object({
      action: z.literal("set-reminder-state"),
      id: z.string().cuid(),
      state: z.enum(["COMPLETED", "CANCELLED"]),
    })
    .strict(),
  z
    .object({
      action: z.literal("queue-suggestion"),
      findingId: z.string().regex(/^[a-z0-9-]+$/),
    })
    .strict(),
  z
    .object({
      action: z.literal("review-suggestion"),
      id: z.string().cuid(),
      state: z.enum(["APPROVED", "REJECTED"]),
    })
    .strict(),
  z
    .object({
      action: z.literal("record-recovery"),
      backupLabel: z.string().trim().min(2).max(160),
      backupCreatedAt: z.string().datetime(),
      restoreTestedAt: z.string().datetime(),
      outcome: z.enum(["PASS", "FAIL"]),
      notes: z.string().trim().max(2_000).optional(),
    })
    .strict(),
]);

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session?.user.twoFactorEnabled)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    assertSameOrigin(request);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 403 });
  }

  try {
    const input = inputSchema.parse(await readJsonBody(request, 8_192));
    if (
      [
        "add-note",
        "add-meeting",
        "add-reminder",
        "set-reminder-state",
      ].includes(input.action) &&
      !["owner", "moderator"].includes(session.role)
    )
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (
      ["queue-suggestion", "review-suggestion", "record-recovery"].includes(
        input.action,
      ) &&
      session.role !== "owner"
    )
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    let result: { id: string };
    let entityType: string;
    if (input.action === "add-note") {
      entityType = "ContactNote";
      result = await runAuditedMutation(
        (tx) =>
          tx.contactNote.create({
            data: {
              submissionId: input.submissionId,
              body: input.body,
              actorId: session.user.id,
            },
          }),
        (saved) => ({
          actorId: session.user.id,
          action: "CREATE",
          entityType,
          entityId: saved.id,
        }),
      );
    } else if (input.action === "add-meeting") {
      entityType = "ContactMeeting";
      result = await runAuditedMutation(
        (tx) =>
          tx.contactMeeting.create({
            data: {
              submissionId: input.submissionId,
              occurredAt: new Date(input.occurredAt),
              summary: input.summary,
              nextStep: input.nextStep,
              actorId: session.user.id,
            },
          }),
        (saved) => ({
          actorId: session.user.id,
          action: "CREATE",
          entityType,
          entityId: saved.id,
        }),
      );
    } else if (input.action === "add-reminder") {
      const consent = await prisma.consentRecord.findFirst({
        where: {
          submissionId: input.submissionId,
          consentType: "follow_up_reminder",
          granted: true,
          withdrawnAt: null,
        },
        select: { id: true },
      });
      if (!consent)
        return NextResponse.json(
          { error: "This contact did not grant follow-up consent" },
          { status: 409 },
        );
      entityType = "FollowUpReminder";
      result = await runAuditedMutation(
        (tx) =>
          tx.followUpReminder.create({
            data: {
              submissionId: input.submissionId,
              dueAt: new Date(input.dueAt),
              note: input.note,
              actorId: session.user.id,
            },
          }),
        (saved) => ({
          actorId: session.user.id,
          action: "CREATE",
          entityType,
          entityId: saved.id,
        }),
      );
    } else if (input.action === "set-reminder-state") {
      entityType = "FollowUpReminder";
      result = await runAuditedMutation(
        (tx) =>
          tx.followUpReminder.update({
            where: { id: input.id },
            data: {
              state: input.state,
              completedAt: input.state === "COMPLETED" ? new Date() : null,
            },
          }),
        (saved) => ({
          actorId: session.user.id,
          action: "UPDATE",
          entityType,
          entityId: saved.id,
        }),
      );
    } else if (input.action === "queue-suggestion") {
      const finding = (await getStudioHealthFindings()).find(
        (item) => item.id === input.findingId,
      );
      if (!finding)
        return NextResponse.json(
          { error: "Finding is no longer active" },
          { status: 409 },
        );
      const existing = await prisma.studioSuggestion.findFirst({
        where: { findingId: finding.id, state: "PENDING" },
        select: { id: true },
      });
      if (existing)
        return NextResponse.json(
          { error: "This finding already awaits review" },
          { status: 409 },
        );
      entityType = "StudioSuggestion";
      result = await runAuditedMutation(
        (tx) =>
          tx.studioSuggestion.create({
            data: {
              findingId: finding.id,
              title: finding.title,
              rationale: finding.detail,
              proposedAction: finding.proposedAction,
              evidence: finding.evidence,
            },
          }),
        (saved) => ({
          actorId: session.user.id,
          action: "CREATE",
          entityType,
          entityId: saved.id,
        }),
      );
    } else if (input.action === "review-suggestion") {
      entityType = "StudioSuggestion";
      result = await runAuditedMutation(
        (tx) =>
          tx.studioSuggestion.update({
            where: { id: input.id },
            data: {
              state: input.state,
              reviewedBy: session.user.id,
              reviewedAt: new Date(),
            },
          }),
        (saved) => ({
          actorId: session.user.id,
          action: "UPDATE",
          entityType,
          entityId: saved.id,
        }),
      );
    } else {
      if (new Date(input.restoreTestedAt) < new Date(input.backupCreatedAt))
        return NextResponse.json(
          { error: "Restore test cannot predate the backup" },
          { status: 400 },
        );
      entityType = "RecoveryVerification";
      result = await runAuditedMutation(
        (tx) =>
          tx.recoveryVerification.create({
            data: {
              backupLabel: input.backupLabel,
              backupCreatedAt: new Date(input.backupCreatedAt),
              restoreTestedAt: new Date(input.restoreTestedAt),
              outcome: input.outcome,
              notes: input.notes,
              actorId: session.user.id,
            },
          }),
        (saved) => ({
          actorId: session.user.id,
          action: "CREATE",
          entityType,
          entityId: saved.id,
        }),
      );
    }
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return adminErrorResponse(error, {
      event: "admin_studio_operation_failed",
      fallback: "The Studio change could not be saved. Refresh and try again.",
    });
  }
}
