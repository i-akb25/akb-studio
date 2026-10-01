import "server-only";

import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL?.trim() || "info",
  base: { service: "akb-studio" },
  redact: {
    paths: [
      "password",
      "token",
      "authorization",
      "cookie",
      "email",
      "name",
      "message",
      "question",
      "prompt",
      "request.headers.authorization",
      "request.headers.cookie",
    ],
    censor: "[redacted]",
  },
});

export function safeErrorFields(error: unknown) {
  if (!(error instanceof Error)) return { errorType: "unknown" };
  return {
    errorType: error.name.slice(0, 80),
    errorCode:
      "code" in error && typeof error.code === "string"
        ? error.code.slice(0, 80)
        : undefined,
  };
}
