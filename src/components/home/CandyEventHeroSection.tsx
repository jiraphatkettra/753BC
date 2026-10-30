"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Sparkles, Trophy, BookOpen, Wallet, ArrowUpRight, Volume2, ShieldCheck, Clock } from "lucide-react";
import Button from "@/components/ui/Button";

export default function CandyEventHeroSection() {
  return (
    <section className="relative w-full flex justify-center mt-10 sm:mt-12 md:mt-14">
      {/* Central Bento Grid Container */}
      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Continuous vertical guide lines layer */}
        <div className="pointer-events-none absolute -top-6 -bottom-8 left-4 sm:left-6 lg:left-8 right-4 sm:right-6 lg:right-8 [mask-image:linear-gradient(to_bottom,transparent_0%,black_24px,black_calc(100%-32px),transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,black_24px,black_calc(100%-32px),transparent_100%)] z-10">
          <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-white/[0.08]" />
          <div className="hidden lg:block absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[1px] bg-white/[0.08]" />
          <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-white/[0.08]" />
        </div>

        {/* Section Frame Container */}
        <div className="relative w-full bg-[#070809] border border-orange-500/30 overflow-hidden shadow-[0_0_50px_rgba(249,115,22,0.06)]">
          {/* Subtle Ambient Radial Glow */}
          <div className="pointer-events-none absolute -right-24 -top-24 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
          <div className="pointer-events-none absolute -left-24 -bottom-24 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl" />

          {/* Top Technical Guide Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 h-8 sm:h-9 relative text-[10px] font-mono text-neutral-400 uppercase tracking-widest select-none border-b border-white/[0.08] bg-black/40">
            <div className="px-5 sm:px-7 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-orange-400 font-semibold">EVENT_SPOTLIGHT // HALLOWEEN_2026</span>
              <span className="text-neutral-700">/</span>
              <span className="text-neutral-400">TRICK_OR_TREAT</span>
            </div>
            <div className="hidden lg:flex px-5 sm:px-7 items-center justify-end gap-3 text-neutral-400">
              <span>30 ต.ค. 23:30 — 31 ต.ค. 00:30 (1 ชม. เต็ม)</span>
              <span className="text-neutral-700">|</span>
              <span className="text-orange-400 font-semibold">1 CANDY = ฿1 CASH</span>
            </div>
          </div>

          {/* Main 2-Column Bento Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.08]">
            {/* Left Content Column (7 cols) */}
            <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                {/* Event Status Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-500/15 border border-orange-500/40 text-orange-400 text-[11px] font-semibold font-mono tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>HALLOWEEN SPECIAL NIGHT</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono font-bold">
                    <span>1 ลูกอม = 1 บาท (เงินจริง)</span>
                  </span>
                </div>

                {/* Headline */}
                <div>
                  <div className="text-[11px] sm:text-xs font-mono text-neutral-400 uppercase tracking-widest mb-1.5">
                    CHANGE CANDY TO MONEY // กิจกรรมพิเศษปล่อยผี
                  </div>
                  <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                    TRICK OR TREAT <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-200">
                      เปลี่ยนลูกอมให้เป็นเงินสดจริง!
                    </span>
                  </h2>
                </div>

                <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-xl">
                  ลูกอมจะสุ่มดรอปตามห้องข้อความในดิสคอร์ด 753BC ตลอด 1 ชั่วโมงเต็ม เพียงเชื่อมต่ออยู่ในห้องพูดคุยเสียง (Voice)
                  ก็มีสิทธิ์กดรับลูกอมและนำมาแลกเปลี่ยนเป็นเงินสดโอนตรงเข้าพร้อมเพย์ 1:1 ได้ทันที!
                </p>

                {/* Rule Highlights Bento Chips */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-white/[0.02] border border-white/[0.08] flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 shrink-0">
                      <Volume2 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">ต้องอยู่ในห้องเสียง (Voice)</div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">
                        เชื่อมต่อห้องพูดคุยเสียงใดก็ได้ (ยกเว้นห้อง AFK) จึงจะมีสิทธิ์กดเก็บ
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-white/[0.02] border border-white/[0.08] flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                      <Wallet className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">แลกเงินสดได้ 1:1</div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">
                        1 ลูกอม = 1 บาท โอนเข้าพร้อมเพย์จริง หลังเสร็จสิ้นกิจกรรม
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-3 border-t border-white/[0.08]">
                <Link href="/candy">
                  <Button variant="primary" showArrow className="px-5 py-3 text-xs sm:text-sm bg-orange-500 hover:bg-orange-400 text-black font-bold">
                    เข้าสู่หน้ากิจกรรม Trick or Treat
                  </Button>
                </Link>

                <Link href="/candy/me">
                  <Button variant="secondary" className="px-4 py-3 text-xs sm:text-sm border-white/20">
                    <Wallet className="w-3.5 h-3.5 mr-1.5 text-neutral-400" />
                    ดูกระเป๋าของฉัน
                  </Button>
                </Link>

                <Link href="/candy/leaderboard" className="text-xs text-neutral-400 hover:text-white transition flex items-center gap-1.5 px-3 py-2">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>อันดับผู้ล่าลูกอม</span>
                </Link>

                <Link href="/candy/rules" className="text-xs text-neutral-400 hover:text-white transition flex items-center gap-1.5 px-3 py-2">
                  <BookOpen className="w-3.5 h-3.5 text-orange-400" />
                  <span>หนังสือกติกา 5 ข้อ</span>
                </Link>
              </div>
            </div>

            {/* Right Banner Artwork Column (5 cols) */}
            <div className="lg:col-span-5 relative flex flex-col justify-between p-6 sm:p-8 bg-black/60">
              {/* Artwork Container (Clickable to /candy) */}
              <Link
                href="/candy"
                className="group relative w-full aspect-[16/10] sm:aspect-[16/9] lg:aspect-[4/3] rounded-xl overflow-hidden border border-white/10 hover:border-orange-500/50 transition-all duration-300 block shadow-2xl"
              >
                <Image
                  src="/event-trickortreat.png"
                  alt="753BC Trick or Treat เปลี่ยนลูกอมให้เป็นเงิน"
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90 group-hover:opacity-60 transition-opacity" />

                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                  <span className="font-bold tracking-wide drop-shadow">คลิกเพื่อเข้าสู่แดชบอร์ดกิจกรรม</span>
                  <div className="w-7 h-7 rounded-full bg-orange-500 text-black flex items-center justify-center group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>

              {/* Bottom Schedule Pill */}
              <div className="mt-4 p-3 rounded-lg bg-white/[0.02] border border-white/[0.08] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-neutral-400">
                  <Clock className="w-3.5 h-3.5 text-orange-400" />
                  <span>กำหนดการกิจกรรม:</span>
                </div>
                <span className="font-mono font-bold text-white">30 ต.ค. 23:30 - 31 ต.ค. 00:30</span>
              </div>
            </div>
          </div>

          {/* Bottom Technical Strip */}
          <div className="grid grid-cols-1 lg:grid-cols-2 h-7 sm:h-8 relative text-[10px] font-mono text-neutral-500 uppercase tracking-widest select-none border-t border-white/[0.08] bg-black/50">
            <div className="px-5 sm:px-7 flex items-center gap-2">
              <span>FIG_01.5</span>
              <span className="text-neutral-700">//</span>
              <span>753BC_COMMUNITY_SEASONAL</span>
            </div>
            <div className="hidden lg:flex px-5 sm:px-7 items-center justify-end gap-2 text-neutral-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>SYSTEM_READY // 1 CANDY = ฿1</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
