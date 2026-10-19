"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MessageSquare,
  ArrowUpRight,
  ExternalLink,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  Shield,
  LifeBuoy,
  FileText,
  User,
  Hash,
  Headphones,
  Check,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import type { TicketItem } from "@/app/api/tickets/route";

const DISCORD_INVITE_URL = "https://discord.gg/6zcbZ47b5t";

const TICKET_CATEGORIES = [
  { id: "general", label: "สอบถามทั่วไป / ข้อมูลเซิร์ฟเวอร์", tag: "GENERAL" },
  { id: "topup", label: "แจ้งปัญหาการเติมเงิน / พ้อยท์", tag: "PAYMENT" },
  { id: "report", label: "รายงานผู้กระทำผิด / แจ้งแบน", tag: "REPORT" },
  { id: "reward", label: "รับรางวัลกิจกรรม / เคลมยศ", tag: "REWARDS" },
  { id: "feedback", label: "ข้อเสนอแนะ / แจ้งปัญหาระบบเว็บ", tag: "SYSTEM" },
];

const PRIORITIES = [
  { id: "NORMAL", label: "ปกติ (Normal)", color: "text-neutral-400 border-white/[0.1]" },
  { id: "HIGH", label: "ด่วน (High)", color: "text-amber-400 border-amber-500/30" },
  { id: "URGENT", label: "ฉุกเฉิน (Urgent)", color: "text-rose-400 border-rose-500/30" },
];

export default function ContactClient() {
  const { data: session, status: authStatus } = useSession();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"create" | "list">("create");

  // Form states
  const [category, setCategory] = useState<string>(TICKET_CATEGORIES[0].label);
  const [priority, setPriority] = useState<string>("NORMAL");
  const [subject, setSubject] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [discordTag, setDiscordTag] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successTicket, setSuccessTicket] = useState<TicketItem | null>(null);

  // Sync session discord username
  React.useEffect(() => {
    if (session?.user?.name && !discordTag) {
      setDiscordTag(session.user.name);
    }
  }, [session, discordTag]);

  // Fetch tickets list
  const {
    data: ticketsData,
    isLoading: isTicketsLoading,
    refetch: refetchTickets,
  } = useQuery<{ success: boolean; tickets: TicketItem[]; total: number }>({
    queryKey: ["support-tickets"],
    queryFn: async () => {
      const res = await fetch("/api/tickets");
      if (!res.ok) throw new Error("Failed to load tickets");
      return res.json();
    },
    staleTime: 15_000,
  });

  // Mutation to create a new ticket
  const createMutation = useMutation({
    mutationFn: async (payload: {
      category: string;
      priority: string;
      subject: string;
      description: string;
      discordTag: string;
    }) => {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "เกิดข้อผิดพลาดในการสร้างคำร้อง");
      }
      return data;
    },
    onSuccess: (data) => {
      setSuccessTicket(data.ticket);
      setSubject("");
      setDescription("");
      setErrorMessage(null);
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
    },
    onError: (err: any) => {
      setErrorMessage(err.message || "ไม่สามารถส่งคำร้องได้ กรุณาลองใหม่อีกครั้ง");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!subject.trim()) {
      setErrorMessage("กรุณาระบุหัวข้อคำร้อง");
      return;
    }

    if (!description.trim()) {
      setErrorMessage("กรุณาระบุรายละเอียดของเรื่องที่ต้องการติดต่อ");
      return;
    }

    createMutation.mutate({
      category,
      priority,
      subject,
      description,
      discordTag: discordTag || session?.user?.name || "สมาชิกเว็บ 753BC",
    });
  };

  const tickets = ticketsData?.tickets || [];

  return (
    <div className="min-h-screen bg-[#070809] text-white selection:bg-white/20 pb-24">
      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 md:pt-16">

        {/* ======================================================== */}
        {/* 1. Header Section (Matching Blueprint Standards)       */}
        {/* ======================================================== */}
        <div className="relative mb-8 sm:mb-12">
          <div className="flex items-center gap-2 text-[10px] sm:text-[11px] font-mono text-neutral-400 uppercase tracking-widest mb-3">
            <span className="w-2 h-2 bg-emerald-400 animate-pulse" />
            <span>SUPPORT_DESK // 753BC</span>
            <span className="text-neutral-600">/</span>
            <span className="text-neutral-400">STAFF TICKET DISPATCH</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-white/[0.08]">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white flex items-center gap-3">
                <span>ติดต่อสตาฟ &amp; ส่งคำร้อง (Web Ticket)</span>
                <span className="px-2 py-0.5 text-xs font-mono font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/30">
                  ONLINE 24/7
                </span>
              </h1>
              <p className="text-sm sm:text-base text-neutral-400 mt-2 max-w-2xl leading-relaxed">
                สร้างคำร้องเพื่อขอความช่วยเหลือ แจ้งปัญหา หรือติดต่อทีมงานผู้ดูแลเซิร์ฟเวอร์ 753BC ผ่านระบบทิคเก็ตหน้าเว็บ หรือติดต่อผ่านห้องดิสคอร์ด
              </p>
            </div>

            {/* Quick Action to Discord */}
            <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
              <a
                href={DISCORD_INVITE_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-black bg-white hover:bg-neutral-200 transition-colors duration-150 active:scale-[0.98] border border-white shadow-[0_0_15px_rgba(255,255,255,0.08)] whitespace-nowrap w-full sm:w-auto min-h-[40px]"
              >
                <span>เปิด Ticket ใน Discord</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center gap-2 sm:gap-3 mt-6">
            <button
              onClick={() => {
                setActiveTab("create");
                setSuccessTicket(null);
              }}
              className={`px-4 py-2 text-xs font-mono border transition-colors flex items-center gap-2 cursor-pointer min-h-[36px] ${
                activeTab === "create"
                  ? "bg-white text-black border-white font-bold"
                  : "bg-white/[0.02] text-neutral-400 border-white/[0.08] hover:border-white/20 hover:text-white"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>01 // สร้าง Ticket ใหม่</span>
            </button>

            <button
              onClick={() => setActiveTab("list")}
              className={`px-4 py-2 text-xs font-mono border transition-colors flex items-center gap-2 cursor-pointer min-h-[36px] ${
                activeTab === "list"
                  ? "bg-white text-black border-white font-bold"
                  : "bg-white/[0.02] text-neutral-400 border-white/[0.08] hover:border-white/20 hover:text-white"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>02 // รายการคำร้องของฉัน</span>
              <span
                className={`px-1.5 py-0.2 text-[10px] font-mono ${
                  activeTab === "list" ? "bg-black text-white" : "bg-white/[0.08] text-neutral-400"
                }`}
              >
                {tickets.length}
              </span>
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 2. Web Ticket Hub Content                                */}
        {/* ======================================================== */}
        <div className="border border-white/[0.08] bg-[#040506] mb-12 sm:mb-16">
          {activeTab === "create" ? (
            <div>
              {/* Top Strip */}
              <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.01]">
                <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
                  <span className="w-2 h-2 bg-emerald-400" />
                  <span>NEW_TICKET_DISPATCH // ระบบเปิดคำร้องออนไลน์</span>
                </div>
                <div className="text-[11px] font-mono text-neutral-500">
                  ESTIMATED RESPONSE: &lt; 15 MINS
                </div>
              </div>

              {successTicket ? (
                /* Success Notification Box */
                <div className="p-8 sm:p-12 text-center max-w-xl mx-auto">
                  <div className="w-14 h-14 border border-emerald-500/40 bg-emerald-950/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                    ส่งคำร้อง Ticket สำเร็จแล้ว!
                  </h3>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/[0.04] border border-white/[0.1] font-mono text-xs text-emerald-400 mb-4">
                    <span>TICKET_ID:</span>
                    <span className="font-bold text-white">{successTicket.ticketId}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed mb-6">
                    คำร้องของคุณถูกส่งเข้าสู่ระบบ Support Dispatch ของเซิร์ฟเวอร์ 753BC เรียบร้อยแล้ว ทีมงานสตาฟจะดำเนินการตรวจสอบและตอบกลับโดยเร็วที่สุด
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      onClick={() => {
                        setSuccessTicket(null);
                        setActiveTab("list");
                      }}
                      className="w-full sm:w-auto px-5 py-2.5 text-xs sm:text-sm font-semibold text-black bg-white hover:bg-neutral-200 transition-colors border border-white"
                    >
                      ดูรายการคำร้องของคุณ
                    </button>
                    <button
                      onClick={() => {
                        setSuccessTicket(null);
                        setSubject("");
                        setDescription("");
                      }}
                      className="w-full sm:w-auto px-5 py-2.5 text-xs sm:text-sm font-semibold text-neutral-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition-colors border border-white/[0.1]"
                    >
                      สร้างคำร้องเรื่องอื่นเพิ่มเติม
                    </button>
                  </div>
                </div>
              ) : (
                /* Ticket Creation Form */
                <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
                  {errorMessage && (
                    <div className="p-4 border border-rose-500/40 bg-rose-950/20 text-rose-300 text-xs sm:text-sm flex items-center gap-3 font-mono">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* Category Selection */}
                  <div>
                    <label className="block text-[11px] font-mono text-neutral-400 uppercase tracking-wider mb-2.5">
                      1. เลือกหมวดหมู่คำร้อง (Category) <span className="text-rose-400">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {TICKET_CATEGORIES.map((cat) => {
                        const isSelected = category === cat.label;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setCategory(cat.label)}
                            className={`p-3.5 text-left border transition-all cursor-pointer ${
                              isSelected
                                ? "bg-white text-black border-white font-semibold"
                                : "bg-white/[0.02] text-neutral-300 border-white/[0.08] hover:border-white/30 hover:text-white"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span
                                className={`text-[10px] font-mono ${
                                  isSelected ? "text-neutral-600" : "text-neutral-500"
                                }`}
                              >
                                #{cat.tag}
                              </span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-black" />}
                            </div>
                            <div className="text-xs sm:text-sm font-medium">{cat.label}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Priority & Discord Username (Two Column) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Priority Selector */}
                    <div>
                      <label className="block text-[11px] font-mono text-neutral-400 uppercase tracking-wider mb-2.5">
                        2. ระดับความเร่งด่วน (Priority)
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {PRIORITIES.map((p) => {
                          const isSelected = priority === p.id;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => setPriority(p.id)}
                              className={`p-2.5 text-center text-xs font-mono border transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-white text-black border-white font-bold"
                                  : "bg-white/[0.02] text-neutral-400 border-white/[0.08] hover:border-white/30 hover:text-white"
                              }`}
                            >
                              {p.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Discord Username */}
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <label className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">
                          3. บัญชี Discord ของคุณ
                        </label>
                        {session?.user && (
                          <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> LINKED
                          </span>
                        )}
                      </div>
                      <div className="flex items-center border border-white/[0.1] bg-[#070809] focus-within:border-white transition-colors">
                        <span className="px-3.5 py-2.5 text-neutral-500 font-mono text-xs border-r border-white/[0.08] select-none">
                          <User className="w-3.5 h-3.5" />
                        </span>
                        <input
                          type="text"
                          placeholder="ชื่อบัญชี Discord (เช่น name#0000 หรือ username)"
                          value={discordTag}
                          onChange={(e) => setDiscordTag(e.target.value)}
                          className="flex-1 px-3 py-2.5 bg-transparent text-xs sm:text-sm text-white placeholder-neutral-600 focus:outline-none font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Subject Input */}
                  <div>
                    <label className="block text-[11px] font-mono text-neutral-400 uppercase tracking-wider mb-2">
                      4. หัวข้อคำร้อง (Subject) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="ระบุหัวข้อเรื่องสั้นๆ ให้ได้ใจความ เช่น แจ้งปัญหาการเติมเงินไม่เข้า, สอบถามกฎกิจกรรม"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#070809] border border-white/[0.1] focus:border-white text-xs sm:text-sm text-white placeholder-neutral-600 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Description Textarea */}
                  <div>
                    <label className="block text-[11px] font-mono text-neutral-400 uppercase tracking-wider mb-2">
                      5. รายละเอียดคำร้อง (Description) <span className="text-rose-400">*</span>
                    </label>
                    <textarea
                      rows={5}
                      placeholder="โปรดระบุรายละเอียดของปัญหา วันเวลาที่เกิดเหตุ ข้อมูลที่เกี่ยวข้อง หรือรูปภาพประกอบเพื่อให้ทีมงานสามารถตรวจสอบและแก้ไขให้ได้อย่างรวดเร็ว..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full p-4 bg-[#070809] border border-white/[0.1] focus:border-white text-xs sm:text-sm text-white placeholder-neutral-600 focus:outline-none transition-colors resize-y leading-relaxed font-sans"
                    />
                  </div>

                  {/* Submit Action */}
                  <div className="pt-4 border-t border-white/[0.08] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    <div className="text-[11px] font-mono text-neutral-500">
                      SECURE_DISPATCH // ข้อมูลของคุณจะถูกส่งให้ทีมงานสตาฟ 753BC ตรวจสอบโดยตรง
                    </div>

                    <button
                      type="submit"
                      disabled={createMutation.isPending}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 text-xs sm:text-sm font-semibold text-black bg-white hover:bg-neutral-200 transition-colors border border-white disabled:opacity-50 cursor-pointer min-h-[44px]"
                    >
                      {createMutation.isPending ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>กำลังส่งคำร้อง...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>ส่งคำร้อง Ticket (Dispatch)</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            /* Ticket List (My Tickets) */
            <div>
              <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.01]">
                <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
                  <span className="w-2 h-2 bg-emerald-400" />
                  <span>MY_TICKETS // ประวัติคำร้องทั้งหมด</span>
                </div>
                <button
                  onClick={() => refetchTickets()}
                  className="inline-flex items-center gap-1.5 text-xs font-mono text-neutral-400 hover:text-white transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>รีเฟรช</span>
                </button>
              </div>

              {isTicketsLoading ? (
                <div className="p-8 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-white/[0.02] border border-white/[0.08] animate-pulse" />
                  ))}
                </div>
              ) : tickets.length === 0 ? (
                <div className="p-12 text-center max-w-md mx-auto">
                  <div className="w-12 h-12 border border-white/[0.1] bg-white/[0.02] flex items-center justify-center mx-auto mb-3 text-neutral-500">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-white mb-1">ยังไม่มีประวัติคำร้อง Ticket</h4>
                  <p className="text-xs text-neutral-400 mb-6 leading-relaxed">
                    คุณยังไม่ได้ส่งคำร้องใดๆ หรือหากคุณเคยเปิดคำร้องไว้ใน Discord สามารถติดต่อทีมงานผ่านดิสคอร์ดได้ทันที
                  </p>
                  <button
                    onClick={() => setActiveTab("create")}
                    className="px-4 py-2 text-xs font-semibold text-black bg-white hover:bg-neutral-200 transition-colors"
                  >
                    เปิด Ticket คำร้องแรก
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-white/[0.08]">
                  {tickets.map((t) => {
                    const isOpen = t.status === "OPEN";
                    const isClaimed = t.status === "CLAIMED";
                    const isClosed = t.status === "CLOSED";

                    return (
                      <div key={t.id} className="p-5 sm:p-6 hover:bg-white/[0.01] transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2.5">
                            <span className="px-2 py-0.5 text-[11px] font-mono text-white bg-white/[0.06] border border-white/[0.1]">
                              {t.ticketId}
                            </span>
                            <span className="text-xs font-mono text-neutral-400">
                              #{t.category}
                            </span>
                            {t.priority && (
                              <span
                                className={`text-[10px] font-mono px-1.5 py-0.2 border ${
                                  t.priority === "URGENT"
                                    ? "text-rose-400 border-rose-500/30"
                                    : t.priority === "HIGH"
                                    ? "text-amber-400 border-amber-500/30"
                                    : "text-neutral-500 border-white/[0.08]"
                                }`}
                              >
                                {t.priority}
                              </span>
                            )}
                          </div>

                          {/* Status Pill */}
                          <div>
                            {isOpen && (
                              <span className="px-2.5 py-0.5 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-emerald-400 animate-pulse" />
                                <span>OPEN // รอตรวจสอบ</span>
                              </span>
                            )}
                            {isClaimed && (
                              <span className="px-2.5 py-0.5 text-xs font-mono text-amber-400 bg-amber-500/10 border border-amber-500/30 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-amber-400" />
                                <span>CLAIMED // กำลังดำเนินการ</span>
                              </span>
                            )}
                            {isClosed && (
                              <span className="px-2.5 py-0.5 text-xs font-mono text-neutral-400 bg-white/[0.04] border border-white/[0.1] flex items-center gap-1.5">
                                <span>CLOSED // สิ้นสุดเรื่อง</span>
                              </span>
                            )}
                          </div>
                        </div>

                        <h4 className="text-sm sm:text-base font-semibold text-white mb-1.5">
                          {t.subject}
                        </h4>

                        {t.description && (
                          <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed mb-3 line-clamp-2">
                            {t.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 pt-2 border-t border-white/[0.04]">
                          <div className="flex items-center gap-3">
                            <span>ผู้แจ้ง: {t.creatorName}</span>
                            <span>•</span>
                            <span>{new Date(t.createdAt).toLocaleString("th-TH")}</span>
                          </div>
                          <span className="text-neutral-600">753BC SUPPORT</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* 3. Bottom Direct Discord Support Section                */}
        {/* ======================================================== */}
        <div className="border border-white/[0.08] bg-[#040506] relative">
          <div className="px-5 sm:px-8 py-5 border-b border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/[0.01]">
            <div>
              <div className="flex items-center gap-2 text-[10px] sm:text-[11px] font-mono text-neutral-400 uppercase tracking-widest mb-1">
                <Hash className="w-3.5 h-3.5 text-indigo-400" />
                <span>DISCORD_CHANNELS // DIRECT_STAFF_CONTACT</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                ช่องทางการติดต่อโดยตรงภายในเซิร์ฟเวอร์ Discord
              </h2>
            </div>
            <a
              href={DISCORD_INVITE_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-xs font-mono text-neutral-300 hover:text-white"
            >
              <span>เข้าร่วมดิสคอร์ด</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* 3 Discord Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/[0.08]">
            {/* Card 1 */}
            <div className="p-6 sm:p-7 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-mono text-indigo-400">#01 // DISCORD BOT TICKET</span>
                  <span className="px-2 py-0.5 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30">
                    RECOMMENDED
                  </span>
                </div>
                <div className="w-10 h-10 border border-white/[0.1] bg-white/[0.02] flex items-center justify-center mb-3">
                  <MessageSquare className="w-5 h-5 text-indigo-400" />
                </div>
                <h4 className="text-base font-bold text-white mb-1.5">
                  ห้อง #ticket-support
                </h4>
                <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                  กดปุ่มเปิดห้องทิคเก็ตส่วนตัว (Private Channel) สำหรับคุณกับทีมงานแอดมินโดยเฉพาะ คุยแบบเรียลไทม์ แนบไฟล์หลักฐานและสลิปได้อย่างปลอดภัย
                </p>
              </div>
              <div className="text-[11px] font-mono text-neutral-500">
                DISCORD BOT // AUTO-DISPATCH
              </div>
            </div>

            {/* Card 2 */}
            <div className="p-6 sm:p-7 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-mono text-neutral-400">#02 // PUBLIC HELPDESK</span>
                  <span className="px-2 py-0.5 text-[10px] font-mono text-neutral-400 bg-white/[0.04] border border-white/[0.08]">
                    COMMUNITY
                  </span>
                </div>
                <div className="w-10 h-10 border border-white/[0.1] bg-white/[0.02] flex items-center justify-center mb-3">
                  <LifeBuoy className="w-5 h-5 text-neutral-400" />
                </div>
                <h4 className="text-base font-bold text-white mb-1.5">
                  ห้อง #สอบถาม-helpdesk
                </h4>
                <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                  ห้องแชทสาธารณะสำหรับสอบถามข้อสงสัยทั่วไป วิธีการเข้าร่วมกิจกรรม หรือพูดคุยแลกเปลี่ยนปัญหากับสมาชิกคนอื่นๆ และทีมงานในเซิร์ฟเวอร์
                </p>
              </div>
              <div className="text-[11px] font-mono text-neutral-500">
                OPEN CHANNEL // ALL MEMBERS
              </div>
            </div>

            {/* Card 3 */}
            <div className="p-6 sm:p-7 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-mono text-emerald-400">#03 // LIVE VOICE SUPPORT</span>
                  <span className="px-2 py-0.5 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30">
                    24/7 ACTIVE
                  </span>
                </div>
                <div className="w-10 h-10 border border-emerald-500/20 bg-emerald-950/10 flex items-center justify-center mb-3">
                  <Headphones className="w-5 h-5 text-emerald-400" />
                </div>
                <h4 className="text-base font-bold text-white mb-1.5">
                  ห้องเสียง Staff Waiting Room
                </h4>
                <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                  เข้าห้องเสียงรอพบทีมงานเพื่อคุยปัญหาเร่งด่วน ทีมงาน Moderation หมุนเวียนประจำการดูแลตลอด 24 ชั่วโมง พร้อมตอบกลับอย่างรวดเร็ว
                </p>
              </div>
              <div className="text-[11px] font-mono text-neutral-500">
                VOICE CHANNEL // STAFF ASSIST
              </div>
            </div>
          </div>

          {/* Join Discord CTA Banner */}
          <div className="p-6 sm:p-8 border-t border-white/[0.08] bg-[#070809] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-sm sm:text-base font-bold text-white">
                เข้าร่วมเซิร์ฟเวอร์ 753BC Discord ตอนนี้
              </h4>
              <p className="text-xs text-neutral-400 mt-0.5">
                ลิงก์เชิญอย่างเป็นทางการ: https://discord.gg/6zcbZ47b5t
              </p>
            </div>

            <a
              href={DISCORD_INVITE_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-black bg-white hover:bg-neutral-200 transition-colors border border-white shadow-[0_0_15px_rgba(255,255,255,0.08)] whitespace-nowrap w-full sm:w-auto min-h-[40px]"
            >
              <span>เข้าร่วม 753BC ใน Discord</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
