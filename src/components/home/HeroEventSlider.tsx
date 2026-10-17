"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

const eventSlides = [
  {
    id: 1,
    src: "/hero-banner.png",
    alt: "753 Discord Sever Welcome Banner",
    badge: "WELCOME",
    tag: "COMMUNITY HUB",
    period: "753BC // OFFICIAL",
  },
  {
    id: 2,
    src: "/event-promo.png",
    alt: "กิจกรรม โปรโมทดิสคอร์ด 753 BC",
    badge: "EVENT 01",
    tag: "PROMO CAMPAIGN",
    period: "15 - 31 OCT",
  },
  {
    id: 3,
    src: "/event-trickortreat.png",
    alt: "Trick or Treat เปลี่ยนลูกอมให้เป็นเงิน",
    badge: "EVENT 02",
    tag: "TRICK OR TREAT",
    period: "31 OCT // MIDNIGHT",
  },
];

export default function HeroEventSlider() {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-slide every 8 seconds (slower & calmer, paused on hover)
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % eventSlides.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [isPaused]);

  const handlePrev = () => {
    setCurrent((prev) => (prev - 1 + eventSlides.length) % eventSlides.length);
  };

  const handleNext = () => {
    setCurrent((prev) => (prev + 1) % eventSlides.length);
  };

  return (
    <div
      className="relative w-full h-full flex flex-col items-center justify-center p-3 sm:p-5 lg:p-6 select-none overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Symmetrical Corner Blueprint Metadata */}
      <div
        className="absolute top-3 left-4 sm:top-3.5 sm:left-5 z-20 font-mono text-[9px] sm:text-[10px] text-neutral-400 tracking-widest uppercase select-none anim-fade-in flex items-center gap-2"
        style={{ animationDelay: "550ms" }}
      >
        <span className="w-1.5 h-1.5 bg-white/70" />
        <span>FIG_01 // SPOTLIGHT</span>
      </div>

      <div
        className="absolute top-3 right-4 sm:top-3.5 sm:right-5 z-20 font-mono text-[9px] sm:text-[10px] text-neutral-500 tracking-widest uppercase select-none anim-fade-in hidden sm:flex items-center gap-2"
        style={{ animationDelay: "550ms" }}
      >
        <span>{eventSlides[current].period}</span>
      </div>

      {/* Main Image Slider Viewport (16:9 Aspect Ratio Container) */}
      <div
        className="relative w-full max-w-[560px] aspect-[16/9] flex items-center justify-center anim-fade-scale z-10 my-auto"
        style={{ animationDelay: "700ms" }}
      >
        {/* Render Slides with smooth 1000ms crossfade */}
        {eventSlides.map((slide, idx) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out flex items-center justify-center ${
              idx === current ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
            }`}
          >
            {/* Relaxed Edge-Fade Mask: Preserves artwork details while smoothly melting the outer border */}
            <div className="relative w-full h-full flex items-center justify-center [mask-image:radial-gradient(ellipse_at_center,black_60%,black_75%,transparent_96%)] [-webkit-mask-image:radial-gradient(ellipse_at_center,black_60%,black_75%,transparent_96%)]">
              <Image
                src={slide.src}
                alt={slide.alt}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority={idx === 0}
                className="object-contain object-center scale-100"
              />
            </div>

            {/* Subtle Edge Overlays to soften perimeter into #070809 without eating into content */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-5 sm:h-6 bg-gradient-to-b from-[#070809] to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-5 sm:h-6 bg-gradient-to-t from-[#070809] to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 left-0 w-6 sm:w-8 bg-gradient-to-r from-[#070809] to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-6 sm:w-8 bg-gradient-to-l from-[#070809] to-transparent" />
          </div>
        ))}

        {/* Sharp Chevron Controls (Left & Right) */}
        <button
          onClick={handlePrev}
          aria-label="Previous Slide"
          className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 sm:w-8 sm:h-8 bg-[#070809]/80 hover:bg-white text-white hover:text-black border border-white/[0.15] hover:border-white transition-colors duration-150 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2 flex items-center justify-center cursor-pointer shadow-lg"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          onClick={handleNext}
          aria-label="Next Slide"
          className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 sm:w-8 sm:h-8 bg-[#070809]/80 hover:bg-white text-white hover:text-black border border-white/[0.15] hover:border-white transition-colors duration-150 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2 flex items-center justify-center cursor-pointer shadow-lg"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Sharp Technical Slide Navigation Bar (Compact & Non-overlapping) */}
      <div
        className="relative z-20 mt-2 sm:mt-2.5 flex items-center justify-between w-full max-w-[500px] px-2 anim-fade-up"
        style={{ animationDelay: "850ms" }}
      >
        <div className="flex items-center gap-1.5 flex-nowrap">
          {eventSlides.map((slide, idx) => (
            <button
              key={slide.id}
              onClick={() => setCurrent(idx)}
              className={`px-2 py-0.5 text-[9px] font-mono border transition-colors duration-150 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2 flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                idx === current
                  ? "bg-white text-black border-white font-semibold shadow-[0_0_12px_rgba(255,255,255,0.15)]"
                  : "bg-white/[0.03] text-neutral-400 border-white/[0.1] hover:text-white hover:bg-white/[0.08]"
              }`}
            >
              <span
                className={`w-1 h-1 ${
                  idx === current ? "bg-black" : "bg-neutral-500"
                }`}
              />
              <span>0{idx + 1}</span>
              <span className="text-neutral-500">//</span>
              <span>{idx === 0 ? "WELCOME" : idx === 1 ? "PROMO" : "EVENT"}</span>
            </button>
          ))}
        </div>

        <div className="text-[10px] font-mono text-neutral-500 whitespace-nowrap shrink-0">
          [{current + 1} / {eventSlides.length}]
        </div>
      </div>
    </div>
  );
}

