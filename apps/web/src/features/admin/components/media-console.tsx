"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

export function MediaConsole() {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setBusy(true);
    setStatus("Uploading…");
    try {
      const response = await fetch("/api/admin/media", {
        method: "POST",
        body: formData,
      });
      const result = (await response.json().catch(() => null)) as {
        error?: string;
        asset?: { id: string };
      } | null;
      if (!response.ok)
        throw new Error(result?.error ?? "The media upload failed.");
      setStatus(`Uploaded. Asset ID: ${result?.asset?.id ?? "available"}`);
      form.reset();
      router.refresh();
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "The media upload failed.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="akb-admin-login" onSubmit={upload}>
      <label>
        <span>Image, audio, video or document</span>
        <input
          type="file"
          name="file"
          accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm,audio/mpeg,audio/ogg,audio/wav,audio/mp4,application/pdf,text/markdown,text/plain"
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
        <span>Replace existing asset ID (optional)</span>
        <input name="replaceId" />
      </label>
      <button type="submit" disabled={busy}>
        {busy ? "Uploading…" : "Upload media"}
      </button>
      <output aria-live="polite">{status}</output>
    </form>
  );
}
