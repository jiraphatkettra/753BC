import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const event = await prisma.candyEvent.findFirst({
      where: { status: { in: ["RUNNING", "PAUSED", "SCHEDULED"] } },
      orderBy: { startsAt: "asc" },
    });

    const totalDrops = event ? await prisma.candyDrop.count({ where: { eventId: event.id } }) : 0;
    const activeDrops = event ? await prisma.candyDrop.count({ where: { eventId: event.id, status: "ACTIVE" } }) : 0;
    const totalClaims = event ? await prisma.candyClaim.count({ where: { eventId: event.id } }) : 0;
    const totalUsers = await prisma.candyWallet.count();

    const recentClaims = await prisma.candyClaim.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
    });

    const recentDrops = await prisma.candyDrop.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      event,
      stats: {
        budgetTotal: event?.budgetTotal || 0,
        budgetClaimed: event?.budgetClaimed || 0,
        budgetReserved: event?.budgetReserved || 0,
        budgetRemaining: event ? event.budgetTotal - event.budgetReserved : 0,
        totalDrops,
        activeDrops,
        totalClaims,
        totalUsers,
      },
      recentClaims,
      recentDrops,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

