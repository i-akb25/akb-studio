"use client";

import { useEffect, useRef, useState } from "react";

export function JourneyScene() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || typeof IntersectionObserver === "undefined") {
      setIsActive(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setIsActive(entry?.isIntersecting ?? false),
      { rootMargin: "0px 0px -10% 0px", threshold: 0.15 },
    );

    observer.observe(scene);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={sceneRef}
      aria-hidden="true"
      className="footer-scene"
      data-active={isActive ? "true" : "false"}
    >
      <div className="footer-scene__train-track">
        <span className="footer-scene__train" />
      </div>

      <span className="footer-scene__edge-blend footer-scene__edge-blend--top" />
      <span className="footer-scene__edge-blend footer-scene__edge-blend--bottom" />
    </div>
  );
}
