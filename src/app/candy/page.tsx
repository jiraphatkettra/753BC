"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, Trophy, BookOpen, User, ArrowRight, ShieldCheck, Volume2, Coins } from "lucide-react";
import Button from "@/components/ui/Button";

export default function HomePage() {
  const { data: statsData } = useQuery({
    queryKey: ["public-stats"],
    queryFn: async () => {
      const res = await fetch("/api/candy/stats");
      if (!res.ok) return null;
      return res.json();
    },
    refetchInterval: 5000,
  });

  const event = statsData?.event;
  const top5 = statsData?.top5 || [];

  return (
    <div className="min-h-screen bg-[#070809] text-neutral-100 flex flex-col selection:bg-orange-500 selection:text-white">
      {/* Top Navbar */}
      <header className="h-16 border-b border-white/10 px-6 sm:px-12 flex items-center justify-between sticky top-0 z-40 bg-[#070809]/80 backdrop-blur">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-lg">
            🍬
          </div>
          <span className="font-bold text-sm tracking-wider text-white">753BC TRICK OR TREAT</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/candy/rules" className="text-xs text-neutral-400 hover:text-white px-3 py-1.5 transition">
            กติกา
          </Link>
          <Link href="/candy/leaderboard" className="text-xs text-neutral-400 hover:text-white px-3 py-1.5 transition">
            อันดับ
          </Link>
          <Link href="/candy/me">
            <Button variant="primary">กระเป๋าของฉัน</Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-10 space-y-12">
        {/* Hero Banner */}
        <div className="relative rounded-2xl bg-gradient-to-b from-neutral-900 to-neutral-950 border border-white/10 p-8 sm:p-12 overflow-hidden shadow-2xl">
          <div className="absolute -right-10 -bottom-10 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-2xl space-y-5 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>30 ต.ค. 23:30 — 31 ต.ค. 00:30 (1 ชั่วโมงเต็ม)</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              เปลี่ยนลูกอมให้เป็นเงินจริง <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
                1 ลูกอม = เงินสด 1 บาท
              </span>
            </h1>

            <p className="text-sm sm:text-base text-neutral-300 leading-relaxed">
              กิจกรรมพิเศษวันฮาโลวีน ณ เซิร์ฟเวอร์ดิสคอร์ด 753BC ลูกอมจะสุ่มดรอปตามห้องข้อความ
              เพียงอยู่ในห้องพูดคุยเสียงก็มีสิทธิ์กดรับลูกอมและแลกเงินรางวัลเข้าบัญชีพร้อมเพย์!
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link href="/candy/me">
                <Button variant="primary" showArrow className="px-6 py-3 text-sm">
                  ดูกระเป๋า & ขอแลกเงิน
                </Button>
              </Link>
              <Link href="/candy/rules">
                <Button variant="secondary" className="px-6 py-3 text-sm">
                  อ่านหนังสือกติกา
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* 3 Step Guide Bento */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-wider text-center">
            วิธีร่วมสนุกใน 3 ขั้นตอน
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-6 rounded-xl bg-neutral-950/70 border border-white/10 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
                1
              </div>
              <h3 className="font-bold text-white text-sm">เข้าห้องพูดคุยเสียง (Voice)</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                เชื่อมต่อเข้าห้อง Voice Channel ใดก็ได้ใน 753BC (ยกเว้นห้อง AFK) อยู่ในห้องล่วงหน้าเพื่อเตรียมพร้อม
              </p>
            </div>

            <div className="p-6 rounded-xl bg-neutral-950/70 border border-white/10 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 font-bold">
                2
              </div>
              <h3 className="font-bold text-white text-sm">เฝ้าห้องข้อความที่มีการดรอป</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                บอทจะสุ่มส่งกล่องดรอปลูกอมลงในห้องข้อความที่กำหนดอย่างต่อเนื่องตลอด 1 ชั่วโมงของกิจกรรม
              </p>
            </div>

            <div className="p-6 rounded-xl bg-neutral-950/70 border border-white/10 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">
                3
              </div>
              <h3 className="font-bold text-white text-sm">กดปุ่มเก็บลูกอมให้ไวที่สุด</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                กดปุ่มเก็บลูกอมสีเขียวบนกล่องดรอป ใครกดเร็วกว่าได้รับลูกอมทันทีและนำมาแลกเงินสด 1:1
              </p>
            </div>
          </div>
        </div>

        {/* Top 5 Preview & Community Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top 5 */}
          <div className="p-6 rounded-xl bg-neutral-950/70 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Top Candy Hunters</h2>
              </div>
              <Link href="/candy/leaderboard" className="text-xs text-neutral-400 hover:text-white flex items-center gap-1">
                ดูทั้งหมด <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-2">
              {top5.length === 0 ? (
                <div className="text-xs text-neutral-500 py-6 text-center">กำลังรอผู้ล่าลูกอมคนแรก...</div>
              ) : (
                top5.map((u: any, idx: number) => (
                  <div key={u.discordId} className="p-3 rounded-lg bg-neutral-900 border border-white/5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="font-bold font-mono text-sm w-4 text-neutral-400">#{idx + 1}</span>
                      <span className="font-semibold text-white">{u.displayName || u.username}</span>
                    </div>
                    <span className="font-bold text-orange-400 font-mono text-sm">{u.totalEarned} 🍬</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Rules Banner */}
          <div className="p-6 rounded-xl bg-neutral-950/70 border border-white/10 space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>Fair Play & Rules</span>
              </div>
              <h3 className="font-bold text-base text-white">กติกาความยุติธรรม</h3>
              <p className="text-xs text-neutral-300 leading-relaxed">
                ระบบตรวจจับการใช้บอทหรือมาโครอัตโนมัติ หากตรวจพบพฤติกรรมผิดปกติ บัญชีจะถูกระงับสิทธิ์และริบลูกอมทันที
                การตัดสินของทีมงาน 753BC ถือเป็นที่สิ้นสุด
              </p>
            </div>
            <Link href="/candy/rules">
              <Button variant="secondary" className="w-full">
                อ่านกติกา 5 ข้ออย่างละเอียด
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 px-4 text-center text-xs text-neutral-500 font-mono">
        753BC Community Platform • Trick or Treat 2026
      </footer>
    </div>
  );
}

