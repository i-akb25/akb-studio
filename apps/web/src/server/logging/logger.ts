import "server-only";

import pino from "pino";

export { safeErrorFields } from "./error-fields";

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
