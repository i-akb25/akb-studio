import { z } from "zod";
import {
  acceptAevaEndRequest,
  hasValidAevaOrigin,
} from "@/features/aeva/server/aeva-guard";
import { endSharedConversation } from "@/features/aeva/server/persistence";
import { RequestSecurityError, readJsonBody } from "@/server/security/request";

const schema = z
  .object({ conversationId: z.string().uuid().optional() })
  .strict();

export async function POST(request: Request) {
  if (!hasValidAevaOrigin(request))
    return Response.json({ error: "Invalid request" }, { status: 403 });
  if (!(await acceptAevaEndRequest(request)))
    return Response.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": "900" } },
    );
  try {
    const input = schema.parse(await readJsonBody(request, 1_024));
    if (input.conversationId) await endSharedConversation(input.conversationId);
    return Response.json({
      ok: true,
      message: "This conversation has ended.",
    });
  } catch (error) {
    return Response.json(
      { error: "Invalid request" },
      { status: error instanceof RequestSecurityError ? error.status : 400 },
    );
  }
}
