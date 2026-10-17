"use client";

import { useEffect, useRef, useState } from "react";

interface TypewriterProps {
  lines: string[];
  className?: string;
  delay?: number;
  charSpeed?: number;
  lineDelay?: number;
  cursor?: boolean;
}

export default function Typewriter({
  lines,
  className = "",
  delay = 0,
  charSpeed = 28,
  lineDelay = 400,
  cursor = true,
}: TypewriterProps) {
  const [displayed, setDisplayed] = useState<string[]>([]);
  const [currentLine, setCurrentLine] = useState(0);
  const [currentChar, setCurrentChar] = useState(0);
  const [done, setDone] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    const delayTimer = setTimeout(() => {
      started.current = true;
    }, delay);
    return () => clearTimeout(delayTimer);
  }, [delay]);

  useEffect(() => {
    if (!started.current) return;
    if (currentLine >= lines.length) {
      setDone(true);
      return;
    }

    const line = lines[currentLine];

    if (currentChar < line.length) {
      const t = setTimeout(() => {
        setDisplayed((prev) => {
          const next = [...prev];
          next[currentLine] = (next[currentLine] || "") + line[currentChar];
          return next;
        });
        setCurrentChar((c) => c + 1);
      }, charSpeed);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => {
        setCurrentLine((l) => l + 1);
        setCurrentChar(0);
      }, lineDelay);
      return () => clearTimeout(t);
    }
  }, [currentChar, currentLine, lines, charSpeed, lineDelay]);

  // Delay start until delay fires
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  if (!ready) return <span className={className}>&nbsp;</span>;

  return (
    <span className={className}>
      {lines.map((line, i) => (
        <span key={i}>
          {displayed[i] || ""}
          {i === currentLine && !done && cursor && (
            <span className="inline-block w-[2px] h-[0.9em] bg-current align-middle ml-[1px] animate-pulse" />
          )}
        </span>
      ))}
    </span>
  );
}
