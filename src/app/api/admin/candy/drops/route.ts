import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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

    return NextResponse.json({ success: true, drops });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// Manual Drop Command
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const body = await req.json();
    const { channelId, amount, maxClaimers } = body;

    const cmd = await prisma.candyCommand.create({
      data: {
        type: "DROP_NOW",
        payload: { channelId, amount, maxClaimers },
        status: "PENDING",
        createdBy: session?.user?.discordId || "web-admin",
      },
    });

    return NextResponse.json({ success: true, command: cmd });
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

    const cmd = await prisma.candyCommand.create({
      data: {
        type: "DROP_CANCEL",
        payload: { dropId },
        status: "PENDING",
        createdBy: session?.user?.discordId || "web-admin",
      },
    });

    return NextResponse.json({ success: true, command: cmd });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

