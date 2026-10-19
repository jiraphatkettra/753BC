import React from "react";

interface CaptionRowProps {
  label: string; // e.g. "FIG_01 // SPOTLIGHT" or "FIG_01 // PROMPTPAY_QR" or "RANK_01"
  meta?: string; // e.g. "฿100.00" or "OCTOBER 2026"
  className?: string;
  accent?: boolean; // green accent for approved / money
}

export default function CaptionRow({
  label,
  meta,
  className = "",
  accent = false,
}: CaptionRowProps) {
  return (
    <div
      className={`border-b border-white/[0.08] px-4 sm:px-5 py-2 sm:py-2.5 flex items-center justify-between text-[10px] font-mono tracking-wider select-none bg-white/[0.015] ${className}`}
    >
      <div className="flex items-center gap-1.5">
        <span
          className={`w-1.5 h-1.5 shrink-0 ${
            accent ? "bg-emerald-400" : "bg-white"
          }`}
        />
        <span className={accent ? "text-emerald-400 font-semibold" : "text-white/90"}>
          ■ {label}
        </span>
      </div>

      {meta && (
        <span className="text-neutral-500 font-mono uppercase">
          {meta}
        </span>
      )}
    </div>
  );
}
