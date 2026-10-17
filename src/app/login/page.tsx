"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn, useSession, signOut } from "next-auth/react";
import { ArrowUpRight, LogOut, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";

/* ─── Blinking cursor ─────────────────────────────────────────────── */
function Cursor() {
  return (
    <span
      className="inline-block w-[9px] h-[1.1em] bg-emerald-400 align-middle ml-0.5 animate-pulse"
      aria-hidden="true"
    />
  );
}

/* ─── Terminal typing line ────────────────────────────────────────── */
function TerminalLine({
  text,
  delay = 0,
  prefix = "$ ",
  speed = 38,
  color = "text-neutral-300",
}: {
  text: string;
  delay?: number;
  prefix?: string;
  speed?: number;
  color?: string;
}) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;
    const startTimer = setTimeout(() => {
      const interval = setInterval(() => {
        setDisplayed(text.slice(0, i + 1));
        i++;
        if (i >= text.length) {
          clearInterval(interval);
          setDone(true);
        }
      }, speed);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(startTimer);
  }, [text, delay, speed]);

  return (
    <div className={`font-mono text-xs leading-relaxed ${color}`}>
      <span className="text-neutral-600 select-none">{prefix}</span>
      {displayed}
      {!done && <Cursor />}
    </div>
  );
}

/* ─── Main Login Content ──────────────────────────────────────────── */
function LoginContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");
  const [isLoading, setIsLoading] = useState(false);
  const [phase, setPhase] = useState(0); // animation phase

  useEffect(() => {
    // Stagger the terminal lines
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 900),
      setTimeout(() => setPhase(3), 1700),
      setTimeout(() => setPhase(4), 2400),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const handleDiscordSignIn = () => {
    setIsLoading(true);
    signIn("discord", { callbackUrl: "/" });
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-10 relative overflow-x-clip">

      {/* Scanlines overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.012) 2px, rgba(255,255,255,0.012) 4px)",
        }}
      />

      {/* Grid dot overlay (subtle) */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative z-10 w-full max-w-[520px]">

        {/* ─── Outer frame ─────────────────────────────────────── */}
        <div className="relative border border-white/[0.12] bg-[#070809]">

          {/* Corner brackets */}
          <div className="absolute -top-[1px] -left-[1px] w-3 h-3 border-t-2 border-l-2 border-white/60 pointer-events-none" />
          <div className="absolute -top-[1px] -right-[1px] w-3 h-3 border-t-2 border-r-2 border-white/60 pointer-events-none" />
          <div className="absolute -bottom-[1px] -left-[1px] w-3 h-3 border-b-2 border-l-2 border-white/60 pointer-events-none" />
          <div className="absolute -bottom-[1px] -right-[1px] w-3 h-3 border-b-2 border-r-2 border-white/60 pointer-events-none" />

          {/* ─── Terminal header strip ───────────────────────── */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.08] bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-emerald-400 tracking-widest uppercase">
                753BC_AUTH_GATEWAY
              </span>
              <Cursor />
            </div>
            <span className="text-[9px] font-mono text-neutral-600 uppercase tracking-wider">
              DISCORD_OAUTH2 // v2
            </span>
          </div>

          {/* ─── Terminal output area ─────────────────────────── */}
          <div className="px-5 py-4 space-y-1.5 border-b border-white/[0.08] min-h-[90px]">
            {phase >= 1 && (
              <TerminalLine
                text="Initializing authentication module..."
                delay={0}
                color="text-neutral-500"
                speed={22}
              />
            )}
            {phase >= 2 && (
              <TerminalLine
                text="Connected to Discord OAuth2 endpoint ✓"
                delay={0}
                color="text-emerald-400"
                speed={20}
              />
            )}
            {phase >= 3 && (
              <TerminalLine
                text="Checking guild membership: 753BC..."
                delay={0}
                color="text-neutral-500"
                speed={22}
              />
            )}
            {phase >= 4 && (
              <TerminalLine
                text="Awaiting user authentication. Press CONNECT."
                delay={0}
                color="text-white"
                speed={20}
              />
            )}
          </div>

          {/* ─── Auth panel ──────────────────────────────────── */}
          <div className="p-6 sm:p-8">

            {/* Discord icon — large, centered */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                {/* Ping ring */}
                <div className="absolute inset-0 border border-white/10 animate-ping rounded-none scale-125 opacity-0 [animation-duration:2s]" />
                <div className="w-14 h-14 border border-white/[0.15] bg-white/[0.04] flex items-center justify-center">
                  <svg
                    className="w-7 h-7 fill-current text-white"
                    viewBox="0 0 127.14 96.36"
                    aria-hidden="true"
                  >
                    <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.86,53,48.81,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Label */}
            <div className="text-center mb-6">
              <div className="text-[10px] font-mono text-neutral-500 tracking-widest uppercase mb-2">
                [ SECURE_AUTH_REQUIRED ]
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                เข้าสู่ระบบด้วย Discord
              </h1>
              <p className="text-xs text-neutral-500 font-mono mt-1">
                สะสมชั่วโมงเสียง · จัดอันดับ · รับสิทธิประโยชน์
              </p>
            </div>

            {/* Error */}
            {errorParam && (
              <div className="mb-5 p-3 bg-red-500/[0.06] border border-red-500/30 text-xs text-red-400 flex items-start gap-2 font-mono">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  {errorParam === "Configuration"
                    ? "ERR: Configuration mismatch. Retry."
                    : "ERR: Auth failed. Please retry."}
                </span>
              </div>
            )}

            {/* ─── Authenticated state ─────────────────────── */}
            {status === "authenticated" && session?.user ? (
              <div className="space-y-4">
                <div className="p-4 border border-emerald-500/20 bg-emerald-500/[0.04] flex items-center gap-3.5">
                  {session.user.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || "Avatar"}
                      className="w-10 h-10 border border-white/[0.12] object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-white/[0.06] border border-white/[0.12] flex items-center justify-center font-bold text-sm">
                      {session.user.name?.charAt(0) || "U"}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-white truncate">
                      {session.user.name}
                    </div>
                    <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-1.5 mt-0.5">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>AUTH_OK // SESSION_ACTIVE</span>
                    </div>
                  </div>
                </div>

                <Link
                  href="/"
                  className="w-full py-2.5 bg-white text-black font-semibold text-xs border border-white hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2"
                >
                  <span>ไปยังหน้าหลัก</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="w-full py-2 text-xs font-mono text-neutral-500 hover:text-red-400 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-3 h-3" />
                  <span>$ signout --confirm</span>
                </button>
              </div>

            ) : (
              /* ─── Unauthenticated state ───────────────────── */
              <div className="space-y-3">

                {/* CONNECT button — large, terminal-style */}
                <button
                  type="button"
                  id="discord-login-btn"
                  onClick={handleDiscordSignIn}
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 bg-white text-black font-bold text-sm tracking-wider hover:bg-neutral-100 transition-colors flex items-center justify-center gap-3 border border-white disabled:opacity-50 cursor-pointer group select-none font-mono relative overflow-hidden"
                >
                  {/* Hover sweep effect */}
                  <span className="absolute inset-0 bg-black/0 group-hover:bg-black/[0.04] transition-colors duration-150" />

                  <svg
                    className="w-4 h-4 fill-current relative z-10 transition-transform group-hover:scale-110 duration-200"
                    viewBox="0 0 127.14 96.36"
                    aria-hidden="true"
                  >
                    <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.86,53,48.81,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
                  </svg>
                  <span className="relative z-10">
                    {isLoading ? "CONNECTING..." : "[ CONNECT_DISCORD ]"}
                  </span>
                  {isLoading && (
                    <span className="relative z-10 flex gap-0.5 ml-1">
                      <span className="w-1 h-1 bg-black rounded-none animate-bounce [animation-delay:0ms]" />
                      <span className="w-1 h-1 bg-black rounded-none animate-bounce [animation-delay:150ms]" />
                      <span className="w-1 h-1 bg-black rounded-none animate-bounce [animation-delay:300ms]" />
                    </span>
                  )}
                </button>

                {/* Footer nav */}
                <div className="flex items-center justify-between pt-2 text-[11px] font-mono text-neutral-600">
                  <Link href="/" className="hover:text-neutral-300 transition-colors">
                    ← back /home
                  </Link>
                  <a
                    href="https://discord.gg/753bc"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-white transition-colors inline-flex items-center gap-1"
                  >
                    <span>join server</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* ─── Footer strip ────────────────────────────────── */}
          <div className="px-5 py-2.5 border-t border-white/[0.08] bg-white/[0.01] flex items-center justify-between">
            <span className="text-[9px] font-mono text-neutral-600 uppercase tracking-wider">
              SSL_ENCRYPTED
            </span>
            <div className="flex items-center gap-1.5">
              <span className="w-1 h-1 bg-emerald-400 animate-pulse" />
              <span className="text-[9px] font-mono text-neutral-600 uppercase tracking-wider">
                SECURE_SOCKET_ACTIVE
              </span>
            </div>
          </div>

        </div>

        {/* Outer monospace label */}
        <div className="mt-3 flex justify-between text-[9px] font-mono text-neutral-700 uppercase tracking-widest">
          <span>GRID_REF // 005</span>
          <span>753BC_AUTH_NODE</span>
        </div>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
          <div className="font-mono text-xs text-emerald-400 animate-pulse tracking-widest">
            LOADING...<span className="inline-block w-[8px] h-[1em] bg-emerald-400 align-middle ml-0.5 animate-pulse" />
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
