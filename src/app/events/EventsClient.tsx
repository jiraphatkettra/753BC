"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  Trophy,
  Sparkles,
  ArrowUpRight,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Share2,
  Check,
  Gift,
  Clock,
  MapPin,
  Flame,
} from "lucide-react";
import { COMMUNITY_EVENTS, CommunityEvent } from "@/config/events";

export default function EventsClient() {
  const [filter, setFilter] = useState<"all" | "active" | "upcoming" | "ended">("all");
  const [expandedId, setExpandedId] = useState<string | null>(COMMUNITY_EVENTS[0]?.id || null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredEvents = COMMUNITY_EVENTS.filter((evt) => {
    if (filter === "all") return true;
    return evt.status === filter;
  });

  const handleShare = (event: CommunityEvent) => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedId(event.id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-[#070809] text-white selection:bg-white/20 pb-24">
      {/* Top Background Technical Lines & Gradients */}
      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 md:pt-16">

        {/* Blueprint Section Header */}
        <div className="relative mb-8 sm:mb-12">
          {/* Top Metadata Micro-row */}
          <div className="flex items-center gap-2 text-[10px] sm:text-[11px] font-mono text-neutral-400 uppercase tracking-widest mb-3">
            <span className="w-2 h-2 bg-emerald-400 animate-pulse" />
            <span>EVENT_REGISTRY // 753BC</span>
            <span className="text-neutral-600">/</span>
            <span className="text-neutral-400">OCTOBER SPECIAL</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-white/[0.08]">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white flex items-center gap-3">
                <span>กิจกรรม &amp; อีเวนต์คอมมูนิตี้</span>
                <span className="px-2 py-0.5 text-xs font-mono font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/30">
                  LIVE
                </span>
              </h1>
              <p className="text-sm sm:text-base text-neutral-400 mt-2 max-w-2xl leading-relaxed">
                ร่วมสนุกและแข่งขันในกิจกรรมประจำเซิร์ฟเวอร์ 753BC ลุ้นรับเงินรางวัลจริง ของรางวัลพิเศษ และยศระดับพรีเมียม
              </p>
            </div>

            {/* Quick Action to Discord */}
            <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
              <a
                href="https://discord.gg/6zcbZ47b5t"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-black bg-white hover:bg-neutral-200 transition-colors duration-150 active:scale-[0.98] border border-white shadow-[0_0_15px_rgba(255,255,255,0.08)] whitespace-nowrap w-full sm:w-auto min-h-[40px]"
              >
                <span>เข้าสู่ดิสคอร์ด 753BC</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Filter Pills Navigation */}
          <div className="flex items-center gap-2 sm:gap-3 mt-6 overflow-x-auto pb-2 scrollbar-none [touch-action:pan-x]">
            <button
              onClick={() => setFilter("all")}
              className={`px-3.5 py-1.5 text-xs font-mono border transition-colors duration-150 flex items-center gap-2 whitespace-nowrap cursor-pointer min-h-[34px] ${
                filter === "all"
                  ? "bg-white text-black border-white font-semibold"
                  : "bg-white/[0.02] text-neutral-400 border-white/[0.1] hover:text-white hover:bg-white/[0.06]"
              }`}
            >
              <span>ทั้งหมด</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 ${
                  filter === "all" ? "bg-black/10 text-black" : "bg-white/[0.08] text-neutral-400"
                }`}
              >
                {COMMUNITY_EVENTS.length}
              </span>
            </button>

            <button
              onClick={() => setFilter("active")}
              className={`px-3.5 py-1.5 text-xs font-mono border transition-colors duration-150 flex items-center gap-2 whitespace-nowrap cursor-pointer min-h-[34px] ${
                filter === "active"
                  ? "bg-emerald-400 text-black border-emerald-400 font-semibold"
                  : "bg-white/[0.02] text-neutral-400 border-white/[0.1] hover:text-white hover:bg-white/[0.06]"
              }`}
            >
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
              <span>กำลังดำเนินอยู่</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 ${
                  filter === "active" ? "bg-black/20 text-black" : "bg-white/[0.08] text-neutral-400"
                }`}
              >
                {COMMUNITY_EVENTS.filter((e) => e.status === "active").length}
              </span>
            </button>

            <button
              onClick={() => setFilter("upcoming")}
              className={`px-3.5 py-1.5 text-xs font-mono border transition-colors duration-150 flex items-center gap-2 whitespace-nowrap cursor-pointer min-h-[34px] ${
                filter === "upcoming"
                  ? "bg-amber-400 text-black border-amber-400 font-semibold"
                  : "bg-white/[0.02] text-neutral-400 border-white/[0.1] hover:text-white hover:bg-white/[0.06]"
              }`}
            >
              <Clock className="w-3 h-3 text-amber-400" />
              <span>เร็วๆ นี้</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 ${
                  filter === "upcoming" ? "bg-black/20 text-black" : "bg-white/[0.08] text-neutral-400"
                }`}
              >
                {COMMUNITY_EVENTS.filter((e) => e.status === "upcoming").length}
              </span>
            </button>

            <button
              onClick={() => setFilter("ended")}
              className={`px-3.5 py-1.5 text-xs font-mono border transition-colors duration-150 flex items-center gap-2 whitespace-nowrap cursor-pointer min-h-[34px] ${
                filter === "ended"
                  ? "bg-white text-black border-white font-semibold"
                  : "bg-white/[0.02] text-neutral-400 border-white/[0.1] hover:text-white hover:bg-white/[0.06]"
              }`}
            >
              <span>สิ้นสุดแล้ว</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 ${
                  filter === "ended" ? "bg-black/10 text-black" : "bg-white/[0.08] text-neutral-400"
                }`}
              >
                {COMMUNITY_EVENTS.filter((e) => e.status === "ended").length}
              </span>
            </button>
          </div>
        </div>

        {/* Events Cards Stack / Grid */}
        <div className="space-y-10 sm:space-y-14">
          {filteredEvents.map((event, index) => {
            const isExpanded = expandedId === event.id;

            return (
              <article
                key={event.id}
                id={event.slug}
                className="relative bg-[#070809] border border-white/[0.12] transition-colors duration-200 overflow-hidden"
              >
                {/* Blueprint Card Frame Guide Header */}
                <div className="px-5 sm:px-7 py-3 border-b border-white/[0.08] bg-white/[0.02] flex items-center justify-between flex-wrap gap-2 text-[11px] font-mono">
                  <div className="flex items-center gap-3">
                    <span className="text-white font-semibold">{event.badge}</span>
                    <span className="text-neutral-500">//</span>
                    <span className="text-neutral-400">{event.tagline}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {event.status === "active" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-semibold">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                        {event.statusLabel}
                      </span>
                    ) : event.status === "upcoming" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-amber-400 bg-amber-500/10 border border-amber-500/30 text-[10px] font-semibold">
                        <Clock className="w-2.5 h-2.5" />
                        {event.statusLabel}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-neutral-400 bg-white/[0.05] border border-white/[0.1] text-[10px]">
                        {event.statusLabel}
                      </span>
                    )}
                  </div>
                </div>

                {/* Main Event Card Body: Balanced 2-Column Responsive Split */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                  {/* Left Column (5 Cols): Clean Banner Display without text overlap */}
                  <div className="lg:col-span-5 p-4 sm:p-6 lg:p-7 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-white/[0.08] bg-black/40">
                    <div className="relative w-full aspect-[16/9] overflow-hidden border border-white/[0.1] bg-[#0c0d0e] shadow-lg">
                      <Image
                        src={event.image}
                        alt={event.title}
                        fill
                        sizes="(max-width: 1024px) 100vw, 40vw"
                        className="object-contain object-center hover:scale-[1.02] transition-transform duration-500"
                        priority={index === 0}
                      />
                    </div>

                    {/* Metadata Strip below Banner */}
                    <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-neutral-400 font-mono">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                        <span>{event.periodText}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                        <span className="truncate max-w-[140px]">753BC Server</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column (7 Cols): Rich Event Information */}
                  <div className="lg:col-span-7 p-6 sm:p-7 lg:p-8 flex flex-col justify-between">
                    <div>
                      {/* Event Title */}
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2">
                        {event.title}
                      </h2>

                      {/* Summary */}
                      <p className="text-sm text-neutral-300 leading-relaxed mb-6">
                        {event.description}
                      </p>

                      {/* Prize and Reward Compartments (No overlap, generous gaps) */}
                      <div className="mb-6">
                        <div className="text-xs font-mono text-neutral-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                          <Trophy className="w-3.5 h-3.5 text-amber-400" />
                          <span>รางวัล &amp; สิทธิประโยชน์ผู้เข้าร่วม</span>
                        </div>

                        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-3">
                          {event.rewards.map((reward, rIdx) => (
                            <div
                              key={rIdx}
                              className={`p-3.5 border transition-colors ${
                                reward.isGrand
                                  ? "bg-amber-500/[0.06] border-amber-500/30 text-white"
                                  : "bg-white/[0.02] border-white/[0.08] text-neutral-200"
                              }`}
                            >
                              <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                                <span>{reward.label}</span>
                                {reward.isGrand && (
                                  <span className="text-[9px] px-1 py-0.2 bg-amber-400 text-black font-bold">
                                    TOP
                                  </span>
                                )}
                              </div>
                              <div className="text-base sm:text-lg font-bold tracking-tight text-white">
                                {reward.value}
                              </div>
                              {reward.subtext && (
                                <div className="text-[11px] text-neutral-400 mt-1 leading-snug">
                                  {reward.subtext}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Highlights */}
                      <div className="p-3.5 bg-white/[0.02] border border-white/[0.06] mb-6">
                        <div className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-white/80" />
                          <span>ไฮไลท์สำคัญของกิจกรรม</span>
                        </div>
                        <ul className="space-y-1.5">
                          {event.highlights.map((item, hIdx) => (
                            <li
                              key={hIdx}
                              className="text-xs text-neutral-300 flex items-start gap-2"
                            >
                              <span className="w-1 h-1 bg-emerald-400 rounded-full mt-1.5 shrink-0" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Expandable Rules & How to join */}
                    {isExpanded && (
                      <div className="pt-4 pb-2 border-t border-white/[0.08] my-4 space-y-4 animate-in fade-in duration-200">
                        {/* วิธีเข้าร่วม */}
                        <div>
                          <div className="text-xs font-mono text-neutral-400 uppercase tracking-wider mb-2">
                            // วิธีเข้าร่วมกิจกรรม (STEPS)
                          </div>
                          <ol className="space-y-2">
                            {event.howToJoin.map((step, sIdx) => (
                              <li
                                key={sIdx}
                                className="text-xs text-neutral-300 flex items-start gap-2.5"
                              >
                                <span className="w-5 h-5 bg-white/[0.06] border border-white/[0.1] text-white flex items-center justify-center font-mono text-[10px] shrink-0">
                                  0{sIdx + 1}
                                </span>
                                <span className="pt-0.5">{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>

                        {/* กฎและข้อกำหนด */}
                        <div className="pt-3 border-t border-white/[0.06]">
                          <div className="text-xs font-mono text-neutral-400 uppercase tracking-wider mb-2">
                            // กฎและกติกา (TERMS &amp; CONDITIONS)
                          </div>
                          <ul className="space-y-1.5">
                            {event.rules.map((rule, ruIdx) => (
                              <li
                                key={ruIdx}
                                className="text-xs text-neutral-400 flex items-start gap-2"
                              >
                                <span className="text-neutral-600 shrink-0">•</span>
                                <span>{rule}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons Bar: Generous spacing, distinct borders and states */}
                    <div className="pt-4 border-t border-white/[0.08] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : event.id)}
                          className="flex-1 sm:flex-none justify-center px-3.5 py-2.5 text-xs font-medium text-neutral-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] transition-colors duration-150 flex items-center gap-1.5 active:scale-[0.98] cursor-pointer min-h-[40px]"
                        >
                          <span>{isExpanded ? "ย่อรายละเอียด" : "ดูกติกา & วิธีเข้าร่วม"}</span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <button
                          onClick={() => handleShare(event)}
                          className="px-3.5 py-2.5 text-xs font-medium text-neutral-400 hover:text-white bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.08] transition-colors duration-150 flex items-center justify-center gap-1.5 active:scale-[0.98] cursor-pointer min-h-[40px] min-w-[40px]"
                          title="แชร์กิจกรรม"
                        >
                          {copiedId === event.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">คัดลอกลิงก์แล้ว</span>
                            </>
                          ) : (
                            <>
                              <Share2 className="w-3.5 h-3.5" />
                              <span>แชร์</span>
                            </>
                          )}
                        </button>
                      </div>

                      <a
                        href={event.discordUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-black bg-white hover:bg-neutral-200 transition-colors duration-150 active:scale-[0.98] border border-white shadow-[0_0_15px_rgba(255,255,255,0.08)] cursor-pointer w-full sm:w-auto min-h-[40px]"
                      >
                        <Flame className="w-3.5 h-3.5 text-black" />
                        <span>เข้าร่วมใน Discord</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Bottom Community Banner / Discord CTA */}
        <div className="mt-14 sm:mt-18 p-6 sm:p-8 bg-[#070809] border border-white/[0.12] flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div>
            <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest mb-1.5">
              NEED HELP // STAFF SUPPORT
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white">
              มีข้อสงสัยเกี่ยวกับกิจกรรม หรือต้องการจัดกิจกรรมร่วมกับเรา?
            </h3>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-xl">
              สามารถเปิดทิคเก็ตติดต่อทีมงานสตาฟได้ตลอด 24 ชั่วโมงในเซิร์ฟเวอร์ดิสคอร์ด 753BC
            </p>
          </div>
          <a
            href="https://discord.gg/6zcbZ47b5t"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.2] transition-colors duration-150 active:scale-[0.98] whitespace-nowrap"
          >
            <span>ติดต่อทีมงานใน Discord</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

      </div>
    </div>
  );
}
