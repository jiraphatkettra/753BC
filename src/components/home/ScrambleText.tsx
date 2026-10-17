"use client";

import { useEffect, useRef, useState } from "react";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*_?/\\|<>[]{}";

interface ScrambleTextProps {
  text: string;
  className?: string;
  delay?: number; // ms before starting
  speed?: number; // ms per frame
  onComplete?: () => void;
}

export default function ScrambleText({
  text,
  className = "",
  delay = 0,
  speed = 40,
  onComplete,
}: ScrambleTextProps) {
  const [displayText, setDisplayText] = useState("");
  const frameRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    let iteration = 0;

    const startTimeout = setTimeout(() => {
      const interval = setInterval(() => {
        setDisplayText(
          text
            .split("")
            .map((char, index) => {
              if (char === " ") return " ";
              if (index < iteration) return text[index];
              return CHARS[Math.floor(Math.random() * CHARS.length)];
            })
            .join("")
        );

        if (iteration >= text.length) {
          clearInterval(interval);
          setDisplayText(text);
          onCompleteRef.current?.();
        }

        iteration += 1 / 2.5;
      }, speed);

      frameRef.current = interval as unknown as ReturnType<typeof setTimeout>;
    }, delay);

    return () => {
      clearTimeout(startTimeout);
      if (frameRef.current) clearInterval(frameRef.current);
    };
  }, [text, delay, speed]);

  return <span className={className}>{displayText || "\u00A0"}</span>;
}
