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
const DEFAULT_VOLUME = 0.55;

export function MusicControl() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [track, setTrack] = useState<PublishedAudio | null>();
  const [playing, setPlaying] = useState(false);
  const [playbackError, setPlaybackError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/site-audio", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok || response.status === 204) {
          return null;
        }

        const published = (await response.json()) as PublishedAudio;

        if (
          !published.url ||
          !published.title ||
          !published.mimeType.startsWith("audio/")
        ) {
          return null;
        }

        return published;
      })
      .then(setTrack)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setTrack(null);
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!track) {
      return;
    }

    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    const storedVolume = Number(window.localStorage.getItem(VOLUME_KEY));

    audio.volume =
      Number.isFinite(storedVolume) && storedVolume > 0 && storedVolume <= 1
        ? storedVolume
        : DEFAULT_VOLUME;

    setPlaying(false);
    setPlaybackError(false);

    audio.load();

    return () => {
      audio.pause();
    };
  }, [track]);

  async function toggle() {
    const audio = audioRef.current;

    if (!audio || !track) {
      return;
    }

    setPlaybackError(false);

    if (!audio.currentSrc) {
      audio.src = track.url;
      audio.load();
    }

    if (!audio.paused) {
      audio.pause();
      return;
    }

    try {
      await audio.play();
    } catch {
      setPlaying(false);
      setPlaybackError(true);
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
        : playbackError
          ? `Retry ${detail}`
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
        // biome-ignore lint/a11y/useMediaCaption: this control plays owner-supplied music with no required spoken information.
        <audio
          ref={audioRef}
          src={track.url}
          preload="none"
          onPlay={() => {
            setPlaying(true);
            setPlaybackError(false);
          }}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onError={() => {
            setPlaying(false);
            setPlaybackError(true);
          }}
        />
      ) : null}

      <span className="sr-only" aria-live="polite">
        {playbackError
          ? "Portfolio music could not be played. Activate the control to retry."
          : playing
            ? `Now playing ${detail}`
            : ""}
      </span>
    </>
  );
}
