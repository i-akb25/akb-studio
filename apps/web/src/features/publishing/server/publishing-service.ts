import "server-only";

import { recordOperationalHealth } from "@/server/analytics/metrics";
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
  | "feedback_submit";

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

  await recordOperationalHealth({
    key: "publishing_service",
    status: result.ok ? "healthy" : "degraded",
    summary: result.ok
      ? "Publishing service responded successfully"
      : "Publishing service reported a controlled error",
  });

  return result.ok
    ? result
    : {
        ok: false,
        error: result.error ?? "publishing_service_error",
      };
}
