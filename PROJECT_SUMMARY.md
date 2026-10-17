# 753BC Community Web Platform — AI Context Summary

## 1. Overview
Web platform for the **753BC** Discord Community. Built with a dark, high-precision Raycast/Linear-style Bento Grid design.

- **Repository**: [https://github.com/jiraphatkettra/753BC](https://github.com/jiraphatkettra/753BC)
- **Primary Pages**:
  - `/` — Homepage: Bento Grid Hero, Scramble headline, Thai Typewriter loop, Event carousel.
  - `/leaderboard` — Voice channel ranking and voice hours leaderboard.
  - `/topup` — PromptPay QR code donation & payment slip upload.
  - `/login` — Discord OAuth2 authentication gateway.

---

## 2. Tech Stack
- **Framework**: Next.js 15 (App Router, React 19, TypeScript)
- **Styling**: Tailwind CSS v4 + Design tokens (`tokens.css`, `src/app/globals.css`)
- **Fonts**: Google Sans + Noto Sans Thai
- **Icons**: Lucide React
- **Auth**: NextAuth.js v5 (Auth.js Beta) with Discord OAuth2 provider
- **Database**: Supabase PostgreSQL via Prisma ORM v6 (Dual-connection: 6543 pooler / 5432 direct)
- **Storage**: Cloudflare R2 via `@aws-sdk/client-s3` (Presigned URL slip uploads, zero egress fees)
- **Client State & Fetching**: Zustand + TanStack React Query v5

---

## 3. Key Components & Implementation Details
- `src/components/shared/InteractiveDotGrid.tsx`:
  - HTML5 Canvas background dot matrix.
  - Denser 20px grid, faint 0.065 base alpha, 0.8px radius.
  - Soft hover illumination (~0.30 alpha) without 3D bulging/magnification. 0% idle CPU.
- `src/components/home/HeroHeadline.tsx`:
  - `ScrambleText` ("Discord Server.") with callback on complete.
  - `Typewriter` using `Intl.Segmenter` for Thai characters to prevent floating tone mark glitches.
  - 6.5s reading pause -> backspace deletion -> 0.5s pause -> re-typing loop.
  - Crisp on/off terminal caret (`terminal-caret-blink`, no opacity fading).
- `src/components/shared/Navbar.tsx`:
  - Sticky glassmorphic navbar with active route indicator, user profile avatar, and Discord session handling.

---

## 4. Environment Variables (.env)
```env
# Discord
DISCORD_TOKEN=...
DISCORD_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...
DISCORD_GUILD_ID=...
DISCORD_BOT_TOKEN=...

# Supabase PostgreSQL
DATABASE_URL="postgresql://...pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://...supabase.com:5432/postgres"

# NextAuth v5
NEXTAUTH_SECRET=...
NEXTAUTH_URL="http://localhost:3000"
AUTH_SECRET=...
AUTH_TRUST_HOST="true"

# Cloudflare R2
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
R2_PUBLIC_URL=...
R2_PUBLIC_DOMAIN=...
```

---

## 5. Development Commands
- `npm run dev` — Run local dev server (`http://localhost:3000`)
- `npm run build` — Build production bundle
- `npx prisma db push` — Push schema to Supabase
- `npx prisma generate` — Generate Prisma Client
- `npx tsc --noEmit` — Type check without compilation
