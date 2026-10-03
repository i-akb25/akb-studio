import "server-only";

import { z } from "zod";
import { logger, safeErrorFields } from "@/server/logging/logger";

type ErrorWithCode = Error & { code?: string };

const databaseMessages: Record<string, { message: string; status: number }> = {
  P1001: {
    message: "The database is temporarily unreachable. Try again shortly.",
    status: 503,
  },
  P1017: {
    message: "The database connection closed unexpectedly. Try again.",
    status: 503,
  },
  P2002: {
    message: "A record with the same unique value already exists.",
    status: 409,
  },
  P2003: {
    message: "A referenced record or media asset does not exist.",
    status: 409,
  },
  P2025: {
    message: "The record no longer exists. Refresh the page and try again.",
    status: 404,
  },
};

const safeOperationalMessages = [
  /^Cloudinary is not configured$/,
  /^Unsupported media type$/,
  /^File must be between /,
  /^File signature does not match its media type$/,
  /^Document exceeds /,
  /^Supported editorial files are /,
  /^Invalid publication /,
  /^Invalid discipline$/,
  /^Invalid attachments$/,
  /^GitHub lookup failed: /,
  /^GitHub publish failed: /,
  /^Missing knowledge repository write token$/,
  /^HTTPS URL required$/,
];

function isSafeOperationalMessage(message: string): boolean {
  return safeOperationalMessages.some((pattern) => pattern.test(message));
}

export function adminErrorResponse(
  error: unknown,
  options: {
    event: string;
    fallback: string;
    fallbackStatus?: number;
  },
) {
  logger.error({ event: options.event, ...safeErrorFields(error) });

  if (error instanceof z.ZodError) {
    const issue = error.issues[0];
    const field = issue?.path.length ? `${issue.path.join(".")}: ` : "";
    return Response.json(
      {
        error: `${field}${issue?.message ?? "The submitted fields are invalid."}`,
      },
      { status: 400 },
    );
  }

  const coded = error as ErrorWithCode;
  const databaseMessage = coded.code ? databaseMessages[coded.code] : undefined;
  if (databaseMessage) {
    return Response.json(
      { error: databaseMessage.message },
      { status: databaseMessage.status },
    );
  }

  if (error instanceof Error && isSafeOperationalMessage(error.message)) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json(
    { error: options.fallback },
    { status: options.fallbackStatus ?? 500 },
  );
}
