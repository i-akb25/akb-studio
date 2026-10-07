"use client";

import { Download, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type NavigatorWithStandalone = Navigator & { standalone?: boolean };

function isInstalled() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as NavigatorWithStandalone).standalone === true
  );
}

function platformInstructions() {
  const agent = window.navigator.userAgent;

  if (/iPhone|iPad|iPod/i.test(agent)) {
    return "In Safari, open Share and choose Add to Home Screen.";
  }

  if (
    /Macintosh/i.test(agent) &&
    /Safari/i.test(agent) &&
    !/Chrome/i.test(agent)
  ) {
    return "In Safari, choose File, then Add to Dock.";
  }

  return "Open your browser menu and choose Install app or Add to Home screen.";
}

export function InstallAppControl() {
  const instructionsId = useId();
  const promptRef = useRef<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    setInstalled(isInstalled());

    function capturePrompt(event: Event) {
      event.preventDefault();
      promptRef.current = event as InstallPromptEvent;
    }

    function markInstalled() {
      promptRef.current = null;
      setInstalled(true);
      setShowInstructions(false);
    }

    window.addEventListener("beforeinstallprompt", capturePrompt);
    window.addEventListener("appinstalled", markInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", capturePrompt);
      window.removeEventListener("appinstalled", markInstalled);
    };
  }, []);

  async function install() {
    if (installed || installing) return;

    const prompt = promptRef.current;
    if (!prompt) {
      setShowInstructions(true);
      return;
    }

    setInstalling(true);
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      promptRef.current = null;
      if (choice.outcome === "accepted") {
        setInstalled(true);
        setShowInstructions(false);
      } else {
        setShowInstructions(true);
      }
    } catch {
      promptRef.current = null;
      setShowInstructions(true);
    } finally {
      setInstalling(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={install}
        disabled={installed || installing}
        aria-expanded={showInstructions}
        aria-controls={instructionsId}
        className="inline-flex min-h-11 items-center gap-2 rounded-sm text-left text-sm text-muted transition-colors duration-200 hover:text-foreground disabled:cursor-default disabled:text-muted-soft motion-reduce:transition-none"
      >
        <Download aria-hidden="true" className="size-3.5" strokeWidth={1.8} />
        {installed
          ? "AKB Studio installed"
          : installing
            ? "Opening installer…"
            : "Install AKB Studio"}
      </button>

      {showInstructions ? (
        <output
          id={instructionsId}
          className="mt-2 max-w-56 border-l border-border pl-3 text-xs leading-5 text-muted"
        >
          <div className="flex items-start gap-2">
            <p>{platformInstructions()}</p>
            <button
              type="button"
              onClick={() => setShowInstructions(false)}
              aria-label="Close install instructions"
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-sm text-muted hover:text-foreground"
            >
              <X aria-hidden="true" className="size-3.5" />
            </button>
          </div>
        </output>
      ) : null}
    </div>
  );
}
