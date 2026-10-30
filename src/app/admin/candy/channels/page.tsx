"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Hash, Check, Search, Sparkles, Filter, CheckSquare, Square, RefreshCw, Send } from "lucide-react";
import Button from "@/components/ui/Button";

export default function AdminChannelsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState<"ALL" | "ENABLED" | "DISABLED">("ALL");
  const [notification, setNotification] = useState<string | null>(null);

  // Fetch Discord channels
  const { data: discordData, isLoading: isDiscordLoading, refetch: refetchDiscord } = useQuery({
    queryKey: ["candy-discord-channels"],
    queryFn: async () => {
      const res = await fetch("/api/admin/candy/discord/channels", {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (!res.ok) throw new Error("Failed to load discord channels");
      return res.json();
    },
  });

  // Fetch configured event channels
  const { data: channelsData, isLoading: isConfigLoading } = useQuery({
    queryKey: ["candy-admin-channels"],
    queryFn: async () => {
      const res = await fetch("/api/admin/candy/channels", {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (!res.ok) throw new Error("Failed to load event channels");
      return res.json();
    },
    refetchInterval: 3000,
  });

  const discordChannels: any[] = discordData?.channels || [];
  const configuredChannels: any[] = channelsData?.channels || [];
  const savedMasterChannels: any[] = channelsData?.savedMasterChannels || [];

  // Build map: priority configuredChannels -> savedMasterChannels
  const configMap = useMemo(() => {
    const map = new Map<string, { enabled: boolean; weight: number }>();
    for (const c of savedMasterChannels) {
      map.set(c.channelId, { enabled: true, weight: c.weight || 1 });
    }
    for (const c of configuredChannels) {
      map.set(c.channelId, { enabled: c.enabled, weight: c.weight || 1 });
    }
    return map;
  }, [configuredChannels, savedMasterChannels]);

  // Toggle single channel
  const updateMutation = useMutation({
    mutationFn: async (payload: { channelId: string; name: string; enabled: boolean; weight?: number }) => {
      const res = await fetch("/api/admin/candy/channels", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update channel");
      return res.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["candy-admin-channels"] });
      queryClient.invalidateQueries({ queryKey: ["candy-admin-event"] });
      setNotification(`✅ บันทึกห้อง #${variables.name} (${variables.enabled ? "เปิดดรอป" : "ปิดดรอป"}) เรียบร้อยแล้ว`);
      setTimeout(() => setNotification(null), 2500);
    },
  });

  // Batch update
  const batchMutation = useMutation({
    mutationFn: async (channels: Array<{ channelId: string; name: string; enabled: boolean; weight?: number }>) => {
      const res = await fetch("/api/admin/candy/channels", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channels }),
      });
      if (!res.ok) throw new Error("Batch update failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candy-admin-channels"] });
      queryClient.invalidateQueries({ queryKey: ["candy-admin-event"] });
      setNotification("✅ อัปเดตสถานะห้องทั้งหมดเรียบร้อยแล้ว");
      setTimeout(() => setNotification(null), 3000);
    },
  });

  // Instant Drop test to this specific channel
  const instantDropMutation = useMutation({
    mutationFn: async (channelId: string) => {
      const res = await fetch("/api/admin/candy/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "DROP_NOW",
          payload: {
            channelId,
            amount: 1,
            maxClaimers: 1,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to drop");
      }
      return data;
    },
    onSuccess: (data) => {
      setNotification(data.message || "🍬 สั่งดรอปทันทีสำเร็จ!");
      setTimeout(() => setNotification(null), 4000);
    },
    onError: (err: any) => {
      alert(`⚠️ ดรอปไม่สำเร็จ: ${err.message}`);
    },
  });

  // Only Text (0) or Announcement (5)
  const textChannels = useMemo(() => {
    return discordChannels.filter((c) => c.type === 0 || c.type === 5);
  }, [discordChannels]);

  // Filtered channels
  const filteredChannels = useMemo(() => {
    return textChannels.filter((ch) => {
      const matchesSearch =
        ch.name.toLowerCase().includes(search.toLowerCase()) || ch.id.includes(search);
      if (!matchesSearch) return false;

      const isEnabled = configMap.get(ch.id)?.enabled || false;
      if (filterMode === "ENABLED") return isEnabled;
      if (filterMode === "DISABLED") return !isEnabled;
      return true;
    });
  }, [textChannels, search, filterMode, configMap]);

  const totalEnabledCount = useMemo(() => {
    return textChannels.filter((ch) => configMap.get(ch.id)?.enabled).length;
  }, [textChannels, configMap]);

  const handleEnableFiltered = () => {
    if (filteredChannels.length === 0) return;
    const batch = filteredChannels.map((ch) => ({
      channelId: ch.id,
      name: ch.name,
      enabled: true,
      weight: configMap.get(ch.id)?.weight || 1,
    }));
    batchMutation.mutate(batch);
  };

  const handleDisableFiltered = () => {
    if (filteredChannels.length === 0) return;
    const batch = filteredChannels.map((ch) => ({
      channelId: ch.id,
      name: ch.name,
      enabled: false,
      weight: configMap.get(ch.id)?.weight || 1,
    }));
    batchMutation.mutate(batch);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">ห้องที่เปิดให้ลูกอมดรอป</h1>
          <p className="text-xs text-neutral-400 mt-1">
            เลือกห้องข้อความใน Discord ที่อนุญาตให้บอทสุ่มดรอปลูกอมลงไป (ระบบจะจำการตั้งค่านี้ไว้เป็นค่าเริ่มต้นถาวร)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => refetchDiscord()}
            isLoading={isDiscordLoading}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            รีเฟรชห้อง
          </Button>
        </div>
      </div>

      {notification && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-500/30 rounded-lg text-xs text-emerald-300 font-medium">
          {notification}
        </div>
      )}

      {/* Stats & Quick Actions Toolbar */}
      <div className="p-4 rounded-xl bg-neutral-950/80 border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400">สถานะห้องดรอป:</span>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-950/40 text-emerald-400 border border-emerald-500/30">
              🟢 เปิดอยู่ {totalEnabledCount} ห้อง
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-neutral-900 text-neutral-400 border border-white/10">
              ทั้งหมด {textChannels.length} ห้อง
            </span>
          </div>

          {/* Bulk actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleEnableFiltered}
              disabled={batchMutation.isPending || filteredChannels.length === 0}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-950/30 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-900/40 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>เปิดทั้งหมดที่แสดง</span>
            </button>
            <button
              onClick={handleDisableFiltered}
              disabled={batchMutation.isPending || filteredChannels.length === 0}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-neutral-900 text-neutral-400 border border-white/10 hover:text-white transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Square className="w-3.5 h-3.5" />
              <span>ปิดทั้งหมดที่แสดง</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-white/10">
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              placeholder="ค้นหาชื่อห้อง เช่น #พูดคุย หรือ ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-neutral-900 border border-white/10 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500/50"
            />
          </div>

          <div className="sm:col-span-4 flex items-center gap-1 bg-neutral-900 p-1 rounded-lg border border-white/10">
            <button
              onClick={() => setFilterMode("ALL")}
              className={`flex-1 py-1 text-xs rounded font-medium transition cursor-pointer ${
                filterMode === "ALL" ? "bg-white/15 text-white" : "text-neutral-400 hover:text-white"
              }`}
            >
              ทั้งหมด
            </button>
            <button
              onClick={() => setFilterMode("ENABLED")}
              className={`flex-1 py-1 text-xs rounded font-medium transition cursor-pointer ${
                filterMode === "ENABLED" ? "bg-emerald-500/20 text-emerald-400" : "text-neutral-400 hover:text-white"
              }`}
            >
              เปิดอยู่
            </button>
            <button
              onClick={() => setFilterMode("DISABLED")}
              className={`flex-1 py-1 text-xs rounded font-medium transition cursor-pointer ${
                filterMode === "DISABLED" ? "bg-white/15 text-white" : "text-neutral-400 hover:text-white"
              }`}
            >
              ปิดอยู่
            </button>
          </div>
        </div>
      </div>

      {/* Channel List */}
      <div className="bg-neutral-950/70 border border-white/10 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between text-xs text-neutral-400">
          <span>แสดงห้องข้อความ {filteredChannels.length} จาก {textChannels.length} ห้อง</span>
          <span className="text-[11px] text-neutral-500">💡 การเลือกห้องจะจำไว้เป็นค่าหลักตลอดไป</span>
        </div>

        {isDiscordLoading || isConfigLoading ? (
          <div className="p-8 text-center text-xs text-neutral-500">กำลังโหลดรายการห้องใน Discord...</div>
        ) : filteredChannels.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-500">ไม่พบห้องที่ตรงกับการค้นหา</div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredChannels.map((ch) => {
              const cfg = configMap.get(ch.id);
              const isEnabled = cfg?.enabled || false;
              const weight = cfg?.weight || 1;

              return (
                <div
                  key={ch.id}
                  className={`p-3.5 flex items-center justify-between transition ${
                    isEnabled ? "bg-emerald-950/15 hover:bg-emerald-950/25" : "hover:bg-neutral-900/40"
                  }`}
                >
                  {/* Left: Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isEnabled
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-neutral-900 text-neutral-500 border border-white/5"
                      }`}
                    >
                      <Hash className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className={`text-xs font-bold truncate ${isEnabled ? "text-white" : "text-neutral-300"}`}>
                        #{ch.name}
                      </div>
                      <div className="text-[10px] text-neutral-500 font-mono">ID: {ch.id}</div>
                    </div>
                  </div>

                  {/* Right: Controls */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Weight (Only if enabled) */}
                    {isEnabled && (
                      <div className="flex items-center gap-1.5 text-xs text-neutral-400 bg-neutral-900/80 px-2 py-1 rounded border border-white/5">
                        <span className="text-[11px] text-neutral-500">โอกาส:</span>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={weight}
                          onChange={(e) =>
                            updateMutation.mutate({
                              channelId: ch.id,
                              name: ch.name,
                              enabled: true,
                              weight: parseInt(e.target.value, 10) || 1,
                            })
                          }
                          className="w-10 px-1 py-0.5 bg-neutral-800 border border-white/10 rounded text-xs text-white text-center font-mono"
                        />
                      </div>
                    )}

                    {/* Instant Drop Test Button */}
                    {isEnabled && (
                      <button
                        title="สั่งดรอปลูกอมลงห้องนี้ทันที"
                        onClick={() => instantDropMutation.mutate(ch.id)}
                        disabled={instantDropMutation.isPending}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-orange-400 hover:bg-orange-950/30 border border-transparent hover:border-orange-500/20 transition cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4" />
                      </button>
                    )}

                    {/* Toggle Button */}
                    <button
                      onClick={() =>
                        updateMutation.mutate({
                          channelId: ch.id,
                          name: ch.name,
                          enabled: !isEnabled,
                          weight,
                        })
                      }
                      disabled={updateMutation.isPending}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                        isEnabled
                          ? "bg-emerald-500 text-black hover:bg-emerald-400 shadow-sm shadow-emerald-500/20"
                          : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700 border border-white/5"
                      }`}
                    >
                      {isEnabled ? <Check className="w-3.5 h-3.5" /> : null}
                      <span>{isEnabled ? "เปิดดรอปแล้ว" : "ปิดอยู่"}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
