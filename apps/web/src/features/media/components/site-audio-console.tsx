"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

type SiteAudioConsoleProps = {
  assets: Array<{ id: string; originalName: string | null }>;
  initial?: {
    assetId: string;
    title: string;
    artist: string | null;
    enabled: boolean;
  };
};

export function SiteAudioConsole({ initial, assets }: SiteAudioConsoleProps) {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setStatus("Saving…");
    try {
      const response = await fetch("/api/admin/site-audio", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          assetId: String(data.get("assetId") ?? ""),
          title: String(data.get("title") ?? ""),
          artist: String(data.get("artist") ?? "") || undefined,
          enabled: data.get("enabled") === "on",
        }),
      });
      const result = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!response.ok)
        throw new Error(
          result?.error ?? "The music setting could not be saved.",
        );
      setStatus("Portfolio music saved.");
      router.refresh();
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "The music setting could not be saved.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section aria-labelledby="site-audio-heading">
      <h2 id="site-audio-heading">Portfolio music</h2>
      <p>
        Upload an audio file above, then publish its asset ID here. Playback
        always requires a visitor action.
      </p>
      <form className="akb-admin-login" onSubmit={save}>
        <label>
          <span>Audio asset ID</span>
          <select name="assetId" defaultValue={initial?.assetId} required>
            <option value="" disabled>
              Select uploaded audio
            </option>
            {assets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.originalName ?? `Audio ${asset.id.slice(-6)}`}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Track title</span>
          <input
            name="title"
            defaultValue={initial?.title}
            minLength={1}
            maxLength={120}
            required
          />
        </label>
        <label>
          <span>Artist or source (optional)</span>
          <input
            name="artist"
            defaultValue={initial?.artist ?? ""}
            maxLength={120}
          />
        </label>
        <label className="akb-check-row">
          <input
            type="checkbox"
            name="enabled"
            defaultChecked={initial?.enabled}
          />
          <span>Show the music control publicly</span>
        </label>
        <button type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save music setting"}
        </button>
        <output aria-live="polite">{status}</output>
      </form>
      {!assets.length ? (
        <p>Upload an MP3, OGG, WAV or M4A file before publishing music.</p>
      ) : null}
    </section>
  );
}
