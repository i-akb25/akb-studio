"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";

import type { AboutInterestEntry } from "@/features/about/types/about";

function InterestCard({ item }: { item: AboutInterestEntry }) {
  const images = item.images?.length ? item.images.slice(0, 25) : [item.media];
  const [index, setIndex] = useState(0);
  const touchStart = useRef<number | null>(null);
  const active = images[index] ?? images[0];
  const hasMultiple = images.length > 1;

  function move(direction: -1 | 1) {
    setIndex(
      (current) => (current + direction + images.length) % images.length,
    );
  }

  return (
    <figure>
      <div
        className="about-final__interest-media"
        onTouchStart={(event) => {
          touchStart.current = event.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(event) => {
          const start = touchStart.current;
          const end = event.changedTouches[0]?.clientX;
          touchStart.current = null;
          if (start === null || end === undefined || Math.abs(start - end) < 45)
            return;
          move(start > end ? 1 : -1);
        }}
      >
        <Image
          key={active.src}
          src={active.src}
          alt={active.alt}
          fill
          sizes="(max-width: 760px) 86vw, (max-width: 1100px) 44vw, 22vw"
        />
        {hasMultiple ? (
          <>
            <button
              type="button"
              className="about-final__interest-arrow about-final__interest-arrow--previous"
              onClick={() => move(-1)}
              aria-label={`Previous image in ${item.title}`}
            >
              <ChevronLeft aria-hidden="true" />
            </button>
            <button
              type="button"
              className="about-final__interest-arrow about-final__interest-arrow--next"
              onClick={() => move(1)}
              aria-label={`Next image in ${item.title}`}
            >
              <ChevronRight aria-hidden="true" />
            </button>
            <span className="about-final__interest-count" aria-live="polite">
              {index + 1} / {images.length}
            </span>
          </>
        ) : null}
      </div>
      <figcaption>
        <strong>{item.title}</strong>
        <span>{item.note}</span>
        {hasMultiple ? (
          <fieldset className="about-final__interest-dots">
            <legend>Choose image</legend>
            {images.map((image, imageIndex) => (
              <button
                key={`${image.src}-${imageIndex}`}
                type="button"
                aria-label={`Show image ${imageIndex + 1} of ${images.length}`}
                aria-current={imageIndex === index ? "true" : undefined}
                onClick={() => setIndex(imageIndex)}
              />
            ))}
          </fieldset>
        ) : null}
      </figcaption>
    </figure>
  );
}

export function AboutInterestCarousel({
  items,
}: {
  items: AboutInterestEntry[];
}) {
  return (
    <div className="about-final__interest-grid">
      {items.map((item) => (
        <InterestCard key={item.id} item={item} />
      ))}
    </div>
  );
}
