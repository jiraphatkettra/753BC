import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const event = await prisma.candyEvent.findFirst({
      where: { status: { in: ["RUNNING", "PAUSED", "SCHEDULED", "DRAFT"] } },
    });
    if (!event) return NextResponse.json({ success: true, channels: [] });

    const channels = await prisma.candyChannel.findMany({
      where: { eventId: event.id },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ success: true, channels });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { channelId, name, enabled, weight } = body;

    const event = await prisma.candyEvent.findFirst({
      where: { status: { in: ["RUNNING", "PAUSED", "SCHEDULED", "DRAFT"] } },
    });
    if (!event) return NextResponse.json({ success: false, message: "No active event" }, { status: 400 });

    const channel = await prisma.candyChannel.upsert({
      where: { eventId_channelId: { eventId: event.id, channelId } },
      create: {
        eventId: event.id,
        channelId,
        name,
        enabled: enabled !== undefined ? enabled : true,
        weight: weight || 1,
      },
      update: {
        name,
        enabled: enabled !== undefined ? enabled : undefined,
        weight: weight !== undefined ? weight : undefined,
      },
    });

    return NextResponse.json({ success: true, channel });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

