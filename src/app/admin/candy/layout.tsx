import React from "react";
import CandyAdminSidebar from "@/components/candy-admin/CandyAdminSidebar";
import CandyAdminTopBar from "@/components/candy-admin/CandyAdminTopBar";

export const metadata = {
  title: "Trick or Treat Admin — 753BC Hub",
  description: "ระบบจัดการกิจกรรม Trick or Treat แลกเปลี่ยนลูกอมเป็นเงินสด",
};

export default function CandyAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#070809] text-neutral-100">
      <CandyAdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <CandyAdminTopBar />
        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
