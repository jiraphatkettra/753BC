"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, UserCheck, UserX, PlusCircle, MinusCircle, ShieldAlert } from "lucide-react";
import Button from "@/components/ui/Button";

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [adjustForm, setAdjustForm] = useState({ delta: 5, reason: "" });

  const { data: usersData, isLoading } = useQuery({
    queryKey: ["candy-admin-users", search],
    queryFn: async () => {
      const url = search ? `/api/admin/candy/users?search=${encodeURIComponent(search)}` : "/api/admin/candy/users";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load users");
      return res.json();
    },
  });

  const wallets: any[] = usersData?.wallets || [];

  const adjustMutation = useMutation({
    mutationFn: async ({ delta, reason }: { delta: number; reason: string }) => {
      const res = await fetch("/api/admin/candy/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discordId: selectedUser.discordId, delta, reason }),
      });
      if (!res.ok) throw new Error("Failed to adjust balance");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candy-admin-users"] });
      setSelectedUser(null);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">ผู้เล่นและกระเป๋าลูกอม</h1>
          <p className="text-xs text-neutral-400 mt-1">จัดการยอดคงเหลือ ปรับเพิ่ม/ลดลูกอม และระงับสิทธิ์ผู้เล่น</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="ค้นหา Discord ID / ชื่อ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-neutral-900 border border-white/10 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/30"
          />
        </div>
      </div>

      <div className="bg-neutral-950/70 border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-900/60 border-b border-white/10 text-neutral-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">ผู้เล่น</th>
                <th className="p-3.5">ยอดคงเหลือ</th>
                <th className="p-3.5">สะสมทั้งหมด</th>
                <th className="p-3.5">แลกไปแล้ว</th>
                <th className="p-3.5">จำนวนครั้งที่เก็บ</th>
                <th className="p-3.5">สถานะ</th>
                <th className="p-3.5 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-neutral-300">
              {wallets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-neutral-500">
                    ไม่พบข้อมูลผู้เล่น
                  </td>
                </tr>
              ) : (
                wallets.map((w) => (
                  <tr key={w.id} className="hover:bg-neutral-900/40 transition">
                    <td className="p-3.5">
                      <div className="flex items-center gap-2.5">
                        {w.avatar ? (
                          <img src={w.avatar} alt="" className="w-7 h-7 rounded-full bg-neutral-800" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-neutral-800 flex items-center justify-center font-bold text-white text-[10px]">
                            {w.username?.[0] || "U"}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-white text-xs">{w.displayName || w.username}</div>
                          <div className="text-[10px] text-neutral-500 font-mono">{w.discordId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 font-bold text-orange-400 text-sm">{w.balance} 🍬 (฿{w.balance})</td>
                    <td className="p-3.5 font-mono text-neutral-300">{w.totalEarned} 🍬</td>
                    <td className="p-3.5 font-mono text-neutral-400">{w.totalRedeemed} 🍬</td>
                    <td className="p-3.5 font-mono">{w.claimCount} ครั้ง</td>
                    <td className="p-3.5">
                      {w.blocked ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-500/20 text-red-400">
                          ถูกระงับสิทธิ์
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400">
                          ปกติ
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => setSelectedUser(w)}
                        className="px-2.5 py-1 rounded bg-white text-black font-semibold text-[11px] hover:bg-neutral-200 transition"
                      >
                        ปรับยอด
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Balance Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-950 border border-white/20 rounded-xl p-6 max-w-md w-full space-y-4">
            <h2 className="text-base font-bold text-white">ปรับยอดลูกอม: {selectedUser.displayName || selectedUser.username}</h2>
            <div className="p-3 rounded-lg bg-neutral-900 border border-white/10 text-xs">
              <span className="text-neutral-400">ยอดคงเหลือปัจจุบัน:</span>{" "}
              <span className="font-bold text-orange-400">{selectedUser.balance} 🍬 (฿{selectedUser.balance})</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  จำนวนลูกอมที่ต้องการปรับ (+ หรือ -)
                </label>
                <input
                  type="number"
                  value={adjustForm.delta}
                  onChange={(e) => setAdjustForm({ ...adjustForm, delta: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-3 py-2 bg-neutral-900 border border-white/10 rounded-lg text-xs text-white font-mono"
                  placeholder="+5 หรือ -5"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  เหตุผลในการปรับยอด (บังคับบันทึกลง Ledger)
                </label>
                <input
                  type="text"
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-900 border border-white/10 rounded-lg text-xs text-white"
                  placeholder="เช่น มอบรางวัลพิเศษ, ชดเชยระบบ, ฯลฯ"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setSelectedUser(null)}>
                ยกเลิก
              </Button>
              <Button
                variant="primary"
                onClick={() => adjustMutation.mutate({ delta: adjustForm.delta, reason: adjustForm.reason })}
                isLoading={adjustMutation.isPending}
                disabled={!adjustForm.reason || adjustForm.delta === 0}
              >
                ยืนยันการปรับยอด
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
