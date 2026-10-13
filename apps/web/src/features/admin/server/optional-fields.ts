export function nullableOptionalText(
  value: string | undefined,
): string | null | undefined {
  return value === undefined ? undefined : value.trim() || null;
}
