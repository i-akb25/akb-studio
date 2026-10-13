type RepositoryFile = { path: string; content: string };

function sha(value: unknown): string {
  if (typeof value !== "string" || !/^[a-f0-9]{40}$/i.test(value))
    throw new Error("Knowledge repository returned an invalid commit or tree.");
  return value;
}

// The branch moves once, after both files are in the same commit. A concurrent
// branch change is rejected without force, preserving the other writer's data.
export async function publishGitHubFiles(input: {
  repositoryUrl: string;
  ref: string;
  headers: HeadersInit;
  manifestPath: string;
  message: string;
  buildFiles: (manifest: string | null) => RepositoryFile[];
}) {
  const origin = new URL(input.repositoryUrl);
  if (
    origin.origin !== "https://api.github.com" ||
    !/^\/repos\/[^/]+\/[^/]+$/.test(origin.pathname) ||
    origin.search ||
    origin.hash ||
    origin.username ||
    origin.password
  )
    throw new Error("Knowledge repository URL is invalid.");
  const refPath = input.ref.split("/").map(encodeURIComponent).join("/");
  async function request(path: string, init?: RequestInit) {
    let response: Response;
    try {
      response = await fetch(`${input.repositoryUrl}${path}`, {
        ...init,
        headers: input.headers,
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      });
    } catch {
      throw new Error(
        "Knowledge repository request did not complete. Check the publication state before retrying.",
      );
    }
    return response;
  }
  async function json(path: string, init?: RequestInit) {
    const response = await request(path, init);
    if (!response.ok) {
      if (response.status === 409 || response.status === 422)
        throw new Error(
          "Publication conflict: the repository changed or rejected this update. Refresh before retrying.",
        );
      throw new Error(`GitHub publish failed: ${response.status}`);
    }
    return response.json();
  }
  const reference = await json(`/git/ref/heads/${refPath}`);
  const parent = sha(reference.object?.sha);
  const commit = await json(`/git/commits/${parent}`);
  const baseTree = sha(commit.tree?.sha);
  const manifestPath = input.manifestPath
    .split("/")
    .map(encodeURIComponent)
    .join("/");
  const response = await request(`/contents/${manifestPath}?ref=${parent}`);
  let manifest: string | null = null;
  if (response.status !== 404) {
    if (!response.ok)
      throw new Error(`GitHub lookup failed: ${response.status}`);
    const payload = await response.json();
    if (
      payload.type !== "file" ||
      payload.encoding !== "base64" ||
      typeof payload.content !== "string"
    )
      throw new Error("Knowledge repository manifest response is invalid.");
    manifest = Buffer.from(payload.content, "base64").toString("utf8");
  }
  const files = input.buildFiles(manifest);
  if (
    !files.length ||
    new Set(files.map((file) => file.path)).size !== files.length ||
    files.some(
      (file) =>
        !/^[a-zA-Z0-9._/-]+$/.test(file.path) ||
        file.path.startsWith("/") ||
        file.path
          .split("/")
          .some((part) => !part || part === "." || part === ".."),
    )
  )
    throw new Error("Knowledge repository file paths are invalid.");
  const tree = await json("/git/trees", {
    method: "POST",
    body: JSON.stringify({
      base_tree: baseTree,
      tree: files.map((file) => ({ ...file, mode: "100644", type: "blob" })),
    }),
  });
  const nextCommit = await json("/git/commits", {
    method: "POST",
    body: JSON.stringify({
      message: input.message,
      tree: sha(tree.sha),
      parents: [parent],
    }),
  });
  await json(`/git/refs/heads/${refPath}`, {
    method: "PATCH",
    body: JSON.stringify({ sha: sha(nextCommit.sha), force: false }),
  });
}
