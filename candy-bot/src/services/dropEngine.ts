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

      // Read Upcoming Drop Queue from DB
      const queueSetting = await prisma.candySetting.findUnique({
        where: { key: "candy:upcoming_drop_queue" },
      });
      let queue: any[] = (queueSetting?.value as any[]) || [];

      // Clean up stale unexecuted items older than 20 seconds
      queue = queue.filter((item) => item.scheduledAt > now - 20000);

      // 1. Check if any queued drop is due now
      const dueIndex = queue.findIndex((item) => item.scheduledAt <= now);
      if (dueIndex !== -1) {
        const dueItem = queue[dueIndex];
        queue.splice(dueIndex, 1);

        // Update queue in DB immediately so it is not double-executed
        await prisma.candySetting.upsert({
          where: { key: "candy:upcoming_drop_queue" },
          create: { key: "candy:upcoming_drop_queue", value: queue },
          update: { value: queue },
        });

        // Cap amount by remaining budget
        const maxPossible = Math.floor(remainingBudget / dueItem.maxClaimers);
        if (maxPossible > 0) {
          const dropAmount = Math.min(dueItem.amount, maxPossible);
          console.log(`[DropEngine] Executing queued drop: ${dropAmount} candies to channel ${dueItem.channelId}`);
          await this.executeDrop(
            event.id,
            dueItem.channelId,
            dropAmount,
            dueItem.maxClaimers,
            dropCfg.lifetimeSec,
            "SCHEDULER"
          );
        }
      }

      // 2. Ensure queue has at least 3 upcoming drops planned
      let enabledChannels = (event.channels || []).filter((c: any) => c.enabled);
      if (enabledChannels.length === 0) {
        const masterSetting = await prisma.candySetting.findUnique({
          where: { key: "candy:saved_enabled_channels" },
        });
        if (masterSetting && Array.isArray(masterSetting.value)) {
          enabledChannels = masterSetting.value as any[];
        }
      }

      if (enabledChannels.length > 0 && queue.length < 3) {
        const intervalSec = Math.max(30, Math.floor(60 / (dropCfg.fixedDropsPerMinute || 2)));
        let lastTime = queue.length > 0 ? queue[queue.length - 1].scheduledAt : now;

        while (queue.length < 3) {
          lastTime += (intervalSec + Math.floor(Math.random() * 10 - 5)) * 1000;
          if (lastTime < now + 12000) lastTime = now + 12000;

          // Pick candidate channel (weighted)
          const sumWeight = enabledChannels.reduce((acc: number, c: any) => acc + (c.weight || 1), 0);
          let randCh = Math.random() * sumWeight;
          let selectedChannel = enabledChannels[0];
          for (const ch of enabledChannels) {
            randCh -= (ch.weight || 1);
            if (randCh <= 0) {
              selectedChannel = ch;
              break;
            }
          }

          // Pick amount from tiers
          const amountTiers = dropCfg.amountTiers || [
            { amount: 1, weight: 60 },
            { amount: 2, weight: 25 },
            { amount: 5, weight: 10 },
          ];
          const sumTierWeight = amountTiers.reduce((acc: number, t: any) => acc + (t.weight || 1), 0);
          let randTier = Math.random() * sumTierWeight;
          let selectedAmount = amountTiers[0].amount;
          for (const tier of amountTiers) {
            randTier -= (tier.weight || 1);
            if (randTier <= 0) {
              selectedAmount = tier.amount;
              break;
            }
          }

          queue.push({
            id: `queue_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            eventId: event.id,
            channelId: selectedChannel.channelId,
            channelName: selectedChannel.name || selectedChannel.channelId,
            amount: selectedAmount,
            maxClaimers: dropCfg.maxClaimers || 1,
            scheduledAt: lastTime,
            createdAt: now,
          });
        }

        queue.sort((a, b) => a.scheduledAt - b.scheduledAt);

        await prisma.candySetting.upsert({
          where: { key: "candy:upcoming_drop_queue" },
          create: { key: "candy:upcoming_drop_queue", value: queue },
          update: { value: queue },
        });
      }
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

