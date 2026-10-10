export class RequestSecurityError extends Error {
  constructor(
    readonly status: 400 | 413 | 415,
    message: string,
  ) {
    super(message);
  }
}

// Count bytes while reading, including chunked requests without Content-Length.
export async function readLimitedBody(
  request: Request,
  maximumBytes: number,
): Promise<Uint8Array> {
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declared) && declared > maximumBytes)
    throw new RequestSecurityError(413, "Request is too large.");
  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > maximumBytes) {
        await reader.cancel().catch(() => {});
        throw new RequestSecurityError(413, "Request is too large.");
      }
      chunks.push(chunk.value);
    }
  } finally {
    reader.releaseLock();
  }
  const result = new Uint8Array(bytes);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
}

export async function readJsonBody(
  request: Request,
  maximumBytes: number,
): Promise<unknown> {
  const contentType = request.headers
    .get("content-type")
    ?.split(";", 1)[0]
    ?.trim()
    .toLowerCase();
  if (contentType !== "application/json")
    throw new RequestSecurityError(415, "Unsupported request format.");
  const raw = new TextDecoder().decode(
    await readLimitedBody(request, maximumBytes),
  );
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new RequestSecurityError(400, "Invalid request.");
  }
}
