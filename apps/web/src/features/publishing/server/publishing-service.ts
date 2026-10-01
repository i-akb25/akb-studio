import "server-only";

import { createHmac } from "node:crypto";
import { recordOperationalHealth } from "@/server/analytics/metrics";

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

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(value);
}

export async function callPublishingService<T>(
  action: PublishingAction,
  payload: Record<string, unknown> = {},
): Promise<ServiceResponse<T>> {
  const url = requireEnv("AKB_PUBLISHING_SERVICE_URL");
  const serviceToken = requireEnv("AKB_PUBLISHING_SERVICE_TOKEN");
  const signingSecret = requireEnv("APPS_SCRIPT_SIGNING_SECRET");
  const timestamp = Date.now();
  const unsigned = { action, ...payload };
  const signature = createHmac("sha256", signingSecret)
    .update(`${timestamp}.${stableJson(unsigned)}`)
    .digest("hex");

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...unsigned, serviceToken, timestamp, signature }),
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

  const result = (await response.json()) as ServiceResponse<T>;

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
