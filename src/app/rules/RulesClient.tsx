"use client";

import React, { useState } from "react";
import {
  MEMBER_CORE_RULES,
  IMPORTANT_PROVISIONS,
  PENALTY_LEVELS,
  PROCEDURES,
  STAFF_CHAPTERS,
} from "@/config/rules";
import RuleAssistantWidget from "@/components/rules/RuleAssistantWidget";
import {
  Shield,
  FileText,
  Search,
  Scale,
  AlertOctagon,
  Users,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  Bookmark,
} from "lucide-react";

export default function RulesClient() {
  const [activeTab, setActiveTab] = useState<"member" | "staff">("member");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedChapter, setExpandedChapter] = useState<number | null>(1);

  // Filter staff chapters by search
  const filteredStaffChapters = STAFF_CHAPTERS.filter((ch) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchTitle = ch.title.toLowerCase().includes(q);
    const matchSubtitle = ch.subtitle.toLowerCase().includes(q);
    const matchArticles = ch.articles.some(
      (a) =>
        a.content.toLowerCase().includes(q) ||
        a.subArticles?.some((sub) => sub.toLowerCase().includes(q))
    );
    return matchTitle || matchSubtitle || matchArticles;
  });

  // Filter member rules by search
  const filteredCoreRules = MEMBER_CORE_RULES.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q);
  });

  const filteredProvisions = IMPORTANT_PROVISIONS.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-[#070809] text-white selection:bg-white/20 pb-28">
      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 md:pt-16">

        {/* ================= TOP SECTION: GEMINI AI RULE SENTINEL ================= */}
        <section className="relative mb-14 sm:mb-20">
          {/* Metadata Micro-row */}
          <div className="flex items-center gap-2 text-[10px] sm:text-[11px] font-mono text-neutral-400 uppercase tracking-widest mb-3">
            <span className="w-2 h-2 bg-emerald-400 animate-pulse" />
            <span>AI_ASSISTANT // RULE_SENTINEL</span>
            <span className="text-neutral-600">/</span>
            <span className="text-neutral-400">GEMINI VERIFIED ENGINE</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-white/[0.08] mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white flex items-center gap-3">
                <span>กฎระเบียบ &amp; ระบบวิเคราะห์อัตโนมัติ</span>
                <span className="px-2 py-0.5 text-xs font-mono font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/30">
                  AI POWERED
                </span>
              </h1>
              <p className="text-sm sm:text-base text-neutral-400 mt-2 max-w-3xl leading-relaxed">
                สอบถามข้อกฎระเบียบ วิธีการรายงาน หรือให้ AI ช่วยวิเคราะห์สถานการณ์ตามข้อบังคับจริงของเซิร์ฟเวอร์ 753BC โดยระบบจะตอบเฉพาะข้อเท็จจริงตามกฎ ไม่มโนหรือแต่งกฎขึ้นมาเอง
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
              <a
                href="#official-rules"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.15] transition-colors duration-150 active:scale-[0.98] whitespace-nowrap w-full sm:w-auto min-h-[40px]"
              >
                <span>เลื่อนลงอ่านกฎฉบับเต็ม</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* AI Chat Assistant Widget Box */}
          <div className="w-full">
            <RuleAssistantWidget compact={false} />
          </div>
        </section>

        {/* ================= BOTTOM SECTION: SERVER RULES DOCUMENT ================= */}
        <section id="official-rules" className="relative pt-6 border-t border-white/[0.12]">

          {/* Technical Guide Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 h-8 sm:h-9 relative text-[10px] font-mono text-neutral-500 uppercase tracking-widest select-none border-b border-white/[0.08] mb-8">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-white/70" />
              <span>REGISTRY_DOCUMENT // 753BC</span>
              <span className="text-neutral-700">/</span>
              <span className="text-neutral-400">OFFICIAL CODE OF CONDUCT</span>
            </div>
            <div className="hidden lg:flex items-center justify-end">
              <span>STATUS: ENFORCED</span>
            </div>
          </div>

          {/* Document Header & Tab Selector */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-3">
                <Scale className="w-5 h-5 text-neutral-400" />
                <span>ข้อบังคับและกฎระเบียบทางการ</span>
              </h2>
              <p className="text-xs sm:text-sm text-neutral-400 mt-1">
                การร่วมเป็นสมาชิกและอยู่ในเซิร์ฟเวอร์ถือว่าท่านได้อ่านและยอมรับข้อบังคับทั้งหมดแล้ว
              </p>
            </div>

            {/* Segmented Control Tabs (Responsive & Touch Friendly) */}
            <div className="w-full sm:w-auto grid grid-cols-1 xs:grid-cols-2 sm:flex items-center bg-white/[0.02] border border-white/[0.1] p-1 self-stretch sm:self-start lg:self-auto gap-1 sm:gap-0">
              <button
                onClick={() => setActiveTab("member")}
                className={`px-3 sm:px-4 py-2.5 text-xs font-mono transition-colors duration-150 flex items-center justify-center gap-2 cursor-pointer min-h-[40px] text-center ${
                  activeTab === "member"
                    ? "bg-white text-black font-semibold shadow-sm"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span>กฎระเบียบสมาชิกทั่วไป</span>
              </button>

              <button
                onClick={() => setActiveTab("staff")}
                className={`px-3 sm:px-4 py-2.5 text-xs font-mono transition-colors duration-150 flex items-center justify-center gap-2 cursor-pointer min-h-[40px] text-center ${
                  activeTab === "staff"
                    ? "bg-white text-black font-semibold shadow-sm"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <Shield className="w-3.5 h-3.5 shrink-0" />
                <span>ระเบียบทีมงาน 9 หมวด</span>
              </button>
            </div>
          </div>

          {/* Quick Search Input */}
          <div className="relative mb-8 w-full max-w-md">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาข้อกำหนด, คำสำคัญ (เช่น สแปม, Doxxing, อุทธรณ์)..."
              className="w-full bg-white/[0.02] border border-white/[0.1] pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/40 transition-colors min-h-[40px]"
            />
          </div>

          {/* ================= TAB 1: กฎระเบียบสมาชิกทั่วไป ================= */}
          {activeTab === "member" && (
            <div className="space-y-12 animate-in fade-in duration-200">

              {/* Sub-section 1: กฎระเบียบหลัก 6 ข้อ */}
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 uppercase tracking-wider mb-4 pb-2 border-b border-white/[0.08]">
                  <span>[SECTION 01]</span>
                  <span>//</span>
                  <span className="text-white font-semibold">กฎระเบียบหลัก 6 ประการ</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCoreRules.map((rule) => (
                    <div
                      key={rule.id}
                      className="p-5 bg-[#070809] border border-white/[0.1] hover:border-white/25 transition-colors flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3 text-[10px] font-mono text-neutral-500">
                          <span className="px-1.5 py-0.2 bg-white/[0.05] border border-white/[0.08] text-white font-semibold">
                            RULE_{rule.number}
                          </span>
                          <span>753BC_CODE</span>
                        </div>
                        <h3 className="text-base font-bold text-white mb-2">{rule.title}</h3>
                        <p className="text-xs text-neutral-300 leading-relaxed">
                          {rule.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sub-section 2: ข้อกำหนดสำคัญ 8 ข้อ */}
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 uppercase tracking-wider mb-4 pb-2 border-b border-white/[0.08]">
                  <span>[SECTION 02]</span>
                  <span>//</span>
                  <span className="text-white font-semibold">ข้อกำหนดสำคัญ 8 ประการ</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredProvisions.map((prov) => (
                    <div
                      key={prov.id}
                      className="p-5 bg-[#070809] border border-white/[0.1] hover:border-white/25 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-2 text-[10px] font-mono text-amber-400">
                        <span>[{prov.number}]</span>
                        <span className="text-white font-semibold text-sm">{prov.title}</span>
                      </div>
                      <p className="text-xs text-neutral-300 leading-relaxed">{prov.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sub-section 3: ตารางระดับบทลงโทษ 4 ระดับ */}
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 uppercase tracking-wider mb-4 pb-2 border-b border-white/[0.08]">
                  <span>[SECTION 03]</span>
                  <span>//</span>
                  <span className="text-white font-semibold">ระดับบทลงโทษ (ตามความรุนแรงและเจตนา)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {PENALTY_LEVELS.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-5 bg-[#070809] border border-white/[0.1] flex flex-col justify-between"
                    >
                      <div>
                        <div className="text-[10px] font-mono text-neutral-500 mb-1">{item.level}</div>
                        <div className="text-sm font-bold text-white mb-2">{item.name}</div>
                        <div className="text-[11px] font-mono text-neutral-400 mb-3">
                          สถานะ: {item.severity}
                        </div>
                        <div className="text-xs text-neutral-300 mb-3 leading-relaxed">
                          <span className="text-neutral-500 font-mono block mb-1">ตัวอย่าง:</span>
                          {item.examples}
                        </div>
                      </div>
                      <div className="pt-3 border-t border-white/[0.06] text-[11px] text-neutral-400 leading-normal">
                        {item.consequence}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-4 bg-red-500/[0.04] border border-red-500/20 text-xs text-neutral-300">
                  <span className="font-semibold text-red-400 font-mono mr-2">[ความผิดร้ายแรงขั้นสูงสุด]:</span>
                  กรณีเนื้อหาผิดกฎหมาย, เนื้อหาทางเพศเกี่ยวกับผู้เยาว์, การ Raid ถล่มเซิร์ฟเวอร์, แจกลิงก์อันตราย หรือการคุกคามรุนแรง จะทำการ <span className="text-white font-semibold underline">แบนถาวรทันทีโดยไม่ต้องตักเตือน</span>
                </div>
              </div>

              {/* Sub-section 4: วิธีรายงาน และ การอุทธรณ์ */}
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 uppercase tracking-wider mb-4 pb-2 border-b border-white/[0.08]">
                  <span>[SECTION 04]</span>
                  <span>//</span>
                  <span className="text-white font-semibold">ขั้นตอนการรายงาน การอุทธรณ์ และความช่วยเหลือ</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-5 bg-[#070809] border border-white/[0.1]">
                    <div className="text-xs font-mono text-neutral-400 uppercase tracking-wider mb-1">
                      PROCEDURE_01
                    </div>
                    <h4 className="text-base font-bold text-white mb-2">{PROCEDURES.report.title}</h4>
                    <div className="text-xs font-mono text-emerald-400 mb-2">
                      {PROCEDURES.report.channel}
                    </div>
                    <p className="text-xs text-neutral-300 leading-relaxed">
                      {PROCEDURES.report.instruction}
                    </p>
                  </div>

                  <div className="p-5 bg-[#070809] border border-white/[0.1]">
                    <div className="text-xs font-mono text-neutral-400 uppercase tracking-wider mb-1">
                      PROCEDURE_02
                    </div>
                    <h4 className="text-base font-bold text-white mb-2">{PROCEDURES.appeal.title}</h4>
                    <div className="text-xs font-mono text-amber-400 mb-2">
                      {PROCEDURES.appeal.channel}
                    </div>
                    <p className="text-xs text-neutral-300 leading-relaxed">
                      {PROCEDURES.appeal.instruction}
                    </p>
                  </div>

                  <div className="p-5 bg-[#070809] border border-white/[0.1]">
                    <div className="text-xs font-mono text-neutral-400 uppercase tracking-wider mb-1">
                      PROCEDURE_03
                    </div>
                    <h4 className="text-base font-bold text-white mb-2">{PROCEDURES.crisis.title}</h4>
                    <div className="text-xs font-mono text-sky-400 mb-2">
                      สายด่วนสุขภาพจิต 1323 (ตลอด 24 ชม.)
                    </div>
                    <p className="text-xs text-neutral-300 leading-relaxed">
                      {PROCEDURES.crisis.instruction}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ================= TAB 2: กฎทีมงานและระเบียบปฏิบัติ 9 หมวด ================= */}
          {activeTab === "staff" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-4 bg-white/[0.02] border border-white/[0.08] text-xs text-neutral-300 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="font-semibold text-white font-mono mr-2">[STAFF CODE OF ETHICS]:</span>
                  คู่มือระเบียบปฏิบัติ จริยธรรม และมาตรฐานการทำงานของทีมงาน 753 BC DISCORD SERVER ครอบคลุมทั้ง 9 หมวด
                </div>
                <div className="text-[11px] font-mono text-neutral-500">
                  REF: BOT-LYNN-RULES // V1.0
                </div>
              </div>

              {filteredStaffChapters.map((chapter) => {
                const isExpanded = expandedChapter === chapter.chapter;

                return (
                  <div
                    key={chapter.chapter}
                    className="bg-[#070809] border border-white/[0.1] overflow-hidden transition-colors"
                  >
                    {/* Chapter Header Accordion Click */}
                    <button
                      onClick={() =>
                        setExpandedChapter(isExpanded ? null : chapter.chapter)
                      }
                      className="w-full px-4 sm:px-7 py-3.5 sm:py-4 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors cursor-pointer border-b border-white/[0.06] gap-3"
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                        <span className="px-2 py-0.5 text-xs font-mono bg-white/[0.05] border border-white/[0.1] text-white font-semibold shrink-0">
                          หมวดที่ {chapter.chapter}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm sm:text-base font-bold text-white leading-snug">{chapter.title}</div>
                          <div className="text-xs text-neutral-400 hidden sm:block truncate mt-0.5">
                            {chapter.subtitle}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] font-mono text-neutral-500 hidden sm:inline">
                          {chapter.articles.length} ข้อบังคับ
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-neutral-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-neutral-400" />
                        )}
                      </div>
                    </button>

                    {/* Chapter Content Articles */}
                    {isExpanded && (
                      <div className="p-5 sm:p-7 space-y-4 animate-in fade-in duration-150">
                        {chapter.articles.map((art) => (
                          <div
                            key={art.id}
                            className="p-3.5 bg-white/[0.015] border border-white/[0.06]"
                          >
                            <div className="flex items-start gap-2.5">
                              <span className="text-[11px] font-mono font-bold text-neutral-400 px-1.5 py-0.2 bg-white/[0.04] border border-white/[0.08] shrink-0 mt-0.5">
                                {art.num}
                              </span>
                              <div className="flex-1">
                                <div className="text-xs sm:text-sm text-neutral-200 leading-relaxed font-medium">
                                  {art.content}
                                </div>

                                {art.subArticles && art.subArticles.length > 0 && (
                                  <ul className="mt-2.5 pl-3 border-l border-white/[0.1] space-y-1.5">
                                    {art.subArticles.map((sub, sIdx) => (
                                      <li
                                        key={sIdx}
                                        className="text-xs text-neutral-400 leading-relaxed"
                                      >
                                        • {sub}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

        </section>

      </div>
    </div>
  );
}
