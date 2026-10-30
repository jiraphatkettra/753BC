import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_EVENT_CONFIG } from "@/lib/candy";
import { DEFAULT_EMBED_TEMPLATES } from "@/lib/candy/embeds/defaults";
import { renderTemplate } from "@/lib/candy/embeds/render";
import { sendDiscordChannelMessage } from "@/lib/discord";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. Fetch master saved settings as permanent defaults
    const masterConfigSetting = await prisma.candySetting.findUnique({
      where: { key: "candy:saved_master_config" },
    });
    const masterChannelsSetting = await prisma.candySetting.findUnique({
      where: { key: "candy:saved_enabled_channels" },
    });
    const savedMasterChannels = (masterChannelsSetting?.value as any[]) || [];

    // 2. Look for active or running/paused/scheduled event first
    let event = await prisma.candyEvent.findFirst({
      where: { status: { in: ["RUNNING", "PAUSED", "SCHEDULED", "DRAFT"] } },
      include: { channels: true },
      orderBy: { createdAt: "desc" },
    });

    // 3. If all existing events are ENDED, return the latest one
    if (!event) {
      event = await prisma.candyEvent.findFirst({
        include: { channels: true },
        orderBy: { createdAt: "desc" },
      });
    }

    // 4. If no event exists at all, create a default DRAFT event
    if (!event) {
      const savedConfig = (masterConfigSetting?.value as any)?.config || DEFAULT_EVENT_CONFIG;
      const savedBudget = (masterConfigSetting?.value as any)?.budgetTotal || 1000;
      const savedName = (masterConfigSetting?.value as any)?.name || "Trick or Treat 2026";

      event = await prisma.candyEvent.create({
        data: {
          name: savedName,
          status: "DRAFT",
          startsAt: new Date(),
          endsAt: new Date(Date.now() + 24 * 3600 * 1000),
          budgetTotal: savedBudget,
          config: savedConfig as any,
          createdBy: "admin",
        },
        include: { channels: true },
      });
    }

    // 5. Ensure master channels are linked to the active event if it currently has no enabled channels
    const enabledEventChannels = (event.channels || []).filter((c) => c.enabled);
    if (enabledEventChannels.length === 0 && savedMasterChannels.length > 0) {
      for (const mc of savedMasterChannels) {
        await prisma.candyChannel.upsert({
          where: { eventId_channelId: { eventId: event.id, channelId: mc.channelId } },
          create: {
            eventId: event.id,
            channelId: mc.channelId,
            name: mc.name || mc.channelId,
            enabled: true,
            weight: mc.weight || 1,
          },
          update: { enabled: true },
        });
      }
      // Re-fetch event with populated channels
      event = await prisma.candyEvent.findUnique({
        where: { id: event.id },
        include: { channels: true },
      });
    }

    return NextResponse.json({
      success: true,
      event,
      masterConfig: masterConfigSetting?.value || null,
      masterChannels: savedMasterChannels,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// Create or update event
export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    const body = await req.json();

    const { name, startsAt, endsAt, budgetTotal, config } = body;

    // Find the latest existing event to update
    let event = await prisma.candyEvent.findFirst({
      orderBy: { createdAt: "desc" },
      include: { channels: true },
    });

    const parsedStartsAt = startsAt ? new Date(startsAt) : new Date();
    const parsedEndsAt = endsAt ? new Date(endsAt) : new Date(Date.now() + 3600000);

    // Save master config permanently into CandySetting so future events never lose them
    await prisma.candySetting.upsert({
      where: { key: "candy:saved_master_config" },
      create: {
        key: "candy:saved_master_config",
        value: {
          name: name || "Trick or Treat 2026",
          budgetTotal: budgetTotal ? parseInt(budgetTotal, 10) : 1000,
          config: config || DEFAULT_EVENT_CONFIG,
        } as any,
      },
      update: {
        value: {
          name: name || "Trick or Treat 2026",
          budgetTotal: budgetTotal ? parseInt(budgetTotal, 10) : 1000,
          config: config || DEFAULT_EVENT_CONFIG,
        } as any,
      },
    });

    if (event) {
      // If the event was previously ENDED, but new endsAt is in the future, revive it back to DRAFT/SCHEDULED
      let targetStatus = event.status;
      if (event.status === "ENDED" && parsedEndsAt > new Date()) {
        targetStatus = parsedStartsAt > new Date() ? "SCHEDULED" : "DRAFT";
      }

      event = await prisma.candyEvent.update({
        where: { id: event.id },
        data: {
          name: name || event.name,
          status: targetStatus,
          startsAt: parsedStartsAt,
          endsAt: parsedEndsAt,
          budgetTotal: budgetTotal !== undefined ? parseInt(budgetTotal, 10) : event.budgetTotal,
          config: config || event.config,
          configVersion: { increment: 1 },
        },
        include: { channels: true },
      });
    } else {
      // Create new event and auto-link previously saved master channels
      event = await prisma.candyEvent.create({
        data: {
          name: name || "Trick or Treat 2026",
          status: "DRAFT",
          startsAt: parsedStartsAt,
          endsAt: parsedEndsAt,
          budgetTotal: budgetTotal ? parseInt(budgetTotal, 10) : 1000,
          config: config || DEFAULT_EVENT_CONFIG,
          createdBy: session?.user?.discordId || "admin",
        },
        include: { channels: true },
      });

      // Auto-attach saved master channels to this new event
      const masterChannels = await prisma.candySetting.findUnique({
        where: { key: "candy:saved_enabled_channels" },
      });
      if (masterChannels && Array.isArray(masterChannels.value)) {
        for (const ch of masterChannels.value as any[]) {
          await prisma.candyChannel.upsert({
            where: { eventId_channelId: { eventId: event.id, channelId: ch.channelId } },
            create: {
              eventId: event.id,
              channelId: ch.channelId,
              name: ch.name,
              enabled: true,
              weight: ch.weight || 1,
            },
            update: { enabled: true },
          });
        }
      }
    }

    return NextResponse.json({ success: true, event });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// Send Command to Bot or Execute INSTANT DROP
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const body = await req.json();
    const { type, reason, payload } = body;

    // -------------------------------------------------------------
    // ⚡ INSTANT DROP: Execute directly to Discord REST API (0 queue delay)
    // -------------------------------------------------------------
    if (type === "DROP_NOW") {
      let event = await prisma.candyEvent.findFirst({
        orderBy: { createdAt: "desc" },
        include: { channels: true },
      });

      if (!event) {
        return NextResponse.json({ success: false, message: "ยังไม่มีกิจกรรมในระบบ กรุณาบันทึกการตั้งค่าก่อน" }, { status: 400 });
      }

      // If event was not running or was ended, auto-activate it
      if (event.status !== "RUNNING") {
        event = await prisma.candyEvent.update({
          where: { id: event.id },
          data: {
            status: "RUNNING",
            endsAt: event.endsAt <= new Date() ? new Date(Date.now() + 4 * 3600 * 1000) : event.endsAt,
          },
          include: { channels: true },
        });
      }

      const enabledChannels = (event.channels || []).filter((c: any) => c.enabled);
      const targetChannelId = payload?.channelId || enabledChannels[0]?.channelId;

      if (!targetChannelId) {
        return NextResponse.json(
          {
            success: false,
            message: "กรุณาเปิดห้องสำหรับดรอปอย่างน้อย 1 ห้องที่เมนู 'ห้องที่เปิดดรอป' ก่อนสั่งดรอป",
          },
          { status: 400 }
        );
      }

      const targetChannelName = enabledChannels.find((c: any) => c.channelId === targetChannelId)?.name || "channel";
      const amount = payload?.amount || 1;
      const maxClaimers = payload?.maxClaimers || 1;
      const cost = amount * maxClaimers;

      // Atomic reservation in DB
      const reserveResult = await prisma.$executeRawUnsafe(
        `UPDATE candy_events SET "budgetReserved" = "budgetReserved" + $1 WHERE "id" = $2 AND "budgetReserved" + $1 <= "budgetTotal"`,
        cost,
        event.id
      );

      if (reserveResult === 0) {
        return NextResponse.json({ success: false, message: "งบประมาณคงเหลือไม่เพียงพอสำหรับการดรอปรอบนี้" }, { status: 400 });
      }

      const expiresAt = new Date(Date.now() + 45 * 1000);

      // Create Drop record
      const drop = await prisma.candyDrop.create({
        data: {
          eventId: event.id,
          channelId: targetChannelId,
          amount,
          maxClaimers,
          status: "ACTIVE",
          source: "ADMIN",
          createdBy: session?.user?.discordId || "web-admin",
          expiresAt,
        },
      });

      // Render embed
      const defaultTemplate = DEFAULT_EMBED_TEMPLATES["candy_drop"];
      const rendered = renderTemplate(
        defaultTemplate,
        {
          amount,
          maxClaimers,
          claimedCount: 0,
          expiresR: `<t:${Math.floor(expiresAt.getTime() / 1000)}:R>`,
          channel: targetChannelName,
          dropShortId: drop.id.slice(-6),
        },
        0,
        { dropId: drop.id }
      );

      // Mention role: 1562901234963456121
      const roleId = "1562901234963456121";
      const roleTag = `<@&${roleId}>`;
      const messagePayload = {
        content: `${roleTag} 🎃 **มีลูกอมแคนดี้หล่นลงมาแล้ว! ใครอยู่ในห้องพูดคุยเสียงรีบมากดรับด่วน!** 🍬`,
        embeds: rendered.embeds,
        components: rendered.components,
        allowed_mentions: {
          roles: [roleId],
        },
      };

      const sendRes = await sendDiscordChannelMessage(targetChannelId, messagePayload);

      if (sendRes.success && sendRes.messageId) {
        await prisma.candyDrop.update({
          where: { id: drop.id },
          data: { messageId: sendRes.messageId },
        });

        return NextResponse.json({
          success: true,
          instant: true,
          message: `🍬 ดรอปทันที ${amount} ลูก (${maxClaimers} สิทธิ์) ลงห้อง <#${targetChannelId}> สำเร็จเรียบร้อยแล้ว!`,
          drop,
        });
      } else {
        // Rollback reservation on Discord API error
        await prisma.$transaction([
          prisma.candyDrop.update({ where: { id: drop.id }, data: { status: "CANCELLED" } }),
          prisma.candyEvent.update({ where: { id: event.id }, data: { budgetReserved: { decrement: cost } } }),
        ]);

        return NextResponse.json(
          {
            success: false,
            message: `ส่งข้อความ Discord ไม่สำเร็จ: ${sendRes.error}`,
          },
          { status: 500 }
        );
      }
    }

    // -------------------------------------------------------------
    // General Commands (EVENT_START, EVENT_PAUSE, etc.)
    // -------------------------------------------------------------
    const latest = await prisma.candyEvent.findFirst({ orderBy: { createdAt: "desc" } });

    if (type === "EVENT_START" && latest) {
      await prisma.candyEvent.update({
        where: { id: latest.id },
        data: {
          status: "RUNNING",
          startsAt: new Date(),
          endsAt: latest.endsAt <= new Date() ? new Date(Date.now() + 24 * 3600 * 1000) : latest.endsAt,
        },
      });
    } else if (type === "EVENT_PAUSE" && latest) {
      await prisma.candyEvent.update({
        where: { id: latest.id },
        data: { status: "PAUSED" },
      });
    } else if (type === "EVENT_STOP" && latest) {
      await prisma.candyEvent.update({
        where: { id: latest.id },
        data: { status: "ENDED" },
      });
    }

    const command = await prisma.candyCommand.create({
      data: {
        type,
        payload: payload || { reason },
        status: "PENDING",
        createdBy: session?.user?.discordId || "web-admin",
      },
    });

    return NextResponse.json({ success: true, command });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
