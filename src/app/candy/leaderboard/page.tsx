"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Trophy, ArrowLeft } from "lucide-react";
import Button from "@/components/ui/Button";

export default function LeaderboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["public-leaderboard"],
    queryFn: async () => {
      const res = await fetch("/api/candy/leaderboard");
      if (!res.ok) throw new Error("Failed to load leaderboard");
      return res.json();
    },
    refetchInterval: 5000,
  });

  const leaderboard: any[] = data?.leaderboard || [];

  return (
    <div className="min-h-screen bg-[#070809] text-neutral-100 flex flex-col">
      <header className="h-16 border-b border-white/10 px-6 sm:px-12 flex items-center justify-between sticky top-0 z-40 bg-[#070809]/80 backdrop-blur">
        <Link href="/candy" className="flex items-center gap-2 text-xs text-neutral-400 hover:text-white transition">
          <ArrowLeft className="w-4 h-4" />
          <span>กลับหน้ากิจกรรม</span>
        </Link>
        <span className="font-bold text-sm tracking-wider text-white">LEADERBOARD</span>
        <Link href="/candy/me">
          <Button variant="primary">กระเป๋าของฉัน</Button>
        </Link>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Trophy className="w-6 h-6 text-amber-400" />
            <span>กระดานผู้นำยอดเก็บลูกอม (Top 50)</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-1">อัปเดตแบบเรียลไทม์จากระบบกิจกรรม 753BC Trick or Treat</p>
        </div>

        <div className="bg-neutral-950/70 border border-white/10 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-900/60 border-b border-white/10 text-neutral-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5 w-16">อันดับ</th>
                  <th className="p-3.5">ผู้เล่น</th>
                  <th className="p-3.5">ลูกอมที่เก็บได้ทั้งหมด</th>
                  <th className="p-3.5">มูลค่าเงินสด</th>
                  <th className="p-3.5 text-right">จำนวนครั้งที่เก็บ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-neutral-300">
                {leaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-neutral-500">
                      ยังไม่มีข้อมูลผู้ล่าลูกอม
                    </td>
                  </tr>
                ) : (
                  leaderboard.map((w, idx) => {
                    const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`;
                    return (
                      <tr key={w.discordId} className="hover:bg-neutral-900/40 transition">
                        <td className="p-3.5 font-bold font-mono text-sm">{medal}</td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            {w.avatar ? (
                              <img src={w.avatar} alt="" className="w-7 h-7 rounded-full bg-neutral-800" />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-neutral-800 flex items-center justify-center font-bold text-white text-[10px]">
                                {w.username?.[0] || "U"}
                              </div>
                            )}
                            <span className="font-semibold text-white">{w.displayName || w.username}</span>
                          </div>
                        </td>
                        <td className="p-3.5 font-bold text-orange-400 font-mono text-sm">{w.totalEarned} 🍬</td>
                        <td className="p-3.5 font-bold text-emerald-400 font-mono">฿{w.totalEarned}</td>
                        <td className="p-3.5 text-right font-mono text-neutral-400">{w.claimCount} ครั้ง</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

