"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import Button from "@/components/ui/Button";
import DiscordMessagePreview from "@/components/embed-studio/DiscordMessagePreview";
import { DEFAULT_EMBED_TEMPLATES } from "@/lib/candy";

export default function RulesPage() {
  const rulesPayload = DEFAULT_EMBED_TEMPLATES["candy_rules"];

  return (
    <div className="min-h-screen bg-[#070809] text-neutral-100 flex flex-col">
      <header className="h-16 border-b border-white/10 px-6 sm:px-12 flex items-center justify-between sticky top-0 z-40 bg-[#070809]/80 backdrop-blur">
        <Link href="/candy" className="flex items-center gap-2 text-xs text-neutral-400 hover:text-white transition">
          <ArrowLeft className="w-4 h-4" />
          <span>กลับหน้ากิจกรรม</span>
        </Link>
        <span className="font-bold text-sm tracking-wider text-white">RULEBOOK</span>
        <Link href="/candy/me">
          <Button variant="primary">กระเป๋าของฉัน</Button>
        </Link>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center justify-center gap-2">
            <BookOpen className="w-6 h-6 text-orange-400" />
            <span>หนังสือกติกากิจกรรม Trick or Treat</span>
          </h1>
          <p className="text-xs text-neutral-400">
            กติกาอย่างเป็นทางการ 5 หน้า (สามารถกดปุ่มย้อนกลับ/ถัดไปด้านล่างการ์ดเพื่ออ่านทีละหน้า)
          </p>
        </div>

        <div className="rounded-xl overflow-hidden shadow-2xl">
          <DiscordMessagePreview payload={rulesPayload} />
        </div>
      </main>
    </div>
  );
}

