import "server-only";

export async function extractDocumentText(file: File): Promise<string> {
  if (file.size > 5 * 1024 * 1024)
    throw new Error("Document exceeds the 5 MB editorial upload limit.");
  const name = file.name.toLowerCase();
  if (name.endsWith(".md") || name.endsWith(".txt"))
    return (await file.text()).trim();
  throw new Error("Supported editorial files are .md and .txt.");
}
