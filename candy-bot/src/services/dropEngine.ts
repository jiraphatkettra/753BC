import prisma from "@candy/shared";
import { client } from "../client";
import { eventService } from "./eventService";
import { embedService } from "./embedService";
import { activityTracker } from "./activityTracker";

class DropEngine {
  private lastChannelDropTime: Map<string, number> = new Map();

  async initRecovery() {
    try {
      console.log("[DropEngine] Running startup recovery on stale drops...");
      const now = new Date();
      const expiredActive = await prisma.candyDrop.findMany({
        where: {
          status: "ACTIVE",
          expiresAt: { lte: now },
        },
      });

      for (const drop of expiredActive) {
        await this.expireDrop(drop);
      }
      if (expiredActive.length > 0) {
        console.log(`[DropEngine] Cleaned up ${expiredActive.length} expired drops from previous session.`);
      }
    } catch (err) {
      console.error("[DropEngine] Recovery failed:", err);
    }
  }

  async tick() {
    try {
      const event = await eventService.getActiveEvent();
      if (!event || event.status !== "RUNNING") return;

      const config = await eventService.getConfig();
      const dropCfg = config.drop;

      const remainingBudget = event.budgetTotal - event.budgetReserved;
      if (remainingBudget <= 0) return;

      const now = Date.now();
      const endsAtMs = new Date(event.endsAt).getTime();
      const remainingSec = Math.max(1, Math.floor((endsAtMs - now) / 1000));
      if (remainingSec <= 0) return;

      // 1. Calculate Pacing lambda (drops / sec)
      let lambda = 0;
      if (dropCfg.pacing === "BUDGET_AWARE") {
        const totalWeight = dropCfg.amountTiers.reduce((acc, t) => acc + t.weight, 0);
        const weightedSum = dropCfg.amountTiers.reduce((acc, t) => acc + t.amount * t.weight, 0);
        const avgAmount = totalWeight > 0 ? weightedSum / totalWeight : 1;
        const avgCost = avgAmount * dropCfg.maxClaimers;
        lambda = (remainingBudget / remainingSec) / Math.max(1, avgCost);
      } else {
        lambda = dropCfg.fixedDropsPerMinute / 60;
      }

      const pDrop = Math.min(1, lambda * dropCfg.tickSeconds);

      // 2. Check global active drops
      const globalActive = await prisma.candyDrop.count({
        where: { eventId: event.id, status: "ACTIVE" },
      });
      if (globalActive >= dropCfg.maxActiveGlobal) return;

      // If no drop currently active in guild, drop immediately; otherwise follow pacing roll
      const hasActiveDrops = globalActive > 0;
      if (hasActiveDrops && Math.random() > pDrop) return;

      // 3. Find eligible candidate channels
      const enabledChannels = (event.channels || []).filter((c: any) => c.enabled);
      if (enabledChannels.length === 0) return;

      const candidates: any[] = [];
      for (const ch of enabledChannels) {
        const lastDrop = this.lastChannelDropTime.get(ch.channelId) || 0;
        if (now - lastDrop < dropCfg.channelCooldownSec * 1000) continue;

        const channelActive = await prisma.candyDrop.count({
          where: { channelId: ch.channelId, status: "ACTIVE" },
        });
        if (channelActive >= dropCfg.maxActivePerChannel) continue;

        const activity = activityTracker.getActivity(ch.channelId, dropCfg.activityWindowSec);
        // Default allow quiet room drops for testing/active community participation
        const allowQuiet = dropCfg.dropWhenNoActivity !== false;
        if (activity < dropCfg.minActivityMessages && !allowQuiet) continue;

        const effectiveWeight = ch.weight * (1 + activity);
        candidates.push({ channel: ch, weight: effectiveWeight });
      }

      if (candidates.length === 0) return;

      // Weighted random pick of channel
      const sumWeight = candidates.reduce((acc, c) => acc + c.weight, 0);
      let rand = Math.random() * sumWeight;
      let selectedChannel = candidates[0].channel;
      for (const cand of candidates) {
        rand -= cand.weight;
        if (rand <= 0) {
          selectedChannel = cand.channel;
          break;
        }
      }

      // Pick amount from tiers
      const sumTierWeight = dropCfg.amountTiers.reduce((acc, t) => acc + t.weight, 0);
      let randTier = Math.random() * sumTierWeight;
      let selectedAmount = dropCfg.amountTiers[0].amount;
      for (const tier of dropCfg.amountTiers) {
        randTier -= tier.weight;
        if (randTier <= 0) {
          selectedAmount = tier.amount;
          break;
        }
      }

      // Cap selectedAmount by remaining budget
      const maxPossible = Math.floor(remainingBudget / dropCfg.maxClaimers);
      if (maxPossible <= 0) return;
      selectedAmount = Math.min(selectedAmount, maxPossible);

      await this.executeDrop(event.id, selectedChannel.channelId, selectedAmount, dropCfg.maxClaimers, dropCfg.lifetimeSec, "SCHEDULER");
    } catch (err) {
      console.error("[DropEngine] tick error:", err);
    }
  }

  async sweeper() {
    try {
      const now = new Date();
      const expired = await prisma.candyDrop.findMany({
        where: {
          status: "ACTIVE",
          expiresAt: { lte: now },
        },
      });

      for (const drop of expired) {
        await this.expireDrop(drop);
      }
    } catch (err) {
      console.error("[DropEngine] sweeper error:", err);
    }
  }

  private async expireDrop(drop: any) {
    try {
      const unclaimed = (drop.maxClaimers - drop.claimedCount) * drop.amount;

      await prisma.$transaction(async (tx) => {
        await tx.candyDrop.update({
          where: { id: drop.id },
          data: { status: "EXPIRED", closedAt: new Date() },
        });

        if (unclaimed > 0) {
          await tx.candyEvent.update({
            where: { id: drop.eventId },
            data: {
              budgetReserved: { decrement: unclaimed },
            },
          });
        }
      });

      // Update Discord message
      if (drop.channelId && drop.messageId) {
        try {
          const ch: any = await client.channels.fetch(drop.channelId);
          if (ch && "messages" in ch) {
            const msg = await ch.messages.fetch(drop.messageId);
            if (msg) {
              const rendered = embedService.render("candy_drop_expired", {
                amount: drop.amount,
                claimedCount: drop.claimedCount,
                maxClaimers: drop.maxClaimers,
                dropShortId: drop.id.slice(-6),
              });
              await msg.edit(rendered);

              // Auto-delete expired drop message after 6 seconds
              setTimeout(async () => {
                try {
                  await msg.delete();
                } catch (e) {}
              }, 6000);
            }
          }
        } catch (e) {
          // Message might have been deleted, ignore
        }
      }
    } catch (err) {
      console.error(`[DropEngine] Failed to expire drop ${drop.id}:`, err);
    }
  }

  async executeDrop(
    eventId: string,
    channelId: string,
    amount: number,
    maxClaimers: number,
    lifetimeSec: number,
    source: "SCHEDULER" | "ADMIN",
    createdBy?: string
  ): Promise<{ success: boolean; message: string; drop?: any }> {
    const cost = amount * maxClaimers;

    // 1. Atomic reservation in DB
    const reserveRows = await prisma.$executeRawUnsafe(
      `
      UPDATE candy_events
         SET "budgetReserved" = "budgetReserved" + $1
       WHERE "id" = $2 AND "status" = 'RUNNING'
         AND "budgetReserved" + $1 <= "budgetTotal"
    `,
      cost,
      eventId
    );

    if (reserveRows === 0) {
      return { success: false, message: "งบประมาณคงเหลือไม่เพียงพอสำหรับการดรอปรอบนี้" };
    }

    const expiresAt = new Date(Date.now() + lifetimeSec * 1000);

    // 2. Insert drop in DB
    const drop = await prisma.candyDrop.create({
      data: {
        eventId,
        channelId,
        amount,
        maxClaimers,
        status: "ACTIVE",
        source,
        createdBy,
        expiresAt,
      },
    });

    this.lastChannelDropTime.set(channelId, Date.now());

    // 3. Post to Discord Channel
    try {
      const channel: any = await client.channels.fetch(channelId);
      if (!channel || !("send" in channel)) {
        throw new Error("Channel not found or not text-based");
      }

      const rendered = embedService.render(
        "candy_drop",
        {
          amount,
          maxClaimers,
          claimedCount: 0,
          expiresR: `<t:${Math.floor(expiresAt.getTime() / 1000)}:R>`,
          channel: channel.name,
          dropShortId: drop.id.slice(-6),
        },
        0,
        { dropId: drop.id }
      );

      // TAG TARGET ROLE: 1562901234963456121
      const roleId = "1562901234963456121";
      const roleTag = `<@&${roleId}>`;
      rendered.content = rendered.content
        ? `${roleTag} ${rendered.content}`
        : `${roleTag} 🎃 **มีลูกอมแคนดี้หล่นลงมาแล้ว! ใครอยู่ในห้องพูดคุยเสียงรีบมากดรับด่วน!** 🍬`;

      // Discord API: roles array and parse:["roles"] are mutually exclusive
      delete (rendered as any).allowed_mentions;
      const messagePayload: any = {
        ...rendered,
        allowedMentions: {
          roles: [roleId],
        },
      };

      const sent = await channel.send(messagePayload);

      await prisma.candyDrop.update({
        where: { id: drop.id },
        data: { messageId: sent.id },
      });

      return { success: true, message: `ดรอปลูกอม ${amount} ลูก (${maxClaimers} สิทธิ์) ลงห้อง <#${channelId}> สำเร็จ`, drop };
    } catch (sendErr: any) {
      console.error("[DropEngine] Failed to send Discord drop message:", sendErr);
      // Rollback reservation on Discord send failure
      await prisma.$transaction([
        prisma.candyDrop.update({ where: { id: drop.id }, data: { status: "CANCELLED" } }),
        prisma.candyEvent.update({
          where: { id: eventId },
          data: { budgetReserved: { decrement: cost } },
        }),
      ]);
      return { success: false, message: `ส่งข้อความ Discord ไม่สำเร็จ: ${sendErr.message}` };
    }
  }

  async triggerManualDrop(channelId: string, amount: number, maxClaimers: number, actor: string) {
    const event = await eventService.getActiveEvent();
    if (!event || event.status !== "RUNNING") {
      return { success: false, message: "กิจกรรมไม่ได้อยู่ในสถานะ RUNNING" };
    }
    const config = await eventService.getConfig();
    return this.executeDrop(event.id, channelId, amount, maxClaimers, config.drop.lifetimeSec, "ADMIN", actor);
  }
}

export const dropEngine = new DropEngine();

