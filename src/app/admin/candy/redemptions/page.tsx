"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  X,
  CreditCard,
  QrCode,
  Copy,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Coins,
  Send,
  Sparkles,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { generatePromptPayPayload, generatePromptPayQrSvg } from "@/lib/promptpay";

export default function AdminRedemptionsPage() {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [selectedRedeem, setSelectedRedeem] = useState<any | null>(null);
  const [rejectModalId, setRejectModalId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>("");
  const [notification, setNotification] = useState<{ type: "success" | "warning" | "error"; text: string } | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const { data: redemptionsData, isLoading } = useQuery({
    queryKey: ["candy-admin-redemptions"],
    queryFn: async () => {
      const res = await fetch("/api/admin/candy/redemptions");
      if (!res.ok) throw new Error("Failed to load redemptions");
      return res.json();
    },
    refetchInterval: 5000,
  });

  const allRedemptions: any[] = redemptionsData?.redemptions || [];
  const isRedeemOpen = Boolean(redemptionsData?.redeemOpen);
  const totalPendingBaht = redemptionsData?.totalPendingBaht || 0;

  const filteredRedemptions = allRedemptions.filter((r) => {
    if (filterStatus === "ALL") return true;
    return r.status === filterStatus;
  });

  const patchMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/admin/candy/redemptions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update redemption");
      }
      return res.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["candy-admin-redemptions"] });
      setRejectModalId(null);
      setRejectReason("");

      if (variables.action === "PAID") {
        if (data.dmSent) {
          setNotification({
            type: "success",
            text: "✅ ยืนยันการโอนเงินสำเร็จ! บอทได้ส่งข้อความ DM แจ้งเตือนไปยังดิสคอร์ดของผู้รับเรียบร้อยแล้ว",
          });
        } else {
          setNotification({
            type: "warning",
            text: `⚠️ ยืนยันการโอนเงินสำเร็จแล้ว แต่ส่ง DM ไม่สำเร็จ (${data.dmError || "ผู้ใช้อาจปิดรับข้อความส่วนตัว DM ในดิสคอร์ด"})`,
          });
        }
        setSelectedRedeem(null);
      } else if (variables.action === "REJECT") {
        setNotification({
          type: "success",
          text: "✅ ปฏิเสธคำขอและคืนลูกอมกลับเข้ากระเป๋าผู้ใช้เรียบร้อยแล้ว",
        });
      } else if (variables.toggleRedeemOpen !== undefined) {
        setNotification({
          type: "success",
          text: variables.toggleRedeemOpen ? "เปิดระบบแลกเงินเรียบร้อยแล้ว" : "ปิดระบบแลกเงินเรียบร้อยแล้ว",
        });
      }

      setTimeout(() => setNotification(null), 6000);
    },
    onError: (err: any) => {
      setNotification({ type: "error", text: `❌ ${err.message}` });
      setTimeout(() => setNotification(null), 5000);
    },
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">คิวขอแลกเงินรางวัล (Redemptions)</h1>
          <p className="text-xs text-neutral-400 mt-1">
            สแกน PromptPay QR Code เพื่อโอนเงิน และกดยืนยันให้บอทแจ้งเตือนเข้าดิสส่วนตัวของสมาชิกอัตโนมัติ
          </p>
        </div>

        {/* Toggle Redeem Open Switch */}
        <div className="flex items-center gap-3 bg-neutral-900 px-4 py-2 rounded-xl border border-white/10">
          <span className="text-xs font-semibold text-white">ระบบรับแลกเงิน:</span>
          <button
            onClick={() => patchMutation.mutate({ toggleRedeemOpen: !isRedeemOpen })}
            disabled={patchMutation.isPending}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              isRedeemOpen ? "bg-emerald-500 text-black hover:bg-emerald-400" : "bg-neutral-800 text-neutral-400 hover:text-white"
            }`}
          >
            {isRedeemOpen ? "เปิดให้บริการ" : "ปิดอยู่"}
          </button>
        </div>
      </div>

      {/* Alert Notification */}
      {notification && (
        <div
          className={`p-4 rounded-xl border text-xs font-medium flex items-center gap-2.5 transition-all ${
            notification.type === "success"
              ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
              : notification.type === "warning"
              ? "bg-amber-950/40 border-amber-500/40 text-amber-300"
              : "bg-red-950/40 border-red-500/40 text-red-300"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
          )}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Summary KPI Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-orange-950/20 border border-orange-500/30 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-orange-400 font-semibold uppercase tracking-wider">ยอดรอโอนทั้งหมด</div>
            <div className="text-2xl font-bold text-white mt-1">฿{totalPendingBaht.toLocaleString()} บาท</div>
            <div className="text-[10px] text-neutral-400 mt-1">1 ลูกอม = 1 บาท</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center text-xl">
            💸
          </div>
        </div>

        <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-emerald-400 font-semibold uppercase tracking-wider">โอนเงินสำเร็จแล้ว</div>
            <div className="text-2xl font-bold text-emerald-300 mt-1">
              {allRedemptions.filter((r) => r.status === "PAID").length} รายการ
            </div>
            <div className="text-[10px] text-emerald-400/70 mt-1">
              ฿{allRedemptions.filter((r) => r.status === "PAID").reduce((sum, r) => sum + r.bahtAmount, 0).toLocaleString()} บาท
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-xl">
            ✅
          </div>
        </div>

        <div className="p-4 rounded-xl bg-neutral-950/70 border border-white/10 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-neutral-400 font-semibold uppercase tracking-wider">รอคิวตรวจสอบ / โอน</div>
            <div className="text-2xl font-bold text-white mt-1">
              {allRedemptions.filter((r) => r.status === "PENDING" || r.status === "APPROVED").length} รายการ
            </div>
            <div className="text-[10px] text-neutral-400 mt-1">สแกน PromptPay QR เพื่อโอน</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-xl">
            📱
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 border-b border-white/10 pb-3">
        {[
          { id: "ALL", label: `ทั้งหมด (${allRedemptions.length})` },
          { id: "PENDING", label: `รอโอน (${allRedemptions.filter((r) => r.status === "PENDING").length})` },
          { id: "APPROVED", label: `อนุมัติแล้ว (${allRedemptions.filter((r) => r.status === "APPROVED").length})` },
          { id: "PAID", label: `โอนสำเร็จ (${allRedemptions.filter((r) => r.status === "PAID").length})` },
          { id: "REJECTED", label: `ปฏิเสธ (${allRedemptions.filter((r) => r.status === "REJECTED").length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              filterStatus === tab.id
                ? "bg-white text-black font-semibold shadow-sm"
                : "bg-neutral-900 text-neutral-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Redemptions Table */}
      <div className="bg-neutral-950/70 border border-white/10 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-900/60 border-b border-white/10 text-neutral-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">ผู้ขอ (Discord ID)</th>
                <th className="p-3.5">จำนวนลูกอม</th>
                <th className="p-3.5">ยอดเงินสดที่ได้</th>
                <th className="p-3.5">บัญชีพร้อมเพย์ / ชื่อ</th>
                <th className="p-3.5">สถานะ</th>
                <th className="p-3.5">เวลาที่ขอ</th>
                <th className="p-3.5 text-right">การจัดการ & สแกน QR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-neutral-300">
              {filteredRedemptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-neutral-500">
                    ไม่พบรายการคำขอแลกเงินในหมวดหมู่นี้
                  </td>
                </tr>
              ) : (
                filteredRedemptions.map((r) => {
                  const isPendingOrApproved = r.status === "PENDING" || r.status === "APPROVED";
                  return (
                    <tr key={r.id} className="hover:bg-neutral-900/40 transition">
                      <td className="p-3.5">
                        <div className="font-mono text-white font-semibold flex items-center gap-1.5">
                          <span>{r.discordId}</span>
                        </div>
                        <div className="text-[10px] text-neutral-500 font-mono">#{r.id.slice(-8)}</div>
                      </td>
                      <td className="p-3.5 font-bold text-orange-400 text-sm">
                        {r.amount.toLocaleString()} 🍬
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-emerald-400 text-sm font-mono">
                          ฿{r.bahtAmount.toLocaleString()}.00
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="font-mono text-white font-bold tracking-wider">{r.payoutTarget}</div>
                        <div className="text-[11px] text-neutral-400">{r.accountName || "ไม่ระบุชื่อ"}</div>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded text-[10px] font-semibold font-mono ${
                            r.status === "PAID"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : r.status === "APPROVED"
                              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                              : r.status === "REJECTED"
                              ? "bg-red-500/20 text-red-400 border border-red-500/30"
                              : "bg-orange-500/20 text-orange-400 border border-orange-500/30 animate-pulse"
                          }`}
                        >
                          {r.status === "PAID"
                            ? "โอนแล้ว ✓"
                            : r.status === "APPROVED"
                            ? "อนุมัติแล้ว"
                            : r.status === "REJECTED"
                            ? "ปฏิเสธ"
                            : "รอการโอนเงิน"}
                        </span>
                      </td>
                      <td className="p-3.5 text-neutral-400 font-mono text-[11px]">
                        {new Date(r.createdAt).toLocaleString("th-TH")}
                      </td>
                      <td className="p-3.5 text-right space-x-1.5">
                        {/* QR Code Scan Button */}
                        <button
                          onClick={() => setSelectedRedeem(r)}
                          className="px-2.5 py-1.5 rounded bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-orange-300 font-semibold text-[11px] transition inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>ดู QR โอนเงิน</span>
                        </button>

                        {/* Direct Confirm Paid Button */}
                        {isPendingOrApproved && (
                          <button
                            onClick={() => {
                              if (confirm(`ยืนยันว่าโอนเงิน ฿${r.bahtAmount} ให้กับผู้ใช้ ${r.payoutTarget} เรียบร้อยแล้ว? ระบบจะส่ง DM ไปยัง Discord ของผู้ใช้ทันที`)) {
                                patchMutation.mutate({ id: r.id, action: "PAID" });
                              }
                            }}
                            disabled={patchMutation.isPending}
                            className="px-2.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] transition inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>โอนแล้ว</span>
                          </button>
                        )}

                        {/* Reject Button */}
                        {isPendingOrApproved && (
                          <button
                            onClick={() => setRejectModalId(r.id)}
                            className="px-2.5 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-red-400 font-semibold text-[11px] transition cursor-pointer"
                          >
                            ปฏิเสธ
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================== */}
      {/* ── POPUP MODAL: PROMPTPAY QR CODE & CONFIRM PAID ── */}
      {/* ============================================================== */}
      {selectedRedeem && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#070809] border border-orange-500/40 rounded-2xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl relative">
            {/* Close Cross */}
            <button
              onClick={() => setSelectedRedeem(null)}
              className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Title */}
            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[10px] font-mono font-semibold">
                <Sparkles className="w-3 h-3" />
                <span>PROMPTPAY SCAN &amp; PAY</span>
              </div>
              <h2 className="text-lg font-bold text-white">สแกนจ่ายเงินรางวัลฮาโลวีน</h2>
              <p className="text-xs text-neutral-400">
                เปิดแอปธนาคารแล้วสแกน QR เพื่อโอนเงินเข้าพร้อมเพย์ของผู้เล่นได้ทันที
              </p>
            </div>

            {/* PromptPay QR Code Display */}
            <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-inner">
              <div
                dangerouslySetInnerHTML={{
                  __html: generatePromptPayQrSvg(
                    generatePromptPayPayload(selectedRedeem.payoutTarget, selectedRedeem.bahtAmount),
                    220
                  ),
                }}
                className="w-[220px] h-[220px] flex items-center justify-center"
              />
              <div className="text-center mt-2 font-mono text-[11px] text-black font-bold">
                PROMPTPAY // ฿{selectedRedeem.bahtAmount.toLocaleString()}.00 THB
              </div>
            </div>

            {/* Details Box */}
            <div className="p-4 rounded-xl bg-neutral-900/80 border border-white/10 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">จำนวนลูกอมที่แลก:</span>
                <span className="font-bold text-orange-400 font-mono text-sm">
                  {selectedRedeem.amount.toLocaleString()} 🍬
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">ยอดเงินที่ต้องโอน:</span>
                <span className="font-bold text-emerald-400 font-mono text-base">
                  ฿{selectedRedeem.bahtAmount.toLocaleString()}.00 บาท
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-white/5">
                <span className="text-neutral-400">เลขพร้อมเพย์:</span>
                <div className="flex items-center gap-1.5 font-mono text-white font-bold">
                  <span>{selectedRedeem.payoutTarget}</span>
                  <button
                    onClick={() => handleCopy(selectedRedeem.payoutTarget)}
                    className="p-1 hover:bg-white/10 rounded transition text-neutral-400 hover:text-white"
                    title="คัดลอกเลขพร้อมเพย์"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">ชื่อเจ้าของบัญชี:</span>
                <span className="font-medium text-white">{selectedRedeem.accountName || "ไม่ระบุชื่อ"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">ผู้ขอ (Discord ID):</span>
                <span className="font-mono text-neutral-300">{selectedRedeem.discordId}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              {selectedRedeem.status !== "PAID" ? (
                <button
                  onClick={() => {
                    patchMutation.mutate({ id: selectedRedeem.id, action: "PAID" });
                  }}
                  disabled={patchMutation.isPending}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {patchMutation.isPending ? "กำลังบันทึกและส่ง DM..." : "ยืนยันว่าโอนเงินแล้ว (แจ้งบอทส่ง DM)"}
                  </span>
                </button>
              ) : (
                <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-center text-xs font-semibold text-emerald-400">
                  ✓ โอนเงินให้ผู้เล่นและส่ง DM เรียบร้อยแล้ว
                </div>
              )}

              <div className="flex items-center justify-between gap-2">
                {selectedRedeem.status !== "PAID" && (
                  <button
                    onClick={() => {
                      setRejectModalId(selectedRedeem.id);
                      setSelectedRedeem(null);
                    }}
                    className="flex-1 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-lg transition"
                  >
                    ปฏิเสธคำขอ (คืนลูกอม)
                  </button>
                )}
                <button
                  onClick={() => setSelectedRedeem(null)}
                  className="flex-1 py-2 text-xs text-neutral-400 hover:text-white rounded-lg transition"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ── REJECT MODAL ── */}
      {/* ============================================================== */}
      {rejectModalId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-950 border border-white/20 rounded-xl p-6 max-w-md w-full space-y-4">
            <h2 className="text-base font-bold text-white">ปฏิเสธคำขอแลกเงิน (คืนลูกอมเข้ากระเป๋า)</h2>
            <p className="text-xs text-neutral-400">
              เมื่อปฏิเสธคำขอ ระบบจะทำการโอนลูกอมคืนเข้ากระเป๋าของผู้เล่นอัตโนมัติ
            </p>
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">เหตุผลในการปฏิเสธ</label>
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="เช่น ข้อมูลพร้อมเพย์ไม่ถูกต้อง, ตรวจพบข้อผิดพลาด"
                className="w-full px-3 py-2 bg-neutral-900 border border-white/10 rounded-lg text-xs text-white"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setRejectModalId(null)}>
                ยกเลิก
              </Button>
              <Button
                variant="primary"
                onClick={() => patchMutation.mutate({ id: rejectModalId, action: "REJECT", rejectReason })}
                isLoading={patchMutation.isPending}
                disabled={!rejectReason}
              >
                ยืนยันการปฏิเสธ
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
