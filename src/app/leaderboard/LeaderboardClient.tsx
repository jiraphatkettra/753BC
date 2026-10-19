"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  Clock,
  Users,
  Radio,
  Trophy,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
  Award,
} from "lucide-react";
import PageFrame from "@/components/ui/PageFrame";
import { TopSectionStrip, BottomSectionStrip } from "@/components/ui/SectionStrip";
import StatusChip from "@/components/ui/StatusChip";
import TabRow, { TabItem } from "@/components/ui/TabRow";
import CaptionRow from "@/components/ui/CaptionRow";
import Button from "@/components/ui/Button";
import type { LeaderboardResponse, LeaderboardMember } from "@/app/api/leaderboard/route";

const RANGE_TABS: TabItem[] = [
  { id: "week", label: "01 // WEEK", subText: "สัปดาห์นี้" },
  { id: "month", label: "02 // MONTH", subText: "เดือนนี้" },
  { id: "all", label: "03 // ALL_TIME", subText: "ตลอดกาล" },
];

export default function LeaderboardClient() {
  const { data: session } = useSession();
  const [range, setRange] = useState<string>("week");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const PAGE_SIZE = 6;

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery<LeaderboardResponse>({
    queryKey: ["leaderboard", range],
    queryFn: async () => {
      const res = await fetch(`/api/leaderboard?range=${range}`);
      if (!res.ok) {
        throw new Error("Failed to load leaderboard data");
      }
      return res.json();
    },
  });

  const rankings = data?.rankings || [];
  const totalPages = Math.max(1, Math.ceil(rankings.length / PAGE_SIZE));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * PAGE_SIZE;
  const paginatedRankings = rankings.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <PageFrame>
      {/* ── Top Technical Strip ── */}
      <TopSectionStrip gridRef="GRID_REF // 002" pageCode="VOICE_RANKING" />

      {/* ── 1. Header Cell Row ── */}
      <div className="p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-white/[0.08]">
        {/* Left: Headline & Description */}
        <div className="max-w-2xl">
          <StatusChip label="LEADERBOARD // LIVE" className="mb-4" />
          <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight text-white leading-tight">
            จัดอันดับห้องเสียง
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-2 leading-relaxed">
            สะสมชั่วโมงเวลาพูดคุยในห้องเสียง และนำมาแลกยศกับดิสคอร์ดของเซิร์ฟเวอร์
          </p>
        </div>

        {/* Right: Range selector tabs */}
        <div className="flex flex-col items-start lg:items-end gap-2">
          <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
            RANGE_SELECTOR
          </div>
          <TabRow
            tabs={RANGE_TABS}
            activeId={range}
            onChange={(newRange) => {
              setRange(newRange);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* ── 2. Stats Row (3 Ruled Cells) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 border-b border-white/[0.08]">
        {/* Total Hours */}
        <div className="p-5 sm:p-6 border-b md:border-b-0 md:border-r border-white/[0.08] hover:bg-white/[0.015] transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div className="w-7 h-7 bg-white/[0.05] border border-white/[0.1] flex items-center justify-center text-white/80">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
              TOTAL_HOURS
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-white">
            {isLoading ? "..." : `${data?.stats.totalHours.toLocaleString()}h`}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">ชั่วโมงรวมสะสมในเซิร์ฟเวอร์</div>
        </div>

        {/* Active Members */}
        <div className="p-5 sm:p-6 border-b md:border-b-0 md:border-r border-white/[0.08] hover:bg-white/[0.015] transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div className="w-7 h-7 bg-white/[0.05] border border-white/[0.1] flex items-center justify-center text-white/80">
              <Users className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
              ACTIVE_MEMBERS
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-white">
            {isLoading ? "..." : data?.stats.activeMembers.toLocaleString()}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">สมาชิกที่เคลื่อนไหวในห้องเสียง</div>
        </div>

        {/* In Voice Now */}
        <div className="p-5 sm:p-6 hover:bg-white/[0.015] transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div className="w-7 h-7 bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
            </div>
            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-400 animate-ping inline-block" />
              IN_VOICE_NOW
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-white flex items-center gap-2">
            <span>{isLoading ? "..." : data?.stats.inVoiceNow}</span>
            <span className="text-xs font-mono text-neutral-500 font-normal">USERS</span>
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">กำลังพูดคุยอยู่ในขณะนี้</div>
        </div>
      </div>

      {/* ── 3. Podium Row (Rank 1, 2, 3) ── */}
      <div className="border-b border-white/[0.08]">
        <CaptionRow label="TELEMETRY // TOP_PODIUM" meta="VOICE_HOURS_RECORD" />

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/[0.08] p-6 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-44 bg-white/[0.02] border border-white/[0.08] animate-pulse p-5" />
            ))}
          </div>
        ) : isError ? (
          <div className="p-8 text-center border-b border-white/[0.08]">
            <AlertTriangle className="w-6 h-6 text-neutral-500 mx-auto mb-2" />
            <p className="text-xs text-neutral-400 mb-3">ไม่สามารถโหลดข้อมูลกระดานอันดับได้</p>
            <Button variant="secondary" onClick={() => refetch()} icon={<RefreshCw className="w-3.5 h-3.5" />}>
              ลองใหม่อีกครั้ง
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-white/[0.08]">
            {/* Rank 2 (Left) */}
            {data?.podium[1] && (
              <div className="md:col-span-4 p-5 sm:p-6 flex flex-col justify-between hover:bg-white/[0.015] transition-colors order-2 md:order-1">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-mono text-neutral-400 tracking-wider">■ RANK_02</span>
                    <span className="text-xs font-mono text-neutral-500">#02</span>
                  </div>
                  <div className="flex items-center gap-3.5 mb-4">
                    <img
                      src={data.podium[1].avatar || "/placeholder-avatar.png"}
                      alt={data.podium[1].name}
                      className="w-12 h-12 object-cover border border-white/20 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-white truncate">{data.podium[1].name}</div>
                      <div className="text-[10px] font-mono text-neutral-400 mt-0.5">{data.podium[1].role}</div>
                    </div>
                  </div>
                </div>
                <div className="border-t border-white/[0.08] pt-3 flex items-baseline justify-between font-mono">
                  <span className="text-[10px] text-neutral-500">HOURS</span>
                  <span className="text-xl font-bold text-white">{data.podium[1].hours}h</span>
                </div>
              </div>
            )}

            {/* Rank 1 (Center - Featured: White border & #01 block) */}
            {data?.podium[0] && (
              <div className="md:col-span-4 p-5 sm:p-6 flex flex-col justify-between bg-white/[0.025] border-t-2 md:border-t-0 border-white relative transition-colors order-1 md:order-2">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-white shrink-0" />
                      <span className="text-[10px] font-mono text-white font-semibold tracking-wider">■ RANK_01</span>
                    </div>
                    {/* Sharp white #01 block */}
                    <div className="px-2 py-0.5 bg-white text-black font-mono font-bold text-xs tracking-wider">
                      #01 CHAMPION
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5 mb-4">
                    <img
                      src={data.podium[0].avatar || "/placeholder-avatar.png"}
                      alt={data.podium[0].name}
                      className="w-14 h-14 object-cover border-2 border-white shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-base font-bold text-white truncate flex items-center gap-2">
                        <span>{data.podium[0].name}</span>
                        <Trophy className="w-4 h-4 text-white shrink-0" />
                      </div>
                      <div className="text-[11px] font-mono text-neutral-300 mt-0.5">{data.podium[0].role}</div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/20 pt-3 flex items-baseline justify-between font-mono">
                  <span className="text-[10px] text-neutral-400">RECORD_HOURS</span>
                  <span className="text-2xl font-bold text-white">{data.podium[0].hours}h</span>
                </div>
              </div>
            )}

            {/* Rank 3 (Right) */}
            {data?.podium[2] && (
              <div className="md:col-span-4 p-5 sm:p-6 flex flex-col justify-between hover:bg-white/[0.015] transition-colors order-3 md:order-3">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-mono text-neutral-400 tracking-wider">■ RANK_03</span>
                    <span className="text-xs font-mono text-neutral-500">#03</span>
                  </div>
                  <div className="flex items-center gap-3.5 mb-4">
                    <img
                      src={data.podium[2].avatar || "/placeholder-avatar.png"}
                      alt={data.podium[2].name}
                      className="w-12 h-12 object-cover border border-white/20 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-white truncate">{data.podium[2].name}</div>
                      <div className="text-[10px] font-mono text-neutral-400 mt-0.5">{data.podium[2].role}</div>
                    </div>
                  </div>
                </div>
                <div className="border-t border-white/[0.08] pt-3 flex items-baseline justify-between font-mono">
                  <span className="text-[10px] text-neutral-500">HOURS</span>
                  <span className="text-xl font-bold text-white">{data.podium[2].hours}h</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── 4 & 5. Main Split Section (2/3 Ranking Table + 1/3 Side Column) ── */}
      {/* On mobile: side cells stack above table, vertical rules stay on edges */}
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.08]">
        {/* Left: Ranking Table (2/3 width = 8 cols) - Order 2 on mobile */}
        <div className="lg:col-span-8 flex flex-col justify-between order-2 lg:order-1">
          <div>
            <CaptionRow label="TABLE // RANKING_LIST" meta="VOICE_ACTIVITY" />

            {isLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-12 bg-white/[0.02] border border-white/[0.06] animate-pulse" />
                ))}
              </div>
            ) : paginatedRankings.length === 0 ? (
              <div className="p-12 text-center text-xs text-neutral-500 font-mono">
                // ยังไม่มีข้อมูลในช่วงเวลานี้
              </div>
            ) : (
              <div className="divide-y divide-white/[0.08]">
                {paginatedRankings.map((member) => (
                  <div
                    key={member.rank}
                    className={`px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4 transition-colors ${
                      member.isCurrentUser
                        ? "bg-white/[0.05] border-l-2 border-l-white"
                        : "hover:bg-white/[0.02]"
                    }`}
                  >
                    {/* Rank & Avatar & Name */}
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      <span className="font-mono text-xs text-neutral-500 w-7 shrink-0">
                        #{member.rank.toString().padStart(2, "0")}
                      </span>

                      <img
                        src={member.avatar || "/placeholder-avatar.png"}
                        alt={member.name}
                        className="w-8 h-8 object-cover border border-white/20 shrink-0"
                      />

                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-semibold text-white truncate flex items-center gap-2">
                          <span>{member.name}</span>
                          {member.isCurrentUser && (
                            <span className="text-[9px] font-mono px-1 py-0.2 bg-white text-black font-bold">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-neutral-400 truncate">
                          {member.role}
                        </div>
                      </div>
                    </div>

                    {/* Progress to next role & Hours & Delta */}
                    <div className="flex items-center gap-4 sm:gap-8 shrink-0">
                      {/* Thin progress line to next role */}
                      <div className="hidden sm:flex flex-col items-end gap-1 w-28">
                        <div className="text-[9px] font-mono text-neutral-500 uppercase truncate">
                          {member.nextRoleName ? `NEXT: ${member.nextRoleName}` : "MAX_TIER"}
                        </div>
                        <div className="w-full h-[2px] bg-white/[0.1] overflow-hidden">
                          <div
                            className="h-full bg-white transition-all duration-300"
                            style={{ width: `${member.progressToNextRole}%` }}
                          />
                        </div>
                      </div>

                      {/* Hours right-aligned in mono */}
                      <div className="text-right min-w-[50px]">
                        <span className="text-xs sm:text-sm font-mono font-bold text-white">
                          {member.hours}h
                        </span>
                      </div>

                      {/* Weekly Delta in mono (▲ 3, ▼ 1, —) */}
                      <div className="w-8 text-right font-mono text-xs">
                        {member.weeklyDelta > 0 ? (
                          <span className="text-emerald-400">▲ {member.weeklyDelta}</span>
                        ) : member.weeklyDelta < 0 ? (
                          <span className="text-red-400">▼ {Math.abs(member.weeklyDelta)}</span>
                        ) : (
                          <span className="text-neutral-600">—</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 753BC Ruled Blueprint Pagination Controls */}
          {rankings.length > PAGE_SIZE && (
            <div className="p-3 sm:p-4 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-3 bg-white/[0.01] font-mono text-xs">
              <div className="text-neutral-500 text-[11px]">
                PAGE {validCurrentPage} / {totalPages} // SHOWING {startIndex + 1}–{Math.min(startIndex + PAGE_SIZE, rankings.length)} OF {rankings.length}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={validCurrentPage === 1}
                  className="px-2.5 py-1 border border-white/[0.08] text-neutral-400 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  ‹ ก่อนหน้า
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`w-7 h-7 flex items-center justify-center border transition-colors ${
                      p === validCurrentPage
                        ? "border-white bg-white text-black font-bold"
                        : "border-white/[0.08] text-neutral-400 hover:text-white hover:border-white/20"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={validCurrentPage === totalPages}
                  className="px-2.5 py-1 border border-white/[0.08] text-neutral-400 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  ถัดไป ›
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Side Column (1/3 width = 4 cols) - Order 1 on mobile */}
        <div className="lg:col-span-4 flex flex-col divide-y divide-white/[0.08] order-1 lg:order-2">
          {/* Cell 1: YOUR_RANK */}
          <div className="p-5 sm:p-6 bg-[#040506]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
                ■ CELL // YOUR_RANK
              </span>
              <span className="text-[10px] font-mono text-neutral-600">TELEMETRY</span>
            </div>

            {session?.user ? (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  {session.user.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || "User"}
                      className="w-10 h-10 object-cover border border-white/20 shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-white/10 flex items-center justify-center font-mono text-xs font-bold text-white border border-white/20">
                      U
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-bold text-white truncate">
                      {session.user.name}
                    </div>
                    <div className="text-[10px] font-mono text-neutral-400">
                      {data?.userRank?.role || "Trainee Member"}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3 bg-white/[0.02] border border-white/[0.08] mb-3">
                  <div>
                    <div className="text-[9px] font-mono text-neutral-500 uppercase">CURRENT_RANK</div>
                    <div className="text-lg font-mono font-bold text-white">
                      #{data?.userRank?.rank ? data.userRank.rank.toString().padStart(2, "0") : "05"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] font-mono text-neutral-500 uppercase">VOICE_HOURS</div>
                    <div className="text-lg font-mono font-bold text-white">
                      {data?.userRank?.hours || 18}h
                    </div>
                  </div>
                </div>

                {/* Progress to next role */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-neutral-400">
                      PROGRESS: {data?.userRank?.nextRoleName || "Elite"}
                    </span>
                    <span className="text-white font-semibold">
                      {data?.userRank?.progressToNextRole || 65}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-white/[0.1] overflow-hidden">
                    <div
                      className="h-full bg-white transition-all duration-300"
                      style={{ width: `${data?.userRank?.progressToNextRole || 65}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-neutral-400 leading-relaxed">
                  เข้าสู่ระบบด้วยดิสคอร์ด เพื่อตรวจสอบอันดับส่วนบุคคล จำนวนชั่วโมงสะสม และความคืบหน้าในการเลื่อนยศ
                </p>
                <Button
                  variant="primary"
                  href="/login"
                  showArrow
                  className="w-full"
                  icon={
                    <svg className="w-4 h-4 fill-current text-black" viewBox="0 0 24 24">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028z" />
                    </svg>
                  }
                >
                  เข้าสู่ระบบด้วย Discord
                </Button>
              </div>
            )}
          </div>

          {/* Cell 2: ROLE_LADDER */}
          <div className="p-5 sm:p-6 flex-1 bg-[#070809]">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
                ■ CELL // ROLE_LADDER
              </span>
              <span className="text-[10px] font-mono text-neutral-600">REQUIREMENTS</span>
            </div>

            <div className="space-y-3">
              {(data?.roleLadder || []).map((tier, idx) => (
                <div
                  key={tier.id}
                  className="p-3 border border-white/[0.08] hover:border-white/20 bg-white/[0.01] transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-white">{tier.role}</span>
                    <span className="text-[10px] font-mono text-white bg-white/[0.08] px-1.5 py-0.5">
                      {tier.hours}h+
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-tight">
                    {tier.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── 6. Bottom Technical Guide Strip ── */}
      <BottomSectionStrip
        figLabel="FIG_02 // LAST_SYNC"
        statusText={data?.lastSync ? `LAST_SYNC // ${data.lastSync}` : "LAST_SYNC // RECENT"}
      />
    </PageFrame>
  );
}
