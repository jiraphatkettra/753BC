-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "CandyEventStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'RUNNING', 'PAUSED', 'ENDED');

-- CreateEnum
CREATE TYPE "CandyDropStatus" AS ENUM ('ACTIVE', 'CLAIMED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CandyDropSource" AS ENUM ('SCHEDULER', 'ADMIN');

-- CreateEnum
CREATE TYPE "CandyLedgerType" AS ENUM ('DROP_CLAIM', 'ADMIN_GIVE', 'ADMIN_TAKE', 'REDEEM_HOLD', 'REDEEM_REFUND');

-- CreateEnum
CREATE TYPE "CandyRedeemStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CandyCommandStatus" AS ENUM ('PENDING', 'PROCESSING', 'DONE', 'FAILED');

-- CreateTable
CREATE TABLE "candy_events" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "CandyEventStatus" NOT NULL DEFAULT 'DRAFT',
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "budgetTotal" INTEGER NOT NULL DEFAULT 0,
    "budgetReserved" INTEGER NOT NULL DEFAULT 0,
    "budgetClaimed" INTEGER NOT NULL DEFAULT 0,
    "config" JSONB NOT NULL,
    "configVersion" INTEGER NOT NULL DEFAULT 1,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candy_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candy_channels" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "name" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "candy_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candy_drops" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "messageId" TEXT,
    "amount" INTEGER NOT NULL,
    "maxClaimers" INTEGER NOT NULL DEFAULT 1,
    "claimedCount" INTEGER NOT NULL DEFAULT 0,
    "status" "CandyDropStatus" NOT NULL DEFAULT 'ACTIVE',
    "source" "CandyDropSource" NOT NULL DEFAULT 'SCHEDULER',
    "createdBy" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "candy_drops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candy_claims" (
    "id" TEXT NOT NULL,
    "dropId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "discordId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "voiceChannelId" TEXT NOT NULL,
    "voiceSeconds" INTEGER NOT NULL,
    "latencyMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "candy_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candy_wallets" (
    "id" TEXT NOT NULL,
    "discordId" TEXT NOT NULL,
    "username" TEXT,
    "displayName" TEXT,
    "avatar" TEXT,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "totalEarned" INTEGER NOT NULL DEFAULT 0,
    "totalRedeemed" INTEGER NOT NULL DEFAULT 0,
    "claimCount" INTEGER NOT NULL DEFAULT 0,
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "blockReason" TEXT,
    "lastClaimAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candy_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candy_ledger" (
    "id" TEXT NOT NULL,
    "discordId" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "type" "CandyLedgerType" NOT NULL,
    "refType" TEXT,
    "refId" TEXT,
    "reason" TEXT,
    "actor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "candy_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candy_redemptions" (
    "id" TEXT NOT NULL,
    "discordId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "bahtAmount" INTEGER NOT NULL,
    "payoutMethod" TEXT NOT NULL DEFAULT 'PROMPTPAY',
    "payoutTarget" TEXT NOT NULL,
    "accountName" TEXT,
    "status" "CandyRedeemStatus" NOT NULL DEFAULT 'PENDING',
    "rejectReason" TEXT,
    "slipUrl" TEXT,
    "note" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candy_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candy_embed_templates" (
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "payload" JSONB NOT NULL,
    "draft" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isDefault" BOOLEAN NOT NULL DEFAULT true,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "candy_embed_templates_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "candy_embed_revisions" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,
    "note" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "candy_embed_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candy_posted_messages" (
    "id" TEXT NOT NULL,
    "templateKey" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "candy_posted_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candy_commands" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "CandyCommandStatus" NOT NULL DEFAULT 'PENDING',
    "result" JSONB,
    "error" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "doneAt" TIMESTAMP(3),

    CONSTRAINT "candy_commands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candy_settings" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candy_settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "candy_audit_logs" (
    "id" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "candy_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "candy_events_status_idx" ON "candy_events"("status");

-- CreateIndex
CREATE UNIQUE INDEX "candy_channels_eventId_channelId_key" ON "candy_channels"("eventId", "channelId");

-- CreateIndex
CREATE INDEX "candy_drops_eventId_status_idx" ON "candy_drops"("eventId", "status");

-- CreateIndex
CREATE INDEX "candy_drops_status_expiresAt_idx" ON "candy_drops"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "candy_claims_eventId_discordId_idx" ON "candy_claims"("eventId", "discordId");

-- CreateIndex
CREATE INDEX "candy_claims_createdAt_idx" ON "candy_claims"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "candy_claims_dropId_discordId_key" ON "candy_claims"("dropId", "discordId");

-- CreateIndex
CREATE UNIQUE INDEX "candy_wallets_discordId_key" ON "candy_wallets"("discordId");

-- CreateIndex
CREATE INDEX "candy_wallets_totalEarned_idx" ON "candy_wallets"("totalEarned");

-- CreateIndex
CREATE INDEX "candy_ledger_discordId_createdAt_idx" ON "candy_ledger"("discordId", "createdAt");

-- CreateIndex
CREATE INDEX "candy_ledger_refType_refId_idx" ON "candy_ledger"("refType", "refId");

-- CreateIndex
CREATE INDEX "candy_redemptions_discordId_idx" ON "candy_redemptions"("discordId");

-- CreateIndex
CREATE INDEX "candy_redemptions_status_createdAt_idx" ON "candy_redemptions"("status", "createdAt");

-- CreateIndex
CREATE INDEX "candy_embed_templates_category_idx" ON "candy_embed_templates"("category");

-- CreateIndex
CREATE UNIQUE INDEX "candy_embed_revisions_key_version_key" ON "candy_embed_revisions"("key", "version");

-- CreateIndex
CREATE INDEX "candy_posted_messages_templateKey_idx" ON "candy_posted_messages"("templateKey");

-- CreateIndex
CREATE UNIQUE INDEX "candy_posted_messages_channelId_messageId_key" ON "candy_posted_messages"("channelId", "messageId");

-- CreateIndex
CREATE INDEX "candy_commands_status_createdAt_idx" ON "candy_commands"("status", "createdAt");

-- CreateIndex
CREATE INDEX "candy_audit_logs_createdAt_idx" ON "candy_audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "candy_audit_logs_actor_idx" ON "candy_audit_logs"("actor");

-- AddForeignKey
ALTER TABLE "candy_channels" ADD CONSTRAINT "candy_channels_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "candy_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candy_drops" ADD CONSTRAINT "candy_drops_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "candy_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candy_claims" ADD CONSTRAINT "candy_claims_dropId_fkey" FOREIGN KEY ("dropId") REFERENCES "candy_drops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candy_claims" ADD CONSTRAINT "candy_claims_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "candy_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candy_embed_revisions" ADD CONSTRAINT "candy_embed_revisions_key_fkey" FOREIGN KEY ("key") REFERENCES "candy_embed_templates"("key") ON DELETE CASCADE ON UPDATE CASCADE;


-- Partial unique index ensuring at most one active event (RUNNING or PAUSED)
CREATE UNIQUE INDEX IF NOT EXISTS candy_events_single_active
  ON candy_events ((1)) WHERE status IN ('RUNNING','PAUSED');

