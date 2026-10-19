import React from "react";

interface TopSectionStripProps {
  gridRef: string; // e.g. "GRID_REF // 002"
  pageCode: string; // e.g. "VOICE_RANKING"
}

export function TopSectionStrip({ gridRef, pageCode }: TopSectionStripProps) {
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 h-7 sm:h-8 relative text-[10px] font-mono text-neutral-500 uppercase tracking-widest select-none">
        <div className="px-5 flex items-center">
          <span className="anim-fade-in" style={{ animationDelay: "150ms" }}>
            {gridRef}
          </span>
        </div>
        <div className="hidden lg:flex px-5 items-center justify-end">
          <span className="anim-fade-in" style={{ animationDelay: "200ms" }}>
            {pageCode}
          </span>
        </div>
      </div>

      {/* Hairline below GRID_REF */}
      <div className="relative h-[1px]">
        <div className="w-full h-[1px] bg-white/[0.1] circuit-right" style={{ animationDelay: "0ms" }} />
        <div
          className="hidden md:block pointer-events-none absolute right-full top-0 w-[420px] h-[1px] bg-gradient-to-l from-white/[0.1] to-transparent circuit-right"
          style={{ animationDelay: "0ms" }}
        />
        <div
          className="hidden md:block pointer-events-none absolute left-full top-0 w-[420px] h-[1px] bg-gradient-to-r from-white/[0.1] to-transparent circuit-left"
          style={{ animationDelay: "0ms" }}
        />
      </div>
    </>
  );
}

interface BottomSectionStripProps {
  figLabel: string; // e.g. "FIG_02" or "FIG_02 // LAST_SYNC"
  statusText: string; // e.g. "SYSTEM_READY" or "AWAITING_SLIP"
}

export function BottomSectionStrip({ figLabel, statusText }: BottomSectionStripProps) {
  return (
    <>
      {/* Hairline above bottom strip */}
      <div className="relative h-[1px]">
        <div className="w-full h-[1px] bg-white/[0.1] circuit-left" style={{ animationDelay: "0ms" }} />
        <div
          className="hidden md:block pointer-events-none absolute right-full top-0 w-[420px] h-[1px] bg-gradient-to-l from-white/[0.1] to-transparent circuit-right"
          style={{ animationDelay: "0ms" }}
        />
        <div
          className="hidden md:block pointer-events-none absolute left-full top-0 w-[420px] h-[1px] bg-gradient-to-r from-white/[0.1] to-transparent circuit-left"
          style={{ animationDelay: "0ms" }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 h-7 sm:h-8 relative text-[10px] font-mono text-neutral-500 uppercase tracking-widest select-none">
        <div className="px-5 flex items-center">
          <span className="anim-fade-in" style={{ animationDelay: "250ms" }}>
            {figLabel}
          </span>
        </div>
        <div className="hidden lg:flex px-5 items-center justify-end">
          <span className="anim-fade-in text-neutral-400 font-mono" style={{ animationDelay: "300ms" }}>
            {statusText}
          </span>
        </div>
      </div>
    </>
  );
}
