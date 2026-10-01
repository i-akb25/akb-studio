import { z } from "zod";
import { hasValidAevaOrigin } from "@/features/aeva/server/aeva-guard";
import { endSharedConversation } from "@/features/aeva/server/persistence";
import { RequestSecurityError, readJsonBody } from "@/server/security/request";

const schema = z
  .object({ conversationId: z.string().uuid().optional() })
  .strict();

export async function POST(request: Request) {
  if (!hasValidAevaOrigin(request))
    return Response.json({ error: "Invalid request" }, { status: 403 });
  try {
    const input = schema.parse(await readJsonBody(request, 1_024));
    if (input.conversationId) await endSharedConversation(input.conversationId);
    return Response.json({
      ok: true,
      message:
        "Thank you for talking with Aeva. Your questions help make this portfolio more useful.",
    });
  } catch (error) {
    return Response.json(
      { error: "Invalid request" },
      { status: error instanceof RequestSecurityError ? error.status : 400 },
    );
  }
}
