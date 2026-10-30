"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Hash,
  Sparkles,
  History,
  Users,
  Coins,
  Palette,
  Terminal,
  ExternalLink,
  ArrowLeft,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "ภาพรวมกิจกรรม", href: "/admin/candy", icon: LayoutDashboard },
  { label: "ตั้งค่ากิจกรรม", href: "/admin/candy/event", icon: Calendar },
  { label: "ห้องที่เปิดดรอป", href: "/admin/candy/channels", icon: Hash },
  { label: "ประวัติดรอป", href: "/admin/candy/drops", icon: Sparkles },
  { label: "บันทึกการเก็บ", href: "/admin/candy/claims", icon: History },
  { label: "ผู้เล่น & กระเป๋า", href: "/admin/candy/users", icon: Users },
  { label: "คิวแลกเงินสด", href: "/admin/candy/redemptions", icon: Coins },
  { label: "Embed Studio", href: "/admin/candy/embeds", icon: Palette },
  { label: "Command & Logs", href: "/admin/candy/logs", icon: Terminal },
];

export default function CandyAdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-neutral-950 border-r border-white/10 flex flex-col min-h-screen">
      {/* Brand Header */}
      <div className="p-5 border-b border-white/10 flex items-center justify-between">
        <Link href="/admin/candy" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-lg">
            🍬
          </div>
          <div>
            <div className="font-bold text-sm text-white tracking-wide">753BC CANDY</div>
            <div className="text-[10px] text-neutral-400 font-mono">Control Center</div>
          </div>
        </Link>
      </div>

      {/* Navigation List */}
      <nav className="p-3 space-y-1 flex-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition ${
                isActive
                  ? "bg-white text-black font-semibold shadow-[0_0_15px_rgba(255,255,255,0.08)]"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-900"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Navigation */}
      <div className="p-4 border-t border-white/10 space-y-2">
        <Link
          href="/admin"
          className="flex items-center justify-between px-3 py-2 rounded bg-neutral-900/60 hover:bg-neutral-900 text-xs text-neutral-400 hover:text-white transition"
        >
          <div className="flex items-center gap-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>กลับแดชบอร์ดหลัก</span>
          </div>
        </Link>
        <Link
          href="/candy"
          target="_blank"
          className="flex items-center justify-between px-3 py-2 rounded bg-neutral-900 text-xs text-neutral-300 hover:text-white transition"
        >
          <span>หน้าผู้เล่น (Trick or Treat)</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </aside>
  );
}
