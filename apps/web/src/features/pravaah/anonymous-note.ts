export const DEFAULT_ANONYMOUS_NOTE_URL = "https://forms.gle/KJAQD8y1fRZz77xQ9";

// An explicitly empty value disables the link. Invalid overrides fail closed.
export function resolveAnonymousNoteUrl(value: string | undefined) {
  const candidate = (value ?? DEFAULT_ANONYMOUS_NOTE_URL).trim();
  if (!candidate) return undefined;
  try {
    const url = new URL(candidate);
    if (url.protocol !== "https:" || url.username || url.password)
      return undefined;
    return url.href;
  } catch {
    return undefined;
  }
}
