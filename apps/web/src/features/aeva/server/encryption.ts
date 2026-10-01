import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

function key(): Buffer | null {
  const encoded = process.env.AEVA_TRANSCRIPT_ENCRYPTION_KEY?.trim();
  if (!encoded) return null;
  const value = Buffer.from(encoded, "base64");
  return value.length === 32 ? value : null;
}

export function redactAevaText(value: string): string {
  return value
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, "[email]")
    .replace(/(?:\+?\d[\d\s()-]{7,}\d)/g, "[phone]")
    .replace(/https?:\/\/\S+/g, "[link]");
}

export function encryptAevaText(value: string): string | null {
  const encryptionKey = key();
  if (!encryptionKey) return null;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey, iv);
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  return [
    "v1",
    iv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

export function decryptAevaText(value: string): string | null {
  const encryptionKey = key();
  if (!encryptionKey) return null;
  const [version, ivValue, tagValue, encryptedValue] = value.split(".");
  if (version !== "v1" || !ivValue || !tagValue || !encryptedValue) return null;
  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      encryptionKey,
      Buffer.from(ivValue, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(encryptedValue, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return null;
  }
}
