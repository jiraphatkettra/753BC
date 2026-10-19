import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isDiscordAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const isAdmin = isDiscordAdmin(session?.user?.discordId) || session?.user?.isAdmin;

    if (!isAdmin && process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status") || "ALL";

    let whereClause = "";
    if (statusFilter !== "ALL") {
      whereClause = `WHERE "status"::text = '${statusFilter.toUpperCase()}'`;
    }

    let slips: any[] = [];
    try {
      slips = await prisma.$queryRawUnsafe(`
        SELECT 
          "id", "userId", "discordId", "discordName", "imageUrl", "amount", 
          "status"::text as "status", "note", "reviewedByName", "reviewedAt", "createdAt"
        FROM "slips"
        ${whereClause}
        ORDER BY "createdAt" DESC
        LIMIT 50
      `);
    } catch (e) {
      console.warn("Slips list query error:", e);
    }

    return NextResponse.json({ slips: slips || [] });
  } catch (err: any) {
    console.error("GET /api/admin/slips error:", err);
    return NextResponse.json({ error: "INTERNAL_ERROR", message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const isAdmin = isDiscordAdmin(session?.user?.discordId) || session?.user?.isAdmin;

    if (!isAdmin && process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const body = await req.json();
    const { slipId, action, note } = body;

    if (!slipId || !action) {
      return NextResponse.json({ error: "BAD_REQUEST", message: "Missing slipId or action" }, { status: 400 });
    }

    const adminName = session?.user?.name || "Admin";
    const adminId = session?.user?.id || session?.user?.discordId || "admin";

    // 1. Fetch current slip
    const slipRows: any = await prisma.$queryRawUnsafe(
      `SELECT * FROM "slips" WHERE "id" = $1 LIMIT 1`,
      slipId
    );

    if (!slipRows || slipRows.length === 0) {
      return NextResponse.json({ error: "NOT_FOUND", message: "ไม่พบข้อมูลสลิปนี้" }, { status: 404 });
    }

    const slip = slipRows[0];
    const amount = Number(slip.amount || 0);

    if (action === "APPROVE") {
      // Mark slip as APPROVED
      await prisma.$executeRawUnsafe(
        `
        UPDATE "slips"
        SET 
          "status" = 'APPROVED'::"USER-DEFINED",
          "reviewedByName" = $1,
          "reviewedById" = $2,
          "reviewedAt" = NOW(),
          "updatedAt" = NOW()
        WHERE "id" = $3
      `,
        adminName,
        adminId,
        slipId
      );

      // Credit user's balance in users table
      if (slip.userId || slip.discordId) {
        try {
          await prisma.$executeRawUnsafe(
            `
            UPDATE "users"
            SET 
              "balance" = COALESCE("balance", 0) + $1,
              "updatedAt" = NOW()
            WHERE "id" = $2 OR "discordId" = $3
          `,
            amount,
            slip.userId || "",
            slip.discordId || ""
          );

          // Record in wallet_transactions
          await prisma.$executeRawUnsafe(
            `
            INSERT INTO "wallet_transactions" ("id", "userId", "type", "amount", "description", "createdAt")
            VALUES ($1, $2, 'TOPUP', $3, $4, NOW())
          `,
            `tx_${Date.now()}`,
            slip.userId || slip.discordId,
            amount,
            `Topup approved by ${adminName} (Slip: ${slipId})`
          );
        } catch (creditErr) {
          console.warn("User balance update notice:", creditErr);
        }
      }

      return NextResponse.json({
        success: true,
        message: `อนุมัติสลิปเรียบร้อยแล้ว เพิ่มยอด ฿${amount.toLocaleString()} ให้กับผู้ใช้`,
      });
    } else if (action === "REJECT") {
      // Mark slip as REJECTED with reason note
      const rejectReason = note || "ข้อมูลสลิปไม่ถูกต้อง หรือไม่พบยอดโอน";

      await prisma.$executeRawUnsafe(
        `
        UPDATE "slips"
        SET 
          "status" = 'REJECTED'::"USER-DEFINED",
          "note" = $1,
          "reviewedByName" = $2,
          "reviewedById" = $3,
          "reviewedAt" = NOW(),
          "updatedAt" = NOW()
        WHERE "id" = $4
      `,
        rejectReason,
        adminName,
        adminId,
        slipId
      );

      return NextResponse.json({
        success: true,
        message: `ปฏิเสธสลิปเรียบร้อยแล้ว (เหตุผล: ${rejectReason})`,
      });
    }

    return NextResponse.json({ error: "INVALID_ACTION" }, { status: 400 });
  } catch (err: any) {
    console.error("POST /api/admin/slips error:", err);
    return NextResponse.json({ error: "INTERNAL_ERROR", message: err.message }, { status: 500 });
  }
}
