"use client";

import React, { useState, useMemo, useRef } from "react";
import Link from "next/link";
import {
  Trophy, Mic, Search, Clock, Shield, ArrowUpRight,
  Activity, Users, Zap, Star
} from "lucide-react";

interface LeaderboardUser {
  rank: number;
  name: string;
  minutes: number;
  level: number;
  streakDays: number;
  isUser?: boolean;
}

const MOCK_LEADERBOARD: Record<"WEEKLY" | "MONTHLY" | "ALL_TIME", LeaderboardUser[]> = {
  WEEKLY: [
    { rank: 1, name: "NightWalker", minutes: 3840, level: 48, streakDays: 14 },
    { rank: 2, name: "CloudNine", minutes: 3200, level: 42, streakDays: 9 },
    { rank: 3, name: "Zephyr_X", minutes: 3050, level: 39, streakDays: 11 },
    { rank: 4, name: "Valkyrie", minutes: 2940, level: 36, streakDays: 7 },
    { rank: 5, name: "YOU", minutes: 2847, level: 35, streakDays: 5, isUser: true },
    { rank: 6, name: "VioletMist", minutes: 2640, level: 33, streakDays: 4 },
    { rank: 7, name: "Nomad77", minutes: 2500, level: 31, streakDays: 3 },
    { rank: 8, name: "AeroPulse", minutes: 2310, level: 29, streakDays: 6 },
    { rank: 9, name: "KuroShinobi", minutes: 2180, level: 28, streakDays: 2 },
    { rank: 10, name: "EchoLuna", minutes: 1990, level: 25, streakDays: 5 },
  ],
  MONTHLY: [
    { rank: 1, name: "NightWalker", minutes: 14200, level: 48, streakDays: 28 },
    { rank: 2, name: "CloudNine", minutes: 12800, level: 42, streakDays: 24 },
    { rank: 3, name: "Valkyrie", minutes: 11950, level: 36, streakDays: 21 },
    { rank: 4, name: "Zephyr_X", minutes: 11400, level: 39, streakDays: 19 },
    { rank: 5, name: "VioletMist", minutes: 10600, level: 33, streakDays: 15 },
    { rank: 6, name: "AeroPulse", minutes: 9800, level: 29, streakDays: 18 },
    { rank: 7, name: "YOU", minutes: 9450, level: 35, streakDays: 14, isUser: true },
    { rank: 8, name: "Nomad77", minutes: 8900, level: 31, streakDays: 12 },
  ],
  ALL_TIME: [
    { rank: 1, name: "NightWalker", minutes: 84200, level: 62, streakDays: 85 },
    { rank: 2, name: "CloudNine", minutes: 76500, level: 58, streakDays: 70 },
    { rank: 3, name: "Zephyr_X", minutes: 69200, level: 54, streakDays: 62 },
    { rank: 4, name: "Valkyrie", minutes: 62100, level: 50, streakDays: 55 },
    { rank: 5, name: "VioletMist", minutes: 58400, level: 47, streakDays: 45 },
    { rank: 6, name: "YOU", minutes: 52100, level: 44, streakDays: 40, isUser: true },
  ],
};

const TICKER_ITEMS = [
  "TOP_VOICE: NIGHTWALKER_#1",
  "VOICE_LEADERBOARD_ACTIVE",
  "TELEMETRY_REFRESH: 60S",
  "NEXT_RESET: MONDAY_00:00",
  "GUILD_MEMBERS_248",
  "SYSTEM_ONLINE",
];

/* ─── Helpers (matching Dashboard style) ────────────────────────── */
function fmtMin(m: number) {
  const h = Math.floor(m / 60), r = m % 60;
  return h > 0 ? `${h}h ${r}m` : `${r}m`;
}

function StatBlock({
  icon, label, value, sub, borderRight = true,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  borderRight?: boolean;
}) {
  return (
    <div
      className={`p-5 group hover:bg-white/[0.015] transition-colors ${
        borderRight ? "border-r border-white/[0.08]" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="text-neutral-500 group-hover:text-neutral-300 transition-colors">{icon}</div>
        <span className="text-[9px] font-mono text-neutral-700 uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-xl font-bold font-mono text-white">{value}</div>
      <div className="text-[10px] text-neutral-600 font-mono mt-0.5">{sub}</div>
    </div>
  );
}

/* ─── Scrolling ticker (matching Dashboard style) ────────────────── */
function DataTicker() {
  const content = [...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
    <span key={i} className="inline-flex items-center gap-3 shrink-0">
      <span className="text-white/30">▸</span>
      <span>{item}</span>
    </span>
  ));

  return (
    <div className="relative overflow-hidden border-t border-white/[0.08] bg-white/[0.01] py-2">
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#070809] to-transparent z-10" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#070809] to-transparent z-10" />
      <div
        className="flex gap-8 text-[10px] font-mono text-neutral-500 uppercase tracking-widest whitespace-nowrap"
        style={{ animation: "tickerScroll 28s linear infinite" }}
      >
        {content}
        {content}
      </div>
    </div>
  );
}

/* ─── Main Leaderboard Page ──────────────────────────────────────── */
export default function LeaderboardPage() {
  const [timeframe, setTimeframe] = useState<"WEEKLY" | "MONTHLY" | "ALL_TIME">("WEEKLY");
  const [search, setSearch] = useState("");

  const currentList = MOCK_LEADERBOARD[timeframe];
  const maxMinutes = currentList[0]?.minutes || 1;

  const filteredList = useMemo(() => {
    if (!search.trim()) return currentList;
    return currentList.filter((u) => u.name.toLowerCase().includes(search.toLowerCase()));
  }, [currentList, search]);

  const top1 = currentList[0];
  const userEntry = currentList.find((u) => u.isUser);

  return (
    <div className="min-h-[calc(100vh-64px)] text-white overflow-x-clip relative selection:bg-white/20 pt-6 sm:pt-8 md:pt-10 pb-16">

      {/* Scanlines overlay (exact match with topup/login) */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-50"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.008) 3px, rgba(255,255,255,0.008) 4px)",
        }}
      />

      <section className="relative z-10 w-full flex justify-center">
        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Continuous vertical guide lines */}
          <div className="pointer-events-none absolute -top-8 -bottom-10 left-4 sm:left-6 lg:left-8 right-4 sm:right-6 lg:right-8 [mask-image:linear-gradient(to_bottom,transparent_0%,black_32px,black_calc(100%-40px),transparent_100%)] z-10">
            <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-white/[0.1] circuit-top" />
            <div className="hidden lg:block absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[1px] bg-white/[0.1] circuit-bottom" />
            <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-white/[0.1] circuit-top" />
          </div>

          <div className="relative w-full bg-[#070809]">

            {/* Top border */}
            <div className="relative h-[1px]">
              <div className="w-full h-[1px] bg-white/[0.1] circuit-left" />
              <div className="pointer-events-none absolute right-full top-0 w-[420px] h-[1px] bg-gradient-to-l from-white/[0.1] to-transparent circuit-right" />
              <div className="pointer-events-none absolute left-full top-0 w-[420px] h-[1px] bg-gradient-to-r from-white/[0.1] to-transparent circuit-left" />
            </div>

            {/* Ref row */}
            <div className="grid grid-cols-2 h-8 text-[10px] font-mono text-neutral-500 uppercase tracking-widest select-none">
              <div className="px-5 flex items-center anim-fade-in" style={{ animationDelay: "200ms" }}>
                GRID_REF // 004
              </div>
              <div className="px-5 flex items-center justify-end anim-fade-in" style={{ animationDelay: "250ms" }}>
                753BC_VOICE_LEADERBOARD
              </div>
            </div>

            <div className="relative h-[1px]">
              <div className="w-full h-[1px] bg-white/[0.1] circuit-right" />
              <div className="pointer-events-none absolute right-full top-0 w-[420px] h-[1px] bg-gradient-to-l from-white/[0.1] to-transparent circuit-right" />
              <div className="pointer-events-none absolute left-full top-0 w-[420px] h-[1px] bg-gradient-to-r from-white/[0.1] to-transparent circuit-left" />
            </div>

            {/* ─── Page header (matching Home & Topup) ───────────── */}
            <div className="p-6 sm:p-8 anim-fade-up" style={{ animationDelay: "200ms" }}>
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-white/[0.04] border border-white/[0.08] text-[10px] font-mono text-neutral-300 mb-4 tracking-wider">
                    <span className="w-1.5 h-1.5 bg-white/70 animate-pulse" />
                    TELEMETRY_RADAR // 753BC
                  </div>
                  <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-bold tracking-tight leading-[1.1]">
                    จัดอันดับห้องเสียง
                    <br />
                    <span className="bg-gradient-to-r from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent">
                      Voice Activity &amp; Ranks.
                    </span>
                  </h1>
                </div>

                {/* Right summary box */}
                <div className="border border-white/[0.08] p-5 shrink-0 min-w-[220px] bg-[#040506]">
                  <div className="text-[10px] font-mono text-neutral-600 uppercase tracking-widest mb-2">
                    #1 CHAMPION_TIME
                  </div>
                  <div className="text-2xl font-bold font-mono">{fmtMin(top1.minutes)}</div>
                  <div className="text-[10px] font-mono text-neutral-500 mt-1">
                    HOLDER: {top1.name} (LVL {top1.level})
                  </div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="relative h-[1px]"><div className="w-full h-[1px] bg-white/[0.08]" /></div>

            {/* ─── 4-stat bar (matching Dashboard) ───────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 anim-fade-up" style={{ animationDelay: "300ms" }}>
              <StatBlock icon={<Trophy className="w-4 h-4" />} label="RANK_#1" value={top1.name} sub={fmtMin(top1.minutes)} />
              <StatBlock icon={<Users className="w-4 h-4" />} label="ACTIVE_TALKERS" value="48 คน" sub="ห้องเสียงวันนี้" />
              <StatBlock icon={<Star className="w-4 h-4" />} label="TOP_STREAK" value={`${top1.streakDays} วัน`} sub="สะสมต่อเนื่อง" />
              <StatBlock icon={<Clock className="w-4 h-4" />} label="YOUR_POSITION" value={userEntry ? `#${userEntry.rank}` : "UNRANKED"} sub={userEntry ? fmtMin(userEntry.minutes) : "0m"} borderRight={false} />
            </div>

            {/* Divider */}
            <div className="relative h-[1px]"><div className="w-full h-[1px] bg-white/[0.08]" /></div>

            {/* Section labels (matching Topup & Dashboard 50/50) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 text-[11px] font-mono bg-white/[0.015] border-b border-white/[0.08]">
              <div className="px-5 py-2.5 flex items-center justify-between lg:border-r border-white/[0.08]">
                <span className="text-white font-semibold">01 // PODIUM_OVERVIEW</span>
                <span className="text-neutral-500">TIMEFRAME</span>
              </div>
              <div className="px-5 py-2.5 flex items-center justify-between">
                <span className="text-white font-semibold">02 // FULL_RANK_LADDER</span>
                <span className="text-neutral-500">VOICE_STATS</span>
              </div>
            </div>

            {/* ─── 50/50 Main Content ─────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2">

              {/* LEFT: Podium & Timeframe Config ──────────────────── */}
              <div className="p-6 sm:p-8 lg:border-r border-white/[0.08] space-y-6 anim-fade-up" style={{ animationDelay: "350ms" }}>

                {/* Timeframe selector (hardware keypad style) */}
                <div>
                  <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-2">
                    TIMEFRAME_SELECTION
                  </div>
                  <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                    {(["WEEKLY", "MONTHLY", "ALL_TIME"] as const).map((tf) => (
                      <button
                        key={tf}
                        type="button"
                        onClick={() => setTimeframe(tf)}
                        className={`p-3 border text-center transition-all duration-100 cursor-pointer active:scale-[0.97] ${
                          timeframe === tf
                            ? "bg-white text-black font-bold border-white"
                            : "bg-transparent text-neutral-400 border-white/[0.1] hover:border-white/30 hover:text-white"
                        }`}
                      >
                        <div className="text-xs font-bold font-mono">
                          {tf === "WEEKLY" && "สัปดาห์นี้"}
                          {tf === "MONTHLY" && "เดือนนี้"}
                          {tf === "ALL_TIME" && "ตลอดกาล"}
                        </div>
                        <div className={`text-[9px] font-mono mt-0.5 ${timeframe === tf ? "text-black/60" : "text-neutral-600"}`}>
                          {tf}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Top 3 Spotlight Podium (hardware box style) */}
                <div className="space-y-2">
                  <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-2">
                    TOP_3_LEADERS // SPOTLIGHT
                  </div>

                  {currentList.slice(0, 3).map((entry, idx) => {
                    const isFirst = idx === 0;
                    return (
                      <div
                        key={entry.rank}
                        className={`p-4 border transition-colors flex items-center justify-between ${
                          isFirst
                            ? "border-white/20 bg-white/[0.03]"
                            : "border-white/[0.06] bg-[#040506]"
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div className={`w-8 h-8 flex items-center justify-center font-mono font-bold text-xs ${
                            isFirst ? "bg-white text-black" : "border border-white/20 text-white"
                          }`}>
                            #{entry.rank}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-2">
                              <span>{entry.name}</span>
                              {isFirst && (
                                <span className="text-[9px] font-mono px-1 py-px border border-white/20 text-neutral-300">
                                  CHAMPION
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] font-mono text-neutral-500 mt-0.5">
                              LVL {entry.level} · Streak {entry.streakDays}d
                            </div>
                          </div>
                        </div>

                        <div className="text-right font-mono">
                          <div className="text-xs font-bold text-white">{fmtMin(entry.minutes)}</div>
                          <div className="text-[9px] text-neutral-600">VOICE_TOTAL</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Search input (matching custom amount in Topup) */}
                <div>
                  <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-1.5">
                    FIND_PLAYER
                  </div>
                  <div className="flex items-center border border-white/[0.08] bg-white/[0.02] focus-within:border-white/30 transition-colors">
                    <span className="px-3 py-2.5 text-neutral-600 font-mono text-sm border-r border-white/[0.08] select-none">
                      <Search className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="text"
                      placeholder="ค้นหาชื่อผู้เล่น..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="flex-1 px-3 py-2.5 bg-transparent text-xs text-white placeholder-neutral-600 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Technical footer */}
                <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-[10px] font-mono text-neutral-600">
                  <span>SSL_RADAR_ENCRYPTED</span>
                  <span>753BC_VOICE_NODE</span>
                </div>
              </div>

              {/* RIGHT: Full Rank Ladder ──────────────────────────── */}
              <div className="border-t lg:border-t-0 border-white/[0.08] flex flex-col justify-between anim-fade-up" style={{ animationDelay: "400ms" }}>

                <div>
                  {/* Header */}
                  <div className="p-5 sm:px-7 sm:pt-7 pb-4 border-b border-white/[0.06]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
                        RANK_LADDER ({filteredList.length})
                      </span>
                      <span className="text-[10px] font-mono text-white">
                        ORDER BY TOTAL_TIME
                      </span>
                    </div>
                  </div>

                  {/* The actual ladder (exact Dashboard style) */}
                  <div className="divide-y divide-white/[0.05]">
                    {filteredList.map((entry) => {
                      const pct = Math.round((entry.minutes / maxMinutes) * 100);
                      return (
                        <div
                          key={entry.rank}
                          className={`flex items-center gap-4 px-5 sm:px-7 py-3 transition-colors ${
                            entry.isUser
                              ? "bg-white/[0.04] border-l-2 border-l-white"
                              : "hover:bg-white/[0.01]"
                          }`}
                        >
                          <div
                            className={`w-8 shrink-0 text-right font-mono text-sm font-bold ${
                              entry.isUser ? "text-white" : "text-neutral-600"
                            }`}
                          >
                            #{entry.rank}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div
                              className={`text-xs font-semibold mb-1 flex items-center gap-2 ${
                                entry.isUser ? "text-white" : "text-neutral-400"
                              }`}
                            >
                              <span>{entry.isUser ? "→ YOU" : entry.name}</span>
                              <span className="text-[9px] font-mono text-neutral-600">
                                LVL {entry.level}
                              </span>
                            </div>
                            <div className="h-[3px] bg-white/[0.06] relative overflow-hidden">
                              <div
                                className={`absolute left-0 top-0 h-full transition-all ${
                                  entry.isUser ? "bg-white" : "bg-white/30"
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>

                          <div
                            className={`text-[11px] font-mono shrink-0 ${
                              entry.isUser ? "text-white" : "text-neutral-600"
                            }`}
                          >
                            {fmtMin(entry.minutes)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Target hint & nav footer */}
                <div className="p-5 sm:px-7 border-t border-white/[0.08] flex items-center justify-between text-[11px] font-mono text-neutral-500">
                  <Link href="/" className="hover:text-white transition-colors">
                    ← back /home
                  </Link>
                  <a
                    href="https://discord.gg/753bc"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-white transition-colors inline-flex items-center gap-1"
                  >
                    <span>voice rules</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </a>
                </div>

              </div>
            </div>

            {/* ─── Bottom data ticker ─────────────────────────── */}
            <DataTicker />

            {/* Bottom border row */}
            <div className="relative h-[1px]">
              <div className="w-full h-[1px] bg-white/[0.1] circuit-left" />
              <div className="pointer-events-none absolute right-full top-0 w-[420px] h-[1px] bg-gradient-to-l from-white/[0.1] to-transparent circuit-right" />
              <div className="pointer-events-none absolute left-full top-0 w-[420px] h-[1px] bg-gradient-to-r from-white/[0.1] to-transparent circuit-left" />
            </div>
            <div className="grid grid-cols-2 h-8 text-[10px] font-mono text-neutral-500 uppercase tracking-widest select-none">
              <div className="px-5 flex items-center">FIG_04</div>
              <div className="px-5 flex items-center justify-end">
                RADAR_STANDINGS_OK // 2026
              </div>
            </div>
            <div className="relative h-[1px]">
              <div className="w-full h-[1px] bg-white/[0.1] circuit-right" />
              <div className="pointer-events-none absolute right-full top-0 w-[420px] h-[1px] bg-gradient-to-l from-white/[0.1] to-transparent circuit-right" />
              <div className="pointer-events-none absolute left-full top-0 w-[420px] h-[1px] bg-gradient-to-r from-white/[0.1] to-transparent circuit-left" />
            </div>

          </div>
        </div>
      </section>

      {/* Keyframe for ticker */}
      <style>{`
        @keyframes tickerScroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
