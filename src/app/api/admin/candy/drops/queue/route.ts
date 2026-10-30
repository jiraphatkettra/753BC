import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_EMBED_TEMPLATES } from "@/lib/candy/embeds/defaults";
import { renderTemplate } from "@/lib/candy/embeds/render";
import { sendDiscordChannelMessage } from "@/lib/discord";

export const dynamic = "force-dynamic";

export interface QueuedDropItem {
  id: string;
  eventId: string;
  channelId: string;
  channelName: string;
  amount: number;
  maxClaimers: number;
  scheduledAt: number; // timestamp in ms
  createdAt: number;
}

// Helper to pre-fill queue if empty and event is running
async function ensureQueueFilled(event: any): Promise<QueuedDropItem[]> {
  const setting = await prisma.candySetting.findUnique({
    where: { key: "candy:upcoming_drop_queue" },
  });

  let queue: QueuedDropItem[] = (setting?.value as unknown as QueuedDropItem[]) || [];
  const now = Date.now();

  // Remove items scheduled more than 15 seconds ago that weren't executed
  queue = queue.filter((item) => item.scheduledAt > now - 15000);

  if (event && event.status === "RUNNING") {
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
      const config = (event.config || {}) as any;
      const dropCfg = config.drop || {};
      const amountTiers = dropCfg.amountTiers || [
        { amount: 1, weight: 60 },
        { amount: 2, weight: 25 },
        { amount: 5, weight: 10 },
      ];

      // Calculate spacing
      const intervalSec = Math.max(30, Math.floor(60 / (dropCfg.fixedDropsPerMinute || 2)));
      let lastTime = queue.length > 0 ? queue[queue.length - 1].scheduledAt : now;

      while (queue.length < 3) {
        lastTime += (intervalSec + Math.floor(Math.random() * 15 - 5)) * 1000;
        if (lastTime < now + 15000) lastTime = now + 15000;

        // Weighted random channel
        const sumChannelWeight = enabledChannels.reduce((acc: number, c: any) => acc + (c.weight || 1), 0);
        let randCh = Math.random() * sumChannelWeight;
        let selectedChannel = enabledChannels[0];
        for (const ch of enabledChannels) {
          randCh -= (ch.weight || 1);
          if (randCh <= 0) {
            selectedChannel = ch;
            break;
          }
        }

        // Weighted random amount
        const sumTierWeight = amountTiers.reduce((acc: number, t: any) => acc + (t.weight || 1), 0);
        let rand = Math.random() * sumTierWeight;
        let selectedAmount = 1;
        for (const tier of amountTiers) {
          rand -= tier.weight || 1;
          if (rand <= 0) {
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

      await prisma.candySetting.upsert({
        where: { key: "candy:upcoming_drop_queue" },
        create: { key: "candy:upcoming_drop_queue", value: queue as any },
        update: { value: queue as any },
      });
    }
  }

  queue.sort((a, b) => a.scheduledAt - b.scheduledAt);
  return queue;
}

// GET: View upcoming drop queue
export async function GET() {
  try {
    const event = await prisma.candyEvent.findFirst({
      where: { status: { in: ["RUNNING", "DRAFT", "SCHEDULED", "PAUSED"] } },
      include: { channels: true },
      orderBy: { createdAt: "desc" },
    });

    const queue = await ensureQueueFilled(event);
    const now = Date.now();

    const enhancedQueue = queue.map((item) => ({
      ...item,
      secondsRemaining: Math.max(0, Math.ceil((item.scheduledAt - now) / 1000)),
    }));

    return NextResponse.json({
      success: true,
      queue: enhancedQueue,
      eventStatus: event?.status || "NO_EVENT",
      now,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// DELETE: Cancel a queued drop
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const queueId = searchParams.get("id");

    if (!queueId) {
      return NextResponse.json({ success: false, message: "Missing queue ID" }, { status: 400 });
    }

    const setting = await prisma.candySetting.findUnique({
      where: { key: "candy:upcoming_drop_queue" },
    });

    let queue: QueuedDropItem[] = (setting?.value as unknown as QueuedDropItem[]) || [];
    const initialCount = queue.length;
    queue = queue.filter((item) => item.id !== queueId);

    await prisma.candySetting.upsert({
      where: { key: "candy:upcoming_drop_queue" },
      create: { key: "candy:upcoming_drop_queue", value: queue as any },
      update: { value: queue as any },
    });

    return NextResponse.json({
      success: true,
      message: initialCount !== queue.length ? "✅ ยกเลิกคิวดรอปลูกอมนี้เรียบร้อยแล้ว" : "ไม่พบคิวดังกล่าว",
      queue,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST: Trigger a queued drop IMMEDIATELY or add to queue
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const body = await req.json();
    const { action, queueId, channelId, amount = 1, maxClaimers = 1, scheduledInSeconds = 60 } = body;

    const setting = await prisma.candySetting.findUnique({
      where: { key: "candy:upcoming_drop_queue" },
    });
    let queue: QueuedDropItem[] = (setting?.value as unknown as QueuedDropItem[]) || [];

    // Action 1: Execute queued drop immediately
    if (action === "DROP_NOW" && queueId) {
      const item = queue.find((q) => q.id === queueId);
      if (!item) {
        return NextResponse.json({ success: false, message: "ไม่พบคิวนี้ในระบบ (อาจถูกดำเนินการไปแล้ว)" }, { status: 404 });
      }

      // Remove from queue
      queue = queue.filter((q) => q.id !== queueId);
      await prisma.candySetting.update({
        where: { key: "candy:upcoming_drop_queue" },
        data: { value: queue as any },
      });

      // Execute drop directly via Discord REST API
      let event = await prisma.candyEvent.findFirst({
        where: { id: item.eventId },
        include: { channels: true },
      });

      if (!event || event.status !== "RUNNING") {
        event = await prisma.candyEvent.update({
          where: { id: item.eventId },
          data: { status: "RUNNING" },
          include: { channels: true },
        });
      }

      const cost = item.amount * item.maxClaimers;
      await prisma.$executeRawUnsafe(
        `UPDATE candy_events SET "budgetReserved" = "budgetReserved" + $1 WHERE "id" = $2 AND "budgetReserved" + $1 <= "budgetTotal"`,
        cost,
        event.id
      );

      const expiresAt = new Date(Date.now() + 45 * 1000);
      const drop = await prisma.candyDrop.create({
        data: {
          eventId: event.id,
          channelId: item.channelId,
          amount: item.amount,
          maxClaimers: item.maxClaimers,
          status: "ACTIVE",
          source: "ADMIN",
          createdBy: session?.user?.discordId || "web-admin",
          expiresAt,
        },
      });

      const defaultTemplate = DEFAULT_EMBED_TEMPLATES["candy_drop"];
      const rendered = renderTemplate(
        defaultTemplate,
        {
          amount: drop.amount,
          maxClaimers: drop.maxClaimers,
          claimedCount: 0,
          expiresR: `<t:${Math.floor(expiresAt.getTime() / 1000)}:R>`,
          channel: item.channelName,
          dropShortId: drop.id.slice(-6),
        },
        0,
        { dropId: drop.id }
      );

      const roleId = "1562901234963456121";
      const roleTag = `<@&${roleId}>`;
      const messagePayload = {
        content: `${roleTag} 🎃 **มีลูกอมแคนดี้หล่นลงมาแล้ว! ใครอยู่ในห้องพูดคุยเสียงรีบมากดรับด่วน!** 🍬`,
        embeds: rendered.embeds,
        components: rendered.components,
        allowed_mentions: { roles: [roleId] },
      };

      const sendRes = await sendDiscordChannelMessage(item.channelId, messagePayload);
      if (sendRes.success && sendRes.messageId) {
        await prisma.candyDrop.update({
          where: { id: drop.id },
          data: { messageId: sendRes.messageId },
        });

        return NextResponse.json({
          success: true,
          message: `🍬 ดรอปคิวลูกอม ${item.amount} ลูก ลงห้อง <#${item.channelId}> ทันทีสำเร็จ!`,
          drop,
        });
      } else {
        return NextResponse.json({ success: false, message: `Discord Error: ${sendRes.error}` }, { status: 500 });
      }
    }

    // Action 2: Add custom scheduled item to queue
    if (action === "ADD_CUSTOM" && channelId) {
      const event = await prisma.candyEvent.findFirst({
        where: { status: { in: ["RUNNING", "DRAFT", "SCHEDULED"] } },
        include: { channels: true },
        orderBy: { createdAt: "desc" },
      });

      if (!event) {
        return NextResponse.json({ success: false, message: "ไม่พบกิจกรรมที่พร้อมใช้งาน" }, { status: 400 });
      }

      const channel = event.channels.find((c) => c.channelId === channelId);
      const scheduledAt = Date.now() + Math.max(5, scheduledInSeconds) * 1000;

      const newItem: QueuedDropItem = {
        id: `queue_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        eventId: event.id,
        channelId,
        channelName: channel?.name || channelId,
        amount: parseInt(String(amount), 10) || 1,
        maxClaimers: parseInt(String(maxClaimers), 10) || 1,
        scheduledAt,
        createdAt: Date.now(),
      };

      queue.push(newItem);
      queue.sort((a, b) => a.scheduledAt - b.scheduledAt);

      await prisma.candySetting.upsert({
        where: { key: "candy:upcoming_drop_queue" },
        create: { key: "candy:upcoming_drop_queue", value: queue as any },
        update: { value: queue as any },
      });

      return NextResponse.json({
        success: true,
        message: `✅ เพิ่มคิวดรอปลูกอมลงห้อง #${newItem.channelName} เรียบร้อยแล้ว`,
        item: newItem,
      });
    }

    return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
