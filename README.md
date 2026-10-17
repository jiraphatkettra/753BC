# 753BC — Discord Community Platform

> Official web platform for the **753BC** Discord Community, featuring Discord OAuth2 authentication, voice activity ranking, community event showcases, and server top-up management.

---

## ⚡ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, React 19, TypeScript)
- **Styling**: Tailwind CSS, Vanilla CSS Design System (`tokens.css`)
- **Authentication**: [NextAuth.js v5](https://authjs.dev/) (Discord OAuth2)
- **Database & ORM**: [Prisma ORM](https://www.prisma.io/) with [Supabase PostgreSQL](https://supabase.com/) (Dual connection pooling)
- **Cloud Storage**: Cloudflare R2 (S3-compatible storage for payment slips and event uploads)
- **Icons & UI**: Lucide React, Framer-inspired technical micro-animations

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/jiraphatkettra/753BC.git
cd 753BC
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp .env.example .env
```

Required keys include:
- `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_BOT_TOKEN`, `DISCORD_GUILD_ID`
- `DATABASE_URL`, `DIRECT_URL` (Supabase PostgreSQL)
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`

### 4. Setup Prisma Database
```bash
npx prisma generate
npx prisma db push
```

### 5. Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```text
├── prisma/               # Prisma schema & database migrations
├── public/               # Static assets & promotional graphics
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── api/          # Route handlers (auth, events, upload, topup)
│   │   ├── leaderboard/  # Voice ranking leaderboard page
│   │   ├── login/        # Discord authentication gateway
│   │   ├── topup/        # QR PromptPay & slip verification
│   │   ├── globals.css   # Global design system & keyframe animations
│   │   ├── layout.tsx    # Root layout with InteractiveDotGrid
│   │   └── page.tsx      # Bento Grid Hero section
│   ├── components/       # UI & Feature components
│   │   ├── home/         # HeroHeadline, ScrambleText, EventSlider
│   │   └── shared/       # Navbar, InteractiveDotGrid, AuthProvider
│   ├── lib/              # Prisma client, Discord API, S3 Cloudflare client
│   └── types/            # TypeScript data definitions
└── tokens.css            # Atmospheric engineering color tokens
```

---

## 🔒 License
Private repository for 753BC Discord Community.
