import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");

    const where: any = {};
    if (search) {
      where.OR = [
        { discordId: { contains: search } },
        { username: { contains: search, mode: "insensitive" } },
        { displayName: { contains: search, mode: "insensitive" } },
      ];
    }

    const wallets = await prisma.candyWallet.findMany({
      where,
      orderBy: { totalEarned: "desc" },
      take: 50,
    });

    return NextResponse.json({ success: true, wallets });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// Adjust balance
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const body = await req.json();
    const { discordId, delta, reason } = body;

    if (!discordId || delta === undefined || !reason) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    const deltaNum = parseInt(delta, 10);
    const actor = session?.user?.discordId || "web-admin";

    const result = await prisma.$transaction(async (tx) => {
      const wallet = await tx.candyWallet.upsert({
        where: { discordId },
        create: { discordId, balance: 0, totalEarned: 0 },
        update: {},
      });

      if (wallet.balance + deltaNum < 0) {
        throw new Error("à¸¢à¸­à¸”à¸„à¸‡à¹€à¸«à¸¥à¸·à¸­à¹„à¸¡à¹ˆà¹€à¸žà¸µà¸¢à¸‡à¸žà¸­à¸ªà¸³à¸«à¸£à¸±à¸šà¸à¸²à¸£à¸«à¸±à¸");
      }

      const newBalance = wallet.balance + deltaNum;
      const newTotal = deltaNum > 0 ? wallet.totalEarned + deltaNum : wallet.totalEarned;

      await tx.candyWallet.update({
        where: { discordId },
        data: { balance: newBalance, totalEarned: newTotal },
      });

      await tx.candyLedger.create({
        data: {
          discordId,
          delta: deltaNum,
          balanceAfter: newBalance,
          type: deltaNum > 0 ? "ADMIN_GIVE" : "ADMIN_TAKE",
          refType: "admin",
          refId: actor,
          reason,
          actor,
        },
      });

      await tx.candyAuditLog.create({
        data: {
          actor,
          action: "wallet.adjust",
          target: discordId,
          meta: { delta: deltaNum, balanceAfter: newBalance, reason },
        },
      });

      return { balanceAfter: newBalance };
    });

    return NextResponse.json({ success: true, balanceAfter: result.balanceAfter });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

