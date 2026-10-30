import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_EVENT_CONFIG } from "@/lib/candy";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. Look for active or running/paused/scheduled event first
    let event = await prisma.candyEvent.findFirst({
      where: { status: { in: ["RUNNING", "PAUSED", "SCHEDULED", "DRAFT"] } },
      include: { channels: true },
      orderBy: { createdAt: "desc" },
    });

    // 2. If all existing events are ENDED, return the latest one so the admin form preserves all configured settings & channels
    if (!event) {
      event = await prisma.candyEvent.findFirst({
        include: { channels: true },
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json({ success: true, event });
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
    }

    return NextResponse.json({ success: true, event });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// Send Command to Bot (START, PAUSE, RESUME, END, DROP_NOW)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const body = await req.json();
    const { type, reason, payload } = body;

    // If starting event, ensure latest event endsAt is in future and status isn't stuck at ENDED
    if (type === "EVENT_START") {
      const latest = await prisma.candyEvent.findFirst({ orderBy: { createdAt: "desc" } });
      if (latest && (latest.status === "ENDED" || latest.endsAt <= new Date())) {
        await prisma.candyEvent.update({
          where: { id: latest.id },
          data: {
            status: "DRAFT",
            endsAt: new Date(Date.now() + 2 * 3600 * 1000), // extend 2 hours by default if expired
          },
        });
      }
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
