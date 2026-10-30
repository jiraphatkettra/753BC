"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Terminal, Shield, RefreshCw } from "lucide-react";

export default function AdminLogsPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["candy-admin-logs"],
    queryFn: async () => {
      const res = await fetch("/api/admin/candy/logs");
      if (!res.ok) throw new Error("Failed to load logs");
      return res.json();
    },
    refetchInterval: 5000,
  });

  const auditLogs: any[] = data?.auditLogs || [];
  const commands: any[] = data?.commands || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Audit Logs & Command Queue</h1>
          <p className="text-xs text-neutral-400 mt-1">ประวัติการกระทำของผู้ดูแลและสถานะคิวคำสั่งระหว่างเว็บกับบอท</p>
        </div>
        <button
          onClick={() => refetch()}
          className="p-2 text-neutral-400 hover:text-white rounded-lg bg-neutral-900 border border-white/10"
          title="รีเฟรช"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Commands Queue */}
        <div className="p-5 rounded-xl bg-neutral-950/70 border border-white/10 space-y-4">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-orange-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Web ➔ Bot Command Queue</h2>
          </div>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {commands.length === 0 ? (
              <div className="text-xs text-neutral-500 py-8 text-center">ไม่มีคำสั่งในคิว</div>
            ) : (
              commands.map((cmd) => (
                <div key={cmd.id} className="p-3 rounded-lg bg-neutral-900 border border-white/5 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white font-mono">{cmd.type}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${cmd.status === "DONE" ? "bg-emerald-500/20 text-emerald-400" : cmd.status === "PENDING" ? "bg-orange-500/20 text-orange-400" : cmd.status === "PROCESSING" ? "bg-blue-500/20 text-blue-400" : "bg-red-500/20 text-red-400"}`}>
                      {cmd.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-400 font-mono">ผู้สร้าง: {cmd.createdBy}</div>
                  <div className="text-[10px] text-neutral-500 font-mono">
                    {new Date(cmd.createdAt).toLocaleTimeString("th-TH")}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Audit Logs */}
        <div className="p-5 rounded-xl bg-neutral-950/70 border border-white/10 space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Audit Logs (บันทึกความปลอดภัย)</h2>
          </div>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {auditLogs.length === 0 ? (
              <div className="text-xs text-neutral-500 py-8 text-center">ยังไม่มีประวัติ Audit</div>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="p-3 rounded-lg bg-neutral-900 border border-white/5 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white font-mono">{log.action}</span>
                    <span className="text-[10px] text-neutral-500 font-mono">
                      {new Date(log.createdAt).toLocaleTimeString("th-TH")}
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    ผู้ดำเนินการ: <span className="font-mono text-neutral-300">{log.actor}</span>
                    {log.target && <span className="ml-2">➔ {log.target}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
