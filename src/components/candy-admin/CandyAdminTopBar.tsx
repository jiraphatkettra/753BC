"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession, signOut } from "next-auth/react";
import { LogOut, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CandyAdminTopBar() {
  const { data: session } = useSession();

  // Poll Bot Status & Event Status
  const { data: botStatus } = useQuery({
    queryKey: ["candy-bot-status"],
    queryFn: async () => {
      const res = await fetch("/api/admin/candy/bot/status");
      if (!res.ok) return { online: false };
      return res.json();
    },
    refetchInterval: 5000,
  });

  const { data: eventData } = useQuery({
    queryKey: ["candy-admin-event"],
    queryFn: async () => {
      const res = await fetch("/api/admin/candy/event");
      if (!res.ok) return null;
      return res.json();
    },
    refetchInterval: 10000,
  });

  const isBotOnline = Boolean(botStatus?.online && Date.now() - (botStatus?.timestamp || 0) < 30000);
  const eventStatus = eventData?.event?.status || "NO_EVENT";

  return (
    <header className="h-16 bg-neutral-950/80 backdrop-blur border-b border-white/10 px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Left: System Status Pills */}
      <div className="flex items-center gap-3">
        {/* Bot Status */}
        <div
          className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 border ${
            isBotOnline
              ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/30"
              : "bg-red-950/40 text-red-400 border-red-500/30"
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${isBotOnline ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
          <span>บอท: {isBotOnline ? "Online" : "Offline"}</span>
        </div>

        {/* Event Status */}
        <div className="px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 border bg-orange-950/30 text-orange-400 border-orange-500/30">
          <span>กิจกรรม: {eventStatus}</span>
        </div>
      </div>

      {/* Right: User Profile */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin"
          className="text-xs text-neutral-400 hover:text-white px-3 py-1.5 rounded border border-white/10 hover:border-white/20 transition hidden sm:inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>ไปแดชบอร์ดหลัก</span>
        </Link>

        {session?.user && (
          <div className="flex items-center gap-2.5">
            {session.user.image ? (
              <img src={session.user.image} alt="" className="w-8 h-8 rounded-full border border-white/20" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-bold text-white">
                {session.user.name?.[0] || "U"}
              </div>
            )}
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-white leading-tight">{session.user.name}</div>
              <div className="text-[10px] text-emerald-400 font-mono">Admin</div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-900 transition ml-2"
              title="ออกจากระบบ"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
