import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const discordId = session?.user?.discordId;
    if (!discordId) {
      return NextResponse.json({ success: false, message: "Unauthorized - กรุณาเข้าสู่ระบบก่อน" }, { status: 401 });
    }

    const setting = await prisma.candySetting.findUnique({ where: { key: "redeemOpen" } });
    if (!setting?.value) {
      return NextResponse.json(
        { success: false, message: "ระบบแลกเงินยังไม่เปิดให้บริการในขณะนี้ กรุณารอประกาศจากทีมงาน" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { amount, payoutTarget, accountName } = body;

    const amountNum = parseInt(amount, 10);
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json({ success: false, message: "จำนวนลูกอมต้องเป็นตัวเลขจำนวนเต็มบวก" }, { status: 400 });
    }

    if (!payoutTarget || !payoutTarget.trim()) {
      return NextResponse.json(
        { success: false, message: "กรุณาระบุเบอร์พร้อมเพย์ (10 หลัก) หรือเลขบัตรประชาชน (13 หลัก)" },
        { status: 400 }
      );
    }

    const cleanTarget = payoutTarget.replace(/[^0-9]/g, "");
    if (cleanTarget.length !== 10 && cleanTarget.length !== 13) {
      return NextResponse.json(
        {
          success: false,
          message: "รูปแบบเลขพร้อมเพย์ไม่ถูกต้อง (ต้องเป็นเบอร์มือถือ 10 หลัก หรือเลขบัตรประชาชน 13 หลัก)",
        },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const wallet = await tx.candyWallet.findUnique({ where: { discordId } });
      if (!wallet || wallet.balance < amountNum) {
        throw new Error("ยอดลูกอมคงเหลือไม่เพียงพอสำหรับการแลก");
      }
      if (wallet.blocked) {
        throw new Error("บัญชีของคุณถูกระงับสิทธิ์การร่วมกิจกรรม");
      }

      const pending = await tx.candyRedemption.findFirst({
        where: { discordId, status: "PENDING" },
      });
      if (pending) {
        throw new Error("คุณมีคำขอแลกเงินค้างอยู่ในระบบอยู่แล้ว โปรดรอการดำเนินการก่อนส่งคำขอใหม่");
      }

      const newBalance = wallet.balance - amountNum;
      await tx.candyWallet.update({
        where: { discordId },
        data: {
          balance: newBalance,
          totalRedeemed: { increment: amountNum },
        },
      });

      const redRecord = await tx.candyRedemption.create({
        data: {
          discordId,
          amount: amountNum,
          bahtAmount: amountNum * 1, // 1 Candy = 1 THB
          payoutMethod: "PROMPTPAY",
          payoutTarget: cleanTarget,
          accountName: accountName?.trim() || null,
          status: "PENDING",
        },
      });

      await tx.candyLedger.create({
        data: {
          discordId,
          delta: -amountNum,
          balanceAfter: newBalance,
          type: "REDEEM_HOLD",
          refType: "redemption",
          refId: redRecord.id,
          reason: `ระงับลูกอมเพื่อรอโอนเงิน ฿${amountNum} (#${redRecord.id.slice(-6)})`,
          actor: discordId,
        },
      });

      return redRecord;
    });

    return NextResponse.json({ success: true, redemption: result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
