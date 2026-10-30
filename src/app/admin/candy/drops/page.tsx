"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, XCircle, Sparkles, Filter } from "lucide-react";
import Button from "@/components/ui/Button";

export default function AdminDropsPage() {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);
  const [manualForm, setManualForm] = useState({ channelId: "", amount: 5, maxClaimers: 1 });

  const { data: dropsData, isLoading } = useQuery({
    queryKey: ["candy-admin-drops", filterStatus],
    queryFn: async () => {
      const url = filterStatus === "all" ? "/api/admin/candy/drops" : `/api/admin/candy/drops?status=${filterStatus}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load drops");
      return res.json();
    },
    refetchInterval: 5000,
  });

  const { data: channelsData } = useQuery({
    queryKey: ["candy-admin-channels"],
    queryFn: async () => {
      const res = await fetch("/api/admin/candy/channels");
      if (!res.ok) return { channels: [] };
      return res.json();
    },
  });

  const drops: any[] = dropsData?.drops || [];
  const enabledChannels = (channelsData?.channels || []).filter((c: any) => c.enabled);

  const manualDropMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/candy/drops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(manualForm),
      });
      if (!res.ok) throw new Error("Failed to trigger drop");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candy-admin-drops"] });
      setIsManualModalOpen(false);
    },
  });

  const cancelDropMutation = useMutation({
    mutationFn: async (dropId: string) => {
      const res = await fetch(`/api/admin/candy/drops?id=${dropId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to cancel drop");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candy-admin-drops"] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">ประวัติการดรอปลูกอม</h1>
          <p className="text-xs text-neutral-400 mt-1">รายการดรอปทั้งหมดทั้งแบบอัตโนมัติและสั่งดรอปด้วยมือ</p>
        </div>
        <Button variant="primary" onClick={() => setIsManualModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
          สั่งดรอปทันที (Manual Drop)
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5">
        {["all", "ACTIVE", "CLAIMED", "EXPIRED", "CANCELLED"].map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filterStatus === st ? "bg-white text-black font-semibold" : "bg-neutral-900 text-neutral-400 hover:text-white"}`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Drops Table */}
      <div className="bg-neutral-950/70 border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-900/60 border-b border-white/10 text-neutral-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">ID / ห้อง</th>
                <th className="p-3.5">จำนวนลูกอม</th>
                <th className="p-3.5">สิทธิ์การเก็บ</th>
                <th className="p-3.5">ที่มา</th>
                <th className="p-3.5">สถานะ</th>
                <th className="p-3.5">เวลาสร้าง</th>
                <th className="p-3.5 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-neutral-300">
              {drops.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-neutral-500">
                    ไม่พบรายการดรอป
                  </td>
                </tr>
              ) : (
                drops.map((d) => (
                  <tr key={d.id} className="hover:bg-neutral-900/40 transition">
                    <td className="p-3.5">
                      <div className="font-mono text-white font-bold">#{d.id.slice(-6)}</div>
                      <div className="text-[11px] text-neutral-500 font-mono">ห้อง {d.channelId}</div>
                    </td>
                    <td className="p-3.5 font-bold text-orange-400 text-sm">{d.amount} 🍬</td>
                    <td className="p-3.5 font-mono">
                      {d.claimedCount} / {d.maxClaimers}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-white/5 font-mono">{d.source}</span>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold font-mono ${d.status === "ACTIVE" ? "bg-orange-500/20 text-orange-400 animate-pulse" : d.status === "CLAIMED" ? "bg-emerald-500/20 text-emerald-400" : "bg-neutral-800 text-neutral-400"}`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-neutral-400 font-mono text-[11px]">
                      {new Date(d.createdAt).toLocaleTimeString("th-TH")}
                    </td>
                    <td className="p-3.5 text-right">
                      {d.status === "ACTIVE" && (
                        <button
                          onClick={() => cancelDropMutation.mutate(d.id)}
                          className="px-2.5 py-1 rounded bg-red-950/40 border border-red-500/30 text-red-300 hover:bg-red-900/50 text-[11px] transition"
                        >
                          ยกเลิกดรอป
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Drop Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-950 border border-white/20 rounded-xl p-6 max-w-md w-full space-y-4">
            <h2 className="text-base font-bold text-white">สั่งดรอปลูกอมทันที (Manual Drop)</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">เลือกห้องข้อความ</label>
                <select
                  value={manualForm.channelId}
                  onChange={(e) => setManualForm({ ...manualForm, channelId: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-900 border border-white/10 rounded-lg text-xs text-white"
                >
                  <option value="">-- เลือกห้องข้อความ --</option>
                  {enabledChannels.map((c: any) => (
                    <option key={c.channelId} value={c.channelId}>
                      #{c.name || c.channelId}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">จำนวนลูกอม (ต่อผู้เก็บ 1 คน)</label>
                <input
                  type="number"
                  min="1"
                  value={manualForm.amount}
                  onChange={(e) => setManualForm({ ...manualForm, amount: parseInt(e.target.value, 10) || 1 })}
                  className="w-full px-3 py-2 bg-neutral-900 border border-white/10 rounded-lg text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">จำนวนคนที่เก็บได้ (Max Claimers)</label>
                <input
                  type="number"
                  min="1"
                  value={manualForm.maxClaimers}
                  onChange={(e) => setManualForm({ ...manualForm, maxClaimers: parseInt(e.target.value, 10) || 1 })}
                  className="w-full px-3 py-2 bg-neutral-900 border border-white/10 rounded-lg text-xs text-white font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setIsManualModalOpen(false)}>
                ยกเลิก
              </Button>
              <Button
                variant="primary"
                onClick={() => manualDropMutation.mutate()}
                isLoading={manualDropMutation.isPending}
                disabled={!manualForm.channelId}
              >
                ยืนยันการดรอป
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
