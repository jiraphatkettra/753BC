"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Send,
  Save,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Eye,
  Sliders,
  Palette,
  Image as ImageIcon,
  MessageSquare,
  Sparkles,
  Layers,
  Terminal,
  RotateCcw,
} from "lucide-react";
import CaptionRow from "@/components/ui/CaptionRow";
import Button from "@/components/ui/Button";
import { DEFAULT_EMBED_PRESETS, EmbedConfig, EmbedFieldItem } from "@/config/embedPresets";

const PRESET_COLORS = [
  { label: "White (Nitro)", hex: "#ffffff" },
  { label: "Blurple (Discord)", hex: "#5865f2" },
  { label: "Rose (Boost)", hex: "#f43f5e" },
  { label: "Purple (System)", hex: "#8b5cf6" },
  { label: "Amber (Terms)", hex: "#eab308" },
  { label: "Emerald (Ticket)", hex: "#10b981" },
  { label: "Cyan (Tech)", hex: "#06b6d4" },
  { label: "Dark (753BC)", hex: "#111214" },
];

const PANEL_COMMAND_MAP: Record<string, string> = {
  ticket_panel: "/panel ticket",
  shop_panel: "/panel shop",
  attendance_panel: "/panel attendance",
  leave_panel: "/panel leave",
  moderation_panel: "/panel moderation",
  admin_hub_panel: "/panel admin-hub",
  wallet_panel: "/panel wallet",
};

const PANEL_PREVIEW_BUTTONS: Record<
  string,
  Array<{ label: string; style: "primary" | "secondary" | "success" | "danger"; emoji?: string }>
> = {
  ticket_panel: [
    { label: "เปิดทิกเก็ตติดต่อทีมงาน • Open Ticket", style: "primary", emoji: "📩" },
  ],
  shop_panel: [
    { label: "เลือกซื้อยศ • Browse Roles", style: "primary", emoji: "🛒" },
    { label: "กระเป๋าเงิน • My Wallet", style: "secondary", emoji: "💳" },
    { label: "วิธีเติมเงิน • Top Up Info", style: "secondary", emoji: "💸" },
  ],
  attendance_panel: [
    { label: "เข้างาน • Clock In", style: "success", emoji: "🟢" },
    { label: "ออกงาน • Clock Out", style: "danger", emoji: "🔴" },
    { label: "บันทึกของฉัน • My Status", style: "secondary", emoji: "📊" },
  ],
  leave_panel: [
    { label: "ยื่นคำขอลางาน • Request Leave", style: "primary", emoji: "📝" },
    { label: "เช็คสถานะใบลา • My Requests", style: "secondary", emoji: "🔍" },
  ],
  moderation_panel: [
    { label: "ออกใบเตือน / ลงโทษ • Warn Member", style: "danger", emoji: "⚠️" },
    { label: "ประวัติการเตือน • Check Warnings", style: "secondary", emoji: "🔍" },
  ],
  admin_hub_panel: [
    { label: "รายชื่อทีมงาน • Staff List", style: "secondary", emoji: "👥" },
    { label: "คำขอลารออนุมัติ • Pending Leaves", style: "secondary", emoji: "⏳" },
    { label: "สำรองข้อมูลเซิร์ฟเวอร์ • Backup Server", style: "secondary", emoji: "💾" },
  ],
  wallet_panel: [
    { label: "เช็คยอดคงเหลือ • Check Balance", style: "primary", emoji: "💳" },
    { label: "วิธีเติมเงิน • How to Top Up", style: "secondary", emoji: "💸" },
    { label: "ประวัติการซื้อ • Purchase History", style: "secondary", emoji: "📜" },
  ],
  mamomi_nitro: [
    { label: "สั่งซื้อสินค้า", style: "primary", emoji: "🛒" },
    { label: "ประโยชน์ไนโตร", style: "success", emoji: "💎" },
    { label: "เช็คยอดเงิน", style: "secondary", emoji: "ℹ️" },
  ],
  mamomi_boost: [
    { label: "เติมเครดิต", style: "success", emoji: "💸" },
    { label: "เช็คเครดิต", style: "secondary", emoji: "👁️" },
    { label: "เงื่อนไขสินค้า", style: "secondary", emoji: "🛡️" },
  ],
  mamomi_auto_system: [
    { label: "เติมเงิน", style: "success", emoji: "💸" },
    { label: "เช็คเครดิต", style: "secondary", emoji: "👁️" },
    { label: "เงื่อนไข", style: "secondary", emoji: "🛡️" },
  ],
  terms_warranty: [
    { label: "อ่านข้อกำหนดฉบับเต็ม", style: "secondary", emoji: "📖" },
    { label: "ติดต่อฝ่ายดูแลลูกค้า", style: "primary", emoji: "💬" },
  ],
};

const BUTTON_STYLE_CLASSES = {
  primary: "bg-[#5865f2] hover:bg-[#4752c4] text-white",
  secondary: "bg-[#4e5058] hover:bg-[#6d6f78] text-white",
  success: "bg-[#248046] hover:bg-[#1a6334] text-white",
  danger: "bg-[#da373c] hover:bg-[#a1282c] text-white",
};

export default function EmbedStudioTab() {
  const queryClient = useQueryClient();

  // Load Presets from API
  const { data: presetsData, isLoading: isPresetsLoading, refetch: refetchPresets } = useQuery({
    queryKey: ["admin-embed-presets"],
    queryFn: async () => {
      const res = await fetch("/api/admin/bot/embeds");
      if (!res.ok) throw new Error("Failed to load embed presets");
      return res.json();
    },
  });

  // Load Channels from Bot API
  const { data: guildData, isLoading: isGuildLoading } = useQuery({
    queryKey: ["admin-guild-data"],
    queryFn: async () => {
      const res = await fetch("/api/admin/bot/guild-data");
      if (!res.ok) throw new Error("Failed to load guild channels");
      return res.json();
    },
  });

  // Editor State (Default to ticket_panel for /panel focus)
  const [selectedKey, setSelectedKey] = useState<string>("ticket_panel");
  const [targetChannelId, setTargetChannelId] = useState<string>("");
  const [additionalContent, setAdditionalContent] = useState<string>("");
  const [embed, setEmbed] = useState<EmbedConfig>(DEFAULT_EMBED_PRESETS.ticket_panel || DEFAULT_EMBED_PRESETS.mamomi_nitro);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Sync state when selected preset changes
  useEffect(() => {
    const list = presetsData?.presets || Object.values(DEFAULT_EMBED_PRESETS);
    const found = list.find((p: any) => p.key === selectedKey) || DEFAULT_EMBED_PRESETS[selectedKey];
    if (found) {
      setEmbed(JSON.parse(JSON.stringify(found)));
    }
  }, [selectedKey, presetsData]);

  // Set default channel when channels load
  useEffect(() => {
    if (guildData?.channels && guildData.channels.length > 0 && !targetChannelId) {
      setTargetChannelId(guildData.channels[0].id);
    }
  }, [guildData, targetChannelId]);

  // Save Preset Mutation
  const saveMutation = useMutation({
    mutationFn: async (payload: EmbedConfig) => {
      const res = await fetch("/api/admin/bot/embeds", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save preset");
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-embed-presets"] });
      setFeedback({ type: "success", text: data.message || "บันทึกเทมเพลตเรียบร้อยแล้ว!" });
      setTimeout(() => setFeedback(null), 4000);
    },
    onError: (err: any) => {
      setFeedback({ type: "error", text: err.message });
    },
  });

  // Send Embed Mutation
  const sendMutation = useMutation({
    mutationFn: async (payload: { channelId: string; embed: EmbedConfig; content?: string }) => {
      const res = await fetch("/api/admin/bot/embeds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send embed to Discord");
      return data;
    },
    onSuccess: (data) => {
      setFeedback({ type: "success", text: data.message || "ส่งข้อความ Embed เข้าห้อง Discord สำเร็จ!" });
      setTimeout(() => setFeedback(null), 5000);
    },
    onError: (err: any) => {
      setFeedback({ type: "error", text: err.message });
    },
  });

  // Field helpers
  const handleAddField = () => {
    const newField: EmbedFieldItem = {
      id: `f_${Date.now()}`,
      name: "หัวข้อใหม่",
      value: "รายละเอียดข้อมูล",
      inline: true,
    };
    setEmbed({
      ...embed,
      fields: {
        enabled: true,
        items: [...(embed.fields?.items || []), newField],
      },
    });
  };

  const handleUpdateField = (id: string, key: "name" | "value" | "inline", val: any) => {
    const updated = (embed.fields?.items || []).map((f) => {
      if (f.id === id) {
        return { ...f, [key]: val };
      }
      return f;
    });
    setEmbed({
      ...embed,
      fields: {
        ...embed.fields,
        items: updated,
      },
    });
  };

  const handleDeleteField = (id: string) => {
    setEmbed({
      ...embed,
      fields: {
        ...embed.fields,
        items: (embed.fields?.items || []).filter((f) => f.id !== id),
      },
    });
  };

  const handleResetToDefault = () => {
    if (DEFAULT_EMBED_PRESETS[selectedKey]) {
      setEmbed(JSON.parse(JSON.stringify(DEFAULT_EMBED_PRESETS[selectedKey])));
      setFeedback({
        type: "success",
        text: "รีเซ็ตเนื้อหากลับเป็นค่าเริ่มต้นแล้ว (กดบันทึกเพื่ออัปเดตลงระบบบอท)",
      });
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const presetsList: Array<EmbedConfig & { isCustomized?: boolean }> =
    presetsData?.presets || Object.values(DEFAULT_EMBED_PRESETS);

  // Group presets into distinct logical buckets
  const panelPresets = presetsList.filter(
    (p) => p.category === "panel" || p.key.endsWith("_panel")
  );
  const storePresets = presetsList.filter(
    (p) =>
      (p.category === "store" ||
        p.category === "boost" ||
        p.category === "system" ||
        p.category === "rules" ||
        p.key.startsWith("mamomi_") ||
        p.key === "terms_warranty") &&
      !p.key.endsWith("_panel")
  );
  const eventPresets = presetsList.filter(
    (p) =>
      ["ticket_welcome", "attendance_clockin", "moderation_warn_member"].includes(p.key) ||
      p.category === "attendance" ||
      p.category === "moderation"
  );
  const otherPresets = presetsList.filter(
    (p) =>
      !panelPresets.some((x) => x.key === p.key) &&
      !storePresets.some((x) => x.key === p.key) &&
      !eventPresets.some((x) => x.key === p.key)
  );

  const activeButtons = PANEL_PREVIEW_BUTTONS[selectedKey] || [];
  const panelCommand = PANEL_COMMAND_MAP[selectedKey];

  return (
    <div className="p-6 sm:p-8">
      {/* Top Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <CaptionRow label="DISCORD_BOT // EMBED_STUDIO" meta="PANEL_&_GUILD_UI_EDITOR" />
          <p className="text-xs text-neutral-400 mt-1">
            ปรับแต่ง Embed ของคำสั่ง <code className="text-white bg-white/10 px-1 py-0.5 font-mono">/panel</code> และป้ายร้านค้า
            พร้อมระบบแนบรูปโปสเตอร์และปุ่ม Interactive Component ส่งตรงเข้าห้อง Discord
          </p>
        </div>

        {feedback && (
          <div
            className={`p-3 text-xs font-mono flex items-center gap-2 border animate-in fade-in duration-200 ${
              feedback.type === "success"
                ? "bg-emerald-950/50 border-emerald-500/50 text-emerald-300"
                : "bg-red-950/50 border-red-500/50 text-red-300"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}
      </div>

      {/* LynnBot Integration Info Banner */}
      <div className="mb-6 p-4 border border-white/[0.08] bg-[#040506] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-none border border-emerald-500/30 bg-emerald-950/40 flex items-center justify-center shrink-0">
            <Terminal className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-xs font-mono font-bold text-white flex items-center gap-2">
              <span>เชื่อมต่อคำสั่ง /panel ของ LynnBot โดยตรง</span>
              {panelCommand && (
                <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px]">
                  คำสั่ง: {panelCommand}
                </span>
              )}
            </div>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              เมื่อแก้ไขและกด <span className="text-white font-semibold">[ 💾 บันทึกการตั้งค่าเทมเพลตนี้ ]</span> บอท LynnBot จะดึงข้อความและรูปภาพนี้ไปแสดงอัตโนมัติเมื่อรันคำสั่งในเซิร์ฟเวอร์
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-2.5 py-1.5 text-[11px] font-mono border border-white/10 hover:border-white/30 text-neutral-400 hover:text-white flex items-center gap-1.5 transition-colors"
            title="รีเซ็ตเนื้อหากลับเป็นค่าเริ่มต้นของเทมเพลตนี้"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>รีเซ็ตค่าเริ่มต้น</span>
          </button>
        </div>
      </div>

      {/* Preset & Target Channel Selector Strip */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border border-white/[0.08] bg-[#040506] mb-6">
        {/* Presets dropdown with categorized optgroups */}
        <div className="md:col-span-6">
          <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-white" />
            <span>เลือกเทมเพลตเรฟเฟอเรนซ์ (PRESET_TEMPLATE)</span>
          </label>
          <select
            value={selectedKey}
            onChange={(e) => setSelectedKey(e.target.value)}
            className="w-full px-3 py-2 bg-[#070809] border border-white/[0.1] focus:border-white text-xs font-mono text-white focus:outline-none"
          >
            <optgroup label="📌 แผงควบคุมระบบ (BOT /PANEL INTERACTIVE)" className="bg-[#111214] text-neutral-400 font-bold">
              {panelPresets.map((p) => (
                <option key={p.key} value={p.key} className="bg-[#070809] text-white font-normal">
                  {p.name} {p.isCustomized ? "★ (ปรับแต่งแล้ว)" : ""}
                </option>
              ))}
            </optgroup>

            <optgroup label="🛍️ ป้ายสินค้า & โปสเตอร์ (STORE POSTERS)" className="bg-[#111214] text-neutral-400 font-bold">
              {storePresets.map((p) => (
                <option key={p.key} value={p.key} className="bg-[#070809] text-white font-normal">
                  {p.name} {p.isCustomized ? "★ (ปรับแต่งแล้ว)" : ""}
                </option>
              ))}
            </optgroup>

            <optgroup label="🔔 ข้อความแจ้งเตือนอัตโนมัติ (BOT EVENTS)" className="bg-[#111214] text-neutral-400 font-bold">
              {eventPresets.map((p) => (
                <option key={p.key} value={p.key} className="bg-[#070809] text-white font-normal">
                  {p.name} {p.isCustomized ? "★ (ปรับแต่งแล้ว)" : ""}
                </option>
              ))}
            </optgroup>

            {otherPresets.length > 0 && (
              <optgroup label="✨ เทมเพลตเพิ่มเติม (CUSTOM)" className="bg-[#111214] text-neutral-400 font-bold">
                {otherPresets.map((p) => (
                  <option key={p.key} value={p.key} className="bg-[#070809] text-white font-normal">
                    {p.name} ★
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>

        {/* Channel Selector */}
        <div className="md:col-span-6">
          <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-white" />
            <span>ห้อง DISCORD ปลายทาง (TARGET_CHANNEL)</span>
          </label>
          <div className="flex gap-2">
            <select
              value={targetChannelId}
              onChange={(e) => setTargetChannelId(e.target.value)}
              className="flex-1 px-3 py-2 bg-[#070809] border border-white/[0.1] focus:border-white text-xs font-mono text-white focus:outline-none"
            >
              {(guildData?.channels || []).map((c: any) => (
                <option key={c.id} value={c.id} className="bg-[#070809] text-white">
                  #{c.name} {c.type === 5 ? "(Announcement)" : ""}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="หรือใส่ Channel ID"
              value={targetChannelId}
              onChange={(e) => setTargetChannelId(e.target.value)}
              className="w-36 px-2.5 py-2 bg-[#070809] border border-white/[0.1] focus:border-white text-[11px] font-mono text-neutral-300 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Main 2-Column Split: Left Editor (7 cols) + Right Live Preview (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── LEFT: EDITOR CONTROLS ── */}
        <div className="lg:col-span-7 space-y-5">
          {/* Section 1: Basic Embed Info */}
          <div className="p-5 border border-white/[0.08] bg-[#040506] space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
              <span className="text-xs font-bold font-mono text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-white" />
                <span>01 // EMBED_CORE_CONTENT</span>
              </span>
              <span className="text-[10px] font-mono text-neutral-500">PROPERTIES</span>
            </div>

            {/* Optional Outside Message Content */}
            <div>
              <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1 flex items-center gap-1.5">
                <MessageSquare className="w-3 h-3 text-neutral-400" />
                <span>MESSAGE_CONTENT (ข้อความธรรมดานอก Embed เช่น @everyone หรือข้อความประกาศ - เว้นว่างได้)</span>
              </label>
              <input
                type="text"
                value={additionalContent}
                onChange={(e) => setAdditionalContent(e.target.value)}
                placeholder="เช่น ประกาศอัปเดตระบบ หรือ @everyone (ไม่บังคับ)"
                className="w-full px-3 py-2 bg-[#070809] border border-white/[0.1] focus:border-white text-xs text-white focus:outline-none font-mono"
              />
            </div>

            {/* Author */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">
                  AUTHOR_NAME (ชื่อหัวข้อด้านบนสุด)
                </label>
                <input
                  type="text"
                  value={embed.author?.name || ""}
                  onChange={(e) =>
                    setEmbed({
                      ...embed,
                      author: { ...embed.author, name: e.target.value, enabled: true },
                    })
                  }
                  placeholder="เช่น LynnBot Support"
                  className="w-full px-3 py-2 bg-[#070809] border border-white/[0.1] focus:border-white text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">
                  AUTHOR_ICON_URL (ลิงก์ไอคอนเล็ก)
                </label>
                <input
                  type="text"
                  value={embed.author?.iconUrl || ""}
                  onChange={(e) =>
                    setEmbed({
                      ...embed,
                      author: { ...embed.author, iconUrl: e.target.value, enabled: true },
                    })
                  }
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-[#070809] border border-white/[0.1] focus:border-white text-xs text-white focus:outline-none font-mono"
                />
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">
                TITLE (หัวเรื่องหลัก)
              </label>
              <input
                type="text"
                value={embed.title?.text || ""}
                onChange={(e) =>
                  setEmbed({
                    ...embed,
                    title: { ...embed.title, text: e.target.value, enabled: true },
                  })
                }
                placeholder="เช่น 📩 TICKET SUPPORT • ศูนย์บริการช่วยเหลือ"
                className="w-full px-3 py-2 bg-[#070809] border border-white/[0.1] focus:border-white text-xs text-white font-semibold focus:outline-none"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">
                DESCRIPTION (เนื้อหารายละเอียด - รองรับ Markdown, **หนา**, `โค้ด`, &gt; คำคม, -# ข้อความเล็ก)
              </label>
              <textarea
                rows={6}
                value={embed.descriptionText?.text || ""}
                onChange={(e) =>
                  setEmbed({
                    ...embed,
                    descriptionText: { ...embed.descriptionText, text: e.target.value, enabled: true },
                  })
                }
                placeholder="พิมพ์รายละเอียดเนื้อหาของ Embed..."
                className="w-full px-3 py-2 bg-[#070809] border border-white/[0.1] focus:border-white text-xs text-white focus:outline-none font-mono leading-relaxed resize-y"
              />
            </div>

            {/* Color Picker & Swatches */}
            <div>
              <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1.5 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-white" />
                <span>SIDE_BAR_COLOR (สีแถบด้านซ้าย)</span>
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="color"
                  value={embed.color?.hex || "#ffffff"}
                  onChange={(e) =>
                    setEmbed({
                      ...embed,
                      color: { enabled: true, hex: e.target.value },
                    })
                  }
                  className="w-8 h-8 bg-transparent border border-white/20 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={embed.color?.hex || "#ffffff"}
                  onChange={(e) =>
                    setEmbed({
                      ...embed,
                      color: { enabled: true, hex: e.target.value },
                    })
                  }
                  className="w-24 px-2 py-1.5 bg-[#070809] border border-white/[0.1] text-xs font-mono text-white focus:outline-none"
                />

                <div className="flex flex-wrap gap-1.5 ml-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() =>
                        setEmbed({
                          ...embed,
                          color: { enabled: true, hex: c.hex },
                        })
                      }
                      className="px-2 py-1 text-[10px] font-mono border border-white/[0.1] hover:border-white transition-colors flex items-center gap-1 text-neutral-300"
                    >
                      <span className="w-2.5 h-2.5 rounded-none" style={{ backgroundColor: c.hex }} />
                      <span>{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Poster Image / Banner (CRITICAL FOR USER REQUIREMENT) */}
          <div className="p-5 border border-white/[0.08] bg-[#040506] space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
              <span className="text-xs font-bold font-mono text-white flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-white" />
                <span>02 // POSTER_IMAGE &amp; THUMBNAIL</span>
              </span>
              <span className="text-[10px] font-mono text-neutral-500">MEDIA</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">
                  POSTER_IMAGE_URL (รูปภาพโปสเตอร์หลักขนาดใหญ่ - วางลิงก์รูปภาพที่ต้องการ)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={embed.image?.url || ""}
                    onChange={(e) =>
                      setEmbed({
                        ...embed,
                        image: { enabled: Boolean(e.target.value.trim()), url: e.target.value },
                      })
                    }
                    placeholder="https://... หรือลิงก์ Discord CDN / Imgur / R2"
                    className="flex-1 px-3 py-2 bg-[#070809] border border-white/[0.1] focus:border-white text-xs font-mono text-white focus:outline-none"
                  />
                  {embed.image?.url && (
                    <button
                      type="button"
                      onClick={() =>
                        setEmbed({
                          ...embed,
                          image: { enabled: false, url: "" },
                        })
                      }
                      className="px-3 text-xs font-mono text-neutral-400 hover:text-red-400 border border-white/[0.1]"
                    >
                      ลบรูป
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-neutral-500 mt-1 font-mono">
                  * คุณสามารถแปะลิงก์รูปโปสเตอร์ของร้านตนเองได้ที่นี่ รูปจะแสดงในตัวอย่างด้านขวาและส่งเข้า Discord ทันที
                </p>

                {embed.image?.url && (
                  <div className="mt-3 p-2.5 bg-[#070809] border border-white/[0.1] flex items-center gap-3">
                    <img
                      src={embed.image.url}
                      alt="Poster Preview"
                      className="w-24 h-14 object-cover border border-white/20 shrink-0"
                      onError={(e) => {
                        (e.target as HTMLElement).style.opacity = "0.3";
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-mono text-emerald-400 block font-bold">✓ รูปภาพโปสเตอร์พร้อมใช้งาน</span>
                      <span className="text-[10px] font-mono text-neutral-500 truncate block">{embed.image.url}</span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">
                  THUMBNAIL_URL (รูปภาพ Thumbnail มุมขวาบน)
                </label>
                <input
                  type="text"
                  value={embed.thumbnail?.url || ""}
                  onChange={(e) =>
                    setEmbed({
                      ...embed,
                      thumbnail: { enabled: Boolean(e.target.value.trim()), url: e.target.value },
                    })
                  }
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-[#070809] border border-white/[0.1] focus:border-white text-xs font-mono text-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Embed Fields Builder */}
          <div className="p-5 border border-white/[0.08] bg-[#040506] space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
              <span className="text-xs font-bold font-mono text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-white" />
                <span>03 // EMBED_FIELDS (ช่องตารางข้อมูล)</span>
              </span>
              <button
                type="button"
                onClick={handleAddField}
                className="px-2.5 py-1 text-[11px] font-mono text-black bg-white hover:bg-neutral-200 font-bold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ เพิ่ม Field</span>
              </button>
            </div>

            {(!embed.fields?.items || embed.fields.items.length === 0) ? (
              <div className="p-6 text-center text-xs font-mono text-neutral-500 border border-dashed border-white/10">
                ยังไม่มี Fields ตารางข้อมูล (คลิก &quot;+ เพิ่ม Field&quot; เพื่อเพิ่ม)
              </div>
            ) : (
              <div className="space-y-3">
                {embed.fields.items.map((field, idx) => (
                  <div
                    key={field.id || idx}
                    className="p-3 border border-white/[0.08] bg-[#070809] space-y-2 relative group"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <input
                        type="text"
                        value={field.name}
                        onChange={(e) => handleUpdateField(field.id, "name", e.target.value)}
                        placeholder="ชื่อ Field (เช่น 📅 รายเดือน)"
                        className="flex-1 px-2.5 py-1.5 bg-[#040506] border border-white/[0.1] text-xs font-semibold text-white focus:outline-none"
                      />

                      <label className="flex items-center gap-1.5 text-[10px] font-mono text-neutral-400 cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={field.inline}
                          onChange={(e) => handleUpdateField(field.id, "inline", e.target.checked)}
                          className="w-3.5 h-3.5 accent-white"
                        />
                        <span>Inline (เรียงแถวเดียวกัน)</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => handleDeleteField(field.id)}
                        className="p-1.5 text-neutral-500 hover:text-red-400 transition-colors"
                        title="ลบ Field นี้"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <textarea
                      rows={2}
                      value={field.value}
                      onChange={(e) => handleUpdateField(field.id, "value", e.target.value)}
                      placeholder="ข้อความใน Field (เช่น 165.- บาท)"
                      className="w-full px-2.5 py-1.5 bg-[#040506] border border-white/[0.1] text-xs font-mono text-white focus:outline-none resize-y"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 4: Footer */}
          <div className="p-5 border border-white/[0.08] bg-[#040506] space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
              <span className="text-xs font-bold font-mono text-white">04 // FOOTER &amp; TIMESTAMP</span>
              <span className="text-[10px] font-mono text-neutral-500">SIGNATURE</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">
                  FOOTER_TEXT (ข้อความท้าย Embed)
                </label>
                <input
                  type="text"
                  value={embed.footer?.text || ""}
                  onChange={(e) =>
                    setEmbed({
                      ...embed,
                      footer: { ...embed.footer, text: e.target.value, enabled: true },
                    })
                  }
                  placeholder="เช่น LynnBot Operations System"
                  className="w-full px-3 py-2 bg-[#070809] border border-white/[0.1] focus:border-white text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">
                  FOOTER_ICON_URL (ไอคอนท้าย)
                </label>
                <input
                  type="text"
                  value={embed.footer?.iconUrl || ""}
                  onChange={(e) =>
                    setEmbed({
                      ...embed,
                      footer: { ...embed.footer, iconUrl: e.target.value, enabled: true },
                    })
                  }
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-[#070809] border border-white/[0.1] focus:border-white text-xs font-mono text-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="p-4 border border-white/[0.08] bg-[#040506] flex flex-wrap items-center justify-between gap-3">
            <Button
              variant="secondary"
              onClick={() => saveMutation.mutate(embed)}
              disabled={saveMutation.isPending}
              icon={<Save className="w-3.5 h-3.5" />}
            >
              {saveMutation.isPending ? "กำลังบันทึก..." : "💾 บันทึกการตั้งค่าเทมเพลตนี้"}
            </Button>

            <Button
              variant="primary"
              onClick={() => {
                if (!targetChannelId) {
                  setFeedback({ type: "error", text: "กรุณาเลือกห้อง Discord ปลายทางก่อนส่ง" });
                  return;
                }
                sendMutation.mutate({
                  channelId: targetChannelId,
                  embed,
                  content: additionalContent,
                });
              }}
              disabled={sendMutation.isPending}
              icon={<Send className="w-3.5 h-3.5 text-black" />}
            >
              {sendMutation.isPending ? "กำลังส่งเข้า Discord..." : "🚀 ส่งแผงควบคุมเข้า Discord ทันที"}
            </Button>
          </div>
        </div>

        {/* ── RIGHT: LIVE DISCORD CLIENT PREVIEW ── */}
        <div className="lg:col-span-5 sticky top-24 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
            <span className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-white" />
              <span>LIVE_DISCORD_PREVIEW</span>
            </span>
            <span className="text-[10px] text-neutral-500 font-mono">
              {panelCommand ? `AUTO-SYNC: ${panelCommand}` : "DISCORD DARK UI"}
            </span>
          </div>

          {/* Discord Message Container Mockup */}
          <div className="bg-[#313338] border border-[#232428] p-4 text-white font-sans text-sm shadow-2xl">
            {/* Discord Bot Header */}
            <div className="flex items-start gap-3.5 mb-2.5">
              <div className="w-10 h-10 rounded-full bg-[#5865f2] flex items-center justify-center font-bold text-white shrink-0 overflow-hidden">
                {embed.author?.iconUrl ? (
                  <img src={embed.author.iconUrl} alt="Bot Icon" className="w-full h-full object-cover" />
                ) : (
                  <span>L</span>
                )}
              </div>

              <div className="min-w-0 leading-tight">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-white text-[15px] hover:underline cursor-pointer">
                    {embed.author?.name || "LynnBot"}
                  </span>
                  <span className="px-1 py-0.2 bg-[#5865f2] text-white text-[10px] font-bold rounded-[3px] uppercase tracking-wider">
                    ✓ แอป
                  </span>
                  <span className="text-[11px] text-[#949ba4] ml-1">วันนี้ เวลา 19:00</span>
                </div>
                {additionalContent && (
                  <p className="text-[#dbdee1] text-xs mt-1.5 font-sans whitespace-pre-wrap">{additionalContent}</p>
                )}
              </div>
            </div>

            {/* Embed Container with Left Border Strip */}
            <div
              className="ml-13 bg-[#2b2d31] p-4 rounded-[4px] border-l-4 space-y-3"
              style={{ borderLeftColor: embed.color?.hex || "#ffffff" }}
            >
              {/* Author */}
              {embed.author?.name && (
                <div className="flex items-center gap-2 text-xs font-semibold text-[#dbdee1]">
                  {embed.author.iconUrl && (
                    <img src={embed.author.iconUrl} alt="" className="w-4 h-4 rounded-full object-cover" />
                  )}
                  <span>{embed.author.name}</span>
                </div>
              )}

              {/* Title */}
              {embed.title?.text && (
                <h4 className="text-[15px] font-bold text-white hover:underline cursor-pointer">
                  {embed.title.text}
                </h4>
              )}

              {/* Description */}
              {embed.descriptionText?.text && (
                <div className="text-[13px] text-[#dbdee1] whitespace-pre-wrap leading-relaxed font-sans">
                  {embed.descriptionText.text}
                </div>
              )}

              {/* Fields */}
              {embed.fields?.items && embed.fields.items.length > 0 && (
                <div className="grid grid-cols-12 gap-2.5 pt-1">
                  {embed.fields.items.map((field, idx) => (
                    <div
                      key={field.id || idx}
                      className={field.inline ? "col-span-6 sm:col-span-4" : "col-span-12"}
                    >
                      <div className="text-xs font-bold text-white mb-0.5">{field.name}</div>
                      <div className="text-xs text-[#dbdee1] whitespace-pre-wrap font-mono bg-black/20 p-1.5 rounded-[3px]">
                        {field.value}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Poster Image */}
              {embed.image?.url ? (
                <div className="pt-2 overflow-hidden rounded-[4px]">
                  <img
                    src={embed.image.url}
                    alt="Embed Poster"
                    className="w-full max-h-72 object-cover rounded-[4px] border border-white/10"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                </div>
              ) : (
                <div className="p-4 border border-dashed border-[#4e5058] rounded-[4px] text-center text-xs text-[#949ba4] font-mono">
                  [ ยังไม่ได้ใส่รูปภาพโปสเตอร์ (วางลิงก์รูปที่ช่อง POSTER_IMAGE_URL ด้านซ้าย) ]
                </div>
              )}

              {/* Footer */}
              {(embed.footer?.text || embed.timestamp?.enabled) && (
                <div className="flex items-center gap-2 text-[11px] text-[#949ba4] pt-1">
                  {embed.footer?.iconUrl && (
                    <img src={embed.footer.iconUrl} alt="" className="w-3.5 h-3.5 rounded-full object-cover" />
                  )}
                  <span>{embed.footer?.text || "LynnBot Operations System"}</span>
                  {embed.timestamp?.enabled && <span>• วันนี้ เวลา 19:00</span>}
                </div>
              )}
            </div>

            {/* Dynamic Interactive Action Buttons matching this Panel */}
            {activeButtons.length > 0 && (
              <div className="ml-13 mt-3 pt-2.5 border-t border-[#35363c]">
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#949ba4] mb-2">
                  <Layers className="w-3 h-3 text-[#5865f2]" />
                  <span>DISCORD INTERACTIVE BUTTONS (แนบและทำงานอัตโนมัติ)</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {activeButtons.map((btn, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-[3px] flex items-center gap-1.5 transition-colors cursor-default ${
                        BUTTON_STYLE_CLASSES[btn.style]
                      }`}
                    >
                      {btn.emoji && <span>{btn.emoji}</span>}
                      <span>{btn.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
