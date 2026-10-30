"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  Sparkles,
  Zap,
  Clock,
  Hash,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Users,
  Candy,
  Timer,
} from "lucide-react";
import Button from "@/components/ui/Button";

interface QueuedItem {
  id: string;
  eventId: string;
  channelId: string;
  channelName: string;
  amount: number;
  maxClaimers: number;
  scheduledAt: number;
  createdAt: number;
  secondsRemaining?: number;
}

export default function AdminDropsPage() {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);
  const [isQueueModalOpen, setIsQueueModalOpen] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // Form states
  const [manualForm, setManualForm] = useState({ channelId: "", amount: 1, maxClaimers: 1 });
  const [customQueueForm, setCustomQueueForm] = useState({
    channelId: "",
    amount: 1,
    maxClaimers: 1,
    scheduledInSeconds: 45,
  });

  // Tick current time every second for smooth live countdown
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 1. Fetch Upcoming Drop Queue
  const { data: queueData, isLoading: isQueueLoading, refetch: refetchQueue } = useQuery({
    queryKey: ["candy-admin-drop-queue"],
    queryFn: async () => {
      const res = await fetch("/api/admin/candy/drops/queue");
      if (!res.ok) throw new Error("Failed to load queue");
      return res.json();
    },
    refetchInterval: 3000,
  });

  // 2. Fetch Drop History
  const { data: dropsData, isLoading: isDropsLoading } = useQuery({
    queryKey: ["candy-admin-drops", filterStatus],
    queryFn: async () => {
      const url = filterStatus === "all" ? "/api/admin/candy/drops" : `/api/admin/candy/drops?status=${filterStatus}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load drops");
      return res.json();
    },
    refetchInterval: 5000,
  });

  // 3. Fetch Channels
  const { data: channelsData } = useQuery({
    queryKey: ["candy-admin-channels"],
    queryFn: async () => {
      const res = await fetch("/api/admin/candy/channels");
      if (!res.ok) return { channels: [] };
      return res.json();
    },
  });

  const queue: QueuedItem[] = queueData?.queue || [];
  const eventStatus: string = queueData?.eventStatus || "NO_EVENT";
  const drops: any[] = dropsData?.drops || [];
  const enabledChannels = (channelsData?.channels || []).filter((c: any) => c.enabled);

  // Set default channel when channels load
  useEffect(() => {
    if (enabledChannels.length > 0) {
      if (!manualForm.channelId) {
        setManualForm((prev) => ({ ...prev, channelId: enabledChannels[0].channelId }));
      }
      if (!customQueueForm.channelId) {
        setCustomQueueForm((prev) => ({ ...prev, channelId: enabledChannels[0].channelId }));
      }
    }
  }, [enabledChannels]);

  // Cancel Queued Drop Mutation
  const cancelQueueMutation = useMutation({
    mutationFn: async (queueId: string) => {
      const res = await fetch(`/api/admin/candy/drops/queue?id=${queueId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to cancel queue item");
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["candy-admin-drop-queue"] });
      setNotification(data.message || "✅ ยกเลิกคิวดรอปสำเร็จ");
      setTimeout(() => setNotification(null), 3000);
    },
  });

  // Execute Queued Drop Immediately
  const dropQueuedNowMutation = useMutation({
    mutationFn: async (queueId: string) => {
      const res = await fetch("/api/admin/candy/drops/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "DROP_NOW", queueId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to drop");
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["candy-admin-drop-queue"] });
      queryClient.invalidateQueries({ queryKey: ["candy-admin-drops"] });
      setNotification(data.message || "⚡ สั่งดรอปคิวนี้ลงห้อง Discord ทันทีสำเร็จ!");
      setTimeout(() => setNotification(null), 3500);
    },
    onError: (err: any) => {
      alert(err.message);
    },
  });

  // Add Custom Queued Drop
  const addCustomQueueMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/candy/drops/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADD_CUSTOM",
          channelId: customQueueForm.channelId,
          amount: customQueueForm.amount,
          maxClaimers: customQueueForm.maxClaimers,
          scheduledInSeconds: customQueueForm.scheduledInSeconds,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to add queue");
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["candy-admin-drop-queue"] });
      setIsQueueModalOpen(false);
      setNotification(data.message || "✅ เพิ่มคิวดรอปลูกอมเรียบร้อยแล้ว");
      setTimeout(() => setNotification(null), 3000);
    },
    onError: (err: any) => {
      alert(err.message);
    },
  });

  // Manual Instant Drop (New Drop directly)
  const manualDropMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/candy/drops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(manualForm),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to drop");
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["candy-admin-drops"] });
      setIsManualModalOpen(false);
      setNotification(data.message || "⚡ ดรอปลูกอมทันทีสำเร็จ!");
      setTimeout(() => setNotification(null), 3500);
    },
    onError: (err: any) => {
      alert(err.message);
    },
  });

  // Cancel Active Drop in Discord
  const cancelActiveDropMutation = useMutation({
    mutationFn: async (dropId: string) => {
      const res = await fetch(`/api/admin/candy/drops?id=${dropId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to cancel drop");
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["candy-admin-drops"] });
      setNotification(data.message || "✅ ยกเลิกข้อความดรอปเรียบร้อยแล้ว");
      setTimeout(() => setNotification(null), 3000);
    },
  });

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Toast Notification */}
      {notification && (
        <div className="p-3.5 bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs rounded-xl flex items-center justify-between shadow-lg shadow-emerald-950/40 animate-in fade-in slide-in-from-top duration-200 sticky top-20 z-30">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-emerald-400 hover:text-white text-xs">
            ✕
          </button>
        </div>
      )}

      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>🔮 คิวการดรอป & ประวัติกิจกรรม</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            ดูคิวลูกอมที่จะสุ่มดรอปรอบถัดไป สั่งดรอปทันที ยกเลิกคิว หรือตรวจสอบประวัติการดรอปทั้งหมด
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="secondary"
            onClick={() => setIsQueueModalOpen(true)}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            ตั้งเวลาคิวเอง
          </Button>
          <Button
            variant="primary"
            onClick={() => setIsManualModalOpen(true)}
            icon={<Zap className="w-3.5 h-3.5" />}
          >
            สั่งดรอปทันที 1 ลูก
          </Button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 🔮 UPCOMING DROP QUEUE SECTION */}
      {/* ======================================================== */}
      <div className="bg-neutral-950/90 border border-purple-500/30 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl shadow-purple-950/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  คิวลูกอมที่จะดรอปล่วงหน้า (Upcoming Drop Queue)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                  {queue.length} คิวรออยู่
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                ระบบคำนวณและสุ่มห้องล่วงหน้าไว้ให้แล้ว คุณสามารถกด <strong>สั่งดรอปทันที</strong> หรือ{" "}
                <strong>ยกเลิกคิว</strong> ได้ก่อนที่ลูกอมจะตก
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => refetchQueue()}
              className="px-2.5 py-1.5 rounded-lg text-xs bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-white/10 flex items-center gap-1.5 transition"
            >
              <RefreshCw className="w-3 h-3" />
              <span>รีเฟรช</span>
            </button>
          </div>
        </div>

        {/* Queue Items Grid */}
        {queue.length === 0 ? (
          <div className="p-8 border border-dashed border-white/10 rounded-xl text-center space-y-2 bg-neutral-900/30">
            <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center mx-auto text-neutral-500">
              <Clock className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-neutral-300">
              {eventStatus === "RUNNING"
                ? "กำลังจัดเตรียมคิวดรอปรอบถัดไป..."
                : "กิจกรรมไม่ได้อยู่ในสถานะ RUNNING (เริ่มกิจกรรมเพื่อเปิดระบบคิวดรอป)"}
            </p>
            <p className="text-xs text-neutral-500 max-w-md mx-auto">
              เมื่อกิจกรรมทำงาน ระบบจะสุ่มห้องและจำนวนลูกอมมารอไว้ในคิวนี้โดยอัตโนมัติ
              คุณยังสามารถกดปุ่ม "ตั้งเวลาคิวเอง" เพื่อเพิ่มคิวดรอปแบบกำหนดเองได้
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {queue.map((item, idx) => {
              const secondsLeft = Math.max(0, Math.ceil((item.scheduledAt - currentTime) / 1000));
              const isImminent = secondsLeft <= 10;

              return (
                <div
                  key={item.id}
                  className={`relative rounded-xl border p-4.5 flex flex-col justify-between transition duration-200 ${
                    idx === 0
                      ? "bg-gradient-to-b from-purple-950/40 to-neutral-950 border-purple-500/50 shadow-lg shadow-purple-950/30"
                      : "bg-neutral-900/60 border-white/10 hover:border-white/20"
                  }`}
                >
                  {/* Top Bar: Order and Timer */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${
                        idx === 0
                          ? "bg-purple-500 text-white font-mono"
                          : "bg-white/10 text-neutral-400 font-mono"
                      }`}
                    >
                      {idx === 0 ? "🔥 คิวถัดไป (#1)" : `#${idx + 1}`}
                    </span>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono flex items-center gap-1.5 border ${
                        secondsLeft === 0
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse"
                          : isImminent
                          ? "bg-red-500/20 text-red-300 border-red-500/40 animate-pulse"
                          : "bg-amber-500/10 text-amber-300 border-amber-500/30"
                      }`}
                    >
                      <Timer className="w-3 h-3" />
                      {secondsLeft === 0 ? "พร้อมดรอป!" : `อีก ${secondsLeft} วินาที`}
                    </span>
                  </div>

                  {/* Channel & Detail */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-1.5">
                      <Hash className="w-4 h-4 text-purple-400 shrink-0" />
                      <span className="text-sm font-bold text-white tracking-wide truncate">
                        {item.channelName}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="px-2.5 py-1 rounded-lg bg-orange-500/20 border border-orange-500/30 text-orange-300 text-xs font-bold flex items-center gap-1">
                        <Candy className="w-3.5 h-3.5" />
                        <span>{item.amount} ลูก</span>
                      </div>
                      <div className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-neutral-300 text-xs font-medium flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-neutral-400" />
                        <span>สิทธิ์ {item.maxClaimers} คน</span>
                      </div>
                    </div>

                    <div className="text-[11px] text-neutral-500 font-mono">
                      ห้อง ID: {item.channelId}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                    <button
                      onClick={() => dropQueuedNowMutation.mutate(item.id)}
                      disabled={dropQueuedNowMutation.isPending}
                      className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-50"
                    >
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      <span>สั่งดรอปเลย</span>
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`ต้องการยกเลิกคิวดรอปลูกอม ${item.amount} ลูก ที่ห้อง #${item.channelName} หรือไม่?`)) {
                          cancelQueueMutation.mutate(item.id);
                        }
                      }}
                      disabled={cancelQueueMutation.isPending}
                      className="px-3 py-1.5 rounded-lg bg-red-950/30 hover:bg-red-900/50 border border-red-500/30 text-red-300 font-medium text-xs flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>ยกเลิกคิว</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 📜 DROP HISTORY TABLE SECTION */}
      {/* ======================================================== */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
              ประวัติการดรอปลูกอมทั้งหมด (Drop History)
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              รายการดรอปทั้งแบบบอทสุ่มอัตโนมัติและแอดมินสั่งดรอปด้วยมือ
            </p>
          </div>

          {/* Filter Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {["all", "ACTIVE", "CLAIMED", "EXPIRED", "CANCELLED"].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  filterStatus === st
                    ? "bg-white text-black font-semibold shadow"
                    : "bg-neutral-900 text-neutral-400 hover:text-white border border-white/5"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Drops Table */}
        <div className="bg-neutral-950/80 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-900/80 border-b border-white/10 text-neutral-400 font-semibold uppercase tracking-wider">
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
                        <span className="px-2 py-0.5 rounded text-[10px] bg-white/5 font-mono border border-white/10">
                          {d.source}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold font-mono ${
                            d.status === "ACTIVE"
                              ? "bg-orange-500/20 text-orange-400 animate-pulse border border-orange-500/30"
                              : d.status === "CLAIMED"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-neutral-800 text-neutral-400 border border-neutral-700/50"
                          }`}
                        >
                          {d.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-neutral-400 font-mono text-[11px]">
                        {new Date(d.createdAt).toLocaleTimeString("th-TH")}
                      </td>
                      <td className="p-3.5 text-right">
                        {d.status === "ACTIVE" && (
                          <button
                            onClick={() => {
                              if (confirm("ต้องการยกเลิกการดรอปนี้และลบข้อความออกจากห้องหรือไม่?")) {
                                cancelActiveDropMutation.mutate(d.id);
                              }
                            }}
                            className="px-2.5 py-1 rounded-lg bg-red-950/40 border border-red-500/30 text-red-300 hover:bg-red-900/60 text-[11px] transition"
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
      </div>

      {/* ======================================================== */}
      {/* ⚡ MODAL: MANUAL INSTANT DROP */}
      {/* ======================================================== */}
      {isManualModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-950 border border-white/20 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-orange-400" />
                <span>สั่งดรอปลูกอมทันที (Manual Drop)</span>
              </h2>
              <button onClick={() => setIsManualModalOpen(false)} className="text-neutral-400 hover:text-white">
                ✕
              </button>
            </div>
            <p className="text-xs text-neutral-400">
              ข้อความจะถูกส่งลง Discord ทันทีพร้อมแท็ก <strong>@Halloween 2026</strong> โดยไม่ต้องรอคิว
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">เลือกห้องข้อความ</label>
                <select
                  value={manualForm.channelId}
                  onChange={(e) => setManualForm({ ...manualForm, channelId: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-900 border border-white/10 rounded-lg text-xs text-white"
                >
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
                ⚡ ยืนยันสั่งดรอปทันที
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 🔮 MODAL: CUSTOM QUEUE SCHEDULE */}
      {/* ======================================================== */}
      {isQueueModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-950 border border-purple-500/30 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>เพิ่มคิวดรอปแบบกำหนดเอง (Custom Queue)</span>
              </h2>
              <button onClick={() => setIsQueueModalOpen(false)} className="text-neutral-400 hover:text-white">
                ✕
              </button>
            </div>
            <p className="text-xs text-neutral-400">
              กำหนดห้อง จำนวนลูกอม และระยะเวลาที่จะให้ตก ระบบจะนำไปใส่ในคิวล่วงหน้าให้เห็นในตาราง
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">เลือกห้องข้อความ</label>
                <select
                  value={customQueueForm.channelId}
                  onChange={(e) => setCustomQueueForm({ ...customQueueForm, channelId: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-900 border border-white/10 rounded-lg text-xs text-white"
                >
                  {enabledChannels.map((c: any) => (
                    <option key={c.channelId} value={c.channelId}>
                      #{c.name || c.channelId}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">จำนวนลูกอม</label>
                  <input
                    type="number"
                    min="1"
                    value={customQueueForm.amount}
                    onChange={(e) => setCustomQueueForm({ ...customQueueForm, amount: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 bg-neutral-900 border border-white/10 rounded-lg text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">จำนวนคนเก็บได้</label>
                  <input
                    type="number"
                    min="1"
                    value={customQueueForm.maxClaimers}
                    onChange={(e) => setCustomQueueForm({ ...customQueueForm, maxClaimers: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 bg-neutral-900 border border-white/10 rounded-lg text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  ตั้งเวลาให้ตกในอีก (วินาที)
                </label>
                <input
                  type="number"
                  min="5"
                  step="5"
                  value={customQueueForm.scheduledInSeconds}
                  onChange={(e) =>
                    setCustomQueueForm({ ...customQueueForm, scheduledInSeconds: parseInt(e.target.value, 10) || 30 })
                  }
                  className="w-full px-3 py-2 bg-neutral-900 border border-white/10 rounded-lg text-xs text-white font-mono"
                />
                <span className="text-[10px] text-neutral-500 mt-1 block">
                  ตัวอย่าง: 30 = ตกในอีก 30 วินาที, 60 = ตกในอีก 1 นาที
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setIsQueueModalOpen(false)}>
                ยกเลิก
              </Button>
              <Button
                variant="primary"
                onClick={() => addCustomQueueMutation.mutate()}
                isLoading={addCustomQueueMutation.isPending}
                disabled={!customQueueForm.channelId}
              >
                🔮 บันทึกลงคิวดรอป
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
