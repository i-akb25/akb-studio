import "server-only";

import { createHmac, randomUUID } from "node:crypto";
import type { Prisma } from "@generated/prisma/client";
import { prisma } from "@/server/db/prisma";
import type { AevaCitation, AevaMode } from "../model";
import { encryptAevaText, redactAevaText } from "./encryption";

function retentionDate(): Date {
  const configured = Number(process.env.AEVA_CONVERSATION_RETENTION_DAYS ?? 30);
  const days = Number.isFinite(configured)
    ? Math.max(1, Math.min(30, configured))
    : 30;
  return new Date(Date.now() + days * 86_400_000);
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
    const conversation = input.conversationId
      ? await prisma.aevaConversation.findFirst({
          where: {
            publicId: input.conversationId,
            shared: true,
            retentionUntil: { gt: new Date() },
          },
        })
      : null;
    const active =
      conversation ??
      (await prisma.aevaConversation.create({
        data: {
          publicId: randomUUID(),
          mode: input.mode,
          shared: true,
          consentVersion: input.consentVersion,
          retentionUntil: retentionDate(),
        },
      }));
    await prisma.aevaMessage.createMany({
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
  } catch {
    return undefined;
  }
}

export async function endSharedConversation(publicId: string): Promise<void> {
  if (!process.env.DATABASE_URL) return;
  await prisma.aevaConversation.updateMany({
    where: { publicId, shared: true },
    data: { endedAt: new Date() },
  });
}

export async function recordKnowledgeGap(
  question: string,
  shareSample: boolean,
  consentVersion: string,
) {
  if (!process.env.DATABASE_URL) return;
  const secret = process.env.AEVA_ABUSE_HASH_SECRET?.trim();
  if (!secret) return;
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
