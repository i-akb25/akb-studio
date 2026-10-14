import { z } from "zod";
import {
  isSubmissionOwner,
  privateResponseHeaders,
  resourceSchema,
  submissionMutation,
} from "@/features/admin/core/submissions-contract";
import { adminErrorResponse } from "@/features/admin/server/admin-api-response";
import {
  assertSameOrigin,
  getAdminSession,
} from "@/features/admin/server/admin-auth";
import {
  getSubmission,
  listSubmissions,
  mutateSubmission,
  SubmissionError,
} from "@/features/admin/server/submissions";
import { readJsonBody } from "@/server/security/request";

export const dynamic = "force-dynamic";
function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: privateResponseHeaders });
}
function failure(error: unknown) {
  if (error instanceof SubmissionError)
    return json({ error: error.message }, error.status);
  const response = adminErrorResponse(error, {
    event: "admin_submissions_failed",
    fallback:
      "The request could not be confirmed. Refresh the record before retrying.",
  });
  for (const [key, value] of Object.entries(privateResponseHeaders))
    response.headers.set(key, value);
  return response;
}
export async function GET(request: Request) {
  try {
    if (!isSubmissionOwner(await getAdminSession()))
      return json(
        { error: "Owner access and two-factor authentication required." },
        403,
      );
    const query = z
      .object({
        resource: resourceSchema,
        id: z
          .string()
          .regex(/^[a-zA-Z0-9_-]{1,100}$/)
          .optional(),
        cursor: z
          .string()
          .regex(/^[a-zA-Z0-9_-]{1,100}$/)
          .optional(),
      })
      .strict()
      .parse(Object.fromEntries(new URL(request.url).searchParams));
    const data = query.id
      ? await getSubmission(query.resource, query.id)
      : await listSubmissions(query.resource, query.cursor);
    return json({ ok: true, data });
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session || !isSubmissionOwner(session))
      return json(
        { error: "Owner access and two-factor authentication required." },
        403,
      );
    try {
      assertSameOrigin(request);
    } catch {
      return json({ error: "Invalid request origin." }, 403);
    }
    const input = submissionMutation.parse(await readJsonBody(request, 16_384));
    await mutateSubmission(input, session.user.id);
    return json({ ok: true });
  } catch (error) {
    return failure(error);
  }
}
