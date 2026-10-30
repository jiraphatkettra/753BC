"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Hash, Check, X, Sparkles, RefreshCw } from "lucide-react";
import Button from "@/components/ui/Button";

export default function AdminChannelsPage() {
  const queryClient = useQueryClient();

  // Fetch Discord channels
  const { data: discordData, isLoading: isDiscordLoading } = useQuery({
    queryKey: ["candy-discord-channels"],
    queryFn: async () => {
      const res = await fetch("/api/admin/candy/discord/channels");
      if (!res.ok) throw new Error("Failed to load discord channels");
      return res.json();
    },
  });

  // Fetch configured event channels
  const { data: channelsData, isLoading: isConfigLoading } = useQuery({
    queryKey: ["candy-admin-channels"],
    queryFn: async () => {
      const res = await fetch("/api/admin/candy/channels");
      if (!res.ok) throw new Error("Failed to load event channels");
      return res.json();
    },
  });

  const discordChannels: any[] = discordData?.channels || [];
  const configuredChannels: any[] = channelsData?.channels || [];
  const configMap = new Map(configuredChannels.map((c) => [c.channelId, c]));

  // Toggle or update channel
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candy-admin-channels"] });
    },
  });

  const textChannels = discordChannels.filter((c) => c.type === 0 || c.type === 5);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">ห้องที่เปิดให้ลูกอมดรอป</h1>
          <p className="text-xs text-neutral-400 mt-1">เลือกห้องข้อความใน Discord ที่อนุญาตให้บอทสุ่มดรอปลูกอมลงไป</p>
        </div>
      </div>

      <div className="bg-neutral-950/70 border border-white/10 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            ห้องข้อความทั้งหมดในเซิร์ฟเวอร์ ({textChannels.length} ห้อง)
          </span>
        </div>

        <div className="divide-y divide-white/5">
          {textChannels.map((ch) => {
            const config = configMap.get(ch.id);
            const isEnabled = config ? config.enabled : false;
            const weight = config ? config.weight : 1;

            return (
              <div key={ch.id} className="p-4 flex items-center justify-between hover:bg-neutral-900/40 transition">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isEnabled ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" : "bg-neutral-900 text-neutral-500 border border-white/5"}`}>
                    <Hash className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">#{ch.name}</div>
                    <div className="text-[10px] text-neutral-500 font-mono">ID: {ch.id}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {isEnabled && (
                    <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                      <span>น้ำหนัก:</span>
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
                        className="w-14 px-2 py-1 bg-neutral-900 border border-white/10 rounded text-xs text-white text-center font-mono"
                      />
                    </div>
                  )}

                  <button
                    onClick={() =>
                      updateMutation.mutate({
                        channelId: ch.id,
                        name: ch.name,
                        enabled: !isEnabled,
                        weight,
                      })
                    }
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${isEnabled ? "bg-emerald-500 text-black hover:bg-emerald-400" : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"}`}
                  >
                    {isEnabled ? <Check className="w-3.5 h-3.5" /> : null}
                    <span>{isEnabled ? "เปิดดรอปแล้ว" : "ปิดอยู่"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
