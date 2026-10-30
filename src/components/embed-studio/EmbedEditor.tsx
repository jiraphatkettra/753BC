"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Save,
  Send,
  RotateCcw,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  Sliders,
  FileCode,
  Layers,
  Upload,
} from "lucide-react";
import {
  EmbedTemplatePayload,
  TEMPLATE_REGISTRY,
  DEFAULT_THEME,
  DEFAULT_EMBED_TEMPLATES,
  CANDY_BUTTON_ACTIONS,
  validateDiscordLimits,
} from "@/lib/candy";
import DiscordMessagePreview from "./DiscordMessagePreview";
import Button from "@/components/ui/Button";

const THEME_PRESET_COLORS = [
  { label: "Copper (กติกา)", hex: "#A0714F" },
  { label: "Halloween Orange", hex: "#F97316" },
  { label: "Blurple (Discord)", hex: "#5865F2" },
  { label: "Emerald (สำเร็จ)", hex: "#10B981" },
  { label: "Ruby (ผิดพลาด)", hex: "#EF4444" },
  { label: "Dark Terminal", hex: "#111214" },
];

export default function EmbedEditor() {
  const queryClient = useQueryClient();
  const [selectedKey, setSelectedKey] = useState<string>("candy_drop");
  const [activeTab, setActiveTab] = useState<"page" | "buttons" | "pager" | "vars" | "json">("page");
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch templates from API
  const { data: templatesData, isLoading } = useQuery({
    queryKey: ["admin-embeds"],
    queryFn: async () => {
      const res = await fetch("/api/admin/candy/embeds");
      if (!res.ok) throw new Error("Failed to load templates");
      return res.json();
    },
  });

  const templates: any[] = templatesData?.templates || [];
  const activeTemplate = templates.find((t) => t.key === selectedKey) || {
    key: selectedKey,
    name: TEMPLATE_REGISTRY[selectedKey]?.name || selectedKey,
    payload: DEFAULT_EMBED_TEMPLATES[selectedKey] || { pages: [{ color: "#A0714F", title: "Untitled" }] },
  };

  const [currentPayload, setCurrentPayload] = useState<EmbedTemplatePayload>(
    (activeTemplate.draft || activeTemplate.payload) as EmbedTemplatePayload
  );

  // Sync state on template selection change
  const handleSelectTemplate = (key: string) => {
    setSelectedKey(key);
    setActivePageIndex(0);
    const tmpl = templates.find((t) => t.key === key);
    if (tmpl) {
      setCurrentPayload((tmpl.draft || tmpl.payload) as EmbedTemplatePayload);
    } else if (DEFAULT_EMBED_TEMPLATES[key]) {
      setCurrentPayload(DEFAULT_EMBED_TEMPLATES[key]);
    }
  };

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async ({ isPublish }: { isPublish: boolean }) => {
      const endpoint = isPublish ? `/api/admin/candy/embeds/${selectedKey}/publish` : `/api/admin/candy/embeds/${selectedKey}`;
      const res = await fetch(endpoint, {
        method: isPublish ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentPayload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to save template");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-embeds"] });
      setNotification({
        type: "success",
        text: variables.isPublish ? "✅ เผยแพร่ Embed ไปยังบอทเรียบร้อยแล้ว!" : "💾 บันทึกร่างแบบ Draft เรียบร้อย",
      });
      setTimeout(() => setNotification(null), 4000);
    },
    onError: (err: any) => {
      setNotification({ type: "error", text: `❌ ${err.message}` });
      setTimeout(() => setNotification(null), 5000);
    },
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/candy/embeds/${selectedKey}/reset`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to reset");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-embeds"] });
      if (DEFAULT_EMBED_TEMPLATES[selectedKey]) {
        setCurrentPayload(DEFAULT_EMBED_TEMPLATES[selectedKey]);
      }
      setNotification({ type: "success", text: "🔄 รีเซ็ตกลับเป็นค่าเริ่มต้นสำเร็จ" });
      setTimeout(() => setNotification(null), 3000);
    },
  });

  const currentPage = currentPayload.pages[activePageIndex] || currentPayload.pages[0];

  const updateCurrentPage = (updater: (prev: any) => any) => {
    setCurrentPayload((prev) => {
      const newPages = [...prev.pages];
      newPages[activePageIndex] = updater(newPages[activePageIndex]);
      return { ...prev, pages: newPages };
    });
  };

  const handleApplyRulebookTheme = () => {
    updateCurrentPage((p) => ({
      ...p,
      color: DEFAULT_THEME.color,
      description: `# ${p.title || "หัวข้อกิจกรรม"}\n\`เงื่อนไขสำคัญ\`\n\n### รายละเอียด:\n\`\`\`diff\n+ ข้อปฏิบัติสำคัญ\n- ข้อห้ามเข้มงวด\n\`\`\`\n\n${DEFAULT_THEME.decoLine}\n${DEFAULT_THEME.divider}`,
    }));
  };

  const validation = validateDiscordLimits(currentPage);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* 1. LEFT COLUMN: Template Selector */}
      <div className="lg:col-span-3 bg-neutral-950/60 border border-white/10 rounded-xl p-4 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Embed Templates</h2>
          <input
            type="text"
            placeholder="ค้นหา template..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 bg-neutral-900 border border-white/10 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/30"
          />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-1.5 pb-2 border-b border-white/5">
          {["all", "drop", "claim", "error", "panel", "info", "redeem", "announce", "admin"].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2 py-1 text-[11px] rounded transition ${selectedCategory === cat ? "bg-white text-black font-semibold" : "bg-neutral-900 text-neutral-400 hover:text-white"}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* List of Templates */}
        <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
          {Object.entries(TEMPLATE_REGISTRY)
            .filter(([key, meta]) => {
              const matchSearch = key.toLowerCase().includes(searchQuery.toLowerCase()) || meta.name.toLowerCase().includes(searchQuery.toLowerCase());
              const matchCat = selectedCategory === "all" || meta.category === selectedCategory;
              return matchSearch && matchCat;
            })
            .map(([key, meta]) => {
              const isSelected = selectedKey === key;
              return (
                <button
                  key={key}
                  onClick={() => handleSelectTemplate(key)}
                  className={`w-full text-left p-2.5 rounded-lg border transition ${isSelected ? "bg-orange-950/30 border-orange-500/50 text-white" : "bg-neutral-900/60 border-white/5 text-neutral-300 hover:bg-neutral-800/80 hover:border-white/20"}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-xs text-white">{meta.name}</span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/5 text-neutral-400">
                      {meta.category}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-neutral-400 truncate">{key}</div>
                </button>
              );
            })}
        </div>
      </div>

      {/* 2. MIDDLE COLUMN: Editor */}
      <div className="lg:col-span-5 bg-neutral-950/60 border border-white/10 rounded-xl p-4 sm:p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h1 className="text-base font-bold text-white">{TEMPLATE_REGISTRY[selectedKey]?.name || selectedKey}</h1>
            <p className="text-xs text-neutral-400 font-mono mt-0.5">{selectedKey}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => resetMutation.mutate()}
              className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition"
              title="Reset to default"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <Button
              variant="secondary"
              onClick={() => saveMutation.mutate({ isPublish: false })}
              isLoading={saveMutation.isPending}
            >
              บันทึกร่าง
            </Button>
            <Button
              variant="primary"
              onClick={() => saveMutation.mutate({ isPublish: true })}
              isLoading={saveMutation.isPending}
            >
              เผยแพร่
            </Button>
          </div>
        </div>

        {/* Notifications */}
        {notification && (
          <div className={`p-3 rounded-lg text-xs font-medium ${notification.type === "success" ? "bg-emerald-950/50 border border-emerald-500/30 text-emerald-300" : "bg-red-950/50 border border-red-500/30 text-red-300"}`}>
            {notification.text}
          </div>
        )}

        {/* Editor Tabs */}
        <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-lg border border-white/5 text-xs font-medium">
          <button
            onClick={() => setActiveTab("page")}
            className={`px-3 py-1.5 rounded transition ${activeTab === "page" ? "bg-white text-black font-semibold" : "text-neutral-400 hover:text-white"}`}
          >
            เนื้อหา Embed
          </button>
          <button
            onClick={() => setActiveTab("buttons")}
            className={`px-3 py-1.5 rounded transition ${activeTab === "buttons" ? "bg-white text-black font-semibold" : "text-neutral-400 hover:text-white"}`}
          >
            ปุ่มกด ({currentPayload.buttons?.flat().length || 0})
          </button>
          <button
            onClick={() => setActiveTab("pager")}
            className={`px-3 py-1.5 rounded transition ${activeTab === "pager" ? "bg-white text-black font-semibold" : "text-neutral-400 hover:text-white"}`}
          >
            หน้า & Pager ({currentPayload.pages.length})
          </button>
          <button
            onClick={() => setActiveTab("vars")}
            className={`px-3 py-1.5 rounded transition ${activeTab === "vars" ? "bg-white text-black font-semibold" : "text-neutral-400 hover:text-white"}`}
          >
            ตัวแปร
          </button>
        </div>

        {/* TAB 1: Embed Page Content */}
        {activeTab === "page" && (
          <div className="space-y-4">
            {/* Color Strip Picker */}
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1.5">สีแถบด้านข้าง (Color Strip)</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={currentPage.color || "#A0714F"}
                  onChange={(e) => updateCurrentPage((p) => ({ ...p, color: e.target.value }))}
                  className="w-9 h-9 rounded cursor-pointer border border-white/20 bg-transparent p-0.5"
                />
                <input
                  type="text"
                  value={currentPage.color || "#A0714F"}
                  onChange={(e) => updateCurrentPage((p) => ({ ...p, color: e.target.value }))}
                  className="w-28 px-2.5 py-1.5 bg-neutral-900 border border-white/10 rounded text-xs font-mono text-white"
                />
                <div className="flex items-center gap-1.5 ml-2">
                  {THEME_PRESET_COLORS.map((pr) => (
                    <button
                      key={pr.hex}
                      onClick={() => updateCurrentPage((p) => ({ ...p, color: pr.hex }))}
                      className="w-5 h-5 rounded-full border border-white/30 transition hover:scale-110"
                      style={{ backgroundColor: pr.hex }}
                      title={pr.label}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">หัวข้อ (Title)</label>
              <input
                type="text"
                value={currentPage.title || ""}
                onChange={(e) => updateCurrentPage((p) => ({ ...p, title: e.target.value }))}
                className="w-full px-3 py-2 bg-neutral-900 border border-white/10 rounded-lg text-xs text-white"
                placeholder="เช่น 🎃 ลูกอมหล่นแล้ว! — Trick or Treat"
              />
            </div>

            {/* Description Composer */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-neutral-300">เนื้อหา (Markdown Description)</label>
                <button
                  type="button"
                  onClick={handleApplyRulebookTheme}
                  className="text-[11px] text-orange-400 hover:text-orange-300 flex items-center gap-1 font-medium cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>ใส่ธีมรูปที่ 2 (Rulebook Theme)</span>
                </button>
              </div>

              {/* Quick tags bar */}
              <div className="flex flex-wrap gap-1 bg-neutral-900 p-1 rounded-t-lg border-x border-t border-white/10 text-[11px]">
                <button
                  type="button"
                  onClick={() => updateCurrentPage((p) => ({ ...p, description: (p.description || "") + "\n# หัวข้อใหญ่\n" }))}
                  className="px-2 py-0.5 bg-white/5 hover:bg-white/15 text-neutral-300 rounded"
                >
                  # H1
                </button>
                <button
                  type="button"
                  onClick={() => updateCurrentPage((p) => ({ ...p, description: (p.description || "") + "\n### หัวข้อย่อย\n" }))}
                  className="px-2 py-0.5 bg-white/5 hover:bg-white/15 text-neutral-300 rounded"
                >
                  ### H3
                </button>
                <button
                  type="button"
                  onClick={() => updateCurrentPage((p) => ({ ...p, description: (p.description || "") + "\n`ข้อความป้ายโค้ด`\n" }))}
                  className="px-2 py-0.5 bg-white/5 hover:bg-white/15 text-neutral-300 rounded"
                >
                  `chip`
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateCurrentPage((p) => ({
                      ...p,
                      description: (p.description || "") + "\n```diff\n+ บรรทัดสีเขียว\n- บรรทัดสีแดง\n```\n",
                    }))
                  }
                  className="px-2 py-0.5 bg-white/5 hover:bg-white/15 text-emerald-400 rounded"
                >
                  diff block
                </button>
                <button
                  type="button"
                  onClick={() => updateCurrentPage((p) => ({ ...p, description: (p.description || "") + "\n-# ข้อความอธิบายขนาดเล็ก\n" }))}
                  className="px-2 py-0.5 bg-white/5 hover:bg-white/15 text-neutral-400 rounded"
                >
                  -# subtext
                </button>
              </div>

              <textarea
                rows={9}
                value={currentPage.description || ""}
                onChange={(e) => updateCurrentPage((p) => ({ ...p, description: e.target.value }))}
                className="w-full px-3 py-2.5 bg-neutral-900 border border-white/10 rounded-b-lg text-xs font-mono text-white leading-relaxed focus:outline-none focus:border-white/30"
                placeholder="เขียนข้อความ Markdown..."
              />
            </div>

            {/* Poster Image URL */}
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">รูปโปสเตอร์ (Image URL)</label>
              <input
                type="text"
                value={currentPage.image || ""}
                onChange={(e) => updateCurrentPage((p) => ({ ...p, image: e.target.value }))}
                className="w-full px-3 py-2 bg-neutral-900 border border-white/10 rounded-lg text-xs text-white"
                placeholder="https://..."
              />
            </div>

            {/* Footer Text */}
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">ข้อความด้านล่างสุด (Footer)</label>
              <input
                type="text"
                value={currentPage.footer?.text || ""}
                onChange={(e) => updateCurrentPage((p) => ({ ...p, footer: { ...p.footer, text: e.target.value } }))}
                className="w-full px-3 py-2 bg-neutral-900 border border-white/10 rounded-lg text-xs text-white"
                placeholder="เช่น 753BC Trick or Treat Event"
              />
            </div>

            {/* Discord Limits Counter */}
            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
              <span className="text-neutral-400">ขนาดตัวอักษร: {validation.totalChars} / 6000 ตัว</span>
              {validation.valid ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> ผ่านเกณฑ์ Discord
                </span>
              ) : (
                <span className="text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {validation.errors[0]}
                </span>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Buttons */}
        {activeTab === "buttons" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider">รายการปุ่มกด (Action Buttons)</span>
              <button
                type="button"
                onClick={() => {
                  setCurrentPayload((prev) => {
                    const rows = [...(prev.buttons || [])];
                    if (rows.length === 0) rows.push([]);
                    rows[0].push({
                      id: `btn_${Date.now()}`,
                      label: "ปุ่มใหม่",
                      style: "primary",
                      action: "none",
                    });
                    return { ...prev, buttons: rows };
                  });
                }}
                className="px-2.5 py-1 bg-white text-black font-semibold text-xs rounded hover:bg-neutral-200 transition flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> เพิ่มปุ่ม
              </button>
            </div>

            {currentPayload.buttons?.flat().map((btn, bIdx) => (
              <div key={btn.id || bIdx} className="p-3 bg-neutral-900 border border-white/10 rounded-lg space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-neutral-400 block mb-1">ข้อความบนปุ่ม (Label)</label>
                    <input
                      type="text"
                      value={btn.label}
                      onChange={(e) => {
                        const newButtons = currentPayload.buttons.map((row) =>
                          row.map((b) => (b.id === btn.id ? { ...b, label: e.target.value } : b))
                        );
                        setCurrentPayload((prev) => ({ ...prev, buttons: newButtons }));
                      }}
                      className="w-full px-2.5 py-1.5 bg-neutral-800 border border-white/10 rounded text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-neutral-400 block mb-1">Emoji</label>
                    <input
                      type="text"
                      value={btn.emoji || ""}
                      onChange={(e) => {
                        const newButtons = currentPayload.buttons.map((row) =>
                          row.map((b) => (b.id === btn.id ? { ...b, emoji: e.target.value } : b))
                        );
                        setCurrentPayload((prev) => ({ ...prev, buttons: newButtons }));
                      }}
                      className="w-full px-2.5 py-1.5 bg-neutral-800 border border-white/10 rounded text-xs text-white"
                      placeholder="🍬"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-neutral-400 block mb-1">สี/สไตล์</label>
                    <select
                      value={btn.style}
                      onChange={(e) => {
                        const newButtons = currentPayload.buttons.map((row) =>
                          row.map((b) => (b.id === btn.id ? { ...b, style: e.target.value as any } : b))
                        );
                        setCurrentPayload((prev) => ({ ...prev, buttons: newButtons }));
                      }}
                      className="w-full px-2.5 py-1.5 bg-neutral-800 border border-white/10 rounded text-xs text-white"
                    >
                      <option value="primary">น้ำเงิน (Primary)</option>
                      <option value="secondary">เทา (Secondary)</option>
                      <option value="success">เขียว (Success)</option>
                      <option value="danger">แดง (Danger)</option>
                      <option value="link">ลิงก์ URL</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-neutral-400 block mb-1">การทำงาน (Action)</label>
                    <select
                      value={btn.action}
                      onChange={(e) => {
                        const newButtons = currentPayload.buttons.map((row) =>
                          row.map((b) => (b.id === btn.id ? { ...b, action: e.target.value as any } : b))
                        );
                        setCurrentPayload((prev) => ({ ...prev, buttons: newButtons }));
                      }}
                      className="w-full px-2.5 py-1.5 bg-neutral-800 border border-white/10 rounded text-xs text-white"
                    >
                      {CANDY_BUTTON_ACTIONS.map((act) => (
                        <option key={act} value={act}>
                          {act}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const newButtons = currentPayload.buttons
                        .map((row) => row.filter((b) => b.id !== btn.id))
                        .filter((row) => row.length > 0);
                      setCurrentPayload((prev) => ({ ...prev, buttons: newButtons }));
                    }}
                    className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> ลบปุ่ม
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: Pager & Multiple Pages */}
        {activeTab === "pager" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider">จัดการหน้า ({currentPayload.pages.length} หน้า)</span>
              <button
                type="button"
                onClick={() => {
                  setCurrentPayload((prev) => ({
                    ...prev,
                    pages: [
                      ...prev.pages,
                      {
                        color: DEFAULT_THEME.color,
                        title: `หน้าใหม่ ${prev.pages.length + 1}`,
                        description: "# หัวข้อหน้า\n`คำอธิบาย`",
                      },
                    ],
                    pager: { ...prev.pager, enabled: true },
                  }));
                }}
                className="px-2.5 py-1 bg-white text-black font-semibold text-xs rounded hover:bg-neutral-200 transition flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> เพิ่มหน้า
              </button>
            </div>

            <div className="space-y-2">
              {currentPayload.pages.map((p, idx) => (
                <div
                  key={idx}
                  onClick={() => setActivePageIndex(idx)}
                  className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between transition ${activePageIndex === idx ? "bg-orange-950/20 border-orange-500/50 text-white" : "bg-neutral-900 border-white/5 text-neutral-400 hover:border-white/20"}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-white">หน้า {idx + 1}</span>
                    <span className="text-xs text-neutral-300 truncate max-w-[200px]">{p.title || "Untitled"}</span>
                  </div>
                  {currentPayload.pages.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentPayload((prev) => {
                          const newPages = prev.pages.filter((_, i) => i !== idx);
                          return { ...prev, pages: newPages };
                        });
                        setActivePageIndex(0);
                      }}
                      className="text-red-400 hover:text-red-300 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Pager Settings */}
            <div className="pt-4 border-t border-white/10 space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">การตั้งค่าปุ่ม Pager</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-neutral-400 block mb-1">ข้อความปุ่มย้อนกลับ</label>
                  <input
                    type="text"
                    value={currentPayload.pager?.prevLabel || "◀ ย้อนกลับ"}
                    onChange={(e) =>
                      setCurrentPayload((prev) => ({
                        ...prev,
                        pager: { ...prev.pager, prevLabel: e.target.value },
                      }))
                    }
                    className="w-full px-2.5 py-1.5 bg-neutral-900 border border-white/10 rounded text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-neutral-400 block mb-1">ข้อความปุ่มถัดไป</label>
                  <input
                    type="text"
                    value={currentPayload.pager?.nextLabel || "ถัดไป ▶"}
                    onChange={(e) =>
                      setCurrentPayload((prev) => ({
                        ...prev,
                        pager: { ...prev.pager, nextLabel: e.target.value },
                      }))
                    }
                    className="w-full px-2.5 py-1.5 bg-neutral-900 border border-white/10 rounded text-xs text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Variables */}
        {activeTab === "vars" && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">ตัวแปรที่ใช้ได้ใน Template นี้</h3>
            <div className="p-3 bg-neutral-900 border border-white/10 rounded-lg space-y-2 text-xs">
              {(TEMPLATE_REGISTRY[selectedKey]?.variables || []).map((v) => (
                <div key={v} className="flex items-center justify-between border-b border-white/5 pb-1.5">
                  <span className="font-mono text-orange-400 font-semibold">{v}</span>
                  <span className="text-neutral-400">แทรกในข้อความได้โดยตรง</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. RIGHT COLUMN: Live Discord Preview */}
      <div className="lg:col-span-4 sticky top-6">
        <DiscordMessagePreview payload={currentPayload} />
      </div>
    </div>
  );
}

