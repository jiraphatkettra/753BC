"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Download, History } from "lucide-react";
import Button from "@/components/ui/Button";

export default function AdminClaimsPage() {
  const [filterSuspicious, setFilterSuspicious] = useState<boolean>(false);

  const { data: claimsData, isLoading } = useQuery({
    queryKey: ["candy-admin-claims", filterSuspicious],
    queryFn: async () => {
      const url = filterSuspicious ? "/api/admin/candy/claims?suspicious=1" : "/api/admin/candy/claims";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load claims");
      return res.json();
    },
    refetchInterval: 5000,
  });

  const claims: any[] = claimsData?.claims || [];

  const handleExportCSV = () => {
    if (claims.length === 0) return;
    const headers = ["ID", "DropId", "DiscordId", "Amount", "VoiceSeconds", "LatencyMs", "CreatedAt"];
    const rows = claims.map((c) => [c.id, c.dropId, c.discordId, c.amount, c.voiceSeconds, c.latencyMs, c.createdAt]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `claims_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">บันทึกการเก็บลูกอม (Claims Audit)</h1>
          <p className="text-xs text-neutral-400 mt-1">ตรวจสอบเวลาตอบสนอง (Latency) และประวัติ Voice State ของผู้เก็บ</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterSuspicious(!filterSuspicious)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${filterSuspicious ? "bg-red-500 text-white" : "bg-neutral-900 text-neutral-400 hover:text-white border border-white/5"}`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>กรองเฉพาะที่น่าสงสัย (Latency &lt; 250ms)</span>
          </button>
          <Button variant="secondary" onClick={handleExportCSV} icon={<Download className="w-4 h-4" />}>
            Export CSV
          </Button>
        </div>
      </div>

      <div className="bg-neutral-950/70 border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-900/60 border-b border-white/10 text-neutral-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">ผู้เล่น (Discord ID)</th>
                <th className="p-3.5">ดรอปอ้างอิง</th>
                <th className="p-3.5">จำนวน</th>
                <th className="p-3.5">เวลาในห้องเสียง</th>
                <th className="p-3.5">Latency (ปฏิกิริยา)</th>
                <th className="p-3.5">เวลาที่กด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-neutral-300">
              {claims.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-neutral-500">
                    ไม่พบรายการเคลม
                  </td>
                </tr>
              ) : (
                claims.map((c) => {
                  const isFast = c.latencyMs && c.latencyMs < 250;
                  return (
                    <tr key={c.id} className="hover:bg-neutral-900/40 transition">
                      <td className="p-3.5 font-mono text-white font-semibold">{c.discordId}</td>
                      <td className="p-3.5 font-mono text-neutral-400">#{c.dropId.slice(-6)}</td>
                      <td className="p-3.5 font-bold text-emerald-400">+{c.amount} 🍬</td>
                      <td className="p-3.5 text-neutral-300">{c.voiceSeconds} วินาที</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${isFast ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-white/5 text-neutral-300"}`}>
                          {c.latencyMs || 0} ms
                        </span>
                      </td>
                      <td className="p-3.5 text-neutral-400 font-mono text-[11px]">
                        {new Date(c.createdAt).toLocaleTimeString("th-TH")}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
