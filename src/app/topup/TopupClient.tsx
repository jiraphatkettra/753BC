"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Wallet,
  Copy,
  Check,
  UploadCloud,
  FileImage,
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import PageFrame from "@/components/ui/PageFrame";
import { TopSectionStrip, BottomSectionStrip } from "@/components/ui/SectionStrip";
import StatusChip from "@/components/ui/StatusChip";
import TabRow, { TabItem } from "@/components/ui/TabRow";
import CaptionRow from "@/components/ui/CaptionRow";
import Button from "@/components/ui/Button";
import { COMMUNITY_CONFIG } from "@/config/community";
import { generatePromptPayPayload, generatePromptPayQrSvg } from "@/lib/promptpay";
import type { TopupHistoryItem } from "@/app/api/topup/history/route";

const STEP_TABS: TabItem[] = [
  { id: "amount", label: "01 // AMOUNT" },
  { id: "scan", label: "02 // SCAN" },
  { id: "slip", label: "03 // SLIP" },
];

export default function TopupClient() {
  const { data: session, status: authStatus } = useSession();
  const queryClient = useQueryClient();

  const [activeStep, setActiveStep] = useState<string>("amount");
  const [selectedPreset, setSelectedPreset] = useState<number>(100);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // File upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [lastSubmittedTopup, setLastSubmittedTopup] = useState<{
    id: string;
    amount: number;
    status: string;
    createdAt: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate final amount
  const finalAmount = customAmount ? parseFloat(customAmount) || 0 : selectedPreset;

  // Query dynamic topup config (DB settings / env fallback)
  const { data: topupConfigData } = useQuery<{
    config: typeof COMMUNITY_CONFIG.topup;
    success: boolean;
  }>({
    queryKey: ["topup-config"],
    queryFn: async () => {
      const res = await fetch("/api/topup/config");
      if (!res.ok) throw new Error("Failed to load config");
      return res.json();
    },
    staleTime: 30_000,
  });

  const activeConfig = topupConfigData?.config || COMMUNITY_CONFIG.topup;

  // Real-time QR Code SVG generation
  const [qrSvg, setQrSvg] = useState<string>("");

  useEffect(() => {
    if (finalAmount > 0 && activeConfig?.promptPayId) {
      try {
        const payload = generatePromptPayPayload(
          activeConfig.promptPayId,
          finalAmount
        );
        const svg = generatePromptPayQrSvg(payload, 240);
        setQrSvg(svg);
      } catch (err) {
        console.error("QR generation error:", err);
      }
    }
  }, [finalAmount, activeConfig?.promptPayId]);

  // Query user topup history
  const { data: historyData, isLoading: isHistoryLoading } = useQuery<{
    items: TopupHistoryItem[];
  }>({
    queryKey: ["topup-history"],
    queryFn: async () => {
      const res = await fetch("/api/topup/history");
      if (!res.ok) throw new Error("Failed to load history");
      return res.json();
    },
    enabled: Boolean(session?.user),
  });

  const handleCopyPromptPay = () => {
    if (activeConfig?.promptPayId) {
      navigator.clipboard.writeText(activeConfig.promptPayId);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleFileSelect = (file: File) => {
    setUploadError(null);

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setUploadError("ชนิดไฟล์ไม่ถูกต้อง — อนุญาตเฉพาะ JPG, PNG, หรือ WebP");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("ขนาดไฟล์ใหญ่เกินกำหนด — สูงสุดไม่เกิน 5 MB");
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setActiveStep("slip");
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Upload slip to Cloudflare R2 and submit topup record
  const handleSubmitSlip = async () => {
    if (!selectedFile) {
      setUploadError("กรุณาเลือกไฟล์สลิปก่อนส่งรายการ");
      return;
    }

    if (
      finalAmount < activeConfig.minAmount ||
      finalAmount > activeConfig.maxAmount
    ) {
      setUploadError(
        `ยอดเงินต้องอยู่ระหว่าง ฿${activeConfig.minAmount} ถึง ฿${activeConfig.maxAmount.toLocaleString()}`
      );
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(15);

    try {
      // 1. Get presigned R2 upload URL
      const presignRes = await fetch("/api/topup/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: selectedFile.name,
          contentType: selectedFile.type,
          fileSize: selectedFile.size,
        }),
      });

      if (!presignRes.ok) {
        const errJson = await presignRes.json();
        throw new Error(errJson.message || "ไม่สามารถขอ URL อัปโหลดได้");
      }

      const { uploadUrl, publicUrl, fileKey } = await presignRes.json();
      setUploadProgress(50);

      // 2. Upload file directly to Cloudflare R2
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": selectedFile.type,
        },
        body: selectedFile,
      });

      if (!uploadRes.ok) {
        throw new Error("อัปโหลดไฟล์ไปยัง Cloudflare R2 ล้มเหลว กรุณาลองใหม่");
      }

      setUploadProgress(85);

      // 3. Create pending record
      const submitRes = await fetch("/api/topup/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: finalAmount,
          slipUrl: publicUrl,
          fileKey,
        }),
      });

      if (!submitRes.ok) {
        const errJson = await submitRes.json();
        throw new Error(errJson.message || "บันทึกข้อมูลสลิปล้มเหลว");
      }

      const result = await submitRes.json();
      setUploadProgress(100);

      setLastSubmittedTopup({
        id: result.topupId,
        amount: finalAmount,
        status: "PENDING",
        createdAt: result.createdAt,
      });

      // Reset file input
      setSelectedFile(null);
      setPreviewUrl(null);
      queryClient.invalidateQueries({ queryKey: ["topup-history"] });
    } catch (err: any) {
      console.error("Topup submission error:", err);
      setUploadError(err.message || "เกิดข้อผิดพลาดในการทำรายการ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsUploading(false);
    }
  };

  // ── Access check: If logged out, render single gate cell without QR ──
  if (authStatus !== "loading" && !session?.user) {
    return (
      <PageFrame>
        <TopSectionStrip gridRef="GRID_REF // 003" pageCode="TOPUP_GATEWAY" />

        <div className="p-8 sm:p-14 text-center max-w-xl mx-auto my-8 border border-white/[0.08] bg-[#040506]">
          <StatusChip label="■ AUTH_REQUIRED // GATEWAY_LOCKED" className="mb-4" />
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
            เข้าสู่ระบบเพื่อเติมเงิน
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 mb-8 leading-relaxed">
            ระบบชำระเงินจำเป็นต้องยืนยันตัวตนด้วยบัญชี Discord ของคุณ เพื่อผูกแต้มและยอดเข้าสู่บัญชีสมาชิกในเซิร์ฟเวอร์
          </p>

          <Button
            variant="primary"
            href="/login"
            showArrow
            className="w-full sm:w-auto px-6 py-3"
            icon={
              <svg className="w-4 h-4 fill-current text-black" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028z" />
              </svg>
            }
          >
            เข้าสู่ระบบด้วย Discord
          </Button>
        </div>

        <BottomSectionStrip figLabel="FIG_02 // SYSTEM_LOCKED" statusText="LOGIN_REQUIRED" />
      </PageFrame>
    );
  }

  return (
    <PageFrame showCenterLine>
      {/* ── Top Technical Guide Strip ── */}
      <TopSectionStrip gridRef="GRID_REF // 003" pageCode="TOPUP_GATEWAY" />

      {/* ── Stepper Tabs Row ── */}
      <div className="px-4 sm:px-8 py-3 border-b border-white/[0.08] flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2.5 bg-white/[0.01]">
        <div className="flex items-center gap-3">
          <StatusChip label="PAYMENT // PROMPTPAY" accent />
        </div>
        <div className="w-full xs:w-auto overflow-x-auto">
          <TabRow
            tabs={STEP_TABS}
            activeId={activeStep}
            onChange={(newStep) => setActiveStep(newStep)}
          />
        </div>
      </div>

      {/* ── 50/50 Split Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.08]">
        {/* ================= LEFT COLUMN ================= */}
        <div className="flex flex-col justify-between">
          <div>
            {/* Cell 01 // AMOUNT */}
            <div className="p-6 sm:p-8 border-b border-white/[0.08]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
                  ■ CELL_01 // SELECT_AMOUNT
                </span>
                <span className="text-[10px] font-mono text-emerald-400">1 THB = 1 POINT</span>
              </div>

              {/* Preset buttons */}
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-4">
                {activeConfig.presets.map((amt) => {
                  const isSelected = selectedPreset === amt && !customAmount;
                  return (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        setSelectedPreset(amt);
                        setCustomAmount("");
                        setActiveStep("scan");
                      }}
                      className={`p-3 text-center border font-mono transition-all duration-150 cursor-pointer ${
                        isSelected
                          ? "bg-white text-black border-white font-bold"
                          : "bg-white/[0.02] text-neutral-300 border-white/[0.08] hover:border-white/30 hover:text-white"
                      }`}
                    >
                      <div className="text-xs text-neutral-500 font-sans">฿</div>
                      <div className="text-sm sm:text-base font-bold">{amt.toLocaleString()}</div>
                    </button>
                  );
                })}
              </div>

              {/* Custom amount input */}
              <div className="relative">
                <label className="block text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-1.5">
                  CUSTOM_AMOUNT (฿{activeConfig.minAmount} - ฿{activeConfig.maxAmount.toLocaleString()})
                </label>
                <div className="flex items-center border border-white/[0.1] bg-[#040506] focus-within:border-white transition-colors">
                  <span className="px-3.5 py-2.5 text-neutral-500 font-mono text-sm border-r border-white/[0.08] select-none">
                    ฿
                  </span>
                  <input
                    type="number"
                    min={activeConfig.minAmount}
                    max={activeConfig.maxAmount}
                    placeholder="ระบุจำนวนเงินที่ต้องการ"
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      if (e.target.value) setActiveStep("scan");
                    }}
                    className="flex-1 px-3 py-2.5 bg-transparent text-sm text-white placeholder-neutral-600 focus:outline-none font-mono"
                  />
                  {customAmount && (
                    <button
                      type="button"
                      onClick={() => setCustomAmount("")}
                      className="px-3 text-xs text-neutral-500 hover:text-white"
                    >
                      ล้าง
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Cell 03 // SLIP DROPZONE */}
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
                  ■ CELL_03 // UPLOAD_SLIP
                </span>
                <span className="text-[10px] font-mono text-neutral-500">JPG, PNG, WEBP ≤ 5MB</span>
              </div>

              {/* Dashed dropzone with sharp corners */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border border-dashed p-6 sm:p-8 text-center cursor-pointer transition-colors relative bg-white/[0.01] ${
                  previewUrl
                    ? "border-emerald-500/50 bg-emerald-950/10"
                    : "border-white/20 hover:border-white/50 hover:bg-white/[0.02]"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                />

                {previewUrl ? (
                  <div className="flex flex-col items-center">
                    <img
                      src={previewUrl}
                      alt="Slip preview"
                      className="max-h-48 max-w-full object-contain border border-white/20 mb-3"
                    />
                    <div className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{selectedFile?.name} ({(selectedFile!.size / (1024 * 1024)).toFixed(2)} MB)</span>
                    </div>
                    <p className="text-[10px] font-mono text-neutral-500 mt-1">
                      คลิกเพื่อเปลี่ยนรูปภาพ
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <UploadCloud className="w-8 h-8 text-neutral-500 mb-2" />
                    <div className="text-xs sm:text-sm font-semibold text-white">
                      ลากไฟล์สลิปมาวาง หรือ คลิกเพื่อเลือกไฟล์
                    </div>
                    <div className="text-[11px] text-neutral-500 mt-1">
                      ระบบจะอัปโหลดตรงไปยังพื้นที่จัดเก็บ Cloudflare R2 อย่างปลอดภัย
                    </div>
                  </div>
                )}
              </div>

              {/* Progress Line */}
              {isUploading && (
                <div className="mt-4 space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-emerald-400">
                    <span>UPLOADING_TO_R2...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-1 bg-white/[0.1] overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Upload Error display */}
              {uploadError && (
                <div className="mt-4 p-3 border border-red-500/40 bg-red-950/20 text-xs text-red-300 flex items-center gap-2 font-mono">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Submit Button */}
              <div className="mt-6 flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-3">
                <div className="text-[11px] font-mono text-neutral-500">
                  TOTAL: <span className="text-white font-bold">฿{finalAmount.toFixed(2)}</span>
                </div>
                <Button
                  variant="money"
                  onClick={handleSubmitSlip}
                  isLoading={isUploading}
                  disabled={!selectedFile || isUploading || finalAmount <= 0}
                  icon={<Wallet className="w-3.5 h-3.5" />}
                  showArrow
                  className="w-full xs:w-auto justify-center min-h-[40px]"
                >
                  ยืนยันการแจ้งโอนสลิป
                </Button>
              </div>
            </div>
          </div>

          {/* After submit: inline mono timeline */}
          {lastSubmittedTopup && (
            <div className="p-5 sm:p-6 border-t border-emerald-500/30 bg-emerald-950/15">
              <div className="flex items-center justify-between text-[10px] font-mono text-emerald-400 mb-2">
                <span className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  SUBMISSION_SUCCESS // รายการถูกส่งเข้าสู่ระบบแล้ว
                </span>
                <span>ID: {lastSubmittedTopup.id}</span>
              </div>

              {/* Inline timeline */}
              <div className="py-2.5 px-3 border border-emerald-500/30 bg-[#040506] flex items-center justify-between font-mono text-xs">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <span className="w-2 h-2 bg-emerald-400 animate-pulse" />
                  <span>PENDING (รอตรวจสอบ)</span>
                </div>
                <span className="text-neutral-600">────────▶</span>
                <div className="text-neutral-500 text-[11px]">
                  <span>APPROVED | REJECTED</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================= RIGHT COLUMN (Sticky Panel) ================= */}
        <div className="p-6 sm:p-8 flex flex-col justify-between bg-[#040506] sticky top-[64px]">
          <div>
            {/* Caption Row with Amount Meta */}
            <CaptionRow
              label="FIG_01 // PROMPTPAY_QR"
              meta={`฿${finalAmount.toFixed(2)} THB`}
              accent
            />

            {/* QR Code Container */}
            <div className="p-6 flex flex-col items-center justify-center border-b border-white/[0.08] bg-[#070809]">
              <div className="p-3 bg-[#040506] border border-white/20 relative shadow-[0_0_30px_rgba(16,185,129,0.06)]">
                {qrSvg ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: qrSvg }}
                    className="w-56 h-56 flex items-center justify-center"
                  />
                ) : (
                  <div className="w-56 h-56 bg-neutral-900 animate-pulse flex items-center justify-center text-xs font-mono text-neutral-500">
                    GENERATING_QR...
                  </div>
                )}
              </div>

              <div className="text-center mt-4">
                <div className="text-xs sm:text-sm font-semibold text-white">
                  {activeConfig.accountName}
                </div>
                <div className="text-[11px] font-mono text-neutral-400 mt-0.5">
                  {activeConfig.bankName}
                </div>
              </div>

              {/* Copy PromptPay ID button */}
              <div className="mt-4 flex items-center gap-2">
                <span className="px-3 py-1.5 font-mono text-xs text-white bg-white/[0.04] border border-white/[0.1]">
                  {activeConfig.promptPayId}
                </span>
                <Button
                  variant="secondary"
                  onClick={handleCopyPromptPay}
                  icon={isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                >
                  {isCopied ? "คัดลอกแล้ว" : "คัดลอกเลขพร้อมเพย์"}
                </Button>
              </div>

              <p className="text-[11px] text-neutral-400 mt-4 text-center font-mono leading-relaxed">
                เปิดแอปธนาคาร → สแกน QR → ชำระเงิน → แคปสลิป
              </p>
            </div>

            {/* History Cell: Table of Past Topups */}
            <div className="p-5 sm:p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
                  ■ CELL // RECENT_TOPUPS
                </span>
                <span className="text-[10px] font-mono text-neutral-600">HISTORY</span>
              </div>

              {isHistoryLoading ? (
                <div className="space-y-2">
                  {[1, 2].map((n) => (
                    <div key={n} className="h-10 bg-white/[0.02] border border-white/[0.08] animate-pulse" />
                  ))}
                </div>
              ) : historyData?.items && historyData.items.length > 0 ? (
                <div className="divide-y divide-white/[0.08] border border-white/[0.08]">
                  {historyData.items.slice(0, 5).map((item) => (
                    <div key={item.id} className="p-2.5 sm:p-3 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-mono font-bold text-white">
                          ฿{item.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-[10px] font-mono text-neutral-500">
                          {new Date(item.createdAt).toLocaleDateString("th-TH")}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 text-[9px] font-mono border ${
                            item.status === "APPROVED"
                              ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/40"
                              : item.status === "REJECTED"
                              ? "bg-red-950/40 text-red-400 border-red-500/40"
                              : "bg-white/[0.05] text-neutral-300 border-white/[0.1]"
                          }`}
                        >
                          {item.status === "APPROVED"
                            ? "สำเร็จ"
                            : item.status === "REJECTED"
                            ? "ไม่ผ่าน"
                            : "รอตรวจสอบ"}
                        </span>

                        {item.slipUrl && (
                          <a
                            href={item.slipUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-neutral-400 hover:text-white"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 border border-white/[0.06] text-center text-[11px] font-mono text-neutral-500">
                  // ยังไม่มีประวัติการเติมเงิน
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Strip ── */}
      <BottomSectionStrip
        figLabel="FIG_02"
        statusText={selectedFile ? "AWAITING_SLIP_VERIFICATION" : "SYSTEM_READY"}
      />
    </PageFrame>
  );
}
