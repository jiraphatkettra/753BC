"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import ScrambleText from "./ScrambleText";

interface HeroHeadlineProps {
  className?: string;
}

const FULL_DESCRIPTION =
  "ยินดีต้อนรับเข้าสู่เว็บไซต์อย่างเป็นทางการของ 753BC ที่จะช่วยให้คุณไม่พลาดทุกกิจกรรม และข่าวสารต่างๆจากดิสคอร์ด";

function getGraphemes(str: string): string[] {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter("th", { granularity: "grapheme" });
    return Array.from(segmenter.segment(str), (s) => s.segment);
  }
  return Array.from(str);
}

export default function HeroHeadline({ className = "" }: HeroHeadlineProps) {
  const [startLoop, setStartLoop] = useState(false);
  const [typedIndex, setTypedIndex] = useState(0);

  const graphemes = useMemo(() => getGraphemes(FULL_DESCRIPTION), []);
  const loopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleScrambleComplete = useCallback(() => {
    setStartLoop(true);
  }, []);

  // Safety fallback: start loop after 2.4s if scramble animation is delayed
  useEffect(() => {
    const timer = setTimeout(() => {
      setStartLoop(true);
    }, 2400);
    return () => clearTimeout(timer);
  }, []);

  // Typewriter Loop: Type -> Pause with blinking cursor -> Delete -> Short pause -> Repeat
  useEffect(() => {
    if (!startLoop) return;

    let isDeleting = false;
    let idx = 0;

    const tick = () => {
      if (!isDeleting) {
        // Typing forward
        if (idx < graphemes.length) {
          idx += 1;
          setTypedIndex(idx);
          loopTimeoutRef.current = setTimeout(tick, 22);
        } else {
          // Finished typing! Keep cursor blinking (sharp on/off) at the end and pause for 6.5 seconds
          loopTimeoutRef.current = setTimeout(() => {
            isDeleting = true;
            tick();
          }, 6500);
        }
      } else {
        // Backspacing / Deleting backward
        if (idx > 0) {
          idx -= 1;
          setTypedIndex(idx);
          loopTimeoutRef.current = setTimeout(tick, 12);
        } else {
          // Finished deleting! Pause briefly (500ms) with cursor blinking, then type again
          loopTimeoutRef.current = setTimeout(() => {
            isDeleting = false;
            tick();
          }, 500);
        }
      }
    };

    tick();

    return () => {
      if (loopTimeoutRef.current) {
        clearTimeout(loopTimeoutRef.current);
      }
    };
  }, [startLoop, graphemes]);

  const displayedText = useMemo(() => {
    if (!startLoop && typedIndex === 0) return "";
    if (typedIndex >= graphemes.length) return FULL_DESCRIPTION;
    return graphemes.slice(0, typedIndex).join("");
  }, [startLoop, typedIndex, graphemes]);

  return (
    <div className={className}>
      {/* Main Headline with Scramble Effect */}
      <h1
        className="text-3xl sm:text-4xl lg:text-[46px] font-bold tracking-tight text-white leading-[1.08] anim-fade-up"
        style={{ animationDelay: "650ms" }}
      >
        {/* Static "753BC" — always visible */}
        <span className="block">753BC</span>
        {/* Scramble reveal on the second line */}
        <span className="block bg-gradient-to-r from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent">
          <ScrambleText
            text="Discord Server."
            delay={800}
            speed={38}
            onComplete={handleScrambleComplete}
          />
        </span>
      </h1>

      {/* Subtitle / Lead Description — Typewriter loop with persistent blinking cursor */}
      <p className="text-xs sm:text-[13px] text-neutral-400 font-normal leading-relaxed max-w-md mt-3 min-h-[3.5em]">
        {startLoop || typedIndex > 0 ? (
          <>
            <span>{displayedText}</span>
            <span
              className="inline-block w-[2px] h-[0.9em] bg-white/80 align-middle ml-0.5 terminal-caret-blink"
              aria-hidden="true"
            />
          </>
        ) : (
          <span className="opacity-0 select-none pointer-events-none" aria-hidden="true">
            {FULL_DESCRIPTION}
          </span>
        )}
      </p>
    </div>
  );
}
