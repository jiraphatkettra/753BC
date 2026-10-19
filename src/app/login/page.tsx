import React, { Suspense } from "react";
import { Metadata } from "next";
import LoginClient from "./LoginClient";

export const metadata: Metadata = {
  title: "เข้าสู่ระบบ — 753BC Hub",
  description: "เข้าสู่ระบบด้วย Discord OAuth2 เพื่อเชื่อมต่อบัญชี 753BC และเข้าถึงฟีเจอร์ระดับสูง",
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white animate-spin" />
        </div>
      }
    >
      <LoginClient />
    </Suspense>
  );
}
