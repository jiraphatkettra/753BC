import React from "react";

interface StatusChipProps {
  label: string; // e.g. "LEADERBOARD // LIVE" or "PAYMENT // PROMPTPAY" or "DISCORD OAUTH2 | READY"
  pulse?: boolean;
  accent?: boolean; // green pulse/border for topup or success
  className?: string;
}

export default function StatusChip({
  label,
  pulse = true,
  accent = false,
  className = "",
}: StatusChipProps) {
  // If label contains "|" or "//", split cleanly
  return (
    <div
      className={`inline-flex items-center gap-2 px-2.5 py-1 text-[10px] font-mono tracking-wider anim-fade-in ${
        accent
          ? "bg-emerald-950/20 border border-emerald-500/40 text-emerald-300"
          : "bg-white/[0.04] border border-white/[0.08] text-neutral-300"
      } ${className}`}
    >
      <span
        className={`w-1.5 h-1.5 shrink-0 ${
          accent ? "bg-emerald-400" : "bg-white/80"
        } ${pulse ? "animate-pulse" : ""}`}
      />
      <span>{label}</span>
    </div>
  );
}
