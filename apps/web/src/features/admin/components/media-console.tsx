"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";

type MediaAsset = {
  id: string;
  originalName: string | null;
  mimeType: string;
  bytes: number;
  secureUrl: string;
  altText: string;
};

export function MediaConsole({ assets }: { assets: MediaAsset[] }) {
  const router = useRouter();
  const [visibleAssets, setVisibleAssets] = useState(assets);
  const [status, setStatus] = useState("");
  const [tone, setTone] = useState<"neutral" | "success" | "error">("neutral");
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  useEffect(() => setVisibleAssets(assets), [assets]);
  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setBusy(true);
    setTone("neutral");
    setStatus("Uploading…");
    try {
      const response = await fetch("/api/admin/media", {
        method: "POST",
        body: formData,
      });
      const result = (await response.json().catch(() => null)) as {
        error?: string;
        asset?: MediaAsset;
      } | null;
      if (!response.ok)
        throw new Error(result?.error ?? "The media upload failed.");
      setStatus(`Uploaded. Asset ID: ${result?.asset?.id ?? "available"}`);
      setTone("success");
      if (result?.asset) {
        const uploadedAsset = result.asset;
        setVisibleAssets((current) => [
          uploadedAsset,
          ...current.filter((asset) => asset.id !== uploadedAsset.id),
        ]);
      }
      window.dispatchEvent(new CustomEvent("akb:media-updated"));
      form.reset();
      router.refresh();
    } catch (error) {
      setTone("error");
      setStatus(
        error instanceof Error ? error.message : "The media upload failed.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function remove(id: string) {
    if (!window.confirm("Remove this unused asset from the media library?"))
      return;
    setDeletingId(id);
    setTone("neutral");
    setStatus("Removing asset…");
    try {
      const response = await fetch(
        `/api/admin/media?id=${encodeURIComponent(id)}`,
        { method: "DELETE" },
      );
      const result = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!response.ok)
        throw new Error(result?.error ?? "The asset could not be removed.");
      setStatus("Asset removed.");
      setTone("success");
      setVisibleAssets((current) => current.filter((asset) => asset.id !== id));
      window.dispatchEvent(new CustomEvent("akb:media-updated"));
      router.refresh();
    } catch (error) {
      setTone("error");
      setStatus(
        error instanceof Error
          ? error.message
          : "The asset could not be removed.",
      );
    } finally {
      setDeletingId(null);
    }
  }
  return (
    <section aria-labelledby="upload-media-heading">
      <h2 id="upload-media-heading">Upload a new asset</h2>
      <p>
        Maximum 4 MB. Accepted: JPG, PNG, WebP, AVIF, MP3, OGG, WAV, M4A, MP4,
        WebM, PDF, DOCX, Markdown and text.
      </p>
      <form className="akb-admin-form" onSubmit={upload}>
        <label>
          <span>Image, audio, video or document</span>
          <input
            type="file"
            name="file"
            accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm,audio/mpeg,audio/ogg,audio/wav,audio/mp4,application/pdf,.docx,text/markdown,text/plain"
            required
          />
        </label>
        <label>
          <span>Accessible description</span>
          <input name="altText" minLength={3} maxLength={240} required />
        </label>
        <label>
          <span>Collection</span>
          <select name="folder">
            <option value="profile">Profile</option>
            <option value="travel">Travel</option>
            <option value="painting">Painting</option>
            <option value="photography">Photography</option>
            <option value="design">Design</option>
            <option value="projects">Projects</option>
            <option value="reflections">Reflections</option>
            <option value="documents">Documents</option>
            <option value="music">Portfolio music</option>
          </select>
        </label>
        <label>
          <span>Replace an existing asset (optional)</span>
          <select name="replaceId" defaultValue="">
            <option value="">Create a new asset</option>
            {visibleAssets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.originalName ?? asset.id} · {asset.mimeType}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={busy}>
          {busy ? "Uploading…" : "Upload media"}
        </button>
        <output
          className="akb-admin-status"
          data-tone={tone}
          aria-live="polite"
        >
          {status}
        </output>
      </form>

      <div className="akb-admin-list">
        <h2>Current media assets</h2>
        {visibleAssets.length ? (
          visibleAssets.map((asset) => (
            <article key={asset.id}>
              <div>
                {asset.mimeType.startsWith("image/") ? (
                  <a
                    href={asset.secureUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open ${asset.originalName ?? "uploaded image"}`}
                  >
                    <Image
                      src={asset.secureUrl}
                      alt={asset.altText}
                      width={320}
                      height={240}
                      sizes="(max-width: 760px) 100vw, 320px"
                      className="akb-admin-media-thumbnail"
                    />
                  </a>
                ) : null}
                <h3>{asset.originalName ?? "Unnamed asset"}</h3>
                <p>
                  {asset.mimeType} · {(asset.bytes / 1024).toFixed(1)} KB
                </p>
                <p>{asset.altText}</p>
                <p>
                  Asset ID: <code>{asset.id}</code>
                </p>
              </div>
              <div>
                <a
                  href={asset.secureUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open asset
                </a>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(asset.id)}
                >
                  Copy asset ID
                </button>
                <button
                  type="button"
                  disabled={deletingId === asset.id}
                  onClick={() => remove(asset.id)}
                >
                  {deletingId === asset.id ? "Removing…" : "Remove"}
                </button>
              </div>
            </article>
          ))
        ) : (
          <p>No media assets have been uploaded.</p>
        )}
      </div>
    </section>
  );
}
