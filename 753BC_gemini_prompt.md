# 753BC — Prompt สำหรับ Gemini: ออกแบบและเขียนหน้า Leaderboard / Topup / Login (v2)

> วิธีใช้: คัดลอกทุกอย่างตั้งแต่ `PROMPT START` ถึง `PROMPT END` ไปวางใน Gemini
> แนบภาพหน้าแรก (screenshot) + `tokens.css`, `globals.css`, `Navbar.tsx`, `app/page.tsx` ไปด้วยจะแม่นที่สุด

---

## PROMPT START

You are a senior product designer and Next.js engineer. Design and implement three new pages for an existing website. They must look like they were built by the same hand as the homepage (screenshot attached). Follow the design grammar below exactly; it was extracted from the real homepage.

### 1. Project context

**753BC Hub** is the official website of the 753BC Discord community (Thai-speaking). Repo: https://github.com/jiraphatkettra/753BC · Live: https://753-bc.vercel.app/

**Stack (do not change):** Next.js 15 (App Router, React 19, TypeScript strict) · Tailwind CSS v4 + tokens in `tokens.css` / `globals.css` · Google Sans + Noto Sans Thai · Lucide React · NextAuth.js v5 (Discord OAuth2) · Supabase PostgreSQL via Prisma 6 · Cloudflare R2 via `@aws-sdk/client-s3` (presigned uploads) · Zustand + TanStack React Query v5.

**Reuse, do not rewrite:** `Navbar.tsx`, `InteractiveDotGrid.tsx`, `HeroHeadline.tsx`.

**Colors:** use only existing CSS variables from `tokens.css` / `globals.css`. Never hardcode hex values. If a needed token is missing, name it and say what to add.

### 2. Homepage design grammar (source of truth)

The homepage is **not** a set of floating rounded cards. It is a **ruled, blueprint-style grid**: one centered frame divided into cells by 1px hairlines, like an engineering drawing. Reproduce this:

**Frame and rules**
- Near-black page background with the faint 20px dot grid showing in the margins.
- A centered container (about 1520px wide at a 1920px viewport) with 1px vertical rules on both outer edges running the full page height.
- Horizontal 1px hairlines cross the full container width and separate every row. Cells are divided by hairlines, with no gaps and no shadows.
- Every cell has about 24px padding. Hairlines are low-contrast gray.
- **Corners are sharp (0–2px radius) on everything:** buttons, chips, icon boxes, images, inputs. Do not use rounded-lg or pill shapes anywhere.

**Section strips (top and bottom of every page)**
- Top strip: `GRID_REF // 00X` on the left, a page code on the right (homepage: `753BC_COMMUNITY`), tiny uppercase mono, muted gray, with a hairline below.
- Bottom strip: `FIG_0X` on the left, a system status on the right (homepage: `SYSTEM_READY`).
- Panels have their own caption row: `■ FIG_01 // SPOTLIGHT` on the left, a mono meta value on the right (for example a date range `15 - 31 OCT`). The `■` is a tiny filled square.

**Status chip**
- A rectangular bordered chip: `■ 753BC // OFFICIAL SERVER | ONLINE`, with the segments divided by a thin vertical bar. Mono uppercase, small.

**Feature cell pattern (use for every info block)**
- Top row: a small bordered **square icon box** (Lucide icon) on the left, an uppercase mono English label right-aligned (`RANKING`, `EVENTS`).
- Below: a bold Thai title, then a muted Thai description at 2 lines max.
- Wide "strip" cells exist as one-liners: an icon, a bold Thai sentence, and a mono label on the right (`COMMUNITY EVENTS`).

**Headline**
- Very large, bold, tight tracking, white. The brand headline is `753BC` / `Discord Server.` on two lines, followed by a muted Thai paragraph. Page titles on new pages use the same style at a smaller size.

**Buttons**
- **Primary:** solid white fill, black text, sharp corners, with an icon on the left and a small `↗` on the right (for example the Discord icon + `เข้าสู่ระบบด้วย Discord ↗`). This is also the "เข้าสู่ระบบ" button in the navbar.
- **Money / topup action:** dark fill with a green 1px border and green text, wallet icon on the left (the navbar "เติมเงิน" button). Green is the only accent color in the system; use it for topup and for success states.
- **Secondary/text:** plain muted text with `↗`, such as `เข้าร่วมดิสคอร์ด ↗`.
- Do **not** use Discord blurple anywhere.

**Tab / stepper pattern (reuse for every selector)**
- A row of small bordered mono tabs like `■ 01 // WELCOME`, `■ 02 // PROMO`, `■ 03 // EVENT`. The active tab is **white-filled with black text**, inactive tabs are outlined and muted. A counter in mono sits at the far right (`[2 / 3]`).
- Use this exact pattern for the leaderboard range selector and the topup stepper.

**Navbar:** logo is the Discord icon + `753BC` + a small bordered `HUB` badge. Links: หน้าแรก (active = bold white), กิจกรรม, ร้านค้า, จัดอันดับ, กฎระเบียบ, ติดต่อสตาฟ. Right side: `เข้าร่วมดิสคอร์ด ↗`, green `เติมเงิน`, white `เข้าสู่ระบบ`.

**Motion:** minimal and precise: sharp on/off caret, scramble text, no bouncy easing, no idle CPU burn.

**Layout rhythm on the homepage:** a 50/50 split below the top strip. Left: status chip → headline → paragraph → two feature cells side by side → one strip cell → CTA row (`button` on the left, `■ SERVER // ONLINE | DISCORD OAUTH2` on the right). Right: a framed spotlight panel with a caption row, the media, arrows, and the tab row. Use 50/50 or 2/3 + 1/3 splits on new pages in the same way.

### 3. Pages to build

UI copy is Thai. System labels stay English mono. Every page uses the top strip, a status chip, a headline, and the bottom strip described above.

---

#### 3.1 `/leaderboard` — จัดอันดับห้องเสียง

Top strip: `GRID_REF // 002` · `VOICE_RANKING`. Status chip: `■ LEADERBOARD // LIVE`.

1. **Header cell (left)** headline `จัดอันดับห้องเสียง`, muted line "สะสมชั่วโมงเวลาพูดคุยในห้องเสียง และนำมาแลกยศกับดิสคอร์ดของเซิร์ฟเวอร์". **Right of it**, the range tabs: `■ 01 // WEEK`, `■ 02 // MONTH`, `■ 03 // ALL_TIME` (Thai captions beneath or in a tooltip: สัปดาห์นี้ / เดือนนี้ / ตลอดกาล).
2. **Stats row**, 3 ruled cells using the feature-cell pattern: `TOTAL_HOURS` ชั่วโมงรวม · `ACTIVE_MEMBERS` สมาชิกที่เคลื่อนไหว · `IN_VOICE_NOW` อยู่ในห้องเสียงตอนนี้ (with a live `■`).
3. **Podium row**, 3 ruled cells in one row, with rank 1 wider than ranks 2 and 3. Each cell: caption `■ RANK_01`, avatar (square-cropped, sharp), name, large mono hours number, role label. Rank 1 is distinguished by a white 1px border or a white `#01` block, **not** a gold gradient.
4. **Ranking table (2/3 width)**, rows separated by hairlines: mono `#04`, avatar, name, role, hours right-aligned in mono, a thin progress line to the next role, weekly delta in mono (`▲ 3`, `▼ 1`, `—`). "โหลดเพิ่ม" secondary button at the bottom.
5. **Side column (1/3 width):**
   - Cell `YOUR_RANK`: logged in → your rank, hours, progress to next role. Logged out → short pitch + the white primary Discord button.
   - Cell `ROLE_LADDER`: vertical list of tiers with required hours (placeholder values in a single editable config file).
6. Bottom strip: `FIG_02 // LAST_SYNC` · relative time.

**States:** skeleton rows, empty ("ยังไม่มีข้อมูลในช่วงนี้"), error with retry.
**Mobile:** cells stack in one column, podium order 1-2-3, tabs scroll horizontally, side cells go above the table, vertical rules stay on the edges.
**Data:** TanStack Query → route handler `/api/leaderboard?range=week|month|all`. Server component for the shell, client component for range switching. Highlight the current user's row.

---

#### 3.2 `/topup` — เติมเงิน (PromptPay)

Top strip: `GRID_REF // 003` · `TOPUP_GATEWAY`. Status chip: `■ PAYMENT // PROMPTPAY`. This page may use the green accent more than others.

**Access:** login required. If logged out, show a single gate cell with the white Discord button; do not render the QR.

**Layout:** 50/50 split. Stepper tabs above: `■ 01 // AMOUNT`, `■ 02 // SCAN`, `■ 03 // SLIP`, counter `[1 / 3]`.
- **Left column:**
  - Cell `01 // AMOUNT`: preset tabs (50 / 100 / 200 / 500 / 1,000) in the active-white tab style, plus a custom input with `฿` prefix and validation (min/max configurable).
  - Cell `03 // SLIP`: dashed-hairline dropzone (sharp corners), image preview, JPG/PNG/WebP ≤ 5 MB, upload through a **presigned R2 URL** from the browser with a progress line. Submit creates a pending record.
- **Right column (sticky):** framed panel with caption `■ FIG_01 // PROMPTPAY_QR` and the amount as meta. Shows the QR (updates live with the amount), account display name, "คัดลอกเลขพร้อมเพย์" button, and one muted instruction line ("เปิดแอปธนาคาร → สแกน → ชำระ → แคปสลิป").
- **After submit:** an inline mono timeline `PENDING → APPROVED | REJECTED` (รอตรวจสอบ → สำเร็จ / ไม่ผ่านพร้อมเหตุผล). `APPROVED` uses the green accent.
- **History cell:** table of past topups (date, amount, status label, slip link).
- Bottom strip: `FIG_02` · `AWAITING_SLIP` / `SYSTEM_READY` depending on step.

**States:** wrong file type, file too large, upload failed + retry, disable submit while uploading.
**Security:** validate type and size server-side when issuing the presigned URL, scope object keys by user id, store the amount server-side.

---

#### 3.3 `/login` — เข้าสู่ระบบ

Top strip: `GRID_REF // 004` · `AUTH_GATEWAY`.

**Desktop:** 50/50 split like the homepage.
- **Left:** status chip `■ DISCORD OAUTH2 | READY`, headline `เข้าสู่ระบบ`, muted paragraph, and **three strip cells** (icon + bold Thai line + mono label on the right): `RANKING` ดูอันดับและชั่วโมงของคุณ · `ROLES` แลกยศอัตโนมัติ · `TOPUP` เติมเงินและติดตามสถานะ.
- **Right:** framed panel, caption `■ FIG_01 // SIGN_IN`, containing the **white primary button** `เข้าสู่ระบบด้วย Discord ↗` (full width), one muted privacy line ("เราอ่านเฉพาะชื่อและรูปโปรไฟล์ของคุณ"), and a text link `← กลับหน้าแรก`.
- Bottom strip: `FIG_02` · `SYSTEM_READY`.

**States:** loading state on the button after click; error cell above the button reading `?error=` (`AccessDenied`, `OAuthCallback`, default) with friendly Thai text and a mono error code; if already signed in, redirect to `/`; honor `callbackUrl`.
**Mobile:** single column, headline above the panel.

### 4. Cross-cutting requirements

- Accessibility: WCAG AA contrast, visible focus rings (sharp, 1px offset), keyboard-operable tabs and dropzone, `aria-live` for upload/status changes, respect `prefers-reduced-motion`.
- Performance: server components by default, `"use client"` only where needed, no new heavy dependencies. Name and justify any library (for example a PromptPay payload generator) before using it.
- Responsive: mobile-first, verify at 768px and 1280px+.
- Thai typography: body line-height ≥ 1.6, no broken Thai word wraps.
- Build a small shared set of primitives so pages stay consistent: `PageFrame` (rules + container), `SectionStrip` (top/bottom labels), `StatusChip`, `FeatureCell`, `TabRow`, `CaptionRow`, `Button` (primary / money / text). Place them in `components/ui/`.
- Do not modify the homepage, `HeroHeadline`, or `InteractiveDotGrid`. `Navbar` may only get active-state fixes.

### 5. Output format

1. A short **design rationale** (max 10 lines).
2. The **file tree** of everything created or changed.
3. **Full code for each file**, one fenced block per file with its path as a heading. No "..." placeholders.
4. Any **Prisma schema additions** (for example `Topup` with a status enum, `VoiceStat`) plus the `npx prisma db push` reminder.
5. A **checklist** of manual steps (R2 env vars, PromptPay ID, role thresholds config).

If something is ambiguous, state your assumption in one line and continue. Do not stop to ask questions.

## PROMPT END

---

## หมายเหตุสำหรับตัวคุณเอง (ไม่ต้องวางใน Gemini)

- ค่าชั่วโมงของบันไดยศและยอดเติมเงินขั้นต่ำ/สูงสุดเป็นค่าสมมติ ให้แก้ตามจริง
- ถ้า Gemini ตอบมามีมุมโค้งมน หรือใช้สีฟ้า Discord ให้บอกว่า "ทุกอย่างมุมคม และปุ่มหลักเป็นสีขาว ตาม screenshot"
- เมนู กิจกรรม / ร้านค้า / กฎระเบียบ / ติดต่อสตาฟ ยังลิงก์ไปดิสคอร์ด ไม่ได้รวมในพรอมต์นี้
