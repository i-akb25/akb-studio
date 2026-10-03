import { z } from "zod";
import { adminErrorResponse } from "@/features/admin/server/admin-api-response";
import {
  assertSameOrigin,
  getAdminSession,
} from "@/features/admin/server/admin-auth";
import { runAuditedMutation } from "@/features/admin/server/audit";
import { readJsonBody } from "@/server/security/request";

const memory = z.object({
  resource: z.literal("memory"),
  id: z.string().cuid().optional(),
  title: z.string().trim().min(2).max(140),
  content: z.string().trim().min(3).max(8_000),
  visibility: z.enum([
    "PUBLIC_AEVA",
    "RESPONSE_POLICY",
    "OWNER_ONLY",
    "ARCHIVED",
  ]),
  state: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  sourceLabel: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((value) => value || undefined),
  sourceUrl: z
    .string()
    .trim()
    .max(2_048)
    .optional()
    .transform((value) => value || undefined)
    .refine((value) => !value || URL.canParse(value), "Invalid source URL"),
});
const source = z.object({
  resource: z.literal("source"),
  id: z.string().cuid().optional(),
  title: z.string().trim().min(2).max(140),
  url: z
    .string()
    .url()
    .max(2_048)
    .refine((value) => value.startsWith("https://")),
  notes: z
    .string()
    .trim()
    .max(5_000)
    .optional()
    .transform((value) => value || undefined),
});
const inputSchema = z.discriminatedUnion("resource", [memory, source]);

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (
    !session?.user.twoFactorEnabled ||
    !["owner", "editor"].includes(session.role)
  )
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    assertSameOrigin(request);
    const input = inputSchema.parse(await readJsonBody(request, 16_384));
    if (input.resource === "memory") {
      const item = await runAuditedMutation(
        (tx) =>
          input.id
            ? tx.aevaMemory.update({
                where: { id: input.id },
                data: {
                  title: input.title,
                  content: input.content,
                  visibility: input.visibility,
                  state: input.state,
                  sourceLabel: input.sourceLabel,
                  sourceUrl: input.sourceUrl,
                  publishedAt: input.state === "PUBLISHED" ? new Date() : null,
                },
              })
            : tx.aevaMemory.create({
                data: {
                  title: input.title,
                  content: input.content,
                  visibility: input.visibility,
                  state: input.state,
                  sourceLabel: input.sourceLabel,
                  sourceUrl: input.sourceUrl,
                  publishedAt: input.state === "PUBLISHED" ? new Date() : null,
                },
              }),
        (saved) => ({
          actorId: session.user.id,
          action: input.id ? "UPDATE" : "CREATE",
          entityType: "AevaMemory",
          entityId: saved.id,
        }),
      );
      return Response.json({ ok: true, item });
    }
    const item = await runAuditedMutation(
      (tx) =>
        input.id
          ? tx.aevaSource.update({
              where: { id: input.id },
              data: {
                title: input.title,
                url: input.url,
                notes: input.notes,
                enabled: true,
                publicAllowed: true,
              },
            })
          : tx.aevaSource.upsert({
              where: { url: input.url },
              create: {
                title: input.title,
                url: input.url,
                notes: input.notes,
              },
              update: {
                title: input.title,
                notes: input.notes,
                enabled: true,
                publicAllowed: true,
              },
            }),
      (saved) => ({
        actorId: session.user.id,
        action: input.id ? "UPDATE" : "CREATE",
        entityType: "AevaSource",
        entityId: saved.id,
      }),
    );
    return Response.json({ ok: true, item });
  } catch (error) {
    return adminErrorResponse(error, {
      event: "admin_aeva_save_failed",
      fallback: "The Aeva entry could not be saved. Refresh and try again.",
    });
  }
}
