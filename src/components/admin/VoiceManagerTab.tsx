"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Mic, Edit3, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import CaptionRow from "@/components/ui/CaptionRow";
import Button from "@/components/ui/Button";

export default function VoiceManagerTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const pageSize = 8;

  // Search debounce
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Voice data query
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin-voice-list", page, debouncedSearch],
    queryFn: async () => {
      const res = await fetch(`/api/admin/voice?page=${page}&limit=${pageSize}&q=${encodeURIComponent(debouncedSearch)}`);
      if (!res.ok) throw new Error("Failed to load voice statistics");
      return res.json();
    },
  });

  // Modal State
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [targetUser, setTargetUser] = useState<any>(null);
  const [mode, setMode] = useState<"ADD" | "SET">("ADD");
  const [hoursInput, setHoursInput] = useState<string>("");
  const [adjustNote, setAdjustNote] = useState<string>("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Mutation to adjust voice hours
  const adjustMutation = useMutation({
    mutationFn: async (payload: { userId: string; mode: "ADD" | "SET"; hours: number; note?: string }) => {
      const res = await fetch("/api/admin/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to adjust voice hours");
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-voice-list"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      setFeedback({ type: "success", text: data.message });
      setTimeout(() => {
        setModalOpen(false);
        setFeedback(null);
      }, 1500);
    },
    onError: (err: any) => {
      setFeedback({ type: "error", text: err.message });
    },
  });

  const handleOpenModal = (usr: any) => {
    setTargetUser(usr);
    setMode("ADD");
    setHoursInput("");
    setAdjustNote("");
    setFeedback(null);
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUser) return;
    const hours = parseFloat(hoursInput);
    if (isNaN(hours)) return;

    adjustMutation.mutate({
      userId: targetUser.id,
      mode,
      hours,
      note: adjustNote,
    });
  };

  const users = data?.users || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

  return (
    <div className="p-6 sm:p-8">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <CaptionRow label="VOICE_TELEMETRY // RANKING_MANAGEMENT" meta="EDIT_HOURS" />
          <p className="text-xs text-neutral-400 mt-1">
            จัดการชั่วโมงสะสมในห้องเสียงของสมาชิก แก้ไขอันดับ และซิงค์ตรงกับฐานข้อมูล LynnBot
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search bar */}
          <div className="flex items-center border border-white/[0.1] bg-[#040506] px-3 py-1.5 w-full sm:w-72 focus-within:border-white transition-colors">
            <Search className="w-3.5 h-3.5 text-neutral-500 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="ค้นหาชื่อ หรือ Discord ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-xs text-white placeholder-neutral-600 focus:outline-none w-full font-mono"
            />
          </div>

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 border border-white/[0.1] hover:border-white text-neutral-400 hover:text-white transition-colors shrink-0 cursor-pointer disabled:opacity-40"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Users List with Fixed Compact Height */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-16 bg-white/[0.02] border border-white/[0.08] animate-pulse" />
          ))}
        </div>
      ) : users.length > 0 ? (
        <div className="border border-white/[0.08] divide-y divide-white/[0.08] bg-[#040506]">
          {users.map((usr: any, idx: number) => {
            const overallRank = (page - 1) * pageSize + idx + 1;
            return (
              <div key={usr.id} className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-white/[0.015] transition-colors">
                {/* Left: Rank, Avatar & Name */}
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <span className="font-mono text-xs text-neutral-500 w-7 shrink-0">
                    #{overallRank.toString().padStart(2, "0")}
                  </span>

                  {usr.avatar ? (
                    <img
                      src={usr.avatar}
                      alt={usr.displayName || usr.username}
                      className="w-10 h-10 object-cover border border-white/20 shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-white/5 border border-white/10 flex items-center justify-center font-mono text-xs text-white shrink-0">
                      <Mic className="w-4 h-4 text-neutral-400" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-semibold text-white truncate flex items-center gap-2">
                      <span>{usr.displayName || usr.username}</span>
                      {usr.role && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 bg-white/10 text-neutral-300">
                          {usr.role}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] font-mono text-neutral-400 truncate">
                      ID: {usr.discordId || usr.id} · {usr.sessionCount} เซสชัน
                    </div>
                  </div>
                </div>

                {/* Right: Hours & Action Button */}
                <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                  <div className="text-right">
                    <div className="text-[9px] font-mono text-neutral-500 uppercase">VOICE_HOURS</div>
                    <div className="text-sm sm:text-base font-mono font-bold text-white">
                      {usr.hours} ชม.
                    </div>
                  </div>

                  <Button
                    variant="secondary"
                    onClick={() => handleOpenModal(usr)}
                    icon={<Edit3 className="w-3.5 h-3.5" />}
                  >
                    ปรับชั่วโมงเสียง
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center text-xs font-mono text-neutral-500 border border-white/[0.08]">
          // ไม่พบข้อมูลผู้ใช้งานห้องเสียง
        </div>
      )}

      {/* 753BC Ruled Blueprint Pagination */}
      {pagination.totalPages > 1 && (
        <div className="p-3 sm:p-4 border-x border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-3 bg-[#040506] font-mono text-xs">
          <div className="text-neutral-500 text-[11px]">
            PAGE {pagination.page} / {pagination.totalPages} // SHOWING {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, pagination.total)} OF {pagination.total} USERS
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-2.5 py-1 border border-white/[0.08] text-neutral-400 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              ‹ ก่อนหน้า
            </button>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-7 h-7 flex items-center justify-center border transition-colors ${
                  p === page
                    ? "border-white bg-white text-black font-bold"
                    : "border-white/[0.08] text-neutral-400 hover:text-white hover:border-white/20"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="px-2.5 py-1 border border-white/[0.08] text-neutral-400 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              ถัดไป ›
            </button>
          </div>
        </div>
      )}

      {/* Adjust Voice Hours Modal */}
      {modalOpen && targetUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#070809] border border-white/20 max-w-md w-full p-6 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-4">
              <div className="text-sm font-bold font-mono text-white flex items-center gap-2">
                <Mic className="w-4 h-4 text-white" />
                <span>■ ADJUST_VOICE // แก้ไขชั่วโมงห้องเสียง</span>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-neutral-500 hover:text-white font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

            {feedback && (
              <div
                className={`p-3 mb-4 text-xs font-mono flex items-center gap-2 border ${
                  feedback.type === "success"
                    ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-400"
                    : "bg-red-950/40 border-red-500/50 text-red-400"
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

            {/* Target User Info */}
            <div className="p-3 bg-white/[0.02] border border-white/[0.08] mb-4 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white">
                  {targetUser.displayName || targetUser.username}
                </div>
                <div className="text-[10px] font-mono text-neutral-500">
                  ID: {targetUser.discordId || targetUser.id}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[9px] font-mono text-neutral-500 uppercase">CURRENT_HOURS</div>
                <div className="text-base font-mono font-bold text-white">{targetUser.hours} ชม.</div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Mode Selector */}
              <div>
                <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1.5">
                  รูปแบบการแก้ไขชั่วโมง
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMode("ADD")}
                    className={`py-2 text-xs font-mono border transition-colors cursor-pointer ${
                      mode === "ADD"
                        ? "border-white bg-white text-black font-bold"
                        : "border-white/[0.1] text-neutral-400 hover:text-white"
                    }`}
                  >
                    + ปรับเพิ่ม / ลด (Delta)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("SET")}
                    className={`py-2 text-xs font-mono border transition-colors cursor-pointer ${
                      mode === "SET"
                        ? "border-white bg-white text-black font-bold"
                        : "border-white/[0.1] text-neutral-400 hover:text-white"
                    }`}
                  >
                    = กำหนดจำนวนตรงๆ (Set)
                  </button>
                </div>
              </div>

              {/* Hours Input */}
              <div>
                <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">
                  {mode === "ADD" ? "จำนวนชั่วโมงที่ต้องการเพิ่มหรือลด (ใส่ติดลบเพื่อลดได้)" : "จำนวนชั่วโมงรวมที่ต้องการกำหนด"}
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  placeholder={mode === "ADD" ? "เช่น 10 หรือ -5" : "เช่น 100"}
                  value={hoursInput}
                  onChange={(e) => setHoursInput(e.target.value)}
                  className="w-full px-3 py-2 bg-[#040506] border border-white/[0.1] focus:border-white text-sm font-mono text-white focus:outline-none"
                />
              </div>

              {/* Note Input */}
              <div>
                <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">
                  หมายเหตุ / เหตุผลการปรับชั่วโมง
                </label>
                <input
                  type="text"
                  placeholder="เช่น กิจกรรมพิเศษ, ชดเชยระบบ..."
                  value={adjustNote}
                  onChange={(e) => setAdjustNote(e.target.value)}
                  className="w-full px-3 py-2 bg-[#040506] border border-white/[0.1] focus:border-white text-xs text-white focus:outline-none"
                />
              </div>

              {/* Calculation Preview */}
              {hoursInput && !isNaN(parseFloat(hoursInput)) && (
                <div className="p-2.5 bg-white/[0.03] border border-white/[0.08] text-[11px] font-mono text-neutral-300">
                  <span>ชั่วโมงรวมหลังปรับ: </span>
                  <span className="font-bold text-white">
                    {mode === "ADD"
                      ? Math.max(0, targetUser.hours + parseFloat(hoursInput)).toFixed(1)
                      : parseFloat(hoursInput).toFixed(1)}{" "}
                    ชม.
                  </span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>
                  ยกเลิก
                </Button>
                <Button variant="primary" type="submit" disabled={adjustMutation.isPending}>
                  {adjustMutation.isPending ? "กำลังบันทึก..." : "ยืนยันการปรับชั่วโมง"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
