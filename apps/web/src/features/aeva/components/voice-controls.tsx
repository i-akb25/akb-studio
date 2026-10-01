"use client";

import { Mic, Square, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type SpeechRecognitionEventLike = Event & {
  results: ArrayLike<{ 0: { transcript: string } }>;
};

type SpeechRecognitionLike = EventTarget & {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

type VoiceControlsProps = {
  answer?: string;
  disabled?: boolean;
  onTranscript: (transcript: string) => void;
};

export function VoiceControls({
  answer,
  disabled = false,
  onTranscript,
}: VoiceControlsProps) {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [message, setMessage] = useState(
    "Voice is off. Microphone access is requested only after you press Start voice input.",
  );

  useEffect(
    () => () => {
      recognitionRef.current?.stop();
      window.speechSynthesis?.cancel();
    },
    [],
  );

  function stopVoice() {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    window.speechSynthesis?.cancel();
    setListening(false);
    setSpeaking(false);
    setMessage("Voice stopped.");
  }

  function startListening() {
    const Recognition =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Recognition) {
      setMessage(
        "Voice input is not supported in this browser. Use the text field instead.",
      );
      return;
    }

    const recognition = new Recognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = document.documentElement.lang || "en";
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      if (transcript) onTranscript(transcript);
      setMessage(
        transcript
          ? "Voice input added. Review it before sending."
          : "No speech was detected.",
      );
    };
    recognition.onerror = () => {
      setListening(false);
      setMessage(
        "Microphone access was unavailable. You can continue with the keyboard.",
      );
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      setListening(false);
    };
    recognitionRef.current = recognition;
    setListening(true);
    setMessage(
      "Listening for one question. Nothing is recorded in the background.",
    );
    recognition.start();
  }

  function speakAnswer() {
    if (!answer || !("speechSynthesis" in window)) {
      setMessage(
        "Spoken playback is unavailable. The answer remains available as text.",
      );
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(answer);
    utterance.lang = document.documentElement.lang || "en";
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    setMessage("Reading Aeva's latest answer aloud.");
    window.speechSynthesis.speak(utterance);
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={listening ? stopVoice : startListening}
        disabled={disabled}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-xs font-medium text-foreground disabled:opacity-40"
      >
        {listening ? (
          <Square className="size-3" aria-hidden="true" />
        ) : (
          <Mic className="size-4" aria-hidden="true" />
        )}
        {listening ? "Stop listening" : "Start voice input"}
      </button>
      <button
        type="button"
        onClick={speaking ? stopVoice : speakAnswer}
        disabled={!answer}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-xs font-medium text-foreground disabled:opacity-40"
      >
        {speaking ? (
          <Square className="size-3" aria-hidden="true" />
        ) : (
          <Volume2 className="size-4" aria-hidden="true" />
        )}
        {speaking ? "Stop playback" : "Read latest answer"}
      </button>
      <p className="basis-full text-xs leading-5 text-muted" aria-live="polite">
        {message}
      </p>
    </div>
  );
}
