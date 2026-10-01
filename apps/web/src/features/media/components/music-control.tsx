"use client";

import { AudioLines, Pause } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type PublishedAudio = {
  title: string;
  artist: string | null;
  url: string;
  mimeType: string;
};

const VOLUME_KEY = "akb-portfolio-audio-volume";

export function MusicControl() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [track, setTrack] = useState<PublishedAudio | null>();
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/site-audio", { signal: controller.signal })
      .then(async (response) =>
        response.ok && response.status !== 204
          ? ((await response.json()) as PublishedAudio)
          : null,
      )
      .then(setTrack)
      .catch(() => setTrack(null));
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!track) return;
    const audio = audioRef.current;
    if (!audio) return;
    const stored = Number(window.localStorage.getItem(VOLUME_KEY));
    audio.volume =
      Number.isFinite(stored) && stored >= 0 && stored <= 1 ? stored : 0.55;
  }, [track]);

  async function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      try {
        await audio.play();
        setPlaying(true);
      } catch {
        setPlaying(false);
      }
    } else {
      audio.pause();
      setPlaying(false);
    }
  }

  const detail = track
    ? track.artist
      ? `${track.title} by ${track.artist}`
      : track.title
    : null;
  const label =
    track === undefined
      ? "Loading portfolio music"
      : track === null
        ? "No portfolio music is published"
        : playing
          ? `Pause ${detail}`
          : `Play ${detail}`;

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        disabled={!track}
        aria-pressed={playing}
        aria-label={label}
        title={label}
        className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-foreground transition-[border-color,background-color,color,transform] duration-200 hover:-translate-y-0.5 hover:border-accent-warm hover:bg-surface-subtle disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 disabled:hover:border-border disabled:hover:bg-surface motion-reduce:transform-none motion-reduce:transition-none"
      >
        {playing ? (
          <Pause aria-hidden="true" className="size-[18px]" strokeWidth={1.8} />
        ) : (
          <AudioLines
            aria-hidden="true"
            className="size-[18px]"
            strokeWidth={1.8}
          />
        )}
      </button>
      {track ? (
        // biome-ignore lint/a11y/useMediaCaption: this control plays dashboard-supplied music with no spoken content.
        <audio ref={audioRef} preload="none" onEnded={() => setPlaying(false)}>
          <source src={track.url} type={track.mimeType} />
        </audio>
      ) : null}
    </>
  );
}
