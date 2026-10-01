"use client";

import { Headphones, Volume2, VolumeX } from "lucide-react";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

type ReflectionSoundProps = {
  children: ReactNode;
};

const TARGET_VOLUME = 0.09;
const FADE_DURATION = 420;

function clampVolume(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function ReflectionSound({ children }: ReflectionSoundProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const cancelFade = useCallback(() => {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const fadeVolume = useCallback(
    (from: number, to: number, onComplete?: () => void) => {
      const audio = audioRef.current;

      if (!audio) {
        return;
      }

      cancelFade();

      const safeFrom = clampVolume(from);
      const safeTo = clampVolume(to);
      const startedAt = performance.now();

      const animate = (timestamp: number) => {
        const activeAudio = audioRef.current;

        if (!activeAudio) {
          animationFrameRef.current = null;
          return;
        }

        const progress = Math.min(
          Math.max((timestamp - startedAt) / FADE_DURATION, 0),
          1,
        );

        const nextVolume = safeFrom + (safeTo - safeFrom) * progress;

        activeAudio.volume = clampVolume(nextVolume);

        if (progress < 1) {
          animationFrameRef.current = window.requestAnimationFrame(animate);
          return;
        }

        activeAudio.volume = safeTo;
        animationFrameRef.current = null;
        onComplete?.();
      };

      animationFrameRef.current = window.requestAnimationFrame(animate);
    },
    [cancelFade],
  );

  const play = useCallback(async () => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    cancelFade();

    if (!audio.paused) {
      fadeVolume(audio.volume, TARGET_VOLUME);
      setIsPlaying(true);
      return;
    }

    audio.volume = 0;

    try {
      await audio.play();

      setIsPlaying(true);
      fadeVolume(0, TARGET_VOLUME);
    } catch {
      audio.volume = 0;
      setIsPlaying(false);
    }
  }, [cancelFade, fadeVolume]);

  const stop = useCallback(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    cancelFade();

    if (audio.paused) {
      audio.volume = 0;
      setIsPlaying(false);
      return;
    }

    const startVolume = clampVolume(audio.volume);

    fadeVolume(startVolume, 0, () => {
      const activeAudio = audioRef.current;

      if (!activeAudio) {
        return;
      }

      activeAudio.pause();
      activeAudio.currentTime = 0;
      activeAudio.volume = 0;

      setIsPlaying(false);
    });
  }, [cancelFade, fadeVolume]);

  const toggle = useCallback(() => {
    if (isPlaying) {
      stop();
      return;
    }

    void play();
  }, [isPlaying, play, stop]);

  useEffect(() => {
    return () => {
      cancelFade();

      const audio = audioRef.current;

      if (audio) {
        audio.pause();
        audio.volume = 0;
      }
    };
  }, [cancelFade]);

  return (
    <div className="relative">
      {/* biome-ignore lint/a11y/useMediaCaption: Ambient instrumental audio has no speech or dialogue to caption. */}
      <audio
        ref={audioRef}
        src="/audio/reflections/tanpura-reflection.mp3"
        preload="none"
        loop
      />

      {children}

      <div className="mt-4 overflow-hidden rounded-[1.25rem] border border-amber-700/18 bg-[#f6eee0]/92 dark:border-amber-300/14 dark:bg-[#0d0e0f]">
        <div className="grid items-center gap-5 px-5 py-4 sm:grid-cols-[1fr_auto_1fr] sm:px-7">
          <div className="flex items-center gap-4">
            <span
              aria-hidden="true"
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-amber-700/25 text-amber-700/70 dark:border-amber-300/22 dark:text-amber-300/70"
            >
              <Headphones className="size-5" strokeWidth={1.5} />
            </span>

            <div>
              <p className="text-sm font-medium text-foreground/76">
                ध्यान संगीत
              </p>

              <p className="mt-0.5 text-xs text-foreground/52">
                शांत मन, स्पष्ट सोच
              </p>
            </div>
          </div>

          <div
            aria-hidden="true"
            className="hidden items-center gap-3 text-amber-700/35 sm:flex dark:text-amber-300/32"
          >
            <span className="h-px w-10 bg-current" />

            <svg
              aria-hidden="true"
              className="size-10"
              viewBox="0 0 48 48"
              fill="none"
            >
              <path
                d="M24 40C24 30 16 27 10 24C17 22.5 21.5 18 24 11C26.5 18 31 22.5 38 24C32 27 24 30 24 40Z"
                stroke="currentColor"
                strokeWidth="1"
              />

              <path
                d="M24 11C19.5 13 16 11.5 13 7C18 7.5 21.5 5.5 24 2C26.5 5.5 30 7.5 35 7C32 11.5 28.5 13 24 11Z"
                stroke="currentColor"
                strokeWidth="1"
              />

              <path
                d="M10 24C15 29 17 34 16 40M38 24C33 29 31 34 32 40M16 40H32"
                stroke="currentColor"
                strokeWidth="0.8"
              />
            </svg>

            <span className="h-px w-10 bg-current" />
          </div>

          <div className="flex sm:justify-end">
            <button
              type="button"
              aria-pressed={isPlaying}
              aria-label={
                isPlaying
                  ? "Stop meditation ambience"
                  : "Play meditation ambience"
              }
              onClick={toggle}
              className="group inline-flex min-h-11 items-center gap-3 rounded-md px-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 focus-visible:ring-offset-4 focus-visible:ring-offset-[#f6eee0] dark:focus-visible:ring-amber-300 dark:focus-visible:ring-offset-[#0d0e0f]"
            >
              <span>
                <span className="block text-xs font-medium tracking-[0.09em] text-amber-700/76 uppercase dark:text-amber-300/72">
                  {isPlaying ? "संगीत चल रहा है" : "स्पर्श करें · सुनें"}
                </span>

                <span className="mt-1 block text-xs text-foreground/50">
                  {isPlaying ? "फिर स्पर्श करके रोकें" : "शांति का अनुभव करें"}
                </span>
              </span>

              <span
                aria-hidden="true"
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-amber-700/20 text-amber-700/65 transition-colors duration-200 group-hover:border-amber-700/35 group-hover:text-amber-700 dark:border-amber-300/18 dark:text-amber-300/62 dark:group-hover:border-amber-300/32 dark:group-hover:text-amber-300 motion-reduce:transition-none"
              >
                {isPlaying ? (
                  <Volume2 className="size-4" strokeWidth={1.5} />
                ) : (
                  <VolumeX className="size-4" strokeWidth={1.5} />
                )}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
