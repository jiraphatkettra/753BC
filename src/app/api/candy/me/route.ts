import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    const discordId = session?.user?.discordId;
    if (!discordId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const wallet = await prisma.candyWallet.findUnique({
      where: { discordId },
    });

    const ledgers = await prisma.candyLedger.findMany({
      where: { discordId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const redemptions = await prisma.candyRedemption.findMany({
      where: { discordId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const setting = await prisma.candySetting.findUnique({ where: { key: "redeemOpen" } });
    const redeemOpen = Boolean(setting?.value);

    return NextResponse.json({
      success: true,
      wallet: wallet || { balance: 0, totalEarned: 0, claimCount: 0 },
      ledgers,
      redemptions,
      redeemOpen,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

