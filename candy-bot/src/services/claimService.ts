import { ButtonInteraction, Guild } from "discord.js";
import prisma from "@candy/shared";
import { client } from "../client";
import { eventService } from "./eventService";
import { voiceTracker } from "./voiceTracker";
import { embedService } from "./embedService";

class ClaimService {
  private userLastClick: Map<string, number> = new Map();
  private updateDebounce: Map<string, NodeJS.Timeout> = new Map();

  async handleClaimInteraction(interaction: ButtonInteraction, dropId: string) {
    const userId = interaction.user.id;
    const guild = interaction.guild;
    const now = Date.now();

    // 1. Check Event Status
    const event = await eventService.getActiveEvent();
    if (!event || event.status !== "RUNNING") {
      const rendered = embedService.render("candy_err_event_not_running", { user: `<@${userId}>` }, 0, { userId });
      return interaction.editReply(rendered);
    }

    const config = await eventService.getConfig();
    const claimCfg = config.claim;

    // 2. Cooldown check per user
    const lastClick = this.userLastClick.get(userId) || 0;
    if (claimCfg.perUserCooldownSec > 0 && now - lastClick < claimCfg.perUserCooldownSec * 1000) {
      const remainingSec = Math.ceil((claimCfg.perUserCooldownSec * 1000 - (now - lastClick)) / 1000);
      const rendered = embedService.render("candy_err_cooldown", { user: `<@${userId}>`, cooldownSec: remainingSec }, 0, { userId });
      return interaction.editReply(rendered);
    }
    this.userLastClick.set(userId, now);

    // 3. Check Wallet Block
    const wallet = await prisma.candyWallet.findUnique({ where: { discordId: userId } });
    if (wallet?.blocked) {
      const rendered = embedService.render("candy_err_blocked", { user: `<@${userId}>` }, 0, { userId });
      return interaction.editReply(rendered);
    }

    // 4. Check Per-User Max Total Cap
    if (claimCfg.perUserMaxTotal && wallet && wallet.totalEarned >= claimCfg.perUserMaxTotal) {
      const rendered = embedService.render("candy_err_cap_reached", { user: `<@${userId}>`, cap: claimCfg.perUserMaxTotal }, 0, { userId });
      return interaction.editReply(rendered);
    }

    // 5. 🔒 VOICE CHECK
    if (claimCfg.requireVoice && guild) {
      const vs = voiceTracker.getVoiceState(guild, userId);

      if (!vs.inVoice) {
        const rendered = embedService.render("candy_err_not_in_voice", { user: `<@${userId}>` }, 0, { userId });
        return interaction.editReply(rendered);
      }

      if (claimCfg.excludeAfkChannel && vs.isAfk) {
        const rendered = embedService.render("candy_err_voice_afk", { user: `<@${userId}>` }, 0, { userId });
        return interaction.editReply(rendered);
      }

      if (claimCfg.allowedVoiceChannelIds.length > 0 && vs.channelId && !claimCfg.allowedVoiceChannelIds.includes(vs.channelId)) {
        const rendered = embedService.render("candy_err_voice_not_allowed", { user: `<@${userId}>` }, 0, { userId });
        return interaction.editReply(rendered);
      }

      if (claimCfg.requireNotDeafened && vs.isDeafened) {
        const rendered = embedService.render("candy_err_voice_deafened", { user: `<@${userId}>` }, 0, { userId });
        return interaction.editReply(rendered);
      }

      if (vs.secondsInVoice < claimCfg.minVoiceSeconds) {
        const remaining = claimCfg.minVoiceSeconds - vs.secondsInVoice;
        const rendered = embedService.render(
          "candy_err_voice_too_short",
          { user: `<@${userId}>`, minVoiceSeconds: claimCfg.minVoiceSeconds, remainingVoiceSec: remaining },
          0,
          { userId }
        );
        return interaction.editReply(rendered);
      }
    }

    // 6. ATOMIC TRANSACTION
    try {
      const claimResult = await prisma.$transaction(async (tx) => {
        // a) Claim drop slot
        const updatedDrops: any[] = await tx.$queryRawUnsafe(
          `
          UPDATE candy_drops
             SET "claimedCount" = "claimedCount" + 1,
                 status = CASE WHEN "claimedCount" + 1 >= "maxClaimers" THEN 'CLAIMED'::"CandyDropStatus" ELSE status END,
                 "closedAt" = CASE WHEN "claimedCount" + 1 >= "maxClaimers" THEN NOW() ELSE "closedAt" END
           WHERE id = $1 AND status = 'ACTIVE' AND "expiresAt" > NOW() AND "claimedCount" < "maxClaimers"
           RETURNING id, amount, "maxClaimers", "claimedCount", status, "channelId", "messageId", "createdAt";
        `,
          dropId
        );

        if (!updatedDrops || updatedDrops.length === 0) {
          // Check why: was it already claimed by this user?
          const existingUserClaim = await tx.candyClaim.findUnique({
            where: { dropId_discordId: { dropId, discordId: userId } },
          });
          if (existingUserClaim) {
            return { error: "ALREADY_CLAIMED" };
          }
          return { error: "TOO_LATE" };
        }

        const drop = updatedDrops[0];
        const latencyMs = Math.max(0, Date.now() - new Date(drop.createdAt).getTime());
        const voiceState = guild ? voiceTracker.getVoiceState(guild, userId) : { secondsInVoice: 0, channelId: "unknown" };

        // b) Insert claim record
        try {
          await tx.candyClaim.create({
            data: {
              dropId: drop.id,
              eventId: event.id,
              discordId: userId,
              amount: drop.amount,
              voiceChannelId: voiceState.channelId || "unknown",
              voiceSeconds: voiceState.secondsInVoice,
              latencyMs,
            },
          });
        } catch (constraintErr: any) {
          if (constraintErr.code === "P2002") {
            return { error: "ALREADY_CLAIMED" };
          }
          throw constraintErr;
        }

        // c) Upsert wallet
        const currentWallet = await tx.candyWallet.upsert({
          where: { discordId: userId },
          create: {
            discordId: userId,
            username: interaction.user.username,
            displayName: interaction.user.displayName || interaction.user.username,
            avatar: interaction.user.displayAvatarURL(),
            balance: drop.amount,
            totalEarned: drop.amount,
            claimCount: 1,
            lastClaimAt: new Date(),
          },
          update: {
            balance: { increment: drop.amount },
            totalEarned: { increment: drop.amount },
            claimCount: { increment: 1 },
            lastClaimAt: new Date(),
            username: interaction.user.username,
            avatar: interaction.user.displayAvatarURL(),
          },
        });

        // d) Insert ledger entry
        await tx.candyLedger.create({
          data: {
            discordId: userId,
            delta: drop.amount,
            balanceAfter: currentWallet.balance,
            type: "DROP_CLAIM",
            refType: "drop",
            refId: drop.id,
            reason: `เก็บลูกอม ${drop.amount} ลูก (#${drop.id.slice(-6)})`,
            actor: "system",
          },
        });

        // e) Update event claimed budget
        await tx.candyEvent.update({
          where: { id: event.id },
          data: { budgetClaimed: { increment: drop.amount } },
        });

        return {
          success: true,
          amount: drop.amount,
          balance: currentWallet.balance,
          claimedCount: drop.claimedCount,
          maxClaimers: drop.maxClaimers,
          channelId: drop.channelId,
          messageId: drop.messageId,
          isFull: drop.claimedCount >= drop.maxClaimers,
        };
      });

      if (claimResult.error === "ALREADY_CLAIMED") {
        const rendered = embedService.render("candy_err_already_claimed", { user: `<@${userId}>` }, 0, { userId });
        return interaction.editReply(rendered);
      }

      if (claimResult.error === "TOO_LATE") {
        const rendered = embedService.render("candy_err_too_late", { user: `<@${userId}>` }, 0, { userId });
        return interaction.editReply(rendered);
      }

      // 7. Success Reply to User (Ephemeral)
      const successRendered = embedService.render("candy_claim_success", {
        user: `<@${userId}>`,
        amount: claimResult.amount,
        balance: claimResult.balance,
        baht: claimResult.balance,
        voiceChannel: guild?.channels.cache.get(voiceTracker.getVoiceState(guild, userId).channelId || "")?.name || "ห้องเสียง",
      }, 0, { userId });

      await interaction.editReply(successRendered);

      // 8. Update original Drop Message (debounced)
      this.scheduleDropMessageUpdate(dropId, claimResult);
    } catch (err: any) {
      console.error("[ClaimService] Claim error:", err);
      const rendered = embedService.render("candy_err_generic", { user: `<@${userId}>`, error: err.message }, 0, { userId });
      return interaction.editReply(rendered);
    }
  }

  private scheduleDropMessageUpdate(dropId: string, result: any) {
    if (this.updateDebounce.has(dropId)) {
      clearTimeout(this.updateDebounce.get(dropId)!);
    }

    const timer = setTimeout(async () => {
      this.updateDebounce.delete(dropId);
      try {
        const drop = await prisma.candyDrop.findUnique({
          where: { id: dropId },
          include: { claims: true },
        });
        if (!drop || !drop.channelId || !drop.messageId) return;

        const channel: any = await client.channels.fetch(drop.channelId);
        if (!channel || !("messages" in channel)) return;

        const msg = await channel.messages.fetch(drop.messageId);
        if (!msg) return;

        if (drop.status === "CLAIMED") {
          const winners = drop.claims.map((c) => `<@${c.discordId}>`).join(", ") || "ผู้เล่น";
          const rendered = embedService.render("candy_drop_claimed", {
            amount: drop.amount,
            winners,
            winner: winners,
            dropShortId: drop.id.slice(-6),
          });
          await msg.edit(rendered);

          // Auto-delete message after 7 seconds to keep chat clean (Option 2)
          setTimeout(async () => {
            try {
              await msg.delete();
            } catch (err) {
              // Message might already be deleted or missing permission
            }
          }, 7000);
        } else if (drop.status === "ACTIVE") {
          const rendered = embedService.render(
            "candy_drop",
            {
              amount: drop.amount,
              maxClaimers: drop.maxClaimers,
              claimedCount: drop.claimedCount,
              expiresR: `<t:${Math.floor(new Date(drop.expiresAt).getTime() / 1000)}:R>`,
              channel: channel.name,
              dropShortId: drop.id.slice(-6),
            },
            0,
            { dropId: drop.id }
          );
          await msg.edit(rendered);
        }
      } catch (e) {
        // Discord API ignore error
      }
    }, 800);

    this.updateDebounce.set(dropId, timer);
  }
}

export const claimService = new ClaimService();

