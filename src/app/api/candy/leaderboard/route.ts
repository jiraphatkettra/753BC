import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const topWallets = await prisma.candyWallet.findMany({
      orderBy: { totalEarned: "desc" },
      take: 50,
      select: {
        discordId: true,
        username: true,
        displayName: true,
        avatar: true,
        balance: true,
        totalEarned: true,
        claimCount: true,
      },
    });

    return NextResponse.json({ success: true, leaderboard: topWallets });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

