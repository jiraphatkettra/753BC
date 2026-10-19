"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import {
  Trophy,
  ShieldCheck,
  Wallet,
  AlertTriangle,
  ArrowLeft,
  Lock,
} from "lucide-react";
import PageFrame from "@/components/ui/PageFrame";
import { TopSectionStrip, BottomSectionStrip } from "@/components/ui/SectionStrip";
import StatusChip from "@/components/ui/StatusChip";
import CaptionRow from "@/components/ui/CaptionRow";
import { FeatureStrip } from "@/components/ui/FeatureCell";
import Button from "@/components/ui/Button";

export default function LoginClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [isLoading, setIsLoading] = useState<boolean>(false);

  // If already signed in, redirect to callbackUrl or home
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      router.replace(callbackUrl);
    }
  }, [status, session, router, callbackUrl]);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn("discord", { callbackUrl });
    } catch (err) {
      console.error("Sign-in error:", err);
      setIsLoading(false);
    }
  };

  // Human-friendly Thai translation for NextAuth OAuth error codes
  const getErrorMessage = (error: string | null) => {
    if (!error) return null;
    switch (error) {
      case "AccessDenied":
        return {
          title: "การเข้าสู่ระบบถูกปฏิเสธ",
          detail: "คุณได้กดยกเลิกสิทธิ์การเข้าถึง หรือไม่ได้รับอนุญาตให้เข้าสู่ระบบ",
          code: "ERR_ACCESS_DENIED",
        };
      case "OAuthCallback":
        return {
          title: "เกิดข้อผิดพลาดในการเชื่อมต่อกับ Discord",
          detail: "ไม่สามารถยืนยันตัวตนกับ Discord API ได้ กรุณาลองใหม่อีกครั้ง",
          code: "ERR_OAUTH_CALLBACK",
        };
      case "Configuration":
        return {
          title: "ระบบยืนยันตัวตนขัดข้อง",
          detail: "การตั้งค่า OAuth2 มีปัญหา กรุณาแจ้งผู้ดูแลระบบ",
          code: "ERR_OAUTH_CONFIG",
        };
      default:
        return {
          title: "เข้าสู่ระบบไม่สำเร็จ",
          detail: "เกิดข้อผิดพลาดไม่ทราบสาเหตุ กรุณาลองใหม่อีกครั้ง",
          code: `ERR_${error.toUpperCase()}`,
        };
    }
  };

  const errorInfo = getErrorMessage(errorParam);

  return (
    <PageFrame showCenterLine>
      {/* ── Top Strip ── */}
      <TopSectionStrip gridRef="GRID_REF // 004" pageCode="AUTH_GATEWAY" />

      {/* ── Desktop 50/50 Split (Mobile: Single Column) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.08]">
        {/* ================= LEFT COLUMN ================= */}
        <div className="flex flex-col justify-between">
          <div className="p-6 sm:p-8 lg:p-10">
            {/* Status Chip */}
            <StatusChip label="■ DISCORD OAUTH2 | READY" className="mb-4" />

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
              เข้าสู่ระบบ
            </h1>

            {/* Muted Paragraph */}
            <p className="text-xs sm:text-sm text-neutral-400 mt-3 leading-relaxed max-w-md">
              ยินดีต้อนรับสู่คอมมูนิตี้ฮับอย่างเป็นทางการของ 753BC เชื่อมต่อตัวตนของคุณกับเซิร์ฟเวอร์ดิสคอร์ดเพื่อเข้าถึงทุกระบบอย่างเต็มรูปแบบ
            </p>

            {/* Line Divider */}
            <div className="my-8 h-[1px] bg-white/[0.08]" />

            {/* Three Strip Cells */}
            <div className="border border-white/[0.08] divide-y divide-white/[0.08]">
              <FeatureStrip
                icon={<Trophy className="w-4 h-4 text-white" />}
                title="ดูอันดับและชั่วโมงของคุณ"
                label="RANKING"
              />
              <FeatureStrip
                icon={<ShieldCheck className="w-4 h-4 text-white" />}
                title="แลกยศอัตโนมัติประจำเซิร์ฟเวอร์"
                label="ROLES"
              />
              <FeatureStrip
                icon={<Wallet className="w-4 h-4 text-white" />}
                title="เติมเงินและติดตามสถานะกระเป๋าตังค์"
                label="TOPUP"
              />
            </div>
          </div>

          {/* Left Footer System Meta */}
          <div className="p-5 sm:p-6 border-t border-white/[0.08] flex items-center justify-between text-[10px] font-mono text-neutral-500 bg-white/[0.01]">
            <span>NODE // AUTH_CLUSTER_01</span>
            <span>SECURE_ENCRYPTION</span>
          </div>
        </div>

        {/* ================= RIGHT COLUMN (Framed Panel) ================= */}
        <div className="flex flex-col justify-between bg-[#040506]">
          <div>
            {/* Caption Row */}
            <CaptionRow label="FIG_01 // SIGN_IN" meta="DISCORD_OAUTH2" />

            <div className="p-6 sm:p-10 lg:p-12 flex flex-col justify-center min-h-[380px]">
              {/* Error Cell if error query param exists */}
              {errorInfo && (
                <div className="mb-6 p-4 border border-red-500/40 bg-red-950/20 text-xs">
                  <div className="flex items-center gap-2 text-red-400 font-semibold mb-1">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{errorInfo.title}</span>
                  </div>
                  <p className="text-neutral-400 text-[11px] leading-relaxed">
                    {errorInfo.detail}
                  </p>
                  <div className="text-[10px] font-mono text-red-400/80 mt-2">
                    CODE: {errorInfo.code}
                  </div>
                </div>
              )}

              {/* Already authenticated banner */}
              {status === "authenticated" && session?.user ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 mx-auto mb-3 bg-white/[0.05] border border-white/20 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="text-sm font-semibold text-white">
                    เข้าสู่ระบบแล้วในชื่อ {session.user.name}
                  </div>
                  <p className="text-xs text-neutral-400 mt-1 mb-4">กำลังนำคุณไปยังหน้าหลัก...</p>
                  <Button variant="secondary" href="/">
                    กลับไปยังหน้าแรกทันที
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* White Primary Discord Sign In Button */}
                  <Button
                    variant="primary"
                    onClick={handleSignIn}
                    isLoading={isLoading}
                    showArrow
                    className="w-full py-3.5 text-sm"
                    icon={
                      <svg className="w-4 h-4 fill-current text-black" viewBox="0 0 24 24">
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                      </svg>
                    }
                  >
                    เข้าสู่ระบบด้วย Discord
                  </Button>

                  {/* Privacy Line */}
                  <p className="text-[11px] font-mono text-neutral-500 text-center leading-relaxed">
                    เราอ่านเฉพาะชื่อและรูปโปรไฟล์ของคุณจาก Discord เท่านั้น
                  </p>

                  {/* Back to Home Link */}
                  <div className="pt-4 text-center">
                    <Link
                      href="/"
                      className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>กลับหน้าแรก</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Footer */}
          <div className="p-5 sm:p-6 border-t border-white/[0.08] flex items-center justify-between text-[10px] font-mono text-neutral-500">
            <span>OFFICIAL_GATEWAY</span>
            <span>VERIFIED_OAUTH2</span>
          </div>
        </div>
      </div>

      {/* ── Bottom Strip ── */}
      <BottomSectionStrip figLabel="FIG_02" statusText="SYSTEM_READY" />
    </PageFrame>
  );
}
