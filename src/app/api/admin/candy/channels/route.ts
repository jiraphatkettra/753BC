import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_EVENT_CONFIG } from "@/lib/candy";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

async function getOrCreateActiveEvent() {
  let event = await prisma.candyEvent.findFirst({
    orderBy: { createdAt: "desc" },
  });

  if (!event) {
    event = await prisma.candyEvent.create({
      data: {
        name: "Trick or Treat 2026",
        status: "DRAFT",
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 24 * 3600 * 1000),
        budgetTotal: 1000,
        config: DEFAULT_EVENT_CONFIG as any,
        createdBy: "admin",
      },
    });
  }

  return event;
}

export async function GET() {
  try {
    const event = await getOrCreateActiveEvent();

    const channels = await prisma.candyChannel.findMany({
      where: { eventId: event.id },
      orderBy: { createdAt: "asc" },
    });

    // Also fetch master saved channels from settings
    const masterSetting = await prisma.candySetting.findUnique({
      where: { key: "candy:saved_enabled_channels" },
    });
    const savedMasterList = (masterSetting?.value as any[]) || [];

    return NextResponse.json(
      {
        success: true,
        channels,
        savedMasterChannels: savedMasterList,
        eventId: event.id,
      },
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

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const event = await getOrCreateActiveEvent();

    // 1. Batch Update
    if (Array.isArray(body.channels)) {
      const updates = body.channels.map((ch: any) =>
        prisma.candyChannel.upsert({
          where: { eventId_channelId: { eventId: event.id, channelId: ch.channelId } },
          create: {
            eventId: event.id,
            channelId: ch.channelId,
            name: ch.name || ch.channelId,
            enabled: ch.enabled !== undefined ? ch.enabled : true,
            weight: ch.weight || 1,
          },
          update: {
            name: ch.name || undefined,
            enabled: ch.enabled !== undefined ? ch.enabled : undefined,
            weight: ch.weight !== undefined ? ch.weight : undefined,
          },
        })
      );

      await prisma.$transaction(updates);
    } else {
      // 2. Single Update
      const { channelId, name, enabled, weight } = body;
      if (!channelId) {
        return NextResponse.json({ success: false, message: "Missing channelId" }, { status: 400 });
      }

      await prisma.candyChannel.upsert({
        where: { eventId_channelId: { eventId: event.id, channelId } },
        create: {
          eventId: event.id,
          channelId,
          name: name || channelId,
          enabled: enabled !== undefined ? enabled : true,
          weight: weight || 1,
        },
        update: {
          name: name || undefined,
          enabled: enabled !== undefined ? enabled : undefined,
          weight: weight !== undefined ? weight : undefined,
        },
      });
    }

    // 3. Persist ALL currently enabled channels to master settings permanently
    const currentEnabled = await prisma.candyChannel.findMany({
      where: { eventId: event.id, enabled: true },
      select: { channelId: true, name: true, weight: true },
    });

    await prisma.candySetting.upsert({
      where: { key: "candy:saved_enabled_channels" },
      create: {
        key: "candy:saved_enabled_channels",
        value: currentEnabled as any,
      },
      update: {
        value: currentEnabled as any,
      },
    });

    return NextResponse.json({ success: true, count: currentEnabled.length });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
