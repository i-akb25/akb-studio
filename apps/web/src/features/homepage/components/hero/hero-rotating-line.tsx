"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

const statements = [
  "I build systems that have to survive reality.",
  "I like problems where software meets the physical world.",
  "I work across code, automation, robotics, and intelligent systems.",
  "I care about how things work, where they fail, and how to improve them.",
] as const;

const rotationInterval = 3200;

export function HeroRotatingLine() {
  const shouldReduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (shouldReduceMotion) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % statements.length);
    }, rotationInterval);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [shouldReduceMotion]);

  if (shouldReduceMotion) {
    return (
      <p className="text-xl leading-tight font-medium tracking-[-0.025em] text-foreground sm:text-2xl lg:text-3xl">
        {statements[0]}
      </p>
    );
  }

  return (
    <div
      aria-live="off"
      className="grid min-h-[3.25rem] sm:min-h-[3.75rem] lg:min-h-[4.75rem]"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={statements[activeIndex]}
          initial={{ opacity: 0, y: 7 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -7 }}
          transition={{
            duration: 0.26,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="col-start-1 row-start-1 text-xl leading-tight font-medium tracking-[-0.025em] text-foreground sm:text-2xl lg:text-3xl"
        >
          {statements[activeIndex]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
