import "server-only";

import { recordOperationalHealth } from "@/server/analytics/metrics";
import { publishingConfigurationError } from "./publishing-config";
import { signedPublishingRequest } from "./publishing-signature";

type PublishingAction =
  | "subscribe"
  | "vartalap_submit"
  | "vartalap_public"
  | "publication_event"
  | "notification_status"
  | "admin_notification_state"
  | "admin_set_setting"
  | "admin_send_notifications"
  | "admin_vartalap_list"
  | "admin_vartalap_reply"
  | "feedback_submit"
  | "admin_feedback_list"
  | "admin_feedback_get"
  | "admin_feedback_update"
  | "admin_feedback_delete";

export type ServiceResponse<T> = {
  ok: boolean;
  data?: T;
  error?: string;
};

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing server environment variable: ${name}`);
  }

  return value;
}

export async function callPublishingService<T>(
  action: PublishingAction,
  payload: Record<string, unknown> = {},
): Promise<ServiceResponse<T>> {
  const configError = publishingConfigurationError(process.env);
  if (configError) {
    await recordOperationalHealth({
      key: "publishing_service",
      status: "disabled",
      summary:
        configError === "publishing_service_invalid_url"
          ? "Publishing service URL is invalid"
          : "Publishing service configuration is incomplete",
    });
    return { ok: false, error: configError };
  }
  const url = requireEnv("AKB_PUBLISHING_SERVICE_URL");
  const serviceToken = requireEnv("AKB_PUBLISHING_SERVICE_TOKEN");
  const signingSecret = requireEnv("APPS_SCRIPT_SIGNING_SECRET");
  const timestamp = Date.now();
  const envelope = signedPublishingRequest({
    action,
    payload,
    serviceToken,
    signingSecret,
    timestamp,
  });

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(envelope),
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
  } catch {
    await recordOperationalHealth({
      key: "publishing_service",
      status: "critical",
      summary: "Publishing service request failed",
    });
    return { ok: false, error: "publishing_service_unavailable" };
  }

  if (!response.ok) {
    await recordOperationalHealth({
      key: "publishing_service",
      status: "degraded",
      summary: `Publishing service returned ${response.status}`,
    });
    return {
      ok: false,
      error: "publishing_service_unavailable",
    };
  }

  let result: ServiceResponse<T>;
  try {
    const payload: unknown = await response.json();
    if (
      !payload ||
      typeof payload !== "object" ||
      !("ok" in payload) ||
      typeof payload.ok !== "boolean"
    )
      throw new Error("invalid_service_response");
    result = payload as ServiceResponse<T>;
  } catch {
    await recordOperationalHealth({
      key: "publishing_service",
      status: "degraded",
      summary: "Publishing service returned an invalid response",
    });
    return { ok: false, error: "publishing_service_invalid_response" };
  }

  const allowedErrors = new Set([
    "unauthorized",
    "unsupported_action",
    "invalid_feedback",
    "invalid_identifier",
    "invalid_text",
    "internal_error",
    "required_sheet_missing",
    "sheet_header_mismatch",
    "publishing_service_not_initialized",
    "service_busy",
    "record_not_found",
    "record_changed",
    "invalid_confirmation",
  ]);
  const safeCode =
    typeof result.error === "string" && allowedErrors.has(result.error)
      ? result.error
      : "publishing_service_error";
  await recordOperationalHealth({
    key: "publishing_service",
    status: result.ok ? "healthy" : "degraded",
    summary: result.ok
      ? "Publishing service responded successfully"
      : `Publishing service rejected request: ${safeCode}`,
  });

  return result.ok
    ? result
    : {
        ok: false,
        error: safeCode,
      };
}
