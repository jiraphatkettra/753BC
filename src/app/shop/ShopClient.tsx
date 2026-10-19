"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  ArrowUpRight,
  ExternalLink,
  Sparkles,
  Gift,
  Lock,
  Wallet,
  Shield,
  HelpCircle,
  Dice5,
  Layers,
  ChevronRight,
  AlertCircle,
} from "lucide-react";

interface CategoryTab {
  id: string;
  label: string;
  count: number;
}

const CATEGORIES: CategoryTab[] = [
  { id: "all", label: "ทั้งหมด", count: 0 },
  { id: "roles", label: "ยศและบทบาท", count: 0 },
  { id: "vip", label: "สิทธิพิเศษ VIP", count: 0 },
  { id: "items", label: "ไอเทม & สิทธิประโยชน์", count: 0 },
  { id: "gacha", label: "กล่องสุ่ม", count: 0 },
];

const DISCORD_INVITE_URL = "https://discord.gg/6zcbZ47b5t";

export default function ShopClient() {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [selectedBox, setSelectedBox] = useState<number>(0);

  return (
    <div className="min-h-screen bg-[#070809] text-white selection:bg-white/20 pb-24">
      {/* Top Background Technical Lines & Gradients */}
      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 md:pt-16">

        {/* ======================================================== */}
        {/* 1. Blueprint Section Header (Exact Match to Screenshot)  */}
        {/* ======================================================== */}
        <div className="relative mb-8 sm:mb-12">
          {/* Top Metadata Micro-row */}
          <div className="flex items-center gap-2 text-[10px] sm:text-[11px] font-mono text-neutral-400 uppercase tracking-widest mb-3">
            <span className="w-2 h-2 bg-emerald-400 animate-pulse" />
            <span>STORE_REGISTRY // 753BC</span>
            <span className="text-neutral-600">/</span>
            <span className="text-neutral-400">COMMUNITY SHOP</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-white/[0.08]">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white flex items-center gap-3">
                <span>ร้านค้า &amp; ยศคอมมูนิตี้</span>
                <span className="px-2 py-0.5 text-xs font-mono font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/30">
                  AVAILABLE
                </span>
              </h1>
              <p className="text-sm sm:text-base text-neutral-400 mt-2 max-w-2xl leading-relaxed">
                เลือกซื้อยศพิเศษ สิทธิประโยชน์ และไอเทมดิจิทัลประจำเซิร์ฟเวอร์ 753BC เพื่อสนับสนุนคอมมูนิตี้และรับสิทธิประโยชน์สุดเอ็กซ์คลูซีฟ
              </p>
            </div>

            {/* Quick Action to Discord */}
            <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
              <a
                href={DISCORD_INVITE_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-black bg-white hover:bg-neutral-200 transition-colors duration-150 active:scale-[0.98] border border-white shadow-[0_0_15px_rgba(255,255,255,0.08)] whitespace-nowrap w-full sm:w-auto min-h-[40px]"
              >
                <span>เข้าสู่ดิสคอร์ด 753BC</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Filter Pills Navigation (with counts, matching Events header) */}
          <div className="flex items-center gap-2 sm:gap-3 mt-6 overflow-x-auto pb-2 scrollbar-none [touch-action:pan-x]">
            {CATEGORIES.map((cat) => {
              const isActive = activeTab === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveTab(cat.id)}
                  className={`px-3.5 py-1.5 text-xs font-mono border transition-colors duration-150 flex items-center gap-2 whitespace-nowrap cursor-pointer min-h-[34px] ${
                    isActive
                      ? "bg-white text-black border-white font-semibold"
                      : "bg-white/[0.02] text-neutral-400 border-white/[0.08] hover:border-white/20 hover:text-white"
                  }`}
                >
                  <span>{cat.label}</span>
                  <span
                    className={`px-1.5 py-0.2 text-[10px] font-mono ${
                      isActive ? "bg-black text-white" : "bg-white/[0.08] text-neutral-400"
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ======================================================== */}
        {/* 2. Catalog Compartment (Prepared Filter Space / Empty)   */}
        {/* ======================================================== */}
        <div className="border border-white/[0.08] bg-[#040506] p-8 sm:p-14 text-center relative overflow-hidden mb-12 sm:mb-16">
          {/* Subtle grid background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

          {/* Corner tech accent marks */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-white/20 pointer-events-none" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-white/20 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-white/20 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-white/20 pointer-events-none" />

          <div className="relative z-10 max-w-lg mx-auto flex flex-col items-center">
            <div className="w-14 h-14 border border-white/[0.12] bg-white/[0.03] flex items-center justify-center mb-5">
              <ShoppingBag className="w-6 h-6 text-neutral-400" />
            </div>

            <div className="inline-flex items-center gap-2 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-neutral-400 bg-white/[0.04] border border-white/[0.08] mb-3">
              <span>■ CATALOG_STATUS // INVENTORY_EMPTY</span>
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-white mb-2 tracking-tight">
              ยังไม่มีรายการสินค้าหรือยศเปิดจำหน่ายในหมวดหมู่นี้
            </h3>

            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed mb-6 max-w-md">
              ทีมงานกำลังจัดเตรียมยศพิเศษและไอเทมดิจิทัลชุดใหม่สำหรับชาว 753BC คุณสามารถเติมเงินสะสมพ้อยท์เตรียมไว้ หรือติดตามการอัปเดตผ่านดิสคอร์ด
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <Link
                href="/topup"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-black bg-white hover:bg-neutral-200 transition-colors border border-white min-h-[40px]"
              >
                <Wallet className="w-4 h-4" />
                <span>เติมเงินสะสมพ้อยท์</span>
              </Link>

              <a
                href={DISCORD_INVITE_URL}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-neutral-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition-colors border border-white/[0.1] min-h-[40px]"
              >
                <span>ติดตามประกาศสินค้าใน Discord</span>
                <ExternalLink className="w-3.5 h-3.5 text-neutral-500" />
              </a>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 3. ระบบสุ่มรางวัล (Lucky Draw / Mystery Box / Gacha)     */}
        {/* ======================================================== */}
        <div className="border border-white/[0.08] bg-[#040506] relative">
          {/* Section Header Strip */}
          <div className="px-5 sm:px-8 py-5 border-b border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.01]">
            <div>
              <div className="flex items-center gap-2 text-[10px] sm:text-[11px] font-mono text-neutral-400 uppercase tracking-widest mb-1.5">
                <Dice5 className="w-3.5 h-3.5 text-amber-400" />
                <span>LUCKY_DRAW_SYSTEM // 753BC RANDOM ENGINE</span>
              </div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  ระบบสุ่มรางวัล &amp; กล่องเสี่ยงทาย (Mystery Box)
                </h2>
                <span className="px-2 py-0.5 text-xs font-mono font-medium text-amber-400 bg-amber-500/10 border border-amber-500/30">
                  COMING SOON
                </span>
              </div>
              <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-2xl leading-relaxed">
                เตรียมพบกับระบบสุ่มกล่องของขวัญ กาชาปอง และวงล้อเสี่ยงทายประจำเซิร์ฟเวอร์ 753BC ลุ้นรับแต้มพิเศษ ยศลิมิเต็ด และของรางวัลจริง
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-neutral-500 bg-white/[0.03] px-3 py-1.5 border border-white/[0.08]">
                STATUS: RESERVED_MODULE
              </span>
            </div>
          </div>

          {/* Mystery Box Showcase Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/[0.08]">
            {/* Box 01 */}
            <div
              onClick={() => setSelectedBox(0)}
              className={`p-6 sm:p-8 transition-colors cursor-pointer flex flex-col justify-between relative ${
                selectedBox === 0 ? "bg-white/[0.02]" : "hover:bg-white/[0.01]"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-mono text-neutral-400">SLOT_01 // COMMON</span>
                  <span className="px-2 py-0.5 text-[10px] font-mono text-neutral-400 bg-white/[0.04] border border-white/[0.08] flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" />
                    LOCKED
                  </span>
                </div>

                <div className="w-16 h-16 border border-white/[0.1] bg-white/[0.02] flex items-center justify-center mb-5 mx-auto relative group">
                  <Gift className="w-8 h-8 text-neutral-400 transition-transform group-hover:scale-110" />
                </div>

                <h4 className="text-base font-bold text-white text-center mb-1">
                  753BC Standard Crate
                </h4>
                <p className="text-xs text-neutral-400 text-center leading-relaxed mb-4">
                  กล่องสุ่มระดับมาตรฐาน ลุ้นรับแต้มสะสมพิเศษ และบทบาททดลองใช้ประจำสัปดาห์
                </p>
              </div>

              <div className="pt-4 border-t border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-neutral-500">PRICE:</span>
                  <span className="text-white font-bold">?? POINTS</span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500">
                  <span>ODDS RATE:</span>
                  <span className="text-neutral-400">COMMON 70% | RARE 30%</span>
                </div>
              </div>
            </div>

            {/* Box 02 */}
            <div
              onClick={() => setSelectedBox(1)}
              className={`p-6 sm:p-8 transition-colors cursor-pointer flex flex-col justify-between relative ${
                selectedBox === 1 ? "bg-white/[0.02]" : "hover:bg-white/[0.01]"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-mono text-emerald-400">SLOT_02 // RARE</span>
                  <span className="px-2 py-0.5 text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/30 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" />
                    LOCKED
                  </span>
                </div>

                <div className="w-16 h-16 border border-emerald-500/20 bg-emerald-950/10 flex items-center justify-center mb-5 mx-auto relative group shadow-[0_0_20px_rgba(16,185,129,0.05)]">
                  <Sparkles className="w-8 h-8 text-emerald-400 transition-transform group-hover:scale-110" />
                </div>

                <h4 className="text-base font-bold text-white text-center mb-1">
                  Cyber Mystery Vault
                </h4>
                <p className="text-xs text-neutral-400 text-center leading-relaxed mb-4">
                  หีบนิรภัยไซเบอร์ ลุ้นรับยศระดับสูง และสิทธิประโยชน์ห้องเสียงส่วนตัว
                </p>
              </div>

              <div className="pt-4 border-t border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-neutral-500">PRICE:</span>
                  <span className="text-emerald-400 font-bold">?? POINTS</span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500">
                  <span>ODDS RATE:</span>
                  <span className="text-neutral-400">RARE 60% | EPIC 35% | 5% VIP</span>
                </div>
              </div>
            </div>

            {/* Box 03 */}
            <div
              onClick={() => setSelectedBox(2)}
              className={`p-6 sm:p-8 transition-colors cursor-pointer flex flex-col justify-between relative ${
                selectedBox === 2 ? "bg-white/[0.02]" : "hover:bg-white/[0.01]"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-mono text-amber-400">SLOT_03 // LEGENDARY</span>
                  <span className="px-2 py-0.5 text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/30 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" />
                    LOCKED
                  </span>
                </div>

                <div className="w-16 h-16 border border-amber-500/20 bg-amber-950/10 flex items-center justify-center mb-5 mx-auto relative group shadow-[0_0_20px_rgba(245,158,11,0.05)]">
                  <Shield className="w-8 h-8 text-amber-400 transition-transform group-hover:scale-110" />
                </div>

                <h4 className="text-base font-bold text-white text-center mb-1">
                  Golden 753BC Relic
                </h4>
                <p className="text-xs text-neutral-400 text-center leading-relaxed mb-4">
                  กล่องสุ่มตำนานประจำอีเวนต์ ลุ้นรางวัลเงินสดพร้อมเพย์และยศถาวร
                </p>
              </div>

              <div className="pt-4 border-t border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-neutral-500">PRICE:</span>
                  <span className="text-amber-400 font-bold">?? POINTS</span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500">
                  <span>ODDS RATE:</span>
                  <span className="text-neutral-400">ULTRA RARE / EVENT SPECIAL</span>
                </div>
              </div>
            </div>
          </div>

          {/* Random Roll Interface Preview (Disabled Placeholder) */}
          <div className="p-6 sm:p-10 border-t border-white/[0.08] bg-[#070809] flex flex-col items-center justify-center text-center">
            {/* Spinning Reel Graphic Indicator */}
            <div className="w-full max-w-md p-4 mb-6 border border-white/[0.08] bg-[#040506] flex items-center justify-center gap-4 text-xs font-mono">
              <span className="text-neutral-600">[ ? ]</span>
              <span className="text-neutral-500">───────</span>
              <span className="text-amber-400 font-bold">[ SYSTEM STANDBY ]</span>
              <span className="text-neutral-500">───────</span>
              <span className="text-neutral-600">[ ? ]</span>
            </div>

            <button
              disabled
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-xs sm:text-sm font-semibold text-neutral-500 bg-white/[0.03] border border-white/[0.1] cursor-not-allowed opacity-75 min-h-[44px]"
            >
              <Lock className="w-4 h-4 text-neutral-500" />
              <span>ระบบสุ่มรางวัลยังไม่เปิดให้บริการ</span>
            </button>

            <p className="text-[11px] font-mono text-neutral-500 mt-3 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-neutral-500" />
              <span>ช่องนี้ถูกเว้นไว้เพื่อเตรียมเชื่อมโยงระบบสุ่มไอเทมและของรางวัลจริงในเวอร์ชันถัดไป</span>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
