import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const event = await prisma.candyEvent.findFirst({
      where: { status: { in: ["RUNNING", "PAUSED", "SCHEDULED"] } },
      select: {
        id: true,
        name: true,
        status: true,
        startsAt: true,
        endsAt: true,
        budgetTotal: true,
        budgetClaimed: true,
      },
    });

    const totalClaims = await prisma.candyClaim.count();
    const totalUsers = await prisma.candyWallet.count();

    const top5 = await prisma.candyWallet.findMany({
      orderBy: { totalEarned: "desc" },
      take: 5,
      select: {
        discordId: true,
        username: true,
        displayName: true,
        avatar: true,
        totalEarned: true,
      },
    });

    return NextResponse.json({
      success: true,
      event,
      totalClaims,
      totalUsers,
      top5,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

