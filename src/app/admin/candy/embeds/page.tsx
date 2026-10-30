import React from "react";
import EmbedEditor from "@/components/embed-studio/EmbedEditor";

export default function AdminEmbedsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Candy Embed Studio</h1>
          <p className="text-xs text-neutral-400 mt-1">
            ปรับแต่งข้อความ Embed ทุกส่วนของบอทลูกอม พร้อมพรีวิวดิสคอร์ดสดแบบเรียลไทม์ (ธีม Rulebook Pager โทนสี #A0714F)
          </p>
        </div>
      </div>

      <EmbedEditor />
    </div>
  );
}
