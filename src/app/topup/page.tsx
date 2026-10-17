"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  QrCode,
  Gift,
  Receipt,
  CheckCircle2,
  Copy,
  Check,
  ArrowRight,
  Wallet,
} from "lucide-react";
import { useSession } from "next-auth/react";

/* ─── Types ────────────────────────────────────────────────────────── */
type PaymentMethod = "promptpay" | "truemoney" | "slip";

/* ─── 7-Segment LCD display ─────────────────────────────────────────
   Renders a number in the style of an old digital clock / ATM screen  */
function LCDDisplay({ value, unit = "THB" }: { value: number; unit?: string }) {
  const [prev, setPrev] = useState(value);
  const [flashing, setFlashing] = useState(false);

  useEffect(() => {
    if (value !== prev) {
      setFlashing(true);
      const t = setTimeout(() => {
        setFlashing(false);
        setPrev(value);
      }, 180);
      return () => clearTimeout(t);
    }
  }, [value, prev]);

  return (
    <div className="relative bg-[#040506] border border-white/[0.08] p-4 sm:p-5 select-none overflow-hidden">
      {/* Scanline effect inside LCD */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.025) 3px, rgba(255,255,255,0.025) 4px)",
        }}
      />

      <div className="relative">
        <div className="text-[10px] font-mono text-neutral-600 uppercase tracking-widest mb-1.5">
          AMOUNT_DISPLAY
        </div>

        {/* The big number */}
        <div
          className={`font-mono font-bold text-4xl sm:text-5xl tracking-widest leading-none transition-opacity duration-150 ${
            flashing ? "opacity-0" : "opacity-100"
          }`}
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          <span className="text-neutral-600 text-2xl sm:text-3xl">฿</span>
          <span className="text-white">{value.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
        </div>

        <div className="flex items-center gap-2 mt-2">
          <span className="text-[10px] font-mono text-neutral-500">{unit}</span>
          <span className="text-neutral-700 text-[10px] font-mono">·</span>
          <span className="text-[10px] font-mono text-neutral-500">
            1 THB = 1 POINT
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Keypad amount button ──────────────────────────────────────────── */
function KeypadBtn({
  amount,
  bonus,
  selected,
  onClick,
}: {
  amount: number;
  bonus: number;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative p-3.5 border text-left transition-all duration-100 cursor-pointer select-none group active:scale-[0.97] ${
        selected
          ? "bg-white text-black border-white"
          : "bg-transparent text-neutral-300 border-white/[0.1] hover:border-white/30 hover:text-white"
      }`}
    >
      {bonus > 0 && (
        <span
          className={`absolute top-1.5 right-1.5 text-[9px] font-mono px-1 py-px border ${
            selected
              ? "border-black/20 text-black/70"
              : "border-white/20 text-neutral-400"
          }`}
        >
          +{bonus}%
        </span>
      )}
      <div className="text-sm font-bold font-mono">฿{amount.toLocaleString()}</div>
      <div
        className={`text-[10px] font-mono mt-0.5 ${
          selected ? "text-black/60" : "text-neutral-500"
        }`}
      >
        {amount + Math.floor((amount * bonus) / 100)} pts
      </div>
    </button>
  );
}

/* ─── Method selector ──────────────────────────────────────────────── */
function MethodBtn({
  icon,
  label,
  sub,
  selected,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 p-3 border transition-all duration-100 cursor-pointer text-left active:scale-[0.98] ${
        selected
          ? "bg-white text-black border-white"
          : "bg-transparent border-white/[0.1] text-neutral-400 hover:border-white/30 hover:text-white"
      }`}
    >
      <div className={`mb-2 ${selected ? "text-black" : "text-neutral-400"}`}>
        {icon}
      </div>
      <div className="text-xs font-bold leading-tight">{label}</div>
      <div
        className={`text-[9px] font-mono mt-0.5 ${
          selected ? "text-black/60" : "text-neutral-500"
        }`}
      >
        {sub}
      </div>
    </button>
  );
}

/* ─── Pulse-dot processing indicator ──────────────────────────────── */
function ProcessingDots() {
  return (
    <span className="inline-flex items-center gap-1 ml-1">
      {[0, 150, 300].map((d) => (
        <span
          key={d}
          className="w-1 h-1 bg-current rounded-none animate-bounce"
          style={{ animationDelay: `${d}ms` }}
        />
      ))}
    </span>
  );
}

/* ─── Presets ─────────────────────────────────────────────────────── */
const PRESETS = [
  { amount: 50, bonus: 0 },
  { amount: 100, bonus: 5 },
  { amount: 300, bonus: 10 },
  { amount: 500, bonus: 15 },
  { amount: 1000, bonus: 20 },
];

/* ─── Main Page ───────────────────────────────────────────────────── */
export default function TopupPage() {
  useSession();
  const [method, setMethod] = useState<PaymentMethod>("promptpay");
  const [selectedPreset, setSelectedPreset] = useState<number>(100);
  const [customAmount, setCustomAmount] = useState("");
  const [voucherUrl, setVoucherUrl] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const finalAmount = customAmount ? Number(customAmount) || 0 : selectedPreset;
  const currentPreset = PRESETS.find((p) => p.amount === finalAmount);
  const bonusPct = currentPreset?.bonus || 0;
  const totalPts = finalAmount + Math.floor((finalAmount * bonusPct) / 100);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setSuccessMsg(
        method === "truemoney"
          ? "VOUCHER_ACCEPTED // ยอดเข้าระบบเรียบร้อย"
          : `TRANSACTION_CREATED // ฿${finalAmount} — กรุณาทำรายการ`
      );
      setTimeout(() => setSuccessMsg(null), 5000);
    }, 1200);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] text-white overflow-x-clip relative selection:bg-white/20 pt-6 sm:pt-8 md:pt-10 pb-16">

      {/* Scanlines overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-50"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.008) 3px, rgba(255,255,255,0.008) 4px)",
        }}
      />

      <section className="relative z-10 w-full flex justify-center">
        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Vertical guide lines */}
          <div className="pointer-events-none absolute -top-8 -bottom-10 left-4 sm:left-6 lg:left-8 right-4 sm:right-6 lg:right-8 [mask-image:linear-gradient(to_bottom,transparent_0%,black_32px,black_calc(100%-40px),transparent_100%)] z-10">
            <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-white/[0.1] circuit-top" />
            <div className="hidden lg:block absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[1px] bg-white/[0.1] circuit-bottom" />
            <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-white/[0.1] circuit-top" />
          </div>

          <div className="relative w-full bg-[#070809]">

            {/* Top border */}
            <div className="relative h-[1px]">
              <div className="w-full h-[1px] bg-white/[0.1] circuit-left" />
              <div className="pointer-events-none absolute right-full top-0 w-[420px] h-[1px] bg-gradient-to-l from-white/[0.1] to-transparent circuit-right" />
              <div className="pointer-events-none absolute left-full top-0 w-[420px] h-[1px] bg-gradient-to-r from-white/[0.1] to-transparent circuit-left" />
            </div>

            {/* Ref row */}
            <div className="grid grid-cols-2 h-8 text-[10px] font-mono text-neutral-500 uppercase tracking-widest select-none">
              <div className="px-5 flex items-center anim-fade-in" style={{ animationDelay: "300ms" }}>
                GRID_REF // 007
              </div>
              <div className="px-5 flex items-center justify-end anim-fade-in" style={{ animationDelay: "350ms" }}>
                753BC_PAYMENT_TERMINAL
              </div>
            </div>

            <div className="relative h-[1px]">
              <div className="w-full h-[1px] bg-white/[0.1] circuit-right" />
              <div className="pointer-events-none absolute right-full top-0 w-[420px] h-[1px] bg-gradient-to-l from-white/[0.1] to-transparent circuit-right" />
              <div className="pointer-events-none absolute left-full top-0 w-[420px] h-[1px] bg-gradient-to-r from-white/[0.1] to-transparent circuit-left" />
            </div>

            {/* ─── Page header ────────────────────────────────── */}
            <div className="p-6 sm:p-8 anim-fade-up" style={{ animationDelay: "200ms" }}>
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-white/[0.04] border border-white/[0.08] text-[10px] font-mono text-neutral-300 mb-4 tracking-wider">
                    <span className="w-1.5 h-1.5 bg-white/70 animate-pulse" />
                    PAYMENT_TERMINAL // 753BC
                  </div>
                  <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-bold tracking-tight leading-[1.1]">
                    เติมเงินเข้าระบบ
                    <br />
                    <span className="bg-gradient-to-r from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent">
                      Top-up Gateway.
                    </span>
                  </h1>
                </div>

                {/* Balance display */}
                <div className="border border-white/[0.08] p-5 shrink-0 min-w-[200px] bg-[#040506]">
                  <div className="text-[10px] font-mono text-neutral-600 uppercase tracking-widest mb-2">
                    CURRENT_BALANCE
                  </div>
                  <div className="text-2xl font-bold font-mono">฿ 0.00</div>
                  <div className="text-[10px] font-mono text-neutral-500 mt-1">
                    → 0 POINTS
                  </div>
                </div>
              </div>

              {/* Success notification */}
              {successMsg && (
                <div className="mt-4 p-3 border border-white/20 bg-white/[0.04] text-xs text-white flex items-center gap-2 font-mono">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="relative h-[1px]">
              <div className="w-full h-[1px] bg-white/[0.1]" />
            </div>

            {/* Section labels */}
            <div className="grid grid-cols-1 lg:grid-cols-2 text-[11px] font-mono bg-white/[0.015] border-b border-white/[0.08]">
              <div className="px-5 py-2.5 flex items-center justify-between lg:border-r border-white/[0.08]">
                <span className="text-white font-semibold">01 // เลือกช่องทาง &amp; จำนวนเงิน</span>
                <span className="text-neutral-500">CONFIG</span>
              </div>
              <div className="px-5 py-2.5 flex items-center justify-between">
                <span className="text-white font-semibold">02 // ยืนยันการชำระเงิน</span>
                <span className="text-neutral-500">EXECUTE</span>
              </div>
            </div>

            {/* ─── 50/50 Main Content ──────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2">

              {/* LEFT: Config ──────────────────────────────────── */}
              <div className="p-6 sm:p-8 lg:border-r border-white/[0.08] space-y-6 anim-fade-up" style={{ animationDelay: "300ms" }}>

                {/* Method selector — horizontal hardware-button style */}
                <div>
                  <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-2">
                    PAYMENT_METHOD
                  </div>
                  <div className="flex gap-2">
                    <MethodBtn
                      icon={<QrCode className="w-4 h-4" />}
                      label="PromptPay"
                      sub="SCAN_QR"
                      selected={method === "promptpay"}
                      onClick={() => setMethod("promptpay")}
                    />
                    <MethodBtn
                      icon={<Gift className="w-4 h-4" />}
                      label="TrueMoney"
                      sub="VOUCHER"
                      selected={method === "truemoney"}
                      onClick={() => setMethod("truemoney")}
                    />
                    <MethodBtn
                      icon={<Receipt className="w-4 h-4" />}
                      label="โอนเงิน"
                      sub="BANK_SLIP"
                      selected={method === "slip"}
                      onClick={() => setMethod("slip")}
                    />
                  </div>
                </div>

                {/* Amount section — only for promptpay & slip */}
                {method !== "truemoney" && (
                  <div className="space-y-3">
                    {/* LCD display */}
                    <LCDDisplay value={finalAmount} />

                    {/* Keypad grid — 3+2 layout */}
                    <div>
                      <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-2">
                        SELECT_AMOUNT (THB)
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 mb-1.5">
                        {PRESETS.slice(0, 3).map((p) => (
                          <KeypadBtn
                            key={p.amount}
                            amount={p.amount}
                            bonus={p.bonus}
                            selected={selectedPreset === p.amount && !customAmount}
                            onClick={() => {
                              setSelectedPreset(p.amount);
                              setCustomAmount("");
                            }}
                          />
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {PRESETS.slice(3).map((p) => (
                          <KeypadBtn
                            key={p.amount}
                            amount={p.amount}
                            bonus={p.bonus}
                            selected={selectedPreset === p.amount && !customAmount}
                            onClick={() => {
                              setSelectedPreset(p.amount);
                              setCustomAmount("");
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Custom input */}
                    <div>
                      <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-1.5">
                        CUSTOM_AMOUNT
                      </div>
                      <div className="flex items-center border border-white/[0.08] bg-white/[0.02] focus-within:border-white/30 transition-colors">
                        <span className="px-3 py-2.5 text-neutral-600 font-mono text-sm border-r border-white/[0.08] select-none">
                          ฿
                        </span>
                        <input
                          type="number"
                          placeholder="ระบุจำนวน (ขั้นต่ำ 20)"
                          value={customAmount}
                          onChange={(e) => setCustomAmount(e.target.value)}
                          className="flex-1 px-3 py-2.5 bg-transparent text-xs text-white placeholder-neutral-600 focus:outline-none font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TrueMoney instructions */}
                {method === "truemoney" && (
                  <div className="border border-white/[0.08] bg-white/[0.01] p-4 text-xs space-y-2 font-mono">
                    <div className="text-white font-semibold text-[11px] uppercase tracking-wider mb-3">
                      // HOW_TO_CREATE_VOUCHER
                    </div>
                    {[
                      '1. เปิดแอป TrueMoney → "โอนเงิน" → "ส่งซองของขวัญ"',
                      "2. ระบุจำนวนเงิน",
                      '3. เลือก "แบ่งเท่ากัน" → จำนวนคน: 1',
                      "4. คัดลอกลิงก์ → วางในช่องด้านขวา",
                    ].map((line, i) => (
                      <div key={i} className="text-neutral-400 leading-relaxed">
                        {line}
                      </div>
                    ))}
                  </div>
                )}

                {/* Footer */}
                <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-[10px] font-mono text-neutral-600">
                  <span>SSL_ENCRYPTED</span>
                  <span>753BC_FINANCIAL_NODE</span>
                </div>
              </div>

              {/* RIGHT: Execution Dock ────────────────────────── */}
              <div className="p-6 sm:p-8 border-t lg:border-t-0 border-white/[0.08] flex flex-col gap-6 anim-fade-up" style={{ animationDelay: "400ms" }}>

                {/* Summary receipt */}
                <div className="border border-white/[0.08] bg-[#040506]">
                  <div className="px-4 py-2.5 border-b border-white/[0.08] text-[10px] font-mono text-neutral-600 uppercase tracking-widest">
                    TRANSACTION_SUMMARY
                  </div>
                  <div className="p-4 space-y-2.5">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-neutral-500">METHOD</span>
                      <span className="text-white uppercase">{method}</span>
                    </div>
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-neutral-500">AMOUNT</span>
                      <span className="text-white font-bold">฿{finalAmount.toLocaleString()} THB</span>
                    </div>
                    {bonusPct > 0 && (
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-neutral-500">BONUS (+{bonusPct}%)</span>
                        <span className="text-white">+{Math.floor((finalAmount * bonusPct) / 100)} pts</span>
                      </div>
                    )}
                    <div className="h-[1px] bg-white/[0.08]" />
                    <div className="flex justify-between font-mono">
                      <span className="text-xs text-white font-semibold uppercase">Total Points</span>
                      <span className="text-base font-bold text-white">{totalPts.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Dynamic right panel */}
                {method === "promptpay" && (
                  <div className="space-y-4 flex-1 flex flex-col">
                    {/* QR code area */}
                    <div className="border border-white/[0.1] p-5 flex flex-col items-center gap-3 bg-[#040506] flex-1">
                      {/* Corner-bracket animated frame */}
                      <div className="relative w-36 h-36">
                        {/* Animated corner brackets */}
                        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white/60" />
                        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white/60" />
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white/60" />
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white/60" />
                        {/* QR placeholder */}
                        <div className="absolute inset-2 bg-white flex items-center justify-center">
                          <QrCode className="w-full h-full text-black p-2" />
                        </div>
                        {/* Scan line sweep */}
                        <div className="absolute inset-2 overflow-hidden pointer-events-none">
                          <div
                            className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent"
                            style={{
                              animation: "scanSweep 2.5s ease-in-out infinite",
                            }}
                          />
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs font-semibold text-white">PromptPay QR</div>
                        <div className="text-[10px] font-mono text-neutral-500 mt-1">
                          สแกนด้วยแอปธนาคาร
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleSubmit}
                      disabled={isProcessing || finalAmount < 20}
                      className="w-full py-3 bg-white text-black font-bold text-xs font-mono border border-white hover:bg-neutral-100 transition-colors disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isProcessing ? (
                        <>PROCESSING<ProcessingDots /></>
                      ) : (
                        <>[ CONFIRM_TRANSFER ] <ArrowRight className="w-3.5 h-3.5" /></>
                      )}
                    </button>
                  </div>
                )}

                {method === "truemoney" && (
                  <form onSubmit={handleSubmit} className="space-y-4 flex-1 flex flex-col">
                    <div className="flex-1">
                      <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-2">
                        VOUCHER_URL
                      </div>
                      <div className="flex items-center border border-white/[0.08] focus-within:border-white/30 transition-colors bg-white/[0.02]">
                        <input
                          type="url"
                          required
                          placeholder="https://gift.truemoney.com/..."
                          value={voucherUrl}
                          onChange={(e) => setVoucherUrl(e.target.value)}
                          className="flex-1 px-3 py-2.5 bg-transparent text-xs text-white placeholder-neutral-600 focus:outline-none font-mono"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isProcessing || !voucherUrl}
                      className="w-full py-3 bg-white text-black font-bold text-xs font-mono border border-white hover:bg-neutral-100 transition-colors disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isProcessing ? (
                        <>VERIFYING<ProcessingDots /></>
                      ) : (
                        <>[ REDEEM_VOUCHER ] <ArrowRight className="w-3.5 h-3.5" /></>
                      )}
                    </button>
                  </form>
                )}

                {method === "slip" && (
                  <div className="space-y-4 flex-1 flex flex-col">
                    {/* Bank info */}
                    <div className="border border-white/[0.08] bg-[#040506] p-4 text-xs font-mono space-y-2">
                      <div className="text-neutral-500 uppercase tracking-wider text-[10px] mb-3">
                        BANK_ACCOUNT_INFO
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-400">KBANK</span>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold tracking-wider">098-7-65432-1</span>
                          <button
                            onClick={() => handleCopy("098-7-65432-1")}
                            className="p-1 border border-white/10 hover:border-white/30 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                          >
                            {isCopied ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="text-neutral-600 text-[10px]">
                        ชื่อบัญชี: บจก. 753บีซี คอมมูนิตี้
                      </div>
                    </div>

                    {/* Slip upload area */}
                    <label className="flex-1 flex flex-col items-center justify-center gap-2 p-6 border border-dashed border-white/[0.15] bg-white/[0.01] hover:bg-white/[0.03] transition-colors cursor-pointer min-h-[120px]">
                      <Receipt className="w-6 h-6 text-neutral-500" />
                      <div className="text-xs text-neutral-300 text-center">ลากหรือคลิกเพื่อแนบสลิป</div>
                      <div className="text-[10px] font-mono text-neutral-600">JPG · PNG · สูงสุด 5MB</div>
                      <input type="file" accept="image/*" className="hidden" />
                    </label>

                    <button
                      onClick={handleSubmit}
                      disabled={isProcessing}
                      className="w-full py-3 bg-white text-black font-bold text-xs font-mono border border-white hover:bg-neutral-100 transition-colors disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isProcessing ? (
                        <>UPLOADING<ProcessingDots /></>
                      ) : (
                        <>[ SUBMIT_SLIP ] <ArrowRight className="w-3.5 h-3.5" /></>
                      )}
                    </button>
                  </div>
                )}

                {/* Help */}
                <div className="text-[11px] text-neutral-600 font-mono border-t border-white/[0.08] pt-4">
                  มีปัญหา?{" "}
                  <Link href="https://discord.gg/753bc" target="_blank" className="text-white hover:underline">
                    แจ้งทีมงานใน Discord ↗
                  </Link>
                </div>

              </div>
            </div>

            {/* Bottom border row */}
            <div className="relative h-[1px]">
              <div className="w-full h-[1px] bg-white/[0.1] circuit-left" />
              <div className="pointer-events-none absolute right-full top-0 w-[420px] h-[1px] bg-gradient-to-l from-white/[0.1] to-transparent circuit-right" />
              <div className="pointer-events-none absolute left-full top-0 w-[420px] h-[1px] bg-gradient-to-r from-white/[0.1] to-transparent circuit-left" />
            </div>
            <div className="grid grid-cols-2 h-8 text-[10px] font-mono text-neutral-500 uppercase tracking-widest select-none">
              <div className="px-5 flex items-center">FIG_07</div>
              <div className="px-5 flex items-center justify-end">
                GATEWAY_READY // AUTO_CREDIT_OK
              </div>
            </div>
            <div className="relative h-[1px]">
              <div className="w-full h-[1px] bg-white/[0.1] circuit-right" />
              <div className="pointer-events-none absolute right-full top-0 w-[420px] h-[1px] bg-gradient-to-l from-white/[0.1] to-transparent circuit-right" />
              <div className="pointer-events-none absolute left-full top-0 w-[420px] h-[1px] bg-gradient-to-r from-white/[0.1] to-transparent circuit-left" />
            </div>

          </div>
        </div>
      </section>

      {/* Keyframe for QR scan sweep */}
      <style>{`
        @keyframes scanSweep {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}
