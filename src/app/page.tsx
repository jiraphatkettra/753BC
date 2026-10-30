import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Trophy, Calendar, Sparkles, Clock, Flame, ChevronRight, Shield, Bot, Wallet, ShoppingBag } from "lucide-react";
import HeroEventSlider from "@/components/home/HeroEventSlider";
import HeroHeadline from "@/components/home/HeroHeadline";
import CandyEventHeroSection from "@/components/home/CandyEventHeroSection";
import { COMMUNITY_EVENTS } from "@/config/events";
import RuleAssistantWidget from "@/components/rules/RuleAssistantWidget";
import { auth } from "@/lib/auth";

export const metadata = {
  title: "753BC — Discord Community Hub",
  description:
    "ยินดีต้อนรับเข้าสู่เว็บไซต์อย่างเป็นทางการของ 753BC ที่จะช่วยให้คุณไม่พลาดทุกกิจกรรม และข่าวสารต่างๆจากดิสคอร์ด",
};

export default async function Home() {
  const session = await auth();
  return (
    <div className="min-h-[calc(100vh-64px)] bg-transparent text-white overflow-x-clip relative selection:bg-white/20 flex flex-col justify-start pt-6 sm:pt-8 md:pt-10 pb-16">

      {/* ================= Raycast Visible Borders Hero Section ================= */}
      <section className="relative w-full flex justify-center">

        {/* Central Bento Grid Container (Max-w-7xl, Perfectly Centered on X-axis) */}
        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">



          {/* ================= CONTINUOUS VERTICAL LINES LAYER ================= */}
          {/* Spans from -top-8 to -bottom-10 with smooth top & bottom fade */}
          <div className="pointer-events-none absolute -top-8 -bottom-10 left-4 sm:left-6 lg:left-8 right-4 sm:right-6 lg:right-8 [mask-image:linear-gradient(to_bottom,transparent_0%,black_32px,black_calc(100%-40px),transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,black_32px,black_calc(100%-40px),transparent_100%)] z-10">

            {/* V1: Left Vertical Line (shoots down from TOP) */}
            <div
              className="absolute left-0 top-0 bottom-0 w-[1px] bg-white/[0.1] circuit-top"
              style={{ animationDelay: "0ms" }}
            />

            {/* V2: Middle Vertical Line (THE RED LINE - perfectly at 50% center X-axis, shoots UP from BOTTOM) */}
            <div
              className="hidden lg:block absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[1px] bg-white/[0.1] circuit-bottom"
              style={{ animationDelay: "0ms" }}
            />

            {/* V3: Right Vertical Line (shoots down from TOP) */}
            <div
              className="absolute right-0 top-0 bottom-0 w-[1px] bg-white/[0.1] circuit-top"
              style={{ animationDelay: "0ms" }}
            />
          </div>

          {/* ================= MAIN BENTO GRID FRAME ================= */}
          <div className="relative w-full bg-[#070809]">

            {/* Line 1: Top Closing Line (above GRID_REF) */}
            <div className="relative h-[1px]">
              <div
                className="w-full h-[1px] bg-white/[0.1] circuit-left"
                style={{ animationDelay: "0ms" }}
              />
              <div
                className="hidden md:block pointer-events-none absolute right-full top-0 w-[420px] h-[1px] bg-gradient-to-l from-white/[0.1] to-transparent circuit-right"
                style={{ animationDelay: "0ms" }}
              />
              <div
                className="hidden md:block pointer-events-none absolute left-full top-0 w-[420px] h-[1px] bg-gradient-to-r from-white/[0.1] to-transparent circuit-left"
                style={{ animationDelay: "0ms" }}
              />
            </div>

            {/* Top Technical Guide Row (GRID_REF // 001) - 50/50 Balanced Split */}
            <div className="grid grid-cols-1 lg:grid-cols-2 h-7 sm:h-8 relative text-[10px] font-mono text-neutral-500 uppercase tracking-widest select-none">
              <div className="px-5 flex items-center">
                <span className="anim-fade-in" style={{ animationDelay: "500ms" }}>
                  GRID_REF // 001
                </span>
              </div>
              <div className="hidden lg:flex px-5 items-center justify-end">
                <span className="anim-fade-in" style={{ animationDelay: "550ms" }}>
                  753BC_COMMUNITY
                </span>
              </div>
            </div>

            {/* Line 2: Divider below GRID_REF */}
            <div className="relative h-[1px]">
              <div
                className="w-full h-[1px] bg-white/[0.1] circuit-right"
                style={{ animationDelay: "0ms" }}
              />
              <div
                className="hidden md:block pointer-events-none absolute right-full top-0 w-[420px] h-[1px] bg-gradient-to-l from-white/[0.1] to-transparent circuit-right"
                style={{ animationDelay: "0ms" }}
              />
              <div
                className="hidden md:block pointer-events-none absolute left-full top-0 w-[420px] h-[1px] bg-gradient-to-r from-white/[0.1] to-transparent circuit-left"
                style={{ animationDelay: "0ms" }}
              />
            </div>

            {/* Main 2-Column Bento Grid Row (Balanced 50/50 Split) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 relative">

              {/* Left Column (50%): Modern Tech Bento Layout (Sharp Precision) */}
              <div className="flex flex-col justify-between relative">

                {/* Bento Box 1: Brand & Headline */}
                <div className="relative p-5 sm:p-7 lg:p-8 flex-1">
                  {/* Status Indicator Chip (Sharp Blueprint Style) */}
                  <div
                    className="inline-flex items-center gap-2 px-2.5 py-1 bg-white/[0.04] border border-white/[0.08] text-[10px] font-mono text-neutral-300 mb-4 tracking-wider anim-fade-in"
                    style={{ animationDelay: "550ms" }}
                  >
                    <span className="w-1.5 h-1.5 bg-white/70 animate-pulse" />
                    753BC // OFFICIAL SERVER
                    <span className="text-neutral-600">|</span>
                    <span className="text-neutral-400">ONLINE</span>
                  </div>

                  {/* Main Headline & Coordinated Subtitle Description */}
                  <HeroHeadline />

                  {/* Line 3: Single Line under Headline */}
                  <div
                    className="pointer-events-none absolute left-0 right-0 bottom-0 h-[1px] bg-white/[0.1] circuit-left z-20"
                    style={{ animationDelay: "0ms" }}
                  />
                  {/* Left extension: exactly 420px smooth fade */}
                  <div
                    className="hidden md:block pointer-events-none absolute right-full bottom-0 w-[420px] h-[1px] bg-gradient-to-l from-white/[0.1] to-transparent circuit-right z-20"
                    style={{ animationDelay: "0ms" }}
                  />
                </div>

                {/* Bento Box 2: Modular Feature Sub-Grid (Sharp Tech Corners) */}
                <div className="relative">

                  {/* Sub-grid of 2 feature compartments */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 relative">

                    {/* Sub-Card 1: Voice Ranking */}
                    <div
                      className="p-4 sm:p-5 relative sm:border-r border-white/[0.08] group hover:bg-white/[0.02] transition-colors anim-fade-up"
                      style={{ animationDelay: "800ms" }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-7 h-7 bg-white/[0.05] border border-white/[0.1] flex items-center justify-center text-white/80 group-hover:text-white transition-colors">
                          <Trophy className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[10px] font-mono text-neutral-500 tracking-wider">RANKING</span>
                      </div>
                      <div className="text-xs sm:text-[13px] font-semibold text-white/90 group-hover:text-white transition-colors">
                        จัดอันดับห้องเสียง
                      </div>
                      <p className="text-[11px] text-neutral-400 leading-relaxed mt-1">
                        สะสมชั่วโมงเวลาพูดคุยในห้องเสียง และนำมาแลกยศกับดิสคอร์ดของเซิร์ฟเวอร์
                      </p>
                    </div>

                    {/* Sub-Card 2: Community Events */}
                    <div
                      className="p-4 sm:p-5 relative group hover:bg-white/[0.02] transition-colors anim-fade-up"
                      style={{ animationDelay: "850ms" }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-7 h-7 bg-white/[0.05] border border-white/[0.1] flex items-center justify-center text-white/80 group-hover:text-white transition-colors">
                          <Calendar className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[10px] font-mono text-neutral-500 tracking-wider">EVENTS</span>
                      </div>
                      <div className="text-xs sm:text-[13px] font-semibold text-white/90 group-hover:text-white transition-colors">
                        กิจกรรมชิงรางวัล
                      </div>
                      <p className="text-[11px] text-neutral-400 leading-relaxed mt-1">
                        ร่วมกิจกรรมต่างๆของเซิร์ฟเวอร์ เพื่อลุ้นรับเงินรางวัลและยศสุดพิเศษ
                      </p>
                    </div>
                  </div>

                  {/* Sub-Card 3: Community Rewards Strip */}
                  <div
                    className="border-t border-white/[0.08] px-4 sm:px-5 py-2.5 flex flex-col xs:flex-row items-start xs:items-center justify-between gap-1.5 bg-white/[0.01] anim-fade-up"
                    style={{ animationDelay: "900ms" }}
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-white/80 shrink-0" />
                      <span className="text-[11px] text-neutral-300 font-medium">
                        กิจกรรมคอมมูนิตี้ &amp; ลุ้นรับรางวัลพิเศษประจำเซิร์ฟเวอร์
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider shrink-0">
                      COMMUNITY EVENTS
                    </span>
                  </div>

                  {/* Line 4: Single Line under Feature Bento */}
                  <div
                    className="pointer-events-none absolute left-0 right-0 bottom-0 h-[1px] bg-white/[0.1] circuit-right z-20"
                    style={{ animationDelay: "0ms" }}
                  />
                  {/* Left extension: exactly 420px smooth fade */}
                  <div
                    className="hidden md:block pointer-events-none absolute right-full bottom-0 w-[420px] h-[1px] bg-gradient-to-l from-white/[0.1] to-transparent circuit-right z-20"
                    style={{ animationDelay: "0ms" }}
                  />
                </div>

                {/* Bento Box 3: Modern Action & Auth Dock (Sharp Edges - Responsive) */}
                <div className="relative py-3.5 px-4 sm:px-7 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  {session?.user ? (
                    <div className="flex flex-wrap items-center gap-2.5">
                      <Link
                        href="/topup"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-400 text-black font-semibold text-xs sm:text-sm hover:bg-emerald-300 transition-colors duration-150 active:scale-[0.98] border border-emerald-400 whitespace-nowrap min-h-[42px]"
                      >
                        <Wallet className="w-4 h-4 text-black" />
                        <span>เติมเงินกระเป๋า</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                      <Link
                        href="/shop"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white/[0.04] text-white font-medium text-xs sm:text-sm hover:bg-white/[0.08] border border-white/[0.1] transition-colors duration-150 active:scale-[0.98] whitespace-nowrap min-h-[42px]"
                      >
                        <ShoppingBag className="w-4 h-4 text-neutral-400" />
                        <span>ร้านค้าคอมมูนิตี้</span>
                      </Link>
                    </div>
                  ) : (
                    <Link
                      href="/login"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-black font-semibold text-xs sm:text-sm hover:bg-neutral-200 transition-colors duration-150 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2 whitespace-nowrap border border-white shadow-[0_0_20px_rgba(255,255,255,0.08)] group anim-fade-up min-h-[42px]"
                      style={{ animationDelay: "950ms" }}
                    >
                      <svg className="w-4 h-4 text-black fill-current" viewBox="0 0 24 24">
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                      </svg>
                      <span>เข้าสู่ระบบด้วย Discord</span>
                      <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </Link>
                  )}

                  <div
                    className="flex items-center justify-center xs:justify-start gap-2 text-xs text-neutral-400 anim-fade-up select-none font-sans"
                    style={{ animationDelay: "1000ms" }}
                  >
                    <span className="w-1.5 h-1.5 bg-emerald-400 animate-pulse" />
                    {session?.user ? (
                      <>
                        <span className="text-white font-semibold truncate max-w-[140px] sm:max-w-[200px]">
                          {session.user.name || "MEMBER"}
                        </span>
                        <span className="text-neutral-600">|</span>
                        <span className="text-emerald-400 font-medium">ACTIVE</span>
                      </>
                    ) : (
                      <>
                        <span className="text-neutral-300">SERVER // ONLINE</span>
                        <span className="text-neutral-600">|</span>
                        <span className="text-neutral-500">OAUTH2</span>
                      </>
                    )}
                  </div>
                </div>

              </div>

              {/* Right Column (50%): Dynamic Event Carousel with Deep Edge-Fade */}
              <div className="relative flex items-center justify-center overflow-hidden min-h-[360px] sm:min-h-[400px] lg:min-h-[440px]">
                <HeroEventSlider />
              </div>

            </div>

            {/* Line 5: Divider above FIG_02 */}
            <div className="relative h-[1px]">
              <div
                className="w-full h-[1px] bg-white/[0.1] circuit-left"
                style={{ animationDelay: "0ms" }}
              />
              <div
                className="hidden md:block pointer-events-none absolute right-full top-0 w-[420px] h-[1px] bg-gradient-to-l from-white/[0.1] to-transparent circuit-right"
                style={{ animationDelay: "0ms" }}
              />
              <div
                className="hidden md:block pointer-events-none absolute left-full top-0 w-[420px] h-[1px] bg-gradient-to-r from-white/[0.1] to-transparent circuit-left"
                style={{ animationDelay: "0ms" }}
              />
            </div>

            {/* Bottom Technical Guide Row (FIG_02) - 50/50 Balanced Split */}
            <div className="grid grid-cols-1 lg:grid-cols-2 h-7 sm:h-8 relative text-[10px] font-mono text-neutral-500 uppercase tracking-widest select-none">
              <div className="px-5 flex items-center">
                <span className="anim-fade-in" style={{ animationDelay: "550ms" }}>
                  FIG_02
                </span>
              </div>
              <div className="hidden lg:flex px-5 items-center justify-end">
                <span className="anim-fade-in" style={{ animationDelay: "600ms" }}>
                  SYSTEM_READY
                </span>
              </div>
            </div>

            {/* Line 6: Bottom Closing Line below FIG_02 */}
            <div className="relative h-[1px]">
              <div
                className="w-full h-[1px] bg-white/[0.1] circuit-right"
                style={{ animationDelay: "0ms" }}
              />
              <div
                className="hidden md:block pointer-events-none absolute right-full top-0 w-[420px] h-[1px] bg-gradient-to-l from-white/[0.1] to-transparent circuit-right"
                style={{ animationDelay: "0ms" }}
              />
              <div
                className="hidden md:block pointer-events-none absolute left-full top-0 w-[420px] h-[1px] bg-gradient-to-r from-white/[0.1] to-transparent circuit-left"
                style={{ animationDelay: "0ms" }}
              />
            </div>

          </div>

        </div>
      </section>

      {/* ================= Halloween Candy Event Spotlight Hero Section ================= */}
      <CandyEventHeroSection />

      {/* ================= Featured Events Section ================= */}
      <section className="relative w-full flex justify-center mt-12 sm:mt-16 md:mt-20">
        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Continuous vertical guide lines layer for Section 2 */}
          <div className="pointer-events-none absolute -top-8 -bottom-10 left-4 sm:left-6 lg:left-8 right-4 sm:right-6 lg:right-8 [mask-image:linear-gradient(to_bottom,transparent_0%,black_32px,black_calc(100%-40px),transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,black_32px,black_calc(100%-40px),transparent_100%)] z-10">
            <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-white/[0.08]" />
            <div className="hidden lg:block absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[1px] bg-white/[0.08]" />
            <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-white/[0.08]" />
          </div>

          {/* Section Frame Container */}
          <div className="relative w-full bg-[#070809] border border-white/[0.1]">

            {/* Top Technical Guide Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 h-8 sm:h-9 relative text-[10px] font-mono text-neutral-500 uppercase tracking-widest select-none border-b border-white/[0.08]">
              <div className="px-5 sm:px-7 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-400" />
                <span>GRID_REF // 002</span>
                <span className="text-neutral-700">/</span>
                <span className="text-neutral-400">FEATURED_CAMPAIGNS</span>
              </div>
              <div className="hidden lg:flex px-5 sm:px-7 items-center justify-end">
                <span>COMMUNITY_ACTIVE // 753BC</span>
              </div>
            </div>

            {/* Section Heading & Link to /events */}
            <div className="p-5 sm:p-8 md:p-10 border-b border-white/[0.08] flex flex-col md:flex-row md:items-end justify-between gap-5">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-white/[0.04] border border-white/[0.08] text-[10px] font-mono text-neutral-300 mb-3 tracking-wider">
                  <span className="w-1.5 h-1.5 bg-white/70 animate-pulse" />
                  EVENTS &amp; CAMPAIGNS
                  <span className="text-neutral-600">|</span>
                  <span className="text-emerald-400">OCTOBER SPECIAL</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                  <span>กิจกรรมเด่นประจำเซิร์ฟเวอร์</span>
                </h2>
                <p className="text-xs sm:text-sm text-neutral-400 mt-2 max-w-xl leading-relaxed">
                  ร่วมสนุก แข่งขันชิงรางวัล และสะสมยศสุดเอ็กซ์คลูซีฟในดิสคอร์ด 753BC ทุกกิจกรรมมีรางวัลและสิทธิพิเศษรอคุณอยู่
                </p>
              </div>

              <Link
                href="/events"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.15] hover:border-white/30 transition-colors duration-150 active:scale-[0.98] w-full sm:w-auto self-start md:self-end whitespace-nowrap group min-h-[40px]"
              >
                <span>ดูกิจกรรมทั้งหมด</span>
                <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>

            {/* 2-Column Responsive Event Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.08]">
              {COMMUNITY_EVENTS.map((event) => (
                <div
                  key={event.id}
                  className="p-4 sm:p-7 md:p-8 flex flex-col justify-between hover:bg-white/[0.01] transition-colors"
                >
                  <div>
                    {/* Top Status & Date Header */}
                    <div className="flex items-center justify-between gap-2 mb-4 text-[11px] font-mono">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-white/[0.06] border border-white/[0.1] text-white font-semibold">
                          {event.badge}
                        </span>
                        <span className="text-neutral-500">//</span>
                        <span className="text-neutral-400 hidden sm:inline">{event.tagline}</span>
                      </div>
                      <div>
                        {event.status === "active" ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                            {event.statusLabel}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/30">
                            <Clock className="w-2.5 h-2.5" />
                            {event.statusLabel}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Banner Image Container (Clean 16:9, no overlapping text) */}
                    <Link
                      href={`/events#${event.slug}`}
                      className="block relative w-full aspect-[16/9] border border-white/[0.1] overflow-hidden bg-black/50 mb-5 group cursor-pointer"
                    >
                      <Image
                        src={event.image}
                        alt={event.title}
                        fill
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className="object-contain object-center group-hover:scale-[1.02] transition-transform duration-500"
                      />
                    </Link>

                    {/* Title and Date */}
                    <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 mb-2">
                      <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                      <span>{event.periodText}</span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight mb-2">
                      <Link
                        href={`/events#${event.slug}`}
                        className="hover:text-neutral-200 transition-colors"
                      >
                        {event.title}
                      </Link>
                    </h3>
                    <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed mb-5">
                      {event.summary}
                    </p>

                    {/* Rewards Summary Box (Proper padding, no text overlaps) */}
                    <div className="p-3.5 bg-white/[0.02] border border-white/[0.08] mb-6">
                      <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Trophy className="w-3 h-3 text-amber-400" />
                        <span>ไฮไลท์รางวัลกิจกรรม</span>
                      </div>
                      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2">
                        {event.rewards.map((r, rIdx) => (
                          <div
                            key={rIdx}
                            className={`p-2 border text-left ${
                              r.isGrand
                                ? "bg-amber-500/[0.05] border-amber-500/30"
                                : "bg-white/[0.02] border-white/[0.06]"
                            }`}
                          >
                            <div className="text-[9px] font-mono text-neutral-400">{r.label}</div>
                            <div className="text-xs sm:text-sm font-bold text-white truncate">
                              {r.value}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-4 border-t border-white/[0.08] flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-3">
                    <Link
                      href={`/events#${event.slug}`}
                      className="inline-flex items-center justify-center xs:justify-start gap-1.5 text-xs text-neutral-300 hover:text-white transition-colors duration-150 font-medium py-1.5"
                    >
                      <span>รายละเอียดเพิ่มเติม</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>

                    <a
                      href={event.discordUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-black bg-white hover:bg-neutral-200 transition-colors duration-150 active:scale-[0.98] border border-white whitespace-nowrap shadow-sm min-h-[38px]"
                    >
                      <Flame className="w-3 h-3 text-black" />
                      <span>เข้าร่วมใน Discord</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Technical Guide Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 h-8 sm:h-9 relative text-[10px] font-mono text-neutral-500 uppercase tracking-widest select-none border-t border-white/[0.08]">
              <div className="px-5 sm:px-7 flex items-center">
                <span>GRID_REF // 002_END</span>
              </div>
              <div className="hidden lg:flex px-5 sm:px-7 items-center justify-end">
                <span>SYSTEM_READY</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ================= Gemini AI Rule Assistant Section (AI Only on Home) ================= */}
      <section className="relative w-full flex justify-center mt-12 sm:mt-16 md:mt-20">
        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Continuous vertical guide lines layer for Section 3 */}
          <div className="pointer-events-none absolute -top-8 -bottom-10 left-4 sm:left-6 lg:left-8 right-4 sm:right-6 lg:right-8 [mask-image:linear-gradient(to_bottom,transparent_0%,black_32px,black_calc(100%-40px),transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,black_32px,black_calc(100%-40px),transparent_100%)] z-10">
            <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-white/[0.08]" />
            <div className="hidden lg:block absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[1px] bg-white/[0.08]" />
            <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-white/[0.08]" />
          </div>

          {/* Section Frame Container */}
          <div className="relative w-full bg-[#070809] border border-white/[0.1]">

            {/* Top Technical Guide Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 h-8 sm:h-9 relative text-[10px] font-mono text-neutral-500 uppercase tracking-widest select-none border-b border-white/[0.08]">
              <div className="px-5 sm:px-7 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-400" />
                <span>GRID_REF // 003</span>
                <span className="text-neutral-700">/</span>
                <span className="text-neutral-400">RULE_SENTINEL_AI</span>
              </div>
              <div className="hidden lg:flex px-5 sm:px-7 items-center justify-end">
                <span>GEMINI_FLASH // MULTI_TOKEN_FAILOVER</span>
              </div>
            </div>

            {/* Section Heading & Link to /rules */}
            <div className="p-5 sm:p-8 md:p-10 border-b border-white/[0.08] flex flex-col md:flex-row md:items-end justify-between gap-5">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-white/[0.04] border border-white/[0.08] text-[10px] font-mono text-neutral-300 mb-3 tracking-wider">
                  <span className="w-1.5 h-1.5 bg-white/70 animate-pulse" />
                  AI ASSISTANT
                  <span className="text-neutral-600">|</span>
                  <span className="text-emerald-400">STRICT FACT-BASED</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                  <span>ถาม-ตอบกฎระเบียบเซิร์ฟเวอร์ด้วย AI</span>
                </h2>
                <p className="text-xs sm:text-sm text-neutral-400 mt-2 max-w-xl leading-relaxed">
                  สงสัยข้อกฎ หรือต้องการตรวจสอบสถานการณ์จำลอง สามารถพิมพ์ถาม AI ได้ทันที ระบบจะวิเคราะห์และตอบเฉพาะตามกฎจริงอย่างเที่ยงตรง
                </p>
              </div>

              <Link
                href="/rules"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.15] hover:border-white/30 transition-colors duration-150 active:scale-[0.98] w-full sm:w-auto self-start md:self-end whitespace-nowrap group min-h-[40px]"
              >
                <span>อ่านกฎระเบียบฉบับเต็ม</span>
                <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>

            {/* Widget Container */}
            <div className="p-3 sm:p-6 md:p-8">
              <RuleAssistantWidget compact={true} showLinkToFullRules={true} />
            </div>

            {/* Bottom Technical Guide Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 h-8 sm:h-9 relative text-[10px] font-mono text-neutral-500 uppercase tracking-widest select-none border-t border-white/[0.08]">
              <div className="px-5 sm:px-7 flex items-center">
                <span>GRID_REF // 003_END</span>
              </div>
              <div className="hidden lg:flex px-5 sm:px-7 items-center justify-end">
                <span>AI_ENGINE_ONLINE</span>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
