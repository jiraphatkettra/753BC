import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_EMBED_TEMPLATES } from "@/lib/candy/embeds/defaults";
import { renderTemplate } from "@/lib/candy/embeds/render";
import { sendDiscordChannelMessage } from "@/lib/discord";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const drops = await prisma.candyDrop.findMany({
      where: status ? { status: status as any } : {},
      include: { claims: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(
      { success: true, drops },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// ⚡ Instant Drop (No queue, directly to Discord API)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const body = await req.json();
    const { channelId, amount = 1, maxClaimers = 1 } = body;

    let event = await prisma.candyEvent.findFirst({
      orderBy: { createdAt: "desc" },
      include: { channels: true },
    });

    if (!event) {
      return NextResponse.json({ success: false, message: "ยังไม่มีกิจกรรมในระบบ" }, { status: 400 });
    }

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
    const targetChannelId = channelId || enabledChannels[0]?.channelId;

    if (!targetChannelId) {
      return NextResponse.json(
        { success: false, message: "กรุณาเลือกหรือเปิดห้องสำหรับดรอปอย่างน้อย 1 ห้องก่อน" },
        { status: 400 }
      );
    }

    const targetChannelName = enabledChannels.find((c: any) => c.channelId === targetChannelId)?.name || "channel";
    const dropAmount = parseInt(String(amount), 10) || 1;
    const dropMaxClaimers = parseInt(String(maxClaimers), 10) || 1;
    const cost = dropAmount * dropMaxClaimers;

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

    const drop = await prisma.candyDrop.create({
      data: {
        eventId: event.id,
        channelId: targetChannelId,
        amount: dropAmount,
        maxClaimers: dropMaxClaimers,
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
        channel: targetChannelName,
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
        message: `🍬 ดรอปทันที ${dropAmount} ลูก (${dropMaxClaimers} สิทธิ์) ลงห้อง <#${targetChannelId}> สำเร็จเรียบร้อยแล้ว!`,
        drop,
      });
    } else {
      await prisma.$transaction([
        prisma.candyDrop.update({ where: { id: drop.id }, data: { status: "CANCELLED" } }),
        prisma.candyEvent.update({ where: { id: event.id }, data: { budgetReserved: { decrement: cost } } }),
      ]);

      return NextResponse.json(
        { success: false, message: `ส่งข้อความ Discord ไม่สำเร็จ: ${sendRes.error}` },
        { status: 500 }
      );
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// Cancel Drop
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(req.url);
    const dropId = searchParams.get("id");

    if (!dropId) return NextResponse.json({ success: false, message: "Missing drop ID" }, { status: 400 });

    const drop = await prisma.candyDrop.findUnique({ where: { id: dropId } });
    if (drop && drop.status === "ACTIVE") {
      const unclaimed = (drop.maxClaimers - drop.claimedCount) * drop.amount;
      await prisma.$transaction([
        prisma.candyDrop.update({ where: { id: drop.id }, data: { status: "CANCELLED" } }),
        prisma.candyEvent.update({ where: { id: drop.eventId }, data: { budgetReserved: { decrement: unclaimed } } }),
      ]);
    }

    return NextResponse.json({ success: true, message: "ยกเลิกดรอปเรียบร้อยแล้ว" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
