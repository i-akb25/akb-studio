import "server-only";

import { createHash } from "node:crypto";
import { v2 as cloudinary } from "cloudinary";

// Keep uploads below Vercel's request-body ceiling on the free deployment.
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const MAX_DOCUMENT_BYTES = 4 * 1024 * 1024;
const MAX_VIDEO_BYTES = 4 * 1024 * 1024;
const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);
const DOCUMENT_TYPES = new Set([
  "application/pdf",
  "text/markdown",
  "text/plain",
]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm"]);
const AUDIO_TYPES = new Set([
  "audio/mpeg",
  "audio/ogg",
  "audio/wav",
  "audio/mp4",
]);

function configure() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (!cloudName || !apiKey || !apiSecret)
    throw new Error("Cloudinary is not configured");
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

function hasExpectedSignature(buffer: Buffer, mimeType: string): boolean {
  if (mimeType === "image/jpeg")
    return buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
  if (mimeType === "image/png")
    return buffer
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (mimeType === "image/webp")
    return (
      buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WEBP"
    );
  if (mimeType === "image/avif")
    return (
      buffer.toString("ascii", 4, 8) === "ftyp" &&
      ["avif", "avis"].includes(buffer.toString("ascii", 8, 12))
    );
  if (mimeType === "application/pdf")
    return buffer.toString("ascii", 0, 5) === "%PDF-";
  if (mimeType === "video/mp4")
    return buffer.toString("ascii", 4, 8) === "ftyp";
  if (mimeType === "video/webm")
    return buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
  if (mimeType === "audio/mpeg")
    return (
      buffer.toString("ascii", 0, 3) === "ID3" ||
      (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0)
    );
  if (mimeType === "audio/ogg")
    return buffer.toString("ascii", 0, 4) === "OggS";
  if (mimeType === "audio/wav")
    return (
      buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WAVE"
    );
  if (mimeType === "audio/mp4")
    return buffer.toString("ascii", 4, 8) === "ftyp";
  if (mimeType === "text/markdown" || mimeType === "text/plain")
    return !buffer.includes(0);
  return false;
}

export async function prepareAdminMedia(file: File) {
  const isImage = IMAGE_TYPES.has(file.type);
  const isDocument = DOCUMENT_TYPES.has(file.type);
  const isVideo = VIDEO_TYPES.has(file.type);
  const isAudio = AUDIO_TYPES.has(file.type);
  if (!isImage && !isDocument && !isVideo && !isAudio)
    throw new Error("Unsupported media type");
  const maximum = isImage
    ? MAX_IMAGE_BYTES
    : isVideo || isAudio
      ? MAX_VIDEO_BYTES
      : MAX_DOCUMENT_BYTES;
  if (file.size < 1 || file.size > maximum)
    throw new Error(
      `File must be between 1 byte and ${maximum / 1024 / 1024} MB`,
    );
  const buffer = Buffer.from(await file.arrayBuffer());
  if (!hasExpectedSignature(buffer, file.type))
    throw new Error("File signature does not match its media type");
  return {
    buffer,
    checksum: createHash("sha256").update(buffer).digest("hex"),
    resourceType: isImage
      ? ("image" as const)
      : isVideo || isAudio
        ? ("video" as const)
        : ("raw" as const),
  };
}

export async function uploadAdminMedia(
  file: File,
  folder: string,
  buffer: Buffer,
  resourceType: "image" | "raw" | "video",
) {
  configure();
  const dataUri = `data:${file.type};base64,${buffer.toString("base64")}`;
  return cloudinary.uploader.upload(dataUri, {
    folder: `akb-studio/${folder}`,
    resource_type: resourceType,
    overwrite: false,
    unique_filename: true,
    use_filename: false,
    ...(resourceType === "image"
      ? {
          allowed_formats: ["jpg", "jpeg", "png", "webp", "avif"],
          eager: [{ quality: "auto:good", fetch_format: "auto" }],
        }
      : {}),
  });
}

export async function deleteAdminMedia(
  providerId: string,
  resourceType: string,
): Promise<void> {
  configure();
  const result = await cloudinary.uploader.destroy(providerId, {
    resource_type:
      resourceType === "image"
        ? "image"
        : resourceType === "video"
          ? "video"
          : "raw",
    invalidate: true,
  });
  if (!["ok", "not found"].includes(result.result))
    throw new Error("Cloudinary deletion failed");
}
