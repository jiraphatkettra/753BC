"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession, signIn } from "next-auth/react";
import {
  ArrowLeft,
  Coins,
  CreditCard,
  History,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  QrCode,
  Send,
} from "lucide-react";
import Button from "@/components/ui/Button";

export default function MyWalletPage() {
  const queryClient = useQueryClient();
  const { data: session, status } = useSession();
  const [redeemAmount, setRedeemAmount] = useState<string>("");
  const [payoutTarget, setPayoutTarget] = useState<string>("");
  const [accountName, setAccountName] = useState<string>("");
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const { data: myData, isLoading } = useQuery({
    queryKey: ["my-wallet"],
    queryFn: async () => {
      const res = await fetch("/api/candy/me");
      if (!res.ok) throw new Error("Failed to load wallet");
      return res.json();
    },
    enabled: status === "authenticated",
    refetchInterval: 5000,
  });

  const wallet = myData?.wallet || { balance: 0, totalEarned: 0, claimCount: 0 };
  const ledgers: any[] = myData?.ledgers || [];
  const redemptions: any[] = myData?.redemptions || [];
  const isRedeemOpen = Boolean(myData?.redeemOpen);

  const currentAmountNum = parseInt(redeemAmount, 10) || 0;

  const redeemMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/candy/me/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: currentAmountNum,
          payoutTarget,
          accountName,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to submit redemption");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-wallet"] });
      setNotification({
        type: "success",
        text: "✅ ส่งคำขอแลกเงินเรียบร้อยแล้ว! เมื่อแอดมินโอนเงินแล้ว บอทจะส่ง DM แจ้งเตือนเข้า Discord ของคุณทันที",
      });
      setRedeemAmount("");
      setPayoutTarget("");
      setAccountName("");
      setTimeout(() => setNotification(null), 8000);
    },
    onError: (err: any) => {
      setNotification({ type: "error", text: `❌ ${err.message}` });
      setTimeout(() => setNotification(null), 6000);
    },
  });

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-[#070809] flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-xl bg-neutral-950 border border-white/10 text-center space-y-4">
          <Coins className="w-12 h-12 text-orange-400 mx-auto" />
          <h1 className="text-xl font-bold text-white">กรุณาเข้าสู่ระบบก่อน</h1>
          <p className="text-xs text-neutral-400">เข้าสู่ระบบด้วย Discord เพื่อดูกระเป๋าลูกอมและทำรายการแลกเงิน</p>
          <Button variant="primary" onClick={() => signIn("discord")} className="w-full">
            เข้าสู่ระบบด้วย Discord
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070809] text-neutral-100 flex flex-col">
      <header className="h-16 border-b border-white/10 px-6 sm:px-12 flex items-center justify-between sticky top-0 z-40 bg-[#070809]/80 backdrop-blur">
        <Link href="/candy" className="flex items-center gap-2 text-xs text-neutral-400 hover:text-white transition">
          <ArrowLeft className="w-4 h-4" />
          <span>กลับหน้ากิจกรรม</span>
        </Link>
        <span className="font-bold text-sm tracking-wider text-white">MY WALLET</span>
        <div className="text-xs text-neutral-400 font-mono">{session?.user?.name}</div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 space-y-8">
        {/* Wallet Overview Bento */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-6 rounded-xl bg-neutral-950/70 border border-orange-500/30 space-y-1">
            <span className="text-xs text-orange-400 font-semibold uppercase tracking-wider">ยอดคงเหลือที่ใช้แลกได้</span>
            <div className="text-3xl font-bold text-white">{wallet.balance.toLocaleString()} 🍬</div>
            <div className="text-xs text-emerald-400 font-mono font-bold">มูลค่าเงินสด ฿{wallet.balance.toLocaleString()} บาท</div>
          </div>

          <div className="p-6 rounded-xl bg-neutral-950/70 border border-white/10 space-y-1">
            <span className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">ลูกอมที่เก็บได้ทั้งหมด</span>
            <div className="text-3xl font-bold text-white">{wallet.totalEarned.toLocaleString()} 🍬</div>
            <div className="text-xs text-neutral-500 font-mono">สะสมตลอดทั้งกิจกรรม</div>
          </div>

          <div className="p-6 rounded-xl bg-neutral-950/70 border border-white/10 space-y-1">
            <span className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">จำนวนครั้งที่เก็บได้</span>
            <div className="text-3xl font-bold text-white">{wallet.claimCount.toLocaleString()} ครั้ง</div>
            <div className="text-xs text-neutral-500 font-mono">กดเก็บสำเร็จจากกล่องดรอป</div>
          </div>
        </div>

        {/* Notifications */}
        {notification && (
          <div
            className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
              notification.type === "success"
                ? "bg-emerald-950/50 border-emerald-500/40 text-emerald-300"
                : "bg-red-950/50 border-red-500/40 text-red-300"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{notification.text}</span>
          </div>
        )}

        {/* Redemption Form */}
        <div className="p-6 sm:p-8 rounded-xl bg-neutral-950/70 border border-white/10 space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2.5">
              <CreditCard className="w-5 h-5 text-orange-400" />
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  ขอแลกเงินรางวัล (Change Candy to Money)
                </h2>
                <p className="text-[11px] text-neutral-400">
                  แลกเปลี่ยนลูกอมเป็นเงินสดจริง อัตราแลกเปลี่ยน 1 ลูกอม = 1 บาท โอนผ่านพร้อมเพย์
                </p>
              </div>
            </div>
            <span
              className={`px-2.5 py-1 rounded text-[11px] font-semibold font-mono ${
                isRedeemOpen ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-neutral-800 text-neutral-500"
              }`}
            >
              {isRedeemOpen ? "ระบบเปิดให้แลกแล้ว ✓" : "ระบบแลกยังไม่เปิด"}
            </span>
          </div>

          {isRedeemOpen ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Amount Input */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-neutral-300">
                      จำนวนลูกอมที่ต้องการแลก
                    </label>
                    <button
                      type="button"
                      onClick={() => setRedeemAmount(wallet.balance.toString())}
                      className="text-[10px] text-orange-400 hover:text-orange-300 font-mono font-bold"
                    >
                      แลกทั้งหมด ({wallet.balance})
                    </button>
                  </div>
                  <input
                    type="number"
                    min="1"
                    max={wallet.balance}
                    value={redeemAmount}
                    onChange={(e) => setRedeemAmount(e.target.value)}
                    placeholder={`เช่น ${wallet.balance || 10}`}
                    className="w-full px-3 py-2 bg-neutral-900 border border-white/10 rounded-lg text-xs text-white font-mono focus:border-orange-500/50 focus:outline-none"
                  />
                  <span className="text-[10px] text-neutral-500 font-mono mt-1 block">
                    คงเหลือ {wallet.balance} 🍬
                  </span>
                </div>

                {/* PromptPay Input */}
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    เบอร์พร้อมเพย์ (10 หลัก) / เลขบัตร (13 หลัก)
                  </label>
                  <input
                    type="text"
                    value={payoutTarget}
                    onChange={(e) => setPayoutTarget(e.target.value)}
                    placeholder="เช่น 0812345678"
                    className="w-full px-3 py-2 bg-neutral-900 border border-white/10 rounded-lg text-xs text-white font-mono focus:border-orange-500/50 focus:outline-none"
                  />
                  <span className="text-[10px] text-neutral-500 font-mono mt-1 block">
                    รองรับเบอร์โทรศัพท์ หรือเลขบัตรประชาชน
                  </span>
                </div>

                {/* Account Name */}
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    ชื่อ-นามสกุล เจ้าของบัญชี
                  </label>
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="เช่น สมชาย ใจดี"
                    className="w-full px-3 py-2 bg-neutral-900 border border-white/10 rounded-lg text-xs text-white focus:border-orange-500/50 focus:outline-none"
                  />
                  <span className="text-[10px] text-neutral-500 mt-1 block">
                    ใช้ตรวจสอบตรงกับชื่อในพร้อมเพย์
                  </span>
                </div>
              </div>

              {/* Summary Strip & DM Notice */}
              <div className="p-3.5 rounded-lg bg-orange-950/20 border border-orange-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <div className="text-neutral-300">
                    ยอดเงินที่จะได้รับโอน:{" "}
                    <strong className="text-emerald-400 font-mono text-sm">
                      ฿{currentAmountNum > 0 ? currentAmountNum.toLocaleString() : 0}.00 บาท
                    </strong>
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    🔔 เมื่อแอดมินยืนยันโอนเงินแล้ว บอทจะส่งข้อความแจ้งเตือนเข้า <strong>Discord DM</strong> ของคุณทันที!
                  </div>
                </div>

                <Button
                  variant="primary"
                  onClick={() => redeemMutation.mutate()}
                  isLoading={redeemMutation.isPending}
                  disabled={wallet.balance <= 0 || currentAmountNum <= 0 || currentAmountNum > wallet.balance || !payoutTarget}
                  className="bg-orange-500 hover:bg-orange-400 text-black font-bold whitespace-nowrap self-end sm:self-center"
                >
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  <span>ยืนยันขอแลก ฿{currentAmountNum} บาท</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-neutral-900/60 border border-white/5 text-xs text-neutral-400 space-y-1">
              <p className="font-semibold text-neutral-300">ระบบแลกเงินยังไม่เปิดให้บริการในขณะนี้</p>
              <p>
                ระบบจะเปิดให้ทำรายการแลกเปลี่ยนตามเวลาที่ทีมงานกำหนดในวันงาน (ก่อนกิจกรรมจะเริ่ม 30 ต.ค. 23:30 เป็นต้นไป)
                ขอให้ทุกท่านเตรียมเบอร์พร้อมเพย์ไว้ล่วงหน้า
              </p>
            </div>
          )}
        </div>

        {/* Redemption Requests History */}
        {redemptions.length > 0 && (
          <div className="p-6 rounded-xl bg-neutral-950/70 border border-white/10 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">รายการขอแลกเงินของคุณ</h2>
            <div className="space-y-2">
              {redemptions.map((r) => (
                <div
                  key={r.id}
                  className="p-3.5 rounded-lg bg-neutral-900 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-bold text-white flex items-center gap-2">
                      <span className="text-emerald-400 font-mono">฿{r.bahtAmount.toLocaleString()} บาท</span>
                      <span className="text-neutral-500">•</span>
                      <span className="text-orange-400 font-mono">{r.amount.toLocaleString()} 🍬</span>
                    </div>
                    <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
                      พร้อมเพย์: {r.payoutTarget} ({r.accountName || "ไม่ระบุชื่อ"})
                    </div>
                    <div className="text-[10px] text-neutral-500 font-mono">
                      ส่งคำขอเมื่อ: {new Date(r.createdAt).toLocaleString("th-TH")}
                    </div>
                  </div>

                  <div>
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold font-mono ${
                        r.status === "PAID"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : r.status === "APPROVED"
                          ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                          : r.status === "REJECTED"
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : "bg-orange-500/20 text-orange-400 border border-orange-500/30 animate-pulse"
                      }`}
                    >
                      {r.status === "PAID" ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>โอนเงินแล้ว ✓ (แจ้ง DM แล้ว)</span>
                        </>
                      ) : r.status === "APPROVED" ? (
                        <span>อนุมัติแล้ว (กำลังดำเนินการโอน)</span>
                      ) : r.status === "REJECTED" ? (
                        <span>ปฏิเสธ: {r.rejectReason || "ข้อมูลไม่ถูกต้อง"}</span>
                      ) : (
                        <span>รอแอดมินสแกนโอนเงิน...</span>
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ledger History */}
        <div className="p-6 rounded-xl bg-neutral-950/70 border border-white/10 space-y-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-neutral-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">ประวัติบัญชีแยกประเภท (Ledger)</h2>
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {ledgers.length === 0 ? (
              <div className="text-xs text-neutral-500 py-6 text-center">ยังไม่มีรายการในกระเป๋า</div>
            ) : (
              ledgers.map((l) => (
                <div
                  key={l.id}
                  className="p-2.5 rounded-lg bg-neutral-900 border border-white/5 flex items-center justify-between text-xs font-mono"
                >
                  <div>
                    <span className="text-white font-semibold">{l.reason}</span>
                    <div className="text-[10px] text-neutral-500">
                      {new Date(l.createdAt).toLocaleString("th-TH")}
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`font-bold ${
                        l.delta > 0 ? "text-emerald-400" : "text-orange-400"
                      }`}
                    >
                      {l.delta > 0 ? `+${l.delta}` : l.delta} 🍬
                    </span>
                    <div className="text-[10px] text-neutral-400">คงเหลือ {l.balanceAfter} 🍬</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
