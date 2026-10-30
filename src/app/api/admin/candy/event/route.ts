import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {  DEFAULT_EVENT_CONFIG, EventConfigSchema  } from "@/lib/candy";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const event = await prisma.candyEvent.findFirst({
      where: { status: { in: ["RUNNING", "PAUSED", "SCHEDULED", "DRAFT"] } },
      include: { channels: true },
      orderBy: { startsAt: "asc" },
    });
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

    let event = await prisma.candyEvent.findFirst({
      where: { status: { in: ["DRAFT", "SCHEDULED", "RUNNING", "PAUSED"] } },
    });

    if (event) {
      event = await prisma.candyEvent.update({
        where: { id: event.id },
        data: {
          name: name || event.name,
          startsAt: startsAt ? new Date(startsAt) : event.startsAt,
          endsAt: endsAt ? new Date(endsAt) : event.endsAt,
          budgetTotal: budgetTotal !== undefined ? parseInt(budgetTotal, 10) : event.budgetTotal,
          config: config || event.config,
          configVersion: { increment: 1 },
        },
      });
    } else {
      event = await prisma.candyEvent.create({
        data: {
          name: name || "Trick or Treat 2026",
          status: "DRAFT",
          startsAt: startsAt ? new Date(startsAt) : new Date(),
          endsAt: endsAt ? new Date(endsAt) : new Date(Date.now() + 3600000),
          budgetTotal: budgetTotal ? parseInt(budgetTotal, 10) : 1000,
          config: config || DEFAULT_EVENT_CONFIG,
          createdBy: session?.user?.discordId || "admin",
        },
      });
    }

    return NextResponse.json({ success: true, event });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// Send Command to Bot (START, PAUSE, RESUME, END)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const body = await req.json();
    const { type, reason } = body;

    const command = await prisma.candyCommand.create({
      data: {
        type,
        payload: { reason },
        status: "PENDING",
        createdBy: session?.user?.discordId || "web-admin",
      },
    });

    return NextResponse.json({ success: true, command });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

