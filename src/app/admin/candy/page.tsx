"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Coins, Sparkles, CheckCircle2, AlertCircle, ArrowUpRight } from "lucide-react";
import Button from "@/components/ui/Button";
import Link from "next/link";

export default function AdminOverviewPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["candy-admin-overview"],
    queryFn: async () => {
      const res = await fetch("/api/admin/candy/overview", {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (!res.ok) throw new Error("Failed to load overview");
      return res.json();
    },
    refetchInterval: 2500,
  });

  const stats = data?.stats || {
    budgetTotal: 0,
    budgetClaimed: 0,
    budgetReserved: 0,
    budgetRemaining: 0,
    totalDrops: 0,
    activeDrops: 0,
    totalClaims: 0,
    totalUsers: 0,
  };

  const percentClaimed = stats.budgetTotal > 0 ? Math.min(100, Math.round((stats.budgetClaimed / stats.budgetTotal) * 100)) : 0;
  const percentReserved = stats.budgetTotal > 0 ? Math.min(100, Math.round((stats.budgetReserved / stats.budgetTotal) * 100)) : 0;

  return (
    <div className="space-y-6">
      {/* Title & Quick actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">ภาพรวมกิจกรรม Trick or Treat</h1>
          <p className="text-xs text-neutral-400 mt-1">มอนิเตอร์งบประมาณ การดรอป และการเก็บลูกอมแบบเรียลไทม์</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/candy/event">
            <Button variant="secondary">ตั้งค่ากิจกรรม</Button>
          </Link>
          <Link href="/admin/candy/drops">
            <Button variant="primary">ดรอปทันที</Button>
          </Link>
        </div>
      </div>

      {/* KPI Bento Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Budget */}
        <div className="p-5 rounded-xl bg-neutral-950/70 border border-white/10 relative overflow-hidden">
          <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">งบประมาณรวม</div>
          <div className="text-2xl font-bold text-white">฿{stats.budgetTotal.toLocaleString()}</div>
          <div className="text-[11px] text-neutral-400 mt-1.5 font-mono">1 ลูกอม = 1 บาท</div>
          <Coins className="w-8 h-8 text-white/5 absolute right-4 bottom-4" />
        </div>

        {/* Card 2: Claimed */}
        <div className="p-5 rounded-xl bg-neutral-950/70 border border-emerald-500/20 relative overflow-hidden">
          <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">ถูกเก็บไปแล้ว</div>
          <div className="text-2xl font-bold text-emerald-300">฿{stats.budgetClaimed.toLocaleString()}</div>
          <div className="text-[11px] text-emerald-400/80 mt-1.5 font-mono">{percentClaimed}% ของงบทั้งหมด</div>
          <CheckCircle2 className="w-8 h-8 text-emerald-500/10 absolute right-4 bottom-4" />
        </div>

        {/* Card 3: Reserved */}
        <div className="p-5 rounded-xl bg-neutral-950/70 border border-orange-500/20 relative overflow-hidden">
          <div className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-1">จองในดรอปที่เปิดอยู่</div>
          <div className="text-2xl font-bold text-orange-300">฿{stats.budgetReserved.toLocaleString()}</div>
          <div className="text-[11px] text-orange-400/80 mt-1.5 font-mono">{percentReserved}% (รอคนเก็บ)</div>
          <Sparkles className="w-8 h-8 text-orange-500/10 absolute right-4 bottom-4" />
        </div>

        {/* Card 4: Remaining */}
        <div className="p-5 rounded-xl bg-neutral-950/70 border border-white/10 relative overflow-hidden">
          <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">งบคงเหลือสำหรับสุ่ม</div>
          <div className="text-2xl font-bold text-white">฿{stats.budgetRemaining.toLocaleString()}</div>
          <div className="text-[11px] text-neutral-400 mt-1.5 font-mono">พร้อมสุ่มดรอปลงห้อง</div>
        </div>
      </div>

      {/* Budget Progress Bar */}
      <div className="p-5 rounded-xl bg-neutral-950/70 border border-white/10 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-neutral-300">สัดส่วนการใช้งบประมาณ</span>
          <span className="text-neutral-400 font-mono">
            {stats.budgetClaimed} / {stats.budgetTotal} 🍬
          </span>
        </div>
        <div className="h-3 w-full bg-neutral-900 rounded-full overflow-hidden flex">
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${percentClaimed}%` }}
            title={`ถูกเก็บแล้ว ${percentClaimed}%`}
          />
          <div
            className="h-full bg-orange-500 transition-all duration-500 opacity-60"
            style={{ width: `${Math.max(0, percentReserved - percentClaimed)}%` }}
            title={`จองในดรอป ${percentReserved}%`}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> เก็บแล้ว ({stats.budgetClaimed} 🍬)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-orange-500 opacity-60" /> กำลังเปิดดรอป ({stats.budgetReserved - stats.budgetClaimed} 🍬)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-neutral-700" /> ยังไม่ได้ดรอป ({stats.budgetRemaining} 🍬)
          </span>
        </div>
      </div>

      {/* Live Feeds Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Claims Feed */}
        <div className="p-5 rounded-xl bg-neutral-950/70 border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">ประวัติการเก็บล่าสุด</h2>
            <Link href="/admin/candy/claims" className="text-xs text-neutral-400 hover:text-white flex items-center gap-1">
              ดูทั้งหมด <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {data?.recentClaims?.length === 0 ? (
              <div className="text-xs text-neutral-500 py-6 text-center">ยังไม่มีประวัติการเก็บลูกอม</div>
            ) : (
              data?.recentClaims?.map((c: any) => (
                <div key={c.id} className="p-2.5 rounded-lg bg-neutral-900 border border-white/5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-white">{c.userName || `ผู้ใช้ ${c.discordId}`}</span>
                    <span className="text-[11px] text-neutral-400 ml-2">อยู่ในเสียง {c.voiceSeconds}s</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">+{c.amount} 🍬</span>
                    <span className="text-[10px] text-neutral-500 font-mono">{c.latencyMs}ms</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Drops Feed */}
        <div className="p-5 rounded-xl bg-neutral-950/70 border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">ดรอปล่าสุด</h2>
            <Link href="/admin/candy/drops" className="text-xs text-neutral-400 hover:text-white flex items-center gap-1">
              ดูทั้งหมด <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {data?.recentDrops?.length === 0 ? (
              <div className="text-xs text-neutral-500 py-6 text-center">ยังไม่มีการดรอป</div>
            ) : (
              data?.recentDrops?.map((d: any) => (
                <div key={d.id} className="p-2.5 rounded-lg bg-neutral-900 border border-white/5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-white">ดรอป {d.amount} ลูก</span>
                    <span className="text-[11px] text-neutral-400 ml-2">#{d.channelName || d.channelId}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${d.status === "ACTIVE" ? "bg-orange-500/20 text-orange-400" : d.status === "CLAIMED" ? "bg-emerald-500/20 text-emerald-400" : "bg-neutral-800 text-neutral-400"}`}>
                      {d.status} ({d.claimedCount}/{d.maxClaimers})
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
