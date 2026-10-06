import "server-only";

import { randomUUID } from "node:crypto";
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
  P2021: {
    message:
      "The required database table is not available yet. Apply the approved production migration and try again.",
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
  /^Pravaah repository /,
  /^Choose a ready image from the media library\.$/,
  /^Choose an image before saving\.$/,
  /^The selected image needs useful alternative text\.$/,
  /^The Pravaah item is no longer present in the publishing repository\./,
  /^Feature registry (?:response )?is invalid$/,
  /^Invalid feature item$/,
  /^GitHub discovery is unavailable$/,
  /^No Pravaah action was submitted\.$/,
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
  const reference = randomUUID().slice(0, 8);
  logger.error({ event: options.event, reference, ...safeErrorFields(error) });

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

  if (error instanceof Error) {
    const normalized = error.message.toLowerCase();
    if (normalized.includes("cloudinary"))
      return Response.json(
        {
          error: `Cloudinary rejected the request. Check the asset format and provider dashboard. Reference ${reference}.`,
        },
        { status: 502 },
      );
    if (normalized.includes("timeout") || normalized.includes("timed out"))
      return Response.json(
        {
          error: `The provider did not respond in time. Nothing was published. Reference ${reference}.`,
        },
        { status: 504 },
      );
  }

  return Response.json(
    { error: `${options.fallback} Reference ${reference}.` },
    { status: options.fallbackStatus ?? 500 },
  );
}
