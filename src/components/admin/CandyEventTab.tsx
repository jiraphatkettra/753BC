"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Sparkles,
  Coins,
  History,
  Users,
  Palette,
  Terminal,
  Hash,
  Play,
  Pause,
  ArrowUpRight,
  Plus,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  QrCode,
  Copy,
  Check,
  X,
  Send,
} from "lucide-react";
import CaptionRow from "@/components/ui/CaptionRow";
import Button from "@/components/ui/Button";
import { generatePromptPayPayload, generatePromptPayQrSvg } from "@/lib/promptpay";

export default function CandyEventTab() {
  const queryClient = useQueryClient();
  const [notification, setNotification] = useState<{ type: "success" | "warning" | "error"; text: string } | null>(null);
  const [selectedRedeem, setSelectedRedeem] = useState<any | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Overview Stats
  const { data: overviewData } = useQuery({
    queryKey: ["candy-admin-overview"],
    queryFn: async () => {
      const res = await fetch("/api/admin/candy/overview", {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (!res.ok) return null;
      return res.json();
    },
    refetchInterval: 2500,
  });

  // Event Data
  const { data: eventData } = useQuery({
    queryKey: ["candy-admin-event"],
    queryFn: async () => {
      const res = await fetch("/api/admin/candy/event", {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (!res.ok) return null;
      return res.json();
    },
    refetchInterval: 3000,
  });

  // Bot Status
  const { data: botStatus } = useQuery({
    queryKey: ["candy-bot-status"],
    queryFn: async () => {
      const res = await fetch("/api/admin/candy/bot/status", {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (!res.ok) return { online: false };
      return res.json();
    },
    refetchInterval: 3000,
  });

  // Redemptions Data
  const { data: redemptionsData } = useQuery({
    queryKey: ["candy-admin-redemptions"],
    queryFn: async () => {
      const res = await fetch("/api/admin/candy/redemptions");
      if (!res.ok) return null;
      return res.json();
    },
    refetchInterval: 5000,
  });

  const event = eventData?.event;
  const stats = overviewData?.stats || {
    budgetTotal: 0,
    budgetClaimed: 0,
    budgetReserved: 0,
    budgetRemaining: 0,
    totalDrops: 0,
    activeDrops: 0,
    totalClaims: 0,
    totalUsers: 0,
  };

  const isBotOnline = Boolean(botStatus?.online && Date.now() - (botStatus?.timestamp || 0) < 30000);
  const redemptions: any[] = redemptionsData?.redemptions || [];
  const pendingRedemptions = redemptions.filter((r) => r.status === "PENDING" || r.status === "APPROVED");

  const commandMutation = useMutation({
    mutationFn: async (type: "EVENT_START" | "EVENT_PAUSE" | "EVENT_RESUME" | "EVENT_END") => {
      const res = await fetch("/api/admin/candy/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      if (!res.ok) throw new Error("Command failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candy-admin-event"] });
      queryClient.invalidateQueries({ queryKey: ["candy-admin-overview"] });
      setNotification({ type: "success", text: "คำสั่งถูกส่งไปยังคิวของบอทเรียบร้อยแล้ว" });
      setTimeout(() => setNotification(null), 3000);
    },
  });

  const instantDropMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/candy/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "DROP_NOW", payload: { amount: 1, maxClaimers: 1 } }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to drop");
      }
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["candy-admin-overview"] });
      queryClient.invalidateQueries({ queryKey: ["candy-admin-event"] });
      setNotification({ type: "success", text: data.message || "⚡ สั่งดรอปลูกอมทันทีสำเร็จ! (แท็กยศเรียบร้อย)" });
      setTimeout(() => setNotification(null), 4000);
    },
    onError: (err: any) => {
      setNotification({ type: "error", text: err.message });
      setTimeout(() => setNotification(null), 4000);
    },
  });

  const payMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch("/api/admin/candy/redemptions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "PAID" }),
      });
      if (!res.ok) throw new Error("Failed to confirm payout");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["candy-admin-redemptions"] });
      queryClient.invalidateQueries({ queryKey: ["candy-admin-overview"] });
      setSelectedRedeem(null);

      if (data.dmSent) {
        setNotification({
          type: "success",
          text: "✅ ยืนยันการโอนเงินสำเร็จ และบอทได้ส่งข้อความ DM แจ้งเตือนเข้า Discord ของผู้รับแล้ว!",
        });
      } else {
        setNotification({
          type: "warning",
          text: `⚠️ ยืนยันการโอนเงินสำเร็จ แต่ส่ง DM ไม่สำเร็จ (${data.dmError || "ผู้ใช้อาจปิดรับข้อความ DM ในดิสคอร์ด"})`,
        });
      }
      setTimeout(() => setNotification(null), 6000);
    },
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const SUB_MODULES = [
    {
      title: "คิวขอแลกเงินสด (Redemptions & QR)",
      desc: "สแกน PromptPay QR เพื่อโอนเงิน ยืนยันการโอน และบอทจะส่ง DM อัตโนมัติ",
      href: "/admin/candy/redemptions",
      icon: Coins,
      badge: `${pendingRedemptions.length} รอโอน`,
    },
    {
      title: "Candy Embed Studio",
      desc: "ปรับแต่ง Embed ของบอททุกส่วน (34 เทมเพลต ธีม Rulebook โทนสี #A0714F)",
      href: "/admin/candy/embeds",
      icon: Palette,
      badge: "34 TEMPLATES",
    },
    {
      title: "ตั้งค่า & ควบคุมกิจกรรม",
      desc: "งบประมาณ เวลาจัดงาน เงื่อนไขห้องพูดคุยเสียง (Voice) และปุ่มเริ่ม/พักกิจกรรม",
      href: "/admin/candy/event",
      icon: Play,
      badge: "CONFIG & RULES",
    },
    {
      title: "ห้องที่เปิดดรอป",
      desc: "เลือกห้องข้อความใน Discord ที่อนุญาตให้บอทสุ่มดรอปลูกอมลงไป",
      href: "/admin/candy/channels",
      icon: Hash,
      badge: "CHANNELS",
    },
    {
      title: "ประวัติดรอป & สั่งดรอปทันที",
      desc: "มอนิเตอร์กล่องดรอปลูกอมที่กำลังออนไลน์ และสั่งดรอปแบบกำหนดห้องด้วยมือ",
      href: "/admin/candy/drops",
      icon: Sparkles,
      badge: "MANUAL DROP",
    },
    {
      title: "บันทึกการเก็บ (Claims Audit)",
      desc: "ตรวจสอบเวลาปฏิกิริยา (Latency ms) ตรวจจับมาโคร/บอท และ Voice State",
      href: "/admin/candy/claims",
      icon: History,
      badge: "ANTI-CHEAT",
    },
    {
      title: "ผู้เล่น & กระเป๋าลูกอม",
      desc: "ดูยอดคงเหลือ ปรับเพิ่ม/ลดลูกอมของสมาชิก พร้อมบันทึกเหตุผลลง Ledger",
      href: "/admin/candy/users",
      icon: Users,
      badge: "WALLETS",
    },
    {
      title: "Command Queue & Audit Logs",
      desc: "ตรวจสอบคิวคำสั่งระหว่างเว็บไซต์กับบอทดิสคอร์ด และประวัติการทำงานของแอดมิน",
      href: "/admin/candy/logs",
      icon: Terminal,
      badge: "SYSTEM LOGS",
    },
  ];

  return (
    <div className="p-6 sm:p-8 space-y-8">
      <CaptionRow label="SEASONAL_EVENT // TRICK_OR_TREAT_2026" meta="CANDY_SYSTEM_MANAGEMENT" />

      {/* Header & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-white/[0.08] p-5 bg-[#040506]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-2xl">
            🍬
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                753BC Trick or Treat: เปลี่ยนลูกอมให้เป็นเงิน
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-orange-500/20 text-orange-400 border border-orange-500/30 font-semibold">
                1 CANDY = ฿1
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-neutral-400 mt-1">
              <span className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isBotOnline ? "bg-emerald-400 animate-pulse" : "bg-red-500"}`} />
                <span className="font-mono">Candy Bot: {isBotOnline ? "ONLINE" : "OFFLINE"}</span>
              </span>
              <span>•</span>
              <span className="font-mono">
                สถานะกิจกรรม: <strong className="text-white">{event?.status || "NO_EVENT"}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="secondary"
            onClick={() => instantDropMutation.mutate()}
            isLoading={instantDropMutation.isPending}
            icon={<Sparkles className="w-4 h-4 text-orange-400" />}
          >
            ⚡ สั่งดรอปทันที 1 ลูก
          </Button>

          {event?.status === "RUNNING" ? (
            <Button
              variant="secondary"
              onClick={() => commandMutation.mutate("EVENT_PAUSE")}
              isLoading={commandMutation.isPending}
              icon={<Pause className="w-4 h-4" />}
            >
              พักกิจกรรม
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={() => commandMutation.mutate("EVENT_START")}
              isLoading={commandMutation.isPending}
              icon={<Play className="w-4 h-4" />}
            >
              เริ่มกิจกรรม
            </Button>
          )}

          <Link href="/admin/candy" className="inline-block">
            <Button variant="secondary" icon={<ExternalLink className="w-3.5 h-3.5" />}>
              เปิดแดชบอร์ดเต็ม
            </Button>
          </Link>
        </div>
      </div>

      {notification && (
        <div
          className={`p-3 border text-xs font-mono flex items-center gap-2 ${
            notification.type === "success"
              ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
              : notification.type === "warning"
              ? "bg-amber-950/40 border-amber-500/40 text-amber-300"
              : "bg-red-950/40 border-red-500/40 text-red-300"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
          )}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Real-time KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 border border-white/[0.08] bg-[#040506]">
          <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block mb-1">
            งบประมาณรวม (Total Budget)
          </span>
          <div className="text-2xl font-bold font-mono text-white">฿{stats.budgetTotal.toLocaleString()}</div>
          <span className="text-[11px] text-neutral-500 font-mono mt-1 block">1 ลูกอม = 1 บาท</span>
        </div>

        <div className="p-4 border border-emerald-500/20 bg-emerald-950/10">
          <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block mb-1">
            ถูกเก็บไปแล้ว (Claimed)
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-300">฿{stats.budgetClaimed.toLocaleString()}</div>
          <span className="text-[11px] text-emerald-400/70 font-mono mt-1 block">
            {stats.budgetTotal > 0 ? Math.round((stats.budgetClaimed / stats.budgetTotal) * 100) : 0}% ของงบทั้งหมด
          </span>
        </div>

        <div className="p-4 border border-orange-500/20 bg-orange-950/10">
          <span className="text-[10px] font-mono text-orange-400 uppercase tracking-wider block mb-1">
            จองในดรอปที่เปิดอยู่
          </span>
          <div className="text-2xl font-bold font-mono text-orange-300">฿{stats.budgetReserved.toLocaleString()}</div>
          <span className="text-[11px] text-orange-400/70 font-mono mt-1 block">
            {stats.activeDrops} ดรอปที่ยังไม่หมดอายุ
          </span>
        </div>

        <div className="p-4 border border-white/[0.08] bg-[#040506]">
          <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block mb-1">
            งบคงเหลือสำหรับสุ่ม
          </span>
          <div className="text-2xl font-bold font-mono text-white">฿{stats.budgetRemaining.toLocaleString()}</div>
          <span className="text-[11px] text-neutral-500 font-mono mt-1 block">พร้อมสุ่มดรอปอัตโนมัติ</span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* ── LIVE PENDING REDEMPTIONS SECTION WITH QUICK SCAN ── */}
      {/* ============================================================== */}
      <div className="p-5 border border-orange-500/30 bg-[#040506] rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-orange-400" />
            <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
              คิวขอแลกเงินรางวัลที่รอโอน ({pendingRedemptions.length} รายการ)
            </h3>
          </div>
          <Link
            href="/admin/candy/redemptions"
            className="text-xs text-orange-400 hover:text-orange-300 transition flex items-center gap-1 font-mono"
          >
            <span>จัดการคิวแลกเงินทั้งหมด</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {pendingRedemptions.length === 0 ? (
          <div className="p-6 text-center text-xs text-neutral-500 border border-white/5 rounded-lg bg-black/40">
            ไม่มีคำขอแลกเงินที่รอการโอนในขณะนี้
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingRedemptions.slice(0, 6).map((r) => (
              <div
                key={r.id}
                className="p-3.5 border border-white/[0.08] hover:border-orange-500/40 bg-neutral-950 rounded-lg flex flex-col justify-between space-y-3 transition"
              >
                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-neutral-400">ID: {r.discordId}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-orange-500/20 text-orange-400 font-bold">
                      {r.amount} 🍬
                    </span>
                  </div>
                  <div className="text-lg font-bold text-emerald-400 font-mono mt-1">
                    ฿{r.bahtAmount.toLocaleString()}.00 บาท
                  </div>
                  <div className="text-[11px] text-white font-mono mt-0.5">
                    พร้อมเพย์: <strong>{r.payoutTarget}</strong>
                  </div>
                  <div className="text-[11px] text-neutral-400 truncate">
                    {r.accountName || "ไม่ระบุชื่อบัญชี"}
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center gap-2">
                  <button
                    onClick={() => setSelectedRedeem(r)}
                    className="flex-1 py-1.5 px-2 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-orange-300 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>สแกน QR โอน</span>
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`ยืนยันว่าโอนเงิน ฿${r.bahtAmount} ให้ ${r.payoutTarget} เรียบร้อยแล้ว? ระบบจะส่ง DM ไปยังดิสคอร์ดทันที`)) {
                        payMutation.mutate(r.id);
                      }
                    }}
                    disabled={payMutation.isPending}
                    className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold transition cursor-pointer"
                  >
                    โอนแล้ว
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 8 Module Navigation Bento */}
      <div>
        <div className="text-xs font-mono text-neutral-400 uppercase tracking-wider mb-3">
          ■ MODULE_DIRECT_ACCESS (เลือกระบบย่อยเพื่อจัดการ)
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {SUB_MODULES.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link
                key={mod.href}
                href={mod.href}
                className="group p-5 border border-white/[0.08] hover:border-orange-500/40 bg-[#040506] hover:bg-white/[0.01] transition flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] group-hover:border-orange-500/40 flex items-center justify-center text-white/80 group-hover:text-orange-400 transition">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[9px] font-mono px-2 py-0.5 bg-white/[0.04] text-neutral-400 group-hover:text-orange-300 border border-white/[0.06] font-semibold">
                      {mod.badge}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-white group-hover:text-orange-300 transition">{mod.title}</h3>
                  <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">{mod.desc}</p>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-mono text-neutral-500 group-hover:text-white pt-2 border-t border-white/[0.04] transition">
                  <span>เปิดระบบย่อย</span>
                  <ArrowUpRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Public Pages Quick Jump */}
      <div className="p-4 border border-white/[0.08] bg-[#040506] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-neutral-300">
          <span className="w-2 h-2 rounded-full bg-orange-400" />
          <span>หน้าฝั่งผู้ใช้งาน (Public Pages):</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/candy"
            target="_blank"
            className="px-3 py-1.5 rounded bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-xs text-white transition inline-flex items-center gap-1.5"
          >
            <span>หน้ากิจกรรมหลัก (/candy)</span>
            <ExternalLink className="w-3 h-3 text-neutral-400" />
          </Link>
          <Link
            href="/candy/me"
            target="_blank"
            className="px-3 py-1.5 rounded bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-xs text-white transition inline-flex items-center gap-1.5"
          >
            <span>กระเป๋าผู้ใช้ (/candy/me)</span>
            <ExternalLink className="w-3 h-3 text-neutral-400" />
          </Link>
          <Link
            href="/candy/leaderboard"
            target="_blank"
            className="px-3 py-1.5 rounded bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-xs text-white transition inline-flex items-center gap-1.5"
          >
            <span>กระดานผู้นำ (/candy/leaderboard)</span>
            <ExternalLink className="w-3 h-3 text-neutral-400" />
          </Link>
          <Link
            href="/candy/rules"
            target="_blank"
            className="px-3 py-1.5 rounded bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-xs text-white transition inline-flex items-center gap-1.5"
          >
            <span>หนังสือกติกา (/candy/rules)</span>
            <ExternalLink className="w-3 h-3 text-neutral-400" />
          </Link>
        </div>
      </div>

      {/* ============================================================== */}
      {/* ── POPUP MODAL: PROMPTPAY QR CODE & CONFIRM PAID ── */}
      {/* ============================================================== */}
      {selectedRedeem && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#070809] border border-orange-500/40 rounded-2xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl relative">
            <button
              onClick={() => setSelectedRedeem(null)}
              className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[10px] font-mono font-semibold">
                <Sparkles className="w-3 h-3" />
                <span>PROMPTPAY SCAN &amp; PAY</span>
              </div>
              <h2 className="text-lg font-bold text-white">สแกนจ่ายเงินรางวัลฮาโลวีน</h2>
              <p className="text-xs text-neutral-400">
                เปิดแอปธนาคารแล้วสแกน QR เพื่อโอนเงินเข้าพร้อมเพย์ของผู้เล่นได้ทันที
              </p>
            </div>

            <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-inner">
              <div
                dangerouslySetInnerHTML={{
                  __html: generatePromptPayQrSvg(
                    generatePromptPayPayload(selectedRedeem.payoutTarget, selectedRedeem.bahtAmount),
                    220
                  ),
                }}
                className="w-[220px] h-[220px] flex items-center justify-center"
              />
              <div className="text-center mt-2 font-mono text-[11px] text-black font-bold">
                PROMPTPAY // ฿{selectedRedeem.bahtAmount.toLocaleString()}.00 THB
              </div>
            </div>

            <div className="p-4 rounded-xl bg-neutral-900/80 border border-white/10 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">จำนวนลูกอมที่แลก:</span>
                <span className="font-bold text-orange-400 font-mono text-sm">
                  {selectedRedeem.amount.toLocaleString()} 🍬
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">ยอดเงินที่ต้องโอน:</span>
                <span className="font-bold text-emerald-400 font-mono text-base">
                  ฿{selectedRedeem.bahtAmount.toLocaleString()}.00 บาท
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-white/5">
                <span className="text-neutral-400">เลขพร้อมเพย์:</span>
                <div className="flex items-center gap-1.5 font-mono text-white font-bold">
                  <span>{selectedRedeem.payoutTarget}</span>
                  <button
                    onClick={() => handleCopy(selectedRedeem.payoutTarget)}
                    className="p-1 hover:bg-white/10 rounded transition text-neutral-400 hover:text-white"
                    title="คัดลอกเลขพร้อมเพย์"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">ชื่อเจ้าของบัญชี:</span>
                <span className="font-medium text-white">{selectedRedeem.accountName || "ไม่ระบุชื่อ"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">ผู้ขอ (Discord ID):</span>
                <span className="font-mono text-neutral-300">{selectedRedeem.discordId}</span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                onClick={() => {
                  payMutation.mutate(selectedRedeem.id);
                }}
                disabled={payMutation.isPending}
                className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>
                  {payMutation.isPending ? "กำลังบันทึกและส่ง DM..." : "ยืนยันว่าโอนเงินแล้ว (แจ้งบอทส่ง DM)"}
                </span>
              </button>

              <button
                onClick={() => setSelectedRedeem(null)}
                className="w-full py-2 text-xs text-neutral-400 hover:text-white rounded-lg transition"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
