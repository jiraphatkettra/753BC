import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendCandyPayoutDMNotification } from "@/lib/discord";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const redemptions = await prisma.candyRedemption.findMany({
      where: status ? { status: status as any } : {},
      orderBy: { createdAt: "desc" },
    });

    const totalPendingBaht = redemptions
      .filter((r) => r.status === "PENDING" || r.status === "APPROVED")
      .reduce((acc, r) => acc + r.bahtAmount, 0);

    const setting = await prisma.candySetting.findUnique({ where: { key: "redeemOpen" } });
    const redeemOpen = Boolean(setting?.value);

    return NextResponse.json({ success: true, redemptions, totalPendingBaht, redeemOpen });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// Update Redemption status (Approve, Reject, Paid) or toggle redeemOpen
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    const body = await req.json();
    const { id, action, rejectReason, slipUrl, toggleRedeemOpen } = body;
    const actor = session?.user?.discordId || "web-admin";

    // Toggle redeem open
    if (toggleRedeemOpen !== undefined) {
      await prisma.candySetting.upsert({
        where: { key: "redeemOpen" },
        create: { key: "redeemOpen", value: Boolean(toggleRedeemOpen) },
        update: { value: Boolean(toggleRedeemOpen) },
      });
      return NextResponse.json({ success: true, redeemOpen: Boolean(toggleRedeemOpen) });
    }

    if (!id) return NextResponse.json({ success: false, message: "Missing id" }, { status: 400 });

    const redemption = await prisma.candyRedemption.findUnique({ where: { id } });
    if (!redemption) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });

    let dmResult: { success: boolean; error?: string } = { success: false };

    if (action === "APPROVE") {
      await prisma.candyRedemption.update({
        where: { id },
        data: { status: "APPROVED", reviewedBy: actor, reviewedAt: new Date() },
      });

      await prisma.candyAuditLog.create({
        data: {
          actor,
          action: "REDEMPTION_APPROVE",
          target: redemption.discordId,
          meta: { redemptionId: id, amount: redemption.amount, bahtAmount: redemption.bahtAmount },
        },
      });
    } else if (action === "REJECT") {
      // Refund candies to user wallet
      await prisma.$transaction(async (tx) => {
        await tx.candyRedemption.update({
          where: { id },
          data: {
            status: "REJECTED",
            rejectReason: rejectReason || "ข้อมูลไม่ถูกต้อง",
            reviewedBy: actor,
            reviewedAt: new Date(),
          },
        });

        const wallet = await tx.candyWallet.update({
          where: { discordId: redemption.discordId },
          data: {
            balance: { increment: redemption.amount },
            totalRedeemed: { decrement: redemption.amount },
          },
        });

        await tx.candyLedger.create({
          data: {
            discordId: redemption.discordId,
            delta: redemption.amount,
            balanceAfter: wallet.balance,
            type: "REDEEM_REFUND",
            refType: "redemption",
            refId: id,
            reason: `คืนลูกอมเนื่องจากปฏิเสธคำขอ: ${rejectReason || "ไม่ระบุ"}`,
            actor,
          },
        });

        await tx.candyAuditLog.create({
          data: {
            actor,
            action: "REDEMPTION_REJECT",
            target: redemption.discordId,
            meta: { redemptionId: id, amount: redemption.amount, rejectReason },
          },
        });
      });
    } else if (action === "PAID") {
      const paidAt = new Date();
      await prisma.candyRedemption.update({
        where: { id },
        data: { status: "PAID", slipUrl, paidAt, reviewedBy: actor },
      });

      await prisma.candyAuditLog.create({
        data: {
          actor,
          action: "REDEMPTION_PAID",
          target: redemption.discordId,
          meta: {
            redemptionId: id,
            amount: redemption.amount,
            bahtAmount: redemption.bahtAmount,
            payoutTarget: redemption.payoutTarget,
          },
        },
      });

      // Send Direct Message (DM) to User's Discord
      dmResult = await sendCandyPayoutDMNotification({
        discordId: redemption.discordId,
        amount: redemption.amount,
        bahtAmount: redemption.bahtAmount,
        payoutTarget: redemption.payoutTarget,
        accountName: redemption.accountName,
        redemptionId: redemption.id,
        paidAt,
      });
    }

    return NextResponse.json({
      success: true,
      dmSent: dmResult.success,
      dmError: dmResult.error,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
