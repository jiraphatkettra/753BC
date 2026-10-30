"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ShieldAlert,
  Activity,
  Calendar,
  Receipt,
  Users,
  Settings,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Search,
  RefreshCw,
  Wallet,
  AlertCircle,
  Save,
  QrCode,
  ArrowUpRight,
  ChevronRight,
  Eye,
} from "lucide-react";
import PageFrame from "@/components/ui/PageFrame";
import { TopSectionStrip, BottomSectionStrip } from "@/components/ui/SectionStrip";
import StatusChip from "@/components/ui/StatusChip";
import TabRow, { TabItem } from "@/components/ui/TabRow";
import CaptionRow from "@/components/ui/CaptionRow";
import Button from "@/components/ui/Button";
import { generatePromptPayPayload, generatePromptPayQrSvg } from "@/lib/promptpay";
import VoiceManagerTab from "@/components/admin/VoiceManagerTab";
import EmbedStudioTab from "@/components/admin/EmbedStudioTab";
import CandyEventTab from "@/components/admin/CandyEventTab";

const ADMIN_TABS: TabItem[] = [
  { id: "overview", label: "01 // OVERVIEW", subText: "ภาพรวม" },
  { id: "events", label: "02 // EVENTS", subText: "กิจกรรม" },
  { id: "slips", label: "03 // SLIPS", subText: "ตรวจสลิป" },
  { id: "users", label: "04 // USERS", subText: "ยอดเงินสมาชิก" },
  { id: "voice", label: "05 // VOICE_HOURS", subText: "ชั่วโมงเสียง" },
  { id: "embed_studio", label: "06 // EMBED_STUDIO", subText: "แก้ไข Embed" },
  { id: "bank_config", label: "07 // BANK_CONFIG", subText: "เลขบัญชี" },
  { id: "candy_event", label: "08 // CANDY_EVENT", subText: "Trick or Treat" },
];

export default function AdminClient() {
  const { data: session, status: authStatus } = useSession();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<string>("overview");
  const [devBypass, setDevBypass] = useState<boolean>(true); // Dev mode access

  // Overview Query
  const {
    data: overview,
    isLoading: isOverviewLoading,
    refetch: refetchOverview,
  } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const res = await fetch("/api/admin/overview");
      if (!res.ok) throw new Error("Failed to load overview");
      return res.json();
    },
  });

  // Events Query
  const {
    data: eventsData,
    isLoading: isEventsLoading,
    refetch: refetchEvents,
  } = useQuery({
    queryKey: ["admin-events"],
    queryFn: async () => {
      const res = await fetch("/api/admin/events");
      if (!res.ok) throw new Error("Failed to load events");
      return res.json();
    },
    enabled: activeTab === "events" || activeTab === "overview",
  });

  // Slips Query & Pagination
  const [slipFilter, setSlipFilter] = useState<string>("ALL");
  const [slipsPage, setSlipsPage] = useState<number>(1);
  const SLIPS_PAGE_SIZE = 6;

  const {
    data: slipsData,
    isLoading: isSlipsLoading,
    refetch: refetchSlips,
  } = useQuery({
    queryKey: ["admin-slips", slipFilter],
    queryFn: async () => {
      const res = await fetch(`/api/admin/slips?status=${slipFilter}`);
      if (!res.ok) throw new Error("Failed to load slips");
      return res.json();
    },
    enabled: activeTab === "slips" || activeTab === "overview",
  });

  const allSlips = slipsData?.slips || [];
  const totalSlipsPages = Math.max(1, Math.ceil(allSlips.length / SLIPS_PAGE_SIZE));
  const validSlipsPage = Math.min(slipsPage, totalSlipsPages);
  const paginatedSlips = allSlips.slice((validSlipsPage - 1) * SLIPS_PAGE_SIZE, validSlipsPage * SLIPS_PAGE_SIZE);

  // Users Query & Pagination
  const [userSearch, setUserSearch] = useState<string>("");
  const [usersPage, setUsersPage] = useState<number>(1);
  const USERS_PAGE_SIZE = 8;

  const {
    data: usersData,
    isLoading: isUsersLoading,
    refetch: refetchUsers,
  } = useQuery({
    queryKey: ["admin-users", userSearch],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(userSearch)}`);
      if (!res.ok) throw new Error("Failed to load users");
      return res.json();
    },
    enabled: activeTab === "users",
  });

  const allUsers = usersData?.users || [];
  const totalUsersPages = Math.max(1, Math.ceil(allUsers.length / USERS_PAGE_SIZE));
  const validUsersPage = Math.min(usersPage, totalUsersPages);
  const paginatedUsers = allUsers.slice((validUsersPage - 1) * USERS_PAGE_SIZE, validUsersPage * USERS_PAGE_SIZE);

  // Bank Config Query
  const {
    data: bankConfigData,
    isLoading: isBankConfigLoading,
    refetch: refetchBankConfig,
  } = useQuery({
    queryKey: ["admin-bank-config"],
    queryFn: async () => {
      const res = await fetch("/api/admin/bank-config");
      if (!res.ok) throw new Error("Failed to load bank config");
      return res.json();
    },
    enabled: activeTab === "bank_config",
  });

  // ── State for Modals ──
  // Event Modal
  const [eventModalOpen, setEventModalOpen] = useState<boolean>(false);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    category: "General",
    bannerUrl: "",
    startDate: "",
    endDate: "",
    maxParticipants: "100",
    status: "UPCOMING",
  });

  // Reject Slip Modal
  const [rejectModalOpen, setRejectModalOpen] = useState<boolean>(false);
  const [selectedSlipId, setSelectedSlipId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>("ไม่พบยอดเงินเข้าบัญชี หรือข้อมูลสลิปไม่ตรง");

  // Adjust Balance Modal
  const [balanceModalOpen, setBalanceModalOpen] = useState<boolean>(false);
  const [targetUser, setTargetUser] = useState<any | null>(null);
  const [adjustAction, setAdjustAction] = useState<"ADD" | "DEDUCT" | "SET">("ADD");
  const [adjustAmount, setAdjustAmount] = useState<string>("");
  const [adjustNote, setAdjustNote] = useState<string>("");

  // Bank Config Form State
  const [bankForm, setBankForm] = useState({
    promptPayId: "",
    accountName: "",
    bankName: "",
    minAmount: 20,
    maxAmount: 50000,
    presets: "50, 100, 200, 500, 1000",
  });
  const [bankConfigSaved, setBankConfigSaved] = useState<boolean>(false);

  // Sync Bank Form when query loads
  React.useEffect(() => {
    if (bankConfigData?.config) {
      setBankForm({
        promptPayId: bankConfigData.config.promptPayId || "",
        accountName: bankConfigData.config.accountName || "",
        bankName: bankConfigData.config.bankName || "",
        minAmount: bankConfigData.config.minAmount || 20,
        maxAmount: bankConfigData.config.maxAmount || 50000,
        presets: Array.isArray(bankConfigData.config.presets)
          ? bankConfigData.config.presets.join(", ")
          : "50, 100, 200, 500, 1000",
      });
    }
  }, [bankConfigData]);

  // Image Preview Modal
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // ── Handlers ──
  // Save Event (Create or Update)
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = "/api/admin/events";
      const method = editingEvent ? "PUT" : "POST";
      const payload = editingEvent ? { id: editingEvent.id, ...eventForm } : eventForm;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.message || "Failed to save event");
        return;
      }

      setEventModalOpen(false);
      setEditingEvent(null);
      refetchEvents();
      refetchOverview();
    } catch (err) {
      console.error(err);
      alert("Error saving event");
    }
  };

  // Delete Event
  const handleDeleteEvent = async (id: string, title: string) => {
    if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบกิจกรรม "${title}" ?`)) return;
    try {
      const res = await fetch(`/api/admin/events?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        refetchEvents();
        refetchOverview();
      } else {
        alert("ลบกิจกรรมล้มเหลว");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Slip Action (Approve / Reject)
  const handleSlipAction = async (slipId: string, action: "APPROVE" | "REJECT", note?: string) => {
    try {
      const res = await fetch("/api/admin/slips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slipId, action, note }),
      });
      const data = await res.json();
      if (res.ok) {
        refetchSlips();
        refetchOverview();
        refetchUsers();
      } else {
        alert(data.message || "การกระทำล้มเหลว");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Adjust User Balance
  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUser || !adjustAmount) return;

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: targetUser.id,
          discordId: targetUser.discordId,
          action: adjustAction,
          amount: parseFloat(adjustAmount),
          note: adjustNote,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setBalanceModalOpen(false);
        setTargetUser(null);
        setAdjustAmount("");
        setAdjustNote("");
        refetchUsers();
        refetchOverview();
        alert(data.message);
      } else {
        alert(data.message || "ปรับยอดเงินไม่สำเร็จ");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating user balance");
    }
  };

  // Save Bank Config
  const handleSaveBankConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const presetsArr = bankForm.presets
        .split(",")
        .map((p) => parseFloat(p.trim()))
        .filter((n) => !isNaN(n) && n > 0);

      const res = await fetch("/api/admin/bank-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promptPayId: bankForm.promptPayId,
          accountName: bankForm.accountName,
          bankName: bankForm.bankName,
          minAmount: bankForm.minAmount,
          maxAmount: bankForm.maxAmount,
          presets: presetsArr,
        }),
      });

      if (res.ok) {
        setBankConfigSaved(true);
        setTimeout(() => setBankConfigSaved(false), 3000);
        refetchBankConfig();
      } else {
        alert("บันทึกการตั้งค่าไม่สำเร็จ");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <PageFrame>
      {/* ── Top Strip ── */}
      <TopSectionStrip gridRef="GRID_REF // 099" pageCode="ADMIN_COMMAND_CENTER" />

      {/* ── Header Headline & Status ── */}
      <div className="p-6 sm:p-8 border-b border-white/[0.08] flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-[#070809]">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <StatusChip label="■ 753BC // ADMIN_COMMAND_SYSTEM | ONLINE" accent />
            <span className="px-2 py-0.5 text-[9px] font-mono bg-orange-500/20 text-orange-400 border border-orange-500/40">
              RESTRICTED
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            ระบบจัดการแอดมิน
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1.5 max-w-2xl leading-relaxed">
            ศูนย์ควบคุมระบบ: จัดการกิจกรรมชิงรางวัล ตรวจสอบสลิป ปรับแก้แต้มและยอดเงินสมาชิก รวมถึงตั้งค่าบัญชีรับเงิน
          </p>
        </div>

        {/* Right side telemetry / Refresh */}
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              refetchOverview();
              refetchEvents();
              refetchSlips();
              refetchUsers();
              refetchBankConfig();
            }}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            รีเฟรชข้อมูล
          </Button>

          <Link
            href="/"
            className="px-3.5 py-2 text-xs font-mono text-neutral-400 hover:text-white border border-white/[0.1] hover:border-white/30 transition-colors"
          >
            ← ดูหน้าเว็บ
          </Link>
        </div>
      </div>

      {/* ── Admin Sub-Navigation Tabs ── */}
      <div className="px-6 sm:px-8 py-3 border-b border-white/[0.08] bg-white/[0.015] flex items-center justify-between overflow-x-auto">
        <TabRow
          tabs={ADMIN_TABS}
          activeId={activeTab}
          onChange={(tab) => setActiveTab(tab)}
        />
        {overview?.pendingSlips > 0 && (
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono">
            <span className="w-1.5 h-1.5 bg-amber-400 animate-ping inline-block" />
            <span>รอตรวจสลิป: {overview.pendingSlips} รายการ</span>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* ── TAB 1: OVERVIEW ── */}
      {/* ============================================================== */}
      {activeTab === "overview" && (
        <div className="divide-y divide-white/[0.08]">
          {/* 4 Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.08]">
            <div className="p-5 sm:p-6 bg-[#040506]">
              <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider mb-2">
                TOTAL_REVENUE
              </div>
              <div className="text-2xl sm:text-3xl font-mono font-bold text-emerald-400">
                ฿{overview?.revenue ? overview.revenue.toLocaleString() : "0.00"}
              </div>
              <div className="text-[11px] text-neutral-400 mt-1">ยอดเงินเติมผ่านสลิปที่อนุมัติแล้ว</div>
            </div>

            <div className="p-5 sm:p-6 bg-[#040506]">
              <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>PENDING_SLIPS</span>
                {overview?.pendingSlips > 0 && (
                  <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                )}
              </div>
              <div className="text-2xl sm:text-3xl font-mono font-bold text-white">
                {overview?.pendingSlips || 0}
              </div>
              <div className="text-[11px] text-neutral-400 mt-1 flex items-center justify-between">
                <span>สลิปรอการตรวจสอบ</span>
                {overview?.pendingSlips > 0 && (
                  <button
                    onClick={() => setActiveTab("slips")}
                    className="text-xs text-amber-400 hover:underline cursor-pointer"
                  >
                    ตรวจทันที →
                  </button>
                )}
              </div>
            </div>

            <div className="p-5 sm:p-6 bg-[#040506]">
              <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider mb-2">
                COMMUNITY_EVENTS
              </div>
              <div className="text-2xl sm:text-3xl font-mono font-bold text-white">
                {overview?.totalEvents || 0}
              </div>
              <div className="text-[11px] text-neutral-400 mt-1">
                เปิดรับสมัคร {overview?.openEvents || 0} รายการ
              </div>
            </div>

            <div className="p-5 sm:p-6 bg-[#040506]">
              <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider mb-2">
                TOTAL_MEMBERS
              </div>
              <div className="text-2xl sm:text-3xl font-mono font-bold text-white">
                {overview?.totalUsers || 0}
              </div>
              <div className="text-[11px] text-neutral-400 mt-1">
                ยอดคงเหลือรวม ฿{overview?.totalBalance?.toLocaleString() || "0"}
              </div>
            </div>
          </div>

          {/* 50/50 Sub Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.08]">
            {/* Left: Pending Slips Quick View */}
            <div className="p-5 sm:p-6">
              <CaptionRow label="TELEMETRY // RECENT_SLIPS" meta="QUICK_VERIFY" />

              {overview?.recentSlips && overview.recentSlips.length > 0 ? (
                <div className="divide-y divide-white/[0.08] border border-white/[0.08] mt-4">
                  {overview.recentSlips.slice(0, 5).map((slip: any) => (
                    <div key={slip.id} className="p-3 sm:p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        {slip.imageUrl ? (
                          <img
                            src={slip.imageUrl}
                            alt="Slip"
                            onClick={() => setPreviewImage(slip.imageUrl)}
                            className="w-10 h-10 object-cover border border-white/20 shrink-0 cursor-pointer hover:opacity-80"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                            <Receipt className="w-4 h-4 text-neutral-500" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-semibold text-white truncate">
                            {slip.discordName || slip.discordId || "Member"}
                          </div>
                          <div className="text-[10px] font-mono text-neutral-400">
                            ID: {slip.id} · {new Date(slip.createdAt).toLocaleDateString("th-TH")}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <div className="text-xs sm:text-sm font-mono font-bold text-white">
                            ฿{Number(slip.amount || 0).toLocaleString()}
                          </div>
                          <span
                            className={`px-1.5 py-0.5 text-[8px] font-mono border ${
                              slip.status === "APPROVED"
                                ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/40"
                                : slip.status === "REJECTED"
                                ? "bg-red-950/40 text-red-400 border-red-500/40"
                                : "bg-amber-950/40 text-amber-400 border-amber-500/40"
                            }`}
                          >
                            {slip.status}
                          </span>
                        </div>

                        {slip.status === "PENDING" && (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleSlipAction(slip.id, "APPROVE")}
                              className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 border border-emerald-500/40 cursor-pointer"
                              title="อนุมัติสลิป"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedSlipId(slip.id);
                                setRejectModalOpen(true);
                              }}
                              className="p-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-400 border border-red-500/40 cursor-pointer"
                              title="ปฏิเสธสลิป"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs font-mono text-neutral-500 border border-white/[0.08] mt-4">
                  // ยังไม่มีรายการสลิป
                </div>
              )}
            </div>

            {/* Right: Quick Action Shortcuts */}
            <div className="p-5 sm:p-6 bg-[#040506]">
              <CaptionRow label="PANEL // QUICK_ACTIONS" meta="ADMIN_CONTROL" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                <button
                  onClick={() => {
                    setEditingEvent(null);
                    setEventForm({
                      title: "",
                      description: "",
                      category: "Special",
                      bannerUrl: "",
                      startDate: new Date().toISOString().slice(0, 10),
                      endDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
                      maxParticipants: "100",
                      status: "UPCOMING",
                    });
                    setEventModalOpen(true);
                  }}
                  className="p-4 border border-white/[0.1] hover:border-white hover:bg-white/[0.03] transition-colors text-left group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Calendar className="w-4 h-4 text-white" />
                    <Plus className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white" />
                  </div>
                  <div className="text-xs font-semibold text-white">สร้างกิจกรรมใหม่</div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">เพิ่มกิจกรรมชิงรางวัลประจำเซิร์ฟเวอร์</div>
                </button>

                <button
                  onClick={() => setActiveTab("slips")}
                  className="p-4 border border-white/[0.1] hover:border-emerald-500 hover:bg-emerald-950/15 transition-colors text-left group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Receipt className="w-4 h-4 text-emerald-400" />
                    <ArrowUpRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white" />
                  </div>
                  <div className="text-xs font-semibold text-white">ตรวจสอบสลิปการโอน</div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">อนุมัติหรือปฏิเสธสลิปการเติมเงิน</div>
                </button>

                <button
                  onClick={() => setActiveTab("users")}
                  className="p-4 border border-white/[0.1] hover:border-white hover:bg-white/[0.03] transition-colors text-left group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Wallet className="w-4 h-4 text-white" />
                    <Search className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white" />
                  </div>
                  <div className="text-xs font-semibold text-white">จัดการยอดเงินสมาชิก</div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">เพิ่ม ลบ หรือแก้ไขแต้มของผู้ใช้</div>
                </button>

                <button
                  onClick={() => setActiveTab("voice")}
                  className="p-4 border border-white/[0.1] hover:border-white hover:bg-white/[0.03] transition-colors text-left group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Activity className="w-4 h-4 text-white" />
                    <ArrowUpRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white" />
                  </div>
                  <div className="text-xs font-semibold text-white">จัดการชั่วโมงเสียง</div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">ปรับแก้อันดับและชั่วโมงในห้องเสียง</div>
                </button>

                <button
                  onClick={() => setActiveTab("embed_studio")}
                  className="p-4 border border-white/[0.1] hover:border-white hover:bg-white/[0.03] transition-colors text-left group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Edit3 className="w-4 h-4 text-white" />
                    <ArrowUpRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white" />
                  </div>
                  <div className="text-xs font-semibold text-white">แก้ไข Discord Embed</div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">สร้างและส่ง Embed ผ่านบอท LynnBot</div>
                </button>

                <button
                  onClick={() => setActiveTab("bank_config")}
                  className="p-4 border border-white/[0.1] hover:border-white hover:bg-white/[0.03] transition-colors text-left group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Settings className="w-4 h-4 text-white" />
                    <Edit3 className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white" />
                  </div>
                  <div className="text-xs font-semibold text-white">แก้ไขเลขบัญชี & พร้อมเพย์</div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">ปรับแต่งเบอร์รับเงินและยอดขั้นต่ำ</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ── TAB 2: EVENTS MANAGEMENT ── */}
      {/* ============================================================== */}
      {activeTab === "events" && (
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <CaptionRow label="EVENT_CONTROLLER // COMMUNITY_EVENTS" meta="CRUD_OPERATIONS" />
              <p className="text-xs text-neutral-400 mt-1">
                จัดการรายการกิจกรรมทั้งหมด กำหนดวันเริ่มต้น-สิ้นสุด และสถานะการรับสมัคร
              </p>
            </div>

            <Button
              variant="primary"
              onClick={() => {
                setEditingEvent(null);
                setEventForm({
                  title: "",
                  description: "",
                  category: "General",
                  bannerUrl: "",
                  startDate: new Date().toISOString().slice(0, 10),
                  endDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
                  maxParticipants: "100",
                  status: "OPEN",
                });
                setEventModalOpen(true);
              }}
              icon={<Plus className="w-4 h-4" />}
            >
              + เพิ่มกิจกรรมใหม่
            </Button>
          </div>

          {isEventsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((n) => (
                <div key={n} className="h-44 bg-white/[0.02] border border-white/[0.08] animate-pulse" />
              ))}
            </div>
          ) : eventsData?.events && eventsData.events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {eventsData.events.map((evt: any) => (
                <div
                  key={evt.id}
                  className="border border-white/[0.08] bg-[#040506] flex flex-col justify-between hover:border-white/30 transition-colors"
                >
                  <div>
                    {evt.bannerUrl && (
                      <div className="relative h-36 w-full overflow-hidden border-b border-white/[0.08]">
                        <img
                          src={evt.bannerUrl}
                          alt={evt.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2 px-2 py-0.5 text-[9px] font-mono bg-black/80 border border-white/20 text-white">
                          {evt.category}
                        </div>
                      </div>
                    )}

                    <div className="p-5">
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`px-2 py-0.5 text-[9px] font-mono border ${
                            evt.status === "OPEN"
                              ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/40"
                              : evt.status === "UPCOMING"
                              ? "bg-blue-950/40 text-blue-400 border-blue-500/40"
                              : "bg-neutral-900 text-neutral-400 border-neutral-700"
                          }`}
                        >
                          {evt.status}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-500">
                          ID: {evt.id}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-white mb-1.5">{evt.title}</h3>
                      <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed mb-4">
                        {evt.description}
                      </p>

                      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-neutral-400 bg-white/[0.02] p-2.5 border border-white/[0.06]">
                        <div>
                          <span className="text-neutral-600 block">START_DATE:</span>
                          {new Date(evt.startDate).toLocaleDateString("th-TH")}
                        </div>
                        <div>
                          <span className="text-neutral-600 block">END_DATE:</span>
                          {new Date(evt.endDate).toLocaleDateString("th-TH")}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 border-t border-white/[0.08] flex items-center justify-between bg-white/[0.01]">
                    <span className="text-[10px] font-mono text-neutral-500">
                      ผู้เข้าร่วม: {evt._count?.participants || 0} / {evt.maxParticipants || "∞"}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingEvent(evt);
                          setEventForm({
                            title: evt.title,
                            description: evt.description,
                            category: evt.category || "General",
                            bannerUrl: evt.bannerUrl || "",
                            startDate: new Date(evt.startDate).toISOString().slice(0, 10),
                            endDate: new Date(evt.endDate).toISOString().slice(0, 10),
                            maxParticipants: String(evt.maxParticipants || "100"),
                            status: evt.status,
                          });
                          setEventModalOpen(true);
                        }}
                        className="px-2.5 py-1 text-xs font-mono text-neutral-300 hover:text-white border border-white/[0.1] hover:border-white transition-colors cursor-pointer"
                      >
                        แก้ไข
                      </button>

                      <button
                        onClick={() => handleDeleteEvent(evt.id, evt.title)}
                        className="p-1 text-red-400 hover:bg-red-500/20 border border-red-500/30 transition-colors cursor-pointer"
                        title="ลบกิจกรรม"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-xs font-mono text-neutral-500 border border-white/[0.08]">
              // ยังไม่มีกิจกรรมในระบบ
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* ── TAB 3: SLIPS MANAGEMENT ── */}
      {/* ============================================================== */}
      {activeTab === "slips" && (
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <CaptionRow label="FINANCE // SLIP_VERIFICATION" meta="AUTOMATIC_CREDIT" />
              <p className="text-xs text-neutral-400 mt-1">
                ตรวจสอบความถูกต้องของสลิปโอนเงิน เมื่ออนุมัติระบบจะเพิ่มยอดเงินให้ผู้ใช้โดยอัตโนมัติ
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1.5 border border-white/[0.08] p-1 bg-[#040506]">
              {["ALL", "PENDING", "APPROVED", "REJECTED"].map((st) => (
                <button
                  key={st}
                  onClick={() => setSlipFilter(st)}
                  className={`px-3 py-1 text-[10px] font-mono transition-colors cursor-pointer ${
                    slipFilter === st
                      ? "bg-white text-black font-bold"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {isSlipsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-16 bg-white/[0.02] border border-white/[0.08] animate-pulse" />
              ))}
            </div>
          ) : allSlips.length > 0 ? (
            <div>
              <div className="border border-white/[0.08] divide-y divide-white/[0.08] bg-[#040506]">
                {paginatedSlips.map((slip: any) => (
                  <div key={slip.id} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Left: Thumbnail & User */}
                    <div className="flex items-center gap-4 min-w-0">
                      {slip.imageUrl ? (
                        <div className="relative group shrink-0">
                          <img
                            src={slip.imageUrl}
                            alt="Slip Preview"
                            onClick={() => setPreviewImage(slip.imageUrl)}
                            className="w-14 h-14 object-cover border border-white/20 cursor-pointer group-hover:opacity-80 transition-opacity"
                          />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/60 pointer-events-none transition-opacity">
                            <Eye className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-14 h-14 bg-white/[0.04] border border-white/10 flex items-center justify-center shrink-0">
                          <Receipt className="w-5 h-5 text-neutral-500" />
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="text-sm font-bold text-white truncate flex items-center gap-2">
                          <span>{slip.discordName || "Member"}</span>
                          <span className="text-[10px] font-mono text-neutral-500 font-normal">
                            (ID: {slip.discordId || slip.userId})
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-neutral-400 mt-0.5">
                          เลขที่รายการ: {slip.id} · {new Date(slip.createdAt).toLocaleString("th-TH")}
                        </div>
                        {slip.note && (
                          <div className="text-[11px] font-mono text-red-400 mt-1">
                            เหตุผล: {slip.note}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Amount & Actions */}
                    <div className="flex items-center justify-between md:justify-end gap-6 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-white/[0.06]">
                      <div className="text-left md:text-right">
                        <div className="text-base sm:text-lg font-mono font-bold text-white">
                          ฿{Number(slip.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </div>
                        <span
                          className={`inline-block px-2 py-0.5 text-[9px] font-mono border ${
                            slip.status === "APPROVED"
                              ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/40"
                              : slip.status === "REJECTED"
                              ? "bg-red-950/40 text-red-400 border-red-500/40"
                              : "bg-amber-950/40 text-amber-400 border-amber-500/40"
                          }`}
                        >
                          {slip.status === "APPROVED"
                            ? "อนุมัติแล้ว"
                            : slip.status === "REJECTED"
                            ? "ปฏิเสธ"
                            : "รอตรวจสอบ"}
                        </span>
                      </div>

                      {slip.status === "PENDING" ? (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="money"
                            onClick={() => handleSlipAction(slip.id, "APPROVE")}
                            icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                          >
                            อนุมัติ
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => {
                              setSelectedSlipId(slip.id);
                              setRejectModalOpen(true);
                            }}
                            className="border-red-500/30 text-red-400 hover:bg-red-500/20"
                            icon={<XCircle className="w-3.5 h-3.5" />}
                          >
                            ปฏิเสธ
                          </Button>
                        </div>
                      ) : (
                        <div className="text-[10px] font-mono text-neutral-500 text-right">
                          ตรวจโดย: {slip.reviewedByName || "Admin"}
                          {slip.reviewedAt && (
                            <div className="text-neutral-600">
                              {new Date(slip.reviewedAt).toLocaleDateString("th-TH")}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Slips Pagination */}
              {totalSlipsPages > 1 && (
                <div className="p-3 sm:p-4 border-x border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-3 bg-[#040506] font-mono text-xs">
                  <div className="text-neutral-500 text-[11px]">
                    PAGE {validSlipsPage} / {totalSlipsPages} // SHOWING {(validSlipsPage - 1) * SLIPS_PAGE_SIZE + 1}–{Math.min(validSlipsPage * SLIPS_PAGE_SIZE, allSlips.length)} OF {allSlips.length} SLIPS
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSlipsPage((p) => Math.max(1, p - 1))}
                      disabled={validSlipsPage === 1}
                      className="px-2.5 py-1 border border-white/[0.08] text-neutral-400 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    >
                      ‹ ก่อนหน้า
                    </button>
                    {Array.from({ length: totalSlipsPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => setSlipsPage(p)}
                        className={`w-7 h-7 flex items-center justify-center border transition-colors ${
                          p === validSlipsPage
                            ? "border-white bg-white text-black font-bold"
                            : "border-white/[0.08] text-neutral-400 hover:text-white hover:border-white/20"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      onClick={() => setSlipsPage((p) => Math.min(totalSlipsPages, p + 1))}
                      disabled={validSlipsPage === totalSlipsPages}
                      className="px-2.5 py-1 border border-white/[0.08] text-neutral-400 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    >
                      ถัดไป ›
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-xs font-mono text-neutral-500 border border-white/[0.08]">
              // ไม่พบรายการสลิปในหมวดนี้
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* ── TAB 4: USERS & BALANCES ── */}
      {/* ============================================================== */}
      {activeTab === "users" && (
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <CaptionRow label="USERS // BALANCE_ADJUSTMENT" meta="SEARCH_AND_EDIT" />
              <p className="text-xs text-neutral-400 mt-1">
                ค้นหาสมาชิก ปรับเพิ่มหรือลดแต้มเงินคงเหลือในกระเป๋าตังค์ พร้อมบันทึกประวัติ
              </p>
            </div>

            {/* Search Input */}
            <div className="flex items-center border border-white/[0.1] bg-[#040506] px-3 py-1.5 w-full sm:w-72 focus-within:border-white transition-colors">
              <Search className="w-3.5 h-3.5 text-neutral-500 mr-2 shrink-0" />
              <input
                type="text"
                placeholder="ค้นหาชื่อ หรือ Discord ID..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="bg-transparent text-xs text-white placeholder-neutral-600 focus:outline-none w-full font-mono"
              />
            </div>
          </div>

          {isUsersLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-14 bg-white/[0.02] border border-white/[0.08] animate-pulse" />
              ))}
            </div>
          ) : allUsers.length > 0 ? (
            <div>
              <div className="border border-white/[0.08] divide-y divide-white/[0.08] bg-[#040506]">
                {paginatedUsers.map((usr: any) => (
                  <div key={usr.id || usr.discordId} className="p-4 flex items-center justify-between gap-4 hover:bg-white/[0.015] transition-colors">
                    <div className="flex items-center gap-3.5 min-w-0">
                      {usr.avatar ? (
                        <img
                          src={usr.avatar}
                          alt={usr.displayName || usr.username}
                          className="w-10 h-10 object-cover border border-white/20 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-white/5 border border-white/10 flex items-center justify-center font-mono text-xs text-white shrink-0">
                          {usr.username?.charAt(0) || "U"}
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-semibold text-white truncate flex items-center gap-2">
                          <span>{usr.displayName || usr.username || "Discord Member"}</span>
                          {usr.role && (
                            <span className="text-[9px] font-mono px-1 py-0.2 bg-white/10 text-neutral-300">
                              {usr.role}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-neutral-400 truncate">
                          ID: {usr.discordId || usr.id} {usr.email && `· ${usr.email}`}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                      <div className="text-right">
                        <div className="text-[9px] font-mono text-neutral-500 uppercase">CURRENT_BALANCE</div>
                        <div className="text-sm sm:text-base font-mono font-bold text-emerald-400">
                          ฿{Number(usr.balance || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </div>
                      </div>

                      <Button
                        variant="secondary"
                        onClick={() => {
                          setTargetUser(usr);
                          setAdjustAmount("");
                          setAdjustNote("");
                          setAdjustAction("ADD");
                          setBalanceModalOpen(true);
                        }}
                        icon={<Wallet className="w-3.5 h-3.5" />}
                      >
                        ปรับยอดเงิน
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Users Pagination */}
              {totalUsersPages > 1 && (
                <div className="p-3 sm:p-4 border-x border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-3 bg-[#040506] font-mono text-xs">
                  <div className="text-neutral-500 text-[11px]">
                    PAGE {validUsersPage} / {totalUsersPages} // SHOWING {(validUsersPage - 1) * USERS_PAGE_SIZE + 1}–{Math.min(validUsersPage * USERS_PAGE_SIZE, allUsers.length)} OF {allUsers.length} USERS
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setUsersPage((p) => Math.max(1, p - 1))}
                      disabled={validUsersPage === 1}
                      className="px-2.5 py-1 border border-white/[0.08] text-neutral-400 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    >
                      ‹ ก่อนหน้า
                    </button>
                    {Array.from({ length: totalUsersPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => setUsersPage(p)}
                        className={`w-7 h-7 flex items-center justify-center border transition-colors ${
                          p === validUsersPage
                            ? "border-white bg-white text-black font-bold"
                            : "border-white/[0.08] text-neutral-400 hover:text-white hover:border-white/20"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      onClick={() => setUsersPage((p) => Math.min(totalUsersPages, p + 1))}
                      disabled={validUsersPage === totalUsersPages}
                      className="px-2.5 py-1 border border-white/[0.08] text-neutral-400 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    >
                      ถัดไป ›
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-xs font-mono text-neutral-500 border border-white/[0.08]">
              // ไม่พบผู้ใช้งานที่ตรงกับคำค้นหา
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* ── TAB 5: VOICE HOURS RANKING & MANAGEMENT ── */}
      {/* ============================================================== */}
      {activeTab === "voice" && <VoiceManagerTab />}

      {/* ============================================================== */}
      {/* ── TAB 6: DISCORD BOT EMBED STUDIO ── */}
      {/* ============================================================== */}
      {activeTab === "embed_studio" && <EmbedStudioTab />}

      {/* ============================================================== */}
      {/* ── TAB 5: BANK & PROMPTPAY CONFIG ── */}
      {/* ============================================================== */}
      {activeTab === "bank_config" && (
        <div className="p-6 sm:p-8">
          <CaptionRow label="CONFIGURATION // PAYMENT_GATEWAY" meta="PROMPTPAY_SETTINGS" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
            {/* Form Column (7 cols) */}
            <form onSubmit={handleSaveBankConfig} className="lg:col-span-7 space-y-5">
              {bankConfigSaved && (
                <div className="p-3 bg-emerald-950/30 border border-emerald-500/50 text-emerald-400 text-xs font-mono flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>บันทึกการตั้งค่าเรียบร้อย! ระบบหน้าเติมเงินอัปเดตอัตโนมัติ</span>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider mb-1.5">
                  PROMPTPAY_ID (เบอร์โทรศัพท์ 10 หลัก หรือ เลขประจำตัวประชาชน 13 หลัก)
                </label>
                <input
                  type="text"
                  required
                  value={bankForm.promptPayId}
                  onChange={(e) => setBankForm({ ...bankForm, promptPayId: e.target.value })}
                  placeholder="เช่น 0812345678"
                  className="w-full px-3.5 py-2.5 bg-[#040506] border border-white/[0.1] focus:border-white text-xs font-mono text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider mb-1.5">
                  ACCOUNT_DISPLAY_NAME (ชื่อบัญชีผู้รับเงิน ที่จะแสดงให้สมาชิกเห็น)
                </label>
                <input
                  type="text"
                  required
                  value={bankForm.accountName}
                  onChange={(e) => setBankForm({ ...bankForm, accountName: e.target.value })}
                  placeholder="เช่น 753BC Official Community Store"
                  className="w-full px-3.5 py-2.5 bg-[#040506] border border-white/[0.1] focus:border-white text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider mb-1.5">
                  BANK_NAME / CHANNEL (ชื่อธนาคาร หรือ ช่องทางการรับเงิน)
                </label>
                <input
                  type="text"
                  value={bankForm.bankName}
                  onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                  placeholder="เช่น พร้อมเพย์ (PromptPay QR)"
                  className="w-full px-3.5 py-2.5 bg-[#040506] border border-white/[0.1] focus:border-white text-xs text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider mb-1.5">
                    MIN_AMOUNT (ยอดเติมขั้นต่ำ ฿)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={bankForm.minAmount}
                    onChange={(e) => setBankForm({ ...bankForm, minAmount: parseFloat(e.target.value) || 20 })}
                    className="w-full px-3.5 py-2.5 bg-[#040506] border border-white/[0.1] focus:border-white text-xs font-mono text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider mb-1.5">
                    MAX_AMOUNT (ยอดเติมสูงสุด ฿)
                  </label>
                  <input
                    type="number"
                    min="100"
                    value={bankForm.maxAmount}
                    onChange={(e) => setBankForm({ ...bankForm, maxAmount: parseFloat(e.target.value) || 50000 })}
                    className="w-full px-3.5 py-2.5 bg-[#040506] border border-white/[0.1] focus:border-white text-xs font-mono text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider mb-1.5">
                  PRESET_BUTTONS (ปุ่มยอดเงินทางลัด คั่นด้วยจุลภาค)
                </label>
                <input
                  type="text"
                  value={bankForm.presets}
                  onChange={(e) => setBankForm({ ...bankForm, presets: e.target.value })}
                  placeholder="50, 100, 200, 500, 1000"
                  className="w-full px-3.5 py-2.5 bg-[#040506] border border-white/[0.1] focus:border-white text-xs font-mono text-white focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <Button variant="primary" type="submit" icon={<Save className="w-3.5 h-3.5" />}>
                  บันทึกการตั้งค่าบัญชี
                </Button>
              </div>
            </form>

            {/* Live QR Preview Column (5 cols) */}
            <div className="lg:col-span-5 border border-white/[0.08] p-6 bg-[#040506] flex flex-col items-center justify-center text-center">
              <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider mb-4">
                ■ LIVE_QR_PREVIEW (฿100.00)
              </div>

              {bankForm.promptPayId ? (
                <div className="p-3 bg-black border border-white/20 mb-3">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: generatePromptPayQrSvg(
                        generatePromptPayPayload(bankForm.promptPayId, 100),
                        200
                      ),
                    }}
                    className="w-48 h-48 flex items-center justify-center"
                  />
                </div>
              ) : (
                <div className="w-48 h-48 bg-neutral-900 border border-white/10 flex items-center justify-center text-xs font-mono text-neutral-500 mb-3">
                  NO_PROMPTPAY_ID
                </div>
              )}

              <div className="text-xs font-bold text-white mt-1">
                {bankForm.accountName || "ชื่อบัญชี"}
              </div>
              <div className="text-[10px] font-mono text-neutral-400 mt-0.5">
                {bankForm.promptPayId || "เลขพร้อมเพย์"}
              </div>
              <div className="text-[10px] font-mono text-emerald-400 mt-2">
                ขั้นต่ำ ฿{bankForm.minAmount} · สูงสุด ฿{bankForm.maxAmount.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ── TAB 8: HALLOWEEN CANDY EVENT ── */}
      {/* ============================================================== */}
      {activeTab === "candy_event" && <CandyEventTab />}

      {/* ── Bottom Section Strip ── */}
      <BottomSectionStrip figLabel="FIG_99 // ADMIN_CORE" statusText="SYSTEM_READY" />

      {/* ============================================================== */}
      {/* ── MODALS & DIALOGS ── */}
      {/* ============================================================== */}

      {/* 1. Event Create/Edit Modal */}
      {eventModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#070809] border border-white/20 max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-5">
              <div className="text-sm font-bold font-mono text-white uppercase">
                {editingEvent ? "■ EDIT_EVENT // แก้ไขกิจกรรม" : "■ CREATE_EVENT // สร้างกิจกรรมใหม่"}
              </div>
              <button
                onClick={() => setEventModalOpen(false)}
                className="text-neutral-500 hover:text-white font-mono text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">
                  ชื่อกิจกรรม (TITLE) *
                </label>
                <input
                  type="text"
                  required
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  placeholder="เช่น 753BC Halloween Tournament"
                  className="w-full px-3 py-2 bg-[#040506] border border-white/[0.1] focus:border-white text-xs text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">
                    หมวดหมู่ (CATEGORY)
                  </label>
                  <input
                    type="text"
                    value={eventForm.category}
                    onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}
                    placeholder="Special / Tournament"
                    className="w-full px-3 py-2 bg-[#040506] border border-white/[0.1] focus:border-white text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">
                    สถานะ (STATUS)
                  </label>
                  <select
                    value={eventForm.status}
                    onChange={(e) => setEventForm({ ...eventForm, status: e.target.value })}
                    className="w-full px-3 py-2 bg-[#040506] border border-white/[0.1] focus:border-white text-xs text-white focus:outline-none font-mono"
                  >
                    <option value="UPCOMING">UPCOMING (เร็วๆ นี้)</option>
                    <option value="OPEN">OPEN (เปิดรับสมัคร)</option>
                    <option value="CLOSED">CLOSED (ปิดรับสมัคร)</option>
                    <option value="COMPLETED">COMPLETED (สิ้นสุดแล้ว)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">
                  ลิงก์รูปแบนเนอร์ (BANNER_URL)
                </label>
                <input
                  type="url"
                  value={eventForm.bannerUrl}
                  onChange={(e) => setEventForm({ ...eventForm, bannerUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-[#040506] border border-white/[0.1] focus:border-white text-xs text-white focus:outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">
                    วันเริ่มต้น (START_DATE)
                  </label>
                  <input
                    type="date"
                    required
                    value={eventForm.startDate}
                    onChange={(e) => setEventForm({ ...eventForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-[#040506] border border-white/[0.1] focus:border-white text-xs text-white focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">
                    วันสิ้นสุด (END_DATE)
                  </label>
                  <input
                    type="date"
                    required
                    value={eventForm.endDate}
                    onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 bg-[#040506] border border-white/[0.1] focus:border-white text-xs text-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">
                  จำนวนผู้เข้าร่วมสูงสุด (MAX_PARTICIPANTS)
                </label>
                <input
                  type="number"
                  min="1"
                  value={eventForm.maxParticipants}
                  onChange={(e) => setEventForm({ ...eventForm, maxParticipants: e.target.value })}
                  placeholder="100"
                  className="w-full px-3 py-2 bg-[#040506] border border-white/[0.1] focus:border-white text-xs text-white focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">
                  รายละเอียดกิจกรรม (DESCRIPTION) *
                </label>
                <textarea
                  rows={4}
                  required
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  placeholder="ระบุกฎเกณฑ์ เงื่อนไข และของรางวัล..."
                  className="w-full px-3 py-2 bg-[#040506] border border-white/[0.1] focus:border-white text-xs text-white focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-end gap-3">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setEventModalOpen(false)}
                >
                  ยกเลิก
                </Button>
                <Button variant="primary" type="submit">
                  {editingEvent ? "บันทึกการแก้ไข" : "สร้างกิจกรรม"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Adjust Balance Modal */}
      {balanceModalOpen && targetUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#070809] border border-white/20 max-w-md w-full p-6 sm:p-7 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-4">
              <div className="text-sm font-bold font-mono text-white">
                ■ ADJUST_BALANCE // ปรับยอดเงิน
              </div>
              <button
                onClick={() => setBalanceModalOpen(false)}
                className="text-neutral-500 hover:text-white font-mono"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-white/[0.02] border border-white/[0.08] mb-4">
              <div className="text-xs font-semibold text-white">
                {targetUser.displayName || targetUser.username}
              </div>
              <div className="text-[10px] font-mono text-neutral-400">
                Discord ID: {targetUser.discordId || targetUser.id}
              </div>
              <div className="text-xs font-mono text-emerald-400 mt-1">
                ยอดปัจจุบัน: ฿{Number(targetUser.balance || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
            </div>

            <form onSubmit={handleAdjustBalance} className="space-y-4">
              {/* Action tabs */}
              <div className="grid grid-cols-3 gap-1.5 font-mono text-xs">
                {(["ADD", "DEDUCT", "SET"] as const).map((act) => (
                  <button
                    key={act}
                    type="button"
                    onClick={() => setAdjustAction(act)}
                    className={`py-2 text-center border cursor-pointer ${
                      adjustAction === act
                        ? "bg-white text-black font-bold border-white"
                        : "bg-white/[0.02] text-neutral-400 border-white/[0.1] hover:text-white"
                    }`}
                  >
                    {act === "ADD" ? "+ เพิ่มเงิน" : act === "DEDUCT" ? "- หักเงิน" : "= กำหนดยอด"}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">
                  จำนวนเงิน (AMOUNT ฿) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-[#040506] border border-white/[0.1] focus:border-white text-sm font-mono text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">
                  หมายเหตุ / เหตุผลการปรับยอด (NOTE)
                </label>
                <input
                  type="text"
                  placeholder="เช่น มอบรางวัลกิจกรรม, คืนยอด..."
                  value={adjustNote}
                  onChange={(e) => setAdjustNote(e.target.value)}
                  className="w-full px-3 py-2 bg-[#040506] border border-white/[0.1] focus:border-white text-xs text-white focus:outline-none"
                />
              </div>

              {/* Calculation Preview */}
              {adjustAmount && (
                <div className="p-2.5 bg-white/[0.03] border border-white/[0.08] text-[11px] font-mono text-neutral-300">
                  <span>ยอดหลังทำรายการ: </span>
                  <span className="font-bold text-white">
                    ฿
                    {adjustAction === "ADD"
                      ? (Number(targetUser.balance || 0) + parseFloat(adjustAmount)).toFixed(2)
                      : adjustAction === "DEDUCT"
                      ? Math.max(0, Number(targetUser.balance || 0) - parseFloat(adjustAmount)).toFixed(2)
                      : parseFloat(adjustAmount).toFixed(2)}
                  </span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button variant="secondary" type="button" onClick={() => setBalanceModalOpen(false)}>
                  ยกเลิก
                </Button>
                <Button variant="money" type="submit">
                  ยืนยันการปรับยอด
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Reject Slip Modal */}
      {rejectModalOpen && selectedSlipId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#070809] border border-red-500/40 max-w-md w-full p-6 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-4">
              <div className="text-sm font-bold font-mono text-red-400">
                ■ REJECT_SLIP // ปฏิเสธสลิป
              </div>
              <button
                onClick={() => setRejectModalOpen(false)}
                className="text-neutral-500 hover:text-white font-mono"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-neutral-400 mb-3">
              กรุณาระบุเหตุผลในการปฏิเสธสลิป เพื่อแจ้งให้สมาชิกทราบในหน้าประวัติการเติมเงิน:
            </p>

            <div className="space-y-2 mb-4">
              {[
                "ไม่พบยอดเงินเข้าบัญชี หรือยอดเงินไม่ถูกต้อง",
                "สลิปซ้ำ หรือเคยใช้ทำรายการแล้ว",
                "ภาพสลิปไม่ชัดเจน หรือไม่สามารถอ่าน QR Code ได้",
                "ไม่ใช่บัญชีผู้รับเงินของ 753BC Hub",
              ].map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setRejectReason(reason)}
                  className={`w-full text-left p-2 text-xs border transition-colors cursor-pointer ${
                    rejectReason === reason
                      ? "border-red-500/60 bg-red-950/30 text-white"
                      : "border-white/[0.08] hover:border-white/20 text-neutral-400"
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="ระบุเหตุผลอื่นๆ..."
              className="w-full px-3 py-2 bg-[#040506] border border-white/[0.1] focus:border-red-500 text-xs text-white focus:outline-none mb-4"
            />

            <div className="flex items-center justify-end gap-2">
              <Button variant="secondary" onClick={() => setRejectModalOpen(false)}>
                ยกเลิก
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  handleSlipAction(selectedSlipId, "REJECT", rejectReason);
                  setRejectModalOpen(false);
                }}
                className="bg-red-500/20 text-red-400 border-red-500/50 hover:bg-red-500/40"
              >
                ยืนยันการปฏิเสธ
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Full Slip Image Preview Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="max-w-2xl max-h-[85vh] relative" onClick={(e) => e.stopPropagation()}>
            <img
              src={previewImage}
              alt="Slip Full"
              className="max-h-[85vh] w-auto object-contain border border-white/20"
            />
            <div className="absolute top-2 right-2 flex items-center gap-2">
              <a
                href={previewImage}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 bg-black/80 border border-white/30 text-xs text-white flex items-center gap-1 font-mono hover:bg-white hover:text-black transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>เปิดแท็บใหม่</span>
              </a>
              <button
                onClick={() => setPreviewImage(null)}
                className="p-1.5 bg-black/80 border border-white/30 text-white hover:bg-white hover:text-black font-mono text-xs"
              >
                ✕ ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </PageFrame>
  );
}
