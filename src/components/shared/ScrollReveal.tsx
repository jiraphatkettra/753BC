"use client";

import React, { useEffect, useRef, useState } from "react";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number; // milliseconds
  duration?: number; // milliseconds
  threshold?: number;
  as?: React.ElementType;
}

/**
 * ScrollReveal: Premium text and content blur-and-fade entrance animation
 * Triggered automatically when scrolled into the viewport.
 */
export default function ScrollReveal({
  children,
  className = "",
  delay = 0,
  duration = 850,
  threshold = 0.12,
  as: Component = "div",
}: ScrollRevealProps) {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Fallback if IntersectionObserver is unavailable
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (domRef.current) {
            observer.unobserve(domRef.current);
          }
        }
      },
      {
        threshold,
        rootMargin: "0px 0px -50px 0px",
      }
    );

    const el = domRef.current;
    if (el) {
      observer.observe(el);
    }

    return () => {
      if (el) observer.unobserve(el);
    };
  }, [threshold]);

  return (
    <Component
      ref={domRef}
      className={`transition-[opacity,filter,transform] ${className}`}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        opacity: isVisible ? 1 : 0,
        filter: isVisible ? "blur(0px)" : "blur(12px)",
        transform: isVisible ? "translate3d(0, 0, 0)" : "translate3d(0, 24px, 0)",
        willChange: "opacity, filter, transform",
      }}
    >
      {children}
    </Component>
  );
}
