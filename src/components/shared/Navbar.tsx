"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Menu, X, ArrowUpRight, Shield, LogOut, User, ChevronDown, Wallet, ShoppingBag, Trophy } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Lock scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

  const navLinks: { name: string; href: string; isExternal?: boolean }[] = [
    { name: "หน้าแรก", href: "/" },
    { name: "กิจกรรม", href: "/events" },
    { name: "ร้านค้า", href: "/shop" },
    { name: "จัดอันดับ", href: "/leaderboard" },
    { name: "กฎระเบียบ", href: "/rules" },
    { name: "ติดต่อสตาฟ", href: "/contact" },
  ];

  return (
    <>
      {/* High-Tech Stealth Fixed Navbar (Sharp Blueprint Theme) */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 h-[64px] transition-colors duration-200 ${
          scrolled || mobileMenuOpen
            ? "bg-[#070809]/90 backdrop-blur-md border-b border-white/[0.08]"
            : "bg-[#070809]/60 backdrop-blur-sm border-b border-white/[0.06]"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">

          {/* Left: Brand Logo (Sharp Technical Blueprint Style) */}
          <Link
            href="/"
            className="flex items-center gap-2.5 text-white hover:opacity-90 transition-opacity group"
          >
            {/* Minimalist Discord Brand Icon */}
            <div className="w-5 h-5 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white fill-current transition-transform duration-200 group-hover:scale-105"
                viewBox="0 0 127.14 96.36"
                aria-hidden="true"
              >
                <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.86,53,48.81,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
              </svg>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-semibold tracking-tight text-white">
                753BC
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono bg-white/[0.04] border border-white/[0.08] text-neutral-400 tracking-wider">
                HUB
              </span>
            </div>
          </Link>

          {/* Right: Nav Links + Actions (Linear Blueprint Style) */}
          <div className="hidden lg:flex items-center gap-6">
            <nav className="flex items-center gap-6 text-[13px] text-neutral-400">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                if (link.isExternal) {
                  return (
                    <a
                      key={link.name}
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="transition-colors duration-150 hover:text-white"
                    >
                      {link.name}
                    </a>
                  );
                }
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`transition-colors duration-150 hover:text-white ${
                      isActive ? "text-white font-medium" : ""
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>

            {/* Subtle Vertical Divider */}
            <div className="h-3.5 w-[1px] bg-white/[0.1] mx-1" />

            {/* Auth Actions (Sharp Rectangular Style) */}
            <div className="flex items-center gap-2.5">
              <a
                href="https://discord.gg/6zcbZ47b5t"
                target="_blank"
                rel="noreferrer"
                className="hidden xl:inline-flex items-center gap-1 text-[13px] text-neutral-400 hover:text-white transition-colors duration-150 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2 whitespace-nowrap group mr-1"
              >
                <span>เข้าร่วมดิสคอร์ด</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-neutral-500 group-hover:text-white transition-colors" />
              </a>

              {/* ปุ่มเติมเงิน (Top-up Action Button) */}
              <Link
                href="/topup"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/60 transition-colors duration-150 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-emerald-400 focus-visible:outline-offset-2 whitespace-nowrap shadow-[0_0_15px_rgba(16,185,129,0.08)] group"
              >
                <Wallet className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-105 transition-transform" />
                <span>เติมเงิน</span>
              </Link>

              {/* User Auth Profile State */}
              {!mounted ? (
                <Link
                  href="/login"
                  className="text-[12px] font-medium text-black bg-white hover:bg-neutral-200 px-3.5 py-1.5 border border-white transition-colors duration-150 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2 whitespace-nowrap shadow-[0_0_15px_rgba(255,255,255,0.08)]"
                >
                  เข้าสู่ระบบ
                </Link>
              ) : status === "loading" ? (
                <div className="w-24 h-7 bg-white/[0.05] border border-white/[0.1] animate-pulse" />
              ) : status === "authenticated" && session?.user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 px-2.5 py-1.5 bg-[#070809] border border-white/[0.15] hover:border-white/40 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2 transition-colors duration-150 text-left cursor-pointer"
                  >
                    {session.user.image ? (
                      <img
                        src={session.user.image}
                        alt={session.user.name || "User"}
                        className="w-5 h-5 object-cover border border-white/20"
                      />
                    ) : (
                      <div className="w-5 h-5 bg-neutral-800 flex items-center justify-center text-[10px] font-bold text-white">
                        {session.user.name?.charAt(0) || "U"}
                      </div>
                    )}
                    <span className="text-xs font-medium text-white max-w-[100px] truncate whitespace-nowrap">
                      {session.user.name}
                    </span>
                    {session.user.isAdmin && (
                      <span className="px-1 py-0.2 text-[8px] font-mono bg-orange-500/20 text-orange-400 border border-orange-500/40">
                        ADMIN
                      </span>
                    )}
                    <ChevronDown className="w-3 h-3 text-neutral-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-[#070809] border border-white/[0.15] shadow-2xl py-2 z-50">
                      <div className="px-3 py-2 border-b border-white/[0.08]">
                        <div className="text-xs font-semibold text-white truncate">
                          {session.user.name}
                        </div>
                        <div className="text-[10px] font-mono text-neutral-500 truncate mt-0.5">
                          ID: {session.user.discordId}
                        </div>
                      </div>

                      <div className="py-1">
                        <Link
                          href="/topup"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-1.5 text-xs text-emerald-400 hover:bg-white/[0.05] transition-colors"
                        >
                          <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                          <span>เติมเงิน / กระเป๋าเงิน</span>
                        </Link>
                        <Link
                          href="/shop"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-1.5 text-xs text-neutral-300 hover:text-white hover:bg-white/[0.05] transition-colors"
                        >
                          <ShoppingBag className="w-3.5 h-3.5 text-neutral-400" />
                          <span>ร้านค้าคอมมูนิตี้</span>
                        </Link>
                        <Link
                          href="/leaderboard"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-1.5 text-xs text-neutral-300 hover:text-white hover:bg-white/[0.05] transition-colors"
                        >
                          <Trophy className="w-3.5 h-3.5 text-neutral-400" />
                          <span>จัดอันดับของฉัน</span>
                        </Link>
                        {session.user.isAdmin && (
                          <Link
                            href="/admin"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs text-orange-400 hover:bg-orange-500/10 transition-colors"
                          >
                            <Shield className="w-3.5 h-3.5 text-orange-400" />
                            <span>ศูนย์ควบคุมแอดมิน</span>
                          </Link>
                        )}
                      </div>

                      <div className="border-t border-white/[0.08] pt-1">
                        <button
                          onClick={() => {
                            setUserDropdownOpen(false);
                            signOut({ callbackUrl: "/" });
                          }}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 active:scale-[0.98] transition-colors duration-150 text-left cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>ออกจากระบบ</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="text-[12px] font-medium text-black bg-white hover:bg-neutral-200 px-3.5 py-1.5 border border-white transition-colors duration-150 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2 whitespace-nowrap shadow-[0_0_15px_rgba(255,255,255,0.08)]"
                >
                  เข้าสู่ระบบ
                </Link>
              )}
            </div>
          </div>

          {/* Mobile & Tablet Right Controls */}
          <div className="flex lg:hidden items-center gap-1.5 sm:gap-2">
            {/* ปุ่มเติมเงินบน Mobile Header */}
            <Link
              href="/topup"
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 active:scale-[0.98] whitespace-nowrap transition-colors duration-150 min-h-[34px]"
              aria-label="เติมเงิน"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">เติมเงิน</span>
            </Link>
            {mounted && status === "authenticated" && session?.user ? (
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-2 py-1.5 bg-[#070809] border border-white/[0.15] active:scale-[0.98] whitespace-nowrap transition-colors duration-150 min-h-[34px]"
              >
                {session.user.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    className="w-4 h-4 object-cover"
                  />
                ) : (
                  <User className="w-3.5 h-3.5 text-white" />
                )}
                <span className="text-[11px] text-white max-w-[55px] sm:max-w-[70px] truncate whitespace-nowrap">
                  {session.user.name}
                </span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="text-[12px] font-medium text-black bg-white px-2.5 sm:px-3 py-1.5 border border-white active:scale-[0.98] whitespace-nowrap transition-colors duration-150 min-h-[34px] flex items-center"
              >
                เข้าสู่ระบบ
              </Link>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 sm:p-2 text-neutral-400 hover:text-white transition-colors border border-white/[0.08] bg-white/[0.02] min-w-[34px] min-h-[34px] flex items-center justify-center cursor-pointer active:scale-95"
              aria-label={mobileMenuOpen ? "ปิดเมนู" : "เปิดเมนู"}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-white" />
              ) : (
                <Menu className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ================= Mobile Drawer (Sharp Theme) ================= */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-[64px] z-40 bg-[#070809]/98 backdrop-blur-2xl lg:hidden px-6 pt-6 pb-10 flex flex-col justify-between overflow-y-auto animate-in fade-in duration-150">
          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) =>
              link.isExternal ? (
                <a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-[15px] text-neutral-300 hover:text-white transition-colors py-3.5 border-b border-white/[0.06] flex items-center justify-between min-h-[44px]"
                >
                  <span>{link.name}</span>
                  <span className="text-[10px] font-mono text-neutral-600">// EXT</span>
                </a>
              ) : (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-[15px] transition-colors py-3.5 border-b border-white/[0.06] flex items-center justify-between min-h-[44px] ${
                    pathname === link.href
                      ? "text-white font-semibold"
                      : "text-neutral-300 hover:text-white"
                  }`}
                >
                  <span>{link.name}</span>
                  <span className="text-[10px] font-mono text-neutral-600">// NAV</span>
                </Link>
              )
            )}
          </nav>

          <div className="pt-6 border-t border-white/[0.08] flex flex-col gap-3">
            {status === "authenticated" && session?.user ? (
              <>
                <div className="p-3 bg-white/[0.02] border border-white/[0.08] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {session.user.image && (
                      <img
                        src={session.user.image}
                        alt="Avatar"
                        className="w-8 h-8 object-cover border border-white/20"
                      />
                    )}
                    <div>
                      <div className="text-xs font-semibold text-white">
                        {session.user.name}
                      </div>
                      <div className="text-[10px] font-mono text-neutral-500">
                        {session.user.discordId}
                      </div>
                    </div>
                  </div>
                  {session.user.isAdmin && (
                    <span className="px-1.5 py-0.5 text-[9px] font-mono bg-orange-500/20 text-orange-400 border border-orange-500/40">
                      ADMIN
                    </span>
                  )}
                </div>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    signOut({ callbackUrl: "/" });
                  }}
                  className="w-full py-3 text-center text-[13px] font-medium text-red-400 bg-red-500/10 border border-red-500/20 flex items-center justify-center gap-2 min-h-[44px] active:scale-[0.98]"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>ออกจากระบบ</span>
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-3 text-center text-[13px] font-medium text-black bg-white border border-white transition-colors duration-150 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2 whitespace-nowrap shadow-sm min-h-[44px] flex items-center justify-center"
              >
                เข้าสู่ระบบด้วย Discord
              </Link>
            )}

            <Link
              href="/topup"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-3 text-center text-[13px] font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors duration-150 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-emerald-400 focus-visible:outline-offset-2 whitespace-nowrap flex items-center justify-center gap-2 min-h-[44px]"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>เติมเงินกระเป๋าตังค์</span>
            </Link>

            {status === "authenticated" && session?.user?.isAdmin && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-3 text-center text-[13px] font-medium text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 transition-colors duration-150 active:scale-[0.98] flex items-center justify-center gap-2 min-h-[44px]"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>ศูนย์ควบคุมแอดมิน</span>
              </Link>
            )}

            <a
              href="https://discord.gg/6zcbZ47b5t"
              target="_blank"
              rel="noreferrer"
              className="w-full py-3 text-center text-[13px] font-medium text-neutral-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] transition-colors duration-150 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2 whitespace-nowrap flex items-center justify-center gap-1.5 min-h-[44px]"
            >
              <span>เข้าร่วมดิสคอร์ด</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-neutral-400" />
            </a>
          </div>
        </div>
      )}
    </>
  );
}
