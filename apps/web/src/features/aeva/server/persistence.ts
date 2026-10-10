import "server-only";

import { createHmac, randomUUID } from "node:crypto";
import type { Prisma } from "@generated/prisma/client";
import {
  boundedRetentionDays,
  retentionDeadline,
} from "@/features/operations/retention-policy";
import { prisma } from "@/server/db/prisma";
import type { AevaCitation, AevaMode } from "../model";
import { encryptAevaText, redactAevaText } from "./encryption";

function retentionDate(): Date {
  const days = boundedRetentionDays(
    process.env.AEVA_CONVERSATION_RETENTION_DAYS,
    30,
    1,
    30,
  );
  return retentionDeadline(new Date(), days);
}

export async function saveSharedExchange(input: {
  conversationId?: string;
  mode: AevaMode;
  question: string;
  answer: string;
  citations: AevaCitation[];
  consentVersion: string;
}): Promise<string | undefined> {
  if (!process.env.DATABASE_URL) return undefined;
  const question = encryptAevaText(redactAevaText(input.question));
  const answer = encryptAevaText(redactAevaText(input.answer));
  if (!question || !answer) return undefined;
  try {
    return await prisma.$transaction(async (tx) => {
      const conversation = input.conversationId
        ? await tx.aevaConversation.findFirst({
            where: {
              publicId: input.conversationId,
              shared: true,
              endedAt: null,
              retentionUntil: { gt: new Date() },
            },
          })
        : null;
      const active =
        conversation ??
        (await tx.aevaConversation.create({
          data: {
            publicId: randomUUID(),
            mode: input.mode,
            shared: true,
            consentVersion: input.consentVersion,
            retentionUntil: retentionDate(),
          },
        }));
      await tx.aevaMessage.createMany({
        data: [
          { conversationId: active.id, role: "USER", encryptedBody: question },
          {
            conversationId: active.id,
            role: "ASSISTANT",
            encryptedBody: answer,
            citations: JSON.parse(
              JSON.stringify(input.citations),
            ) as Prisma.InputJsonValue,
          },
        ],
      });
      return active.publicId;
    });
  } catch {
    return undefined;
  }
}

export async function endSharedConversation(publicId: string): Promise<void> {
  if (!process.env.DATABASE_URL) return;
  await prisma.aevaConversation
    .updateMany({
      where: {
        publicId,
        shared: true,
        endedAt: null,
        retentionUntil: { gt: new Date() },
      },
      data: { endedAt: new Date() },
    })
    .catch(() => undefined);
}

export async function recordKnowledgeGap(
  question: string,
  shareSample: boolean,
  consentVersion: string,
) {
  if (!process.env.DATABASE_URL) return;
  const secret =
    process.env.ABUSE_HASH_SECRET?.trim() ||
    process.env.CONTACT_ABUSE_HASH_SECRET?.trim() ||
    process.env.AEVA_ABUSE_HASH_SECRET?.trim();
  if (!secret || secret.length < 32) return;
  const normalized = redactAevaText(question)
    .toLocaleLowerCase("en-IN")
    .replace(/\s+/g, " ")
    .trim();
  const fingerprint = createHmac("sha256", secret)
    .update(normalized)
    .digest("hex");
  const encryptedQuestion = shareSample ? encryptAevaText(normalized) : null;
  const sampleRetentionUntil = encryptedQuestion ? retentionDate() : null;
  try {
    await prisma.aevaKnowledgeGap.upsert({
      where: { fingerprint },
      create: {
        fingerprint,
        encryptedQuestion,
        sampleConsented: Boolean(encryptedQuestion),
        consentVersion: encryptedQuestion ? consentVersion : null,
        sampleRetentionUntil,
      },
      update: {
        occurrences: { increment: 1 },
        lastSeenAt: new Date(),
        ...(encryptedQuestion
          ? {
              encryptedQuestion,
              sampleConsented: true,
              consentVersion,
              sampleRetentionUntil,
            }
          : {}),
      },
    });
  } catch {}
}
