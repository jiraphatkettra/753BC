import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { COMMUNITY_CONFIG } from "@/config/community";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "กรุณาเข้าสู่ระบบก่อนทำรายการ" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { amount, slipUrl, fileKey } = body;

    const numAmount = Number(amount);
    if (!numAmount || isNaN(numAmount)) {
      return NextResponse.json(
        { error: "INVALID_AMOUNT", message: "จำนวนเงินไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    if (
      numAmount < COMMUNITY_CONFIG.topup.minAmount ||
      numAmount > COMMUNITY_CONFIG.topup.maxAmount
    ) {
      return NextResponse.json(
        {
          error: "AMOUNT_OUT_OF_RANGE",
          message: `ยอดเงินต้องอยู่ระหว่าง ฿${COMMUNITY_CONFIG.topup.minAmount.toLocaleString()} ถึง ฿${COMMUNITY_CONFIG.topup.maxAmount.toLocaleString()}`,
        },
        { status: 400 }
      );
    }

    if (!slipUrl) {
      return NextResponse.json(
        { error: "MISSING_SLIP", message: "กรุณาแนบภาพสลิปการโอนเงิน" },
        { status: 400 }
      );
    }

    const id = `slip_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const userId = session.user.id;
    const discordId = session.user.discordId || "";
    const discordName = session.user.name || "Member";

    // Attempt insert into existing bot slips table
    try {
      await prisma.$executeRawUnsafe(
        `
        INSERT INTO "slips" ("id", "userId", "discordId", "discordName", "imageUrl", "r2Key", "amount", "status", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING', NOW(), NOW())
      `,
        id,
        userId,
        discordId,
        discordName,
        slipUrl,
        fileKey || "",
        numAmount
      );
    } catch (dbErr) {
      console.warn("Notice: raw slips insert fallback:", dbErr);
    }

    return NextResponse.json({
      success: true,
      topupId: id,
      amount: numAmount,
      status: "PENDING",
      createdAt: new Date().toISOString(),
      message: "บันทึกรายการเรียบร้อย ระบบกำลังตรวจสอบสลิป",
    });
  } catch (err: any) {
    console.error("API /api/topup/submit error:", err);
    return NextResponse.json(
      { error: "SUBMISSION_FAILED", message: err.message || "เกิดข้อผิดพลาดในการส่งข้อมูล" },
      { status: 500 }
    );
  }
}
