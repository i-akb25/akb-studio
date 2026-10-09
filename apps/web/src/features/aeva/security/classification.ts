import type { AevaConsumer } from "../capabilities/registry";

export const AEVA_CLASSIFICATIONS = [
  "public",
  "owner_private",
  "restricted",
  "secret",
] as const;

export type AevaClassification = (typeof AEVA_CLASSIFICATIONS)[number];
export type AevaSourceType =
  | "portfolio"
  | "managed_memory"
  | "owner_url"
  | "owner_document"
  | "web";

export type AevaProvenance = {
  sourceId: string;
  route: string;
  sourceType: AevaSourceType;
  classification: AevaClassification;
  allowedConsumers: readonly AevaConsumer[];
  authority: "canonical" | "supporting" | "contextual";
  published: boolean;
  allowAeva: boolean;
  sensitivity: "public" | "private" | "restricted" | "secret";
  updatedAt?: string;
  contentHash: string;
};

export function canConsumerRetrieve(
  provenance: AevaProvenance,
  consumer: AevaConsumer,
): boolean {
  if (!provenance.published || !provenance.allowAeva) return false;
  if (provenance.classification !== "public") return false;
  if (provenance.sensitivity !== "public") return false;
  return provenance.allowedConsumers.includes(consumer);
}

export function containsEmbeddedInstruction(value: string): boolean {
  return /(?:ignore|override|bypass|disregard).{0,50}(?:previous|system|developer|instruction|policy)|(?:reveal|print|expose).{0,40}(?:secret|credential|system prompt|private data)|\bBEGIN (?:SYSTEM|DEVELOPER) INSTRUCTION\b/i.test(
    value,
  );
}
