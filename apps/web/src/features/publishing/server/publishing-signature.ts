import { createHmac } from "node:crypto";

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

export function signedPublishingRequest(input: {
  action: string;
  payload: Record<string, unknown>;
  serviceToken: string;
  signingSecret: string;
  timestamp: number;
}) {
  const {
    serviceToken: _token,
    timestamp: _timestamp,
    signature: _signature,
    ...payload
  } = input.payload;
  // Sign the actual wire representation: undefined fields disappear, dates
  // serialize and undefined array entries become null, exactly as in Code.gs.
  const unsigned = JSON.parse(
    JSON.stringify({ ...payload, action: input.action }),
  ) as Record<string, unknown>;
  const signature = createHmac("sha256", input.signingSecret)
    .update(`${input.timestamp}.${stableJson(unsigned)}`)
    .digest("hex");
  return {
    ...unsigned,
    action: input.action,
    serviceToken: input.serviceToken,
    timestamp: input.timestamp,
    signature,
  };
}
