"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Play, Pause, Square, AlertTriangle, CheckCircle2, Save, Sparkles, Clock } from "lucide-react";
import Button from "@/components/ui/Button";

function toLocalDatetimeInput(dateStr?: string | Date): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
}

export default function AdminEventPage() {
  const queryClient = useQueryClient();
  const [notification, setNotification] = useState<string | null>(null);

  const { data: eventData, isLoading } = useQuery({
    queryKey: ["candy-admin-event"],
    queryFn: async () => {
      const res = await fetch("/api/admin/candy/event", {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (!res.ok) throw new Error("Failed to load event");
      return res.json();
    },
    refetchInterval: 3000,
  });

  const event = eventData?.event;
  const config = event?.config || {};

  const [formData, setFormData] = useState<any>({
    name: "Trick or Treat 2026",
    budgetTotal: 1000,
    startsAt: "2026-10-30T23:30",
    endsAt: "2026-10-31T00:30",
    requireVoice: true,
    minVoiceSeconds: 10,
    excludeAfkChannel: true,
    perUserMaxTotal: "",
    lifetimeSec: 45,
    maxClaimers: 1,
  });

  // Sync formData with loaded event or saved master settings from DB
  useEffect(() => {
    if (event) {
      const cfg = event.config || {};
      setFormData({
        name: event.name || "Trick or Treat 2026",
        budgetTotal: event.budgetTotal ?? 1000,
        startsAt: toLocalDatetimeInput(event.startsAt) || "2026-10-30T23:30",
        endsAt: toLocalDatetimeInput(event.endsAt) || "2026-10-31T00:30",
        requireVoice: cfg.claim?.requireVoice ?? true,
        minVoiceSeconds: cfg.claim?.minVoiceSeconds ?? 10,
        excludeAfkChannel: cfg.claim?.excludeAfkChannel ?? true,
        perUserMaxTotal: cfg.claim?.perUserMaxTotal ?? "",
        lifetimeSec: cfg.drop?.lifetimeSec ?? 45,
        maxClaimers: cfg.drop?.maxClaimers ?? 1,
      });
    } else if (eventData?.masterConfig) {
      const mc = eventData.masterConfig;
      const cfg = mc.config || {};
      setFormData({
        name: mc.name || "Trick or Treat 2026",
        budgetTotal: mc.budgetTotal ?? 1000,
        startsAt: "2026-10-30T23:30",
        endsAt: "2026-10-31T00:30",
        requireVoice: cfg.claim?.requireVoice ?? true,
        minVoiceSeconds: cfg.claim?.minVoiceSeconds ?? 10,
        excludeAfkChannel: cfg.claim?.excludeAfkChannel ?? true,
        perUserMaxTotal: cfg.claim?.perUserMaxTotal ?? "",
        lifetimeSec: cfg.drop?.lifetimeSec ?? 45,
        maxClaimers: cfg.drop?.maxClaimers ?? 1,
      });
    }
  }, [event, eventData]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/candy/event", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          budgetTotal: parseInt(formData.budgetTotal, 10),
          startsAt: new Date(formData.startsAt).toISOString(),
          endsAt: new Date(formData.endsAt).toISOString(),
          config: {
            ...config,
            drop: {
              ...config.drop,
              lifetimeSec: parseInt(formData.lifetimeSec, 10),
              maxClaimers: parseInt(formData.maxClaimers, 10),
              dropWhenNoActivity: true, // Allow drops in quiet rooms/testing
            },
            claim: {
              ...config.claim,
              requireVoice: Boolean(formData.requireVoice),
              minVoiceSeconds: parseInt(formData.minVoiceSeconds, 10),
              excludeAfkChannel: Boolean(formData.excludeAfkChannel),
              perUserMaxTotal: formData.perUserMaxTotal ? parseInt(formData.perUserMaxTotal, 10) : null,
            },
          },
        }),
      });
      if (!res.ok) throw new Error("Failed to save event");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candy-admin-event"] });
      setNotification("✅ บันทึกการตั้งค่ากิจกรรมสำเร็จ!");
      setTimeout(() => setNotification(null), 3000);
    },
  });

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
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["candy-admin-event"] });
      const msg =
        variables === "EVENT_START"
          ? "🚀 เริ่มต้นกิจกรรมเรียบร้อยแล้ว! บอทจะเริ่มสุ่มดรอปลูกอมลงห้องที่เลือกทันที"
          : "คำสั่งถูกส่งไปยังคิวของบอทเรียบร้อยแล้ว";
      setNotification(msg);
      setTimeout(() => setNotification(null), 4000);
    },
  });

  const handleStartEvent = async () => {
    try {
      await saveMutation.mutateAsync();
      await commandMutation.mutateAsync("EVENT_START");
    } catch (e: any) {
      alert(`ไม่สามารถเริ่มกิจกรรมได้: ${e.message}`);
    }
  };

  // Quick manual drop test
  const manualDropMutation = useMutation({
    mutationFn: async () => {
      const enabledChannels = (event?.channels || []).filter((c: any) => c.enabled);
      if (enabledChannels.length === 0) {
        throw new Error("กรุณาเปิดใช้งานห้องสำหรับดรอปอย่างน้อย 1 ห้องก่อนที่เมนู 'ห้องที่เปิดดรอป'");
      }
      const ch = enabledChannels[0];
      const res = await fetch("/api/admin/candy/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "DROP_NOW",
          payload: {
            channelId: ch.channelId,
            amount: 1,
            maxClaimers: 1,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Drop failed");
      }
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["candy-admin-event"] });
      setNotification(data.message || "🍬 สั่งบอทดรอปลูกอมทันทีสำเร็จ! (แท็กยศเรียบร้อย ไม่ต้องรอคิว)");
      setTimeout(() => setNotification(null), 4000);
    },
    onError: (err: any) => {
      alert(err.message);
    },
  });

  const enabledChannelsCount = (event?.channels || []).filter((c: any) => c.enabled).length;

  const preflightChecks = [
    { label: "งบประมาณรวม > 0", pass: (event?.budgetTotal || formData.budgetTotal) > 0 },
    { label: `มีห้องข้อความสำหรับดรอป (${enabledChannelsCount} ห้อง)`, pass: enabledChannelsCount > 0 },
    { label: "ระบบตรวจจับห้องเสียงเปิดใช้งาน", pass: Boolean(formData.requireVoice) },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">ตั้งค่า & ควบคุมกิจกรรม</h1>
          <p className="text-xs text-neutral-400 mt-1">กำหนดงบประมาณ เงื่อนไขห้องเสียง และควบคุมการเริ่ม/หยุดกิจกรรม</p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {event?.status === "RUNNING" ? (
            <>
              <Button
                variant="secondary"
                onClick={() => manualDropMutation.mutate()}
                isLoading={manualDropMutation.isPending}
                icon={<Sparkles className="w-4 h-4 text-orange-400" />}
              >
                ⚡ สั่งดรอปทันที 1 ลูก
              </Button>
              <Button
                variant="secondary"
                onClick={() => commandMutation.mutate("EVENT_PAUSE")}
                isLoading={commandMutation.isPending}
                icon={<Pause className="w-4 h-4" />}
              >
                พักกิจกรรม
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  if (confirm("ยืนยันสิ้นสุดกิจกรรมทันที?")) {
                    commandMutation.mutate("EVENT_END");
                  }
                }}
                isLoading={commandMutation.isPending}
                icon={<Square className="w-4 h-4" />}
              >
                จบกิจกรรม
              </Button>
            </>
          ) : event?.status === "PAUSED" ? (
            <Button
              variant="primary"
              onClick={() => commandMutation.mutate("EVENT_RESUME")}
              isLoading={commandMutation.isPending}
              icon={<Play className="w-4 h-4" />}
            >
              ดำเนินการต่อ
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                onClick={handleStartEvent}
                isLoading={saveMutation.isPending || commandMutation.isPending}
                icon={new Date(formData.startsAt) > new Date() ? <Clock className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              >
                {new Date(formData.startsAt) > new Date()
                  ? `⏰ ตั้งเวลาเริ่ม (${new Date(formData.startsAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })} น.)`
                  : "เริ่มกิจกรรมทันที"}
              </Button>

              {new Date(formData.startsAt) > new Date() && (
                <Button
                  variant="secondary"
                  onClick={async () => {
                    if (confirm("ต้องการเริ่มกิจกรรมและปล่อยลูกอมทันทีตอนนี้เลย โดยไม่ต้องรอเวลาเริ่มหรือไม่?")) {
                      const nowInput = toLocalDatetimeInput(new Date());
                      setFormData({ ...formData, startsAt: nowInput });
                      await fetch("/api/admin/candy/event", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ type: "EVENT_START", payload: { forceNow: true } }),
                      });
                      queryClient.invalidateQueries({ queryKey: ["candy-admin-event"] });
                    }
                  }}
                  icon={<Play className="w-3.5 h-3.5 text-orange-400" />}
                >
                  ⚡ บังคับเริ่มตอนนี้
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {notification && (
        <div className="p-3 bg-emerald-950/50 border border-emerald-500/30 rounded-lg text-xs text-emerald-300 font-medium">
          {notification}
        </div>
      )}

      {/* Pre-flight checklist */}
      <div className="p-4 rounded-xl bg-neutral-950/70 border border-white/10 space-y-2">
        <h2 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Pre-flight Checklist (ความพร้อมก่อนเริ่ม)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          {preflightChecks.map((chk, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded bg-neutral-900 border border-white/5">
              {chk.pass ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0" />
              )}
              <span className={chk.pass ? "text-neutral-200" : "text-orange-300"}>{chk.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Form Settings */}
      <div className="p-6 rounded-xl bg-neutral-950/70 border border-white/10 space-y-6">
        {/* Section 1: Event General */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/10 pb-2">
            ข้อมูลทั่วไปและงบประมาณ
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">ชื่องานกิจกรรม</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-900 border border-white/10 rounded-lg text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">งบประมาณรวม (บาท / ลูกอม)</label>
              <input
                type="number"
                value={formData.budgetTotal}
                onChange={(e) => setFormData({ ...formData, budgetTotal: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-900 border border-white/10 rounded-lg text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">เวลาเริ่ม (Asia/Bangkok)</label>
              <input
                type="datetime-local"
                value={formData.startsAt}
                onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-900 border border-white/10 rounded-lg text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">เวลาสิ้นสุด (Asia/Bangkok)</label>
              <input
                type="datetime-local"
                value={formData.endsAt}
                onChange={(e) => setFormData({ ...formData, endsAt: e.target.value })}
                className={`w-full px-3 py-2 bg-neutral-900 border rounded-lg text-xs text-white font-mono ${
                  new Date(formData.endsAt) <= new Date(formData.startsAt) ? "border-red-500/60" : "border-white/10"
                }`}
              />
              {new Date(formData.endsAt) <= new Date(formData.startsAt) ? (
                <p className="text-[11px] text-red-400 mt-1">
                  ⚠️ เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่ม (ถ้าต้องการให้จบเที่ยงคืน ต้องเลือกวันถัดไป 12:00 AM ไม่ใช่ 12:00 PM)
                </p>
              ) : (
                <p className="text-[10px] text-neutral-500 mt-1">
                  💡 ข้อควรระวัง: เที่ยงคืนคือ 12:00 AM (00:00 น. ของวันถัดไป) ส่วน 12:00 PM คือเที่ยงวัน
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Voice Rules */}
        <div className="space-y-4 pt-4 border-t border-white/10">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/10 pb-2">
            กติกาห้องพูดคุยเสียง (Voice Rules)
          </h2>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.requireVoice}
                onChange={(e) => setFormData({ ...formData, requireVoice: e.target.checked })}
                className="w-4 h-4 rounded bg-neutral-900 border-white/20 text-orange-500 focus:ring-0"
              />
              <div>
                <div className="text-xs font-semibold text-white">ต้องอยู่ในห้องพูดคุยเสียงเท่านั้นถึงจะเก็บได้ (กติกาหลัก)</div>
                <div className="text-[11px] text-neutral-400">บอทจะตรวจสอบสถานะ Voice State ก่อนอนุมัติการเคลมทุกครั้ง</div>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.excludeAfkChannel}
                onChange={(e) => setFormData({ ...formData, excludeAfkChannel: e.target.checked })}
                className="w-4 h-4 rounded bg-neutral-900 border-white/20 text-orange-500 focus:ring-0"
              />
              <div>
                <div className="text-xs font-semibold text-white">ยกเว้นห้อง AFK (ไม่อนุญาตให้รับลูกอมในห้อง AFK)</div>
                <div className="text-[11px] text-neutral-400">ป้องกันการเปิดไมค์ทิ้งไว้ในห้องที่ไม่ได้ร่วมพูดคุย</div>
              </div>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">ต้องอยู่ในห้องเสียงก่อนอย่างน้อย (วินาที)</label>
                <input
                  type="number"
                  value={formData.minVoiceSeconds}
                  onChange={(e) => setFormData({ ...formData, minVoiceSeconds: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-900 border border-white/10 rounded-lg text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">เพดานสะสมสูงสุดต่อคน (เว้นว่างได้)</label>
                <input
                  type="number"
                  value={formData.perUserMaxTotal}
                  onChange={(e) => setFormData({ ...formData, perUserMaxTotal: e.target.value })}
                  placeholder="เช่น 100"
                  className="w-full px-3 py-2 bg-neutral-900 border border-white/10 rounded-lg text-xs text-white font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Drop Lifetimes */}
        <div className="space-y-4 pt-4 border-t border-white/10">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/10 pb-2">
            การดรอปลูกอม (Drop Parameters)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">อายุดรอปในห้องข้อความ (วินาที)</label>
              <input
                type="number"
                value={formData.lifetimeSec}
                onChange={(e) => setFormData({ ...formData, lifetimeSec: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-900 border border-white/10 rounded-lg text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">จำนวนคนเก็บต่อดรอป (Max Claimers)</label>
              <input
                type="number"
                value={formData.maxClaimers}
                onChange={(e) => setFormData({ ...formData, maxClaimers: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-900 border border-white/10 rounded-lg text-xs text-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-white/10 flex justify-end">
          <Button variant="primary" onClick={() => saveMutation.mutate()} isLoading={saveMutation.isPending} icon={<Save className="w-4 h-4" />}>
            บันทึกการตั้งค่าทั้งหมด
          </Button>
        </div>
      </div>
    </div>
  );
}
