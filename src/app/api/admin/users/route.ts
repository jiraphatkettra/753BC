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
    const search = searchParams.get("search")?.trim() || "";

    let users: any[] = [];
    try {
      if (search) {
        users = await prisma.$queryRawUnsafe(
          `
          SELECT "id", "discordId", "username", "displayName", "avatar", "email", "role"::text as "role", "balance", "createdAt"
          FROM "users"
          WHERE "discordId" ILIKE $1 
             OR "username" ILIKE $1 
             OR "displayName" ILIKE $1 
             OR "email" ILIKE $1
          ORDER BY "balance" DESC, "createdAt" DESC
          LIMIT 30
        `,
          `%${search}%`
        );
      } else {
        users = await prisma.$queryRawUnsafe(`
          SELECT "id", "discordId", "username", "displayName", "avatar", "email", "role"::text as "role", "balance", "createdAt"
          FROM "users"
          ORDER BY "balance" DESC, "createdAt" DESC
          LIMIT 30
        `);
      }
    } catch (e) {
      console.warn("Users list query fallback:", e);
    }

    return NextResponse.json({ users: users || [] });
  } catch (err: any) {
    console.error("GET /api/admin/users error:", err);
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
    const { userId, discordId, action, amount, note } = body;

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount < 0) {
      return NextResponse.json({ error: "BAD_REQUEST", message: "จำนวนเงินไม่ถูกต้อง" }, { status: 400 });
    }

    const adminName = session?.user?.name || "Admin";

    // 1. Fetch current user balance
    let currentBalance = 0;
    const userRows: any = await prisma.$queryRawUnsafe(
      `SELECT "id", "discordId", "username", "displayName", "balance" FROM "users" WHERE "id" = $1 OR "discordId" = $2 LIMIT 1`,
      userId || "",
      discordId || ""
    );

    if (!userRows || userRows.length === 0) {
      return NextResponse.json({ error: "NOT_FOUND", message: "ไม่พบผู้ใช้ในระบบ" }, { status: 404 });
    }

    currentBalance = Number(userRows[0].balance || 0);
    let newBalance = currentBalance;

    if (action === "ADD") {
      newBalance = currentBalance + numAmount;
    } else if (action === "DEDUCT") {
      newBalance = Math.max(0, currentBalance - numAmount);
    } else if (action === "SET") {
      newBalance = numAmount;
    } else {
      return NextResponse.json({ error: "INVALID_ACTION", message: "การกระทำไม่ถูกต้อง (ADD, DEDUCT, SET)" }, { status: 400 });
    }

    // 2. Update balance in database
    await prisma.$executeRawUnsafe(
      `
      UPDATE "users"
      SET "balance" = $1, "updatedAt" = NOW()
      WHERE "id" = $2 OR "discordId" = $3
    `,
      newBalance,
      userId || "",
      discordId || ""
    );

    // 3. Record transaction log
    try {
      await prisma.$executeRawUnsafe(
        `
        INSERT INTO "wallet_transactions" ("id", "userId", "type", "amount", "description", "createdAt")
        VALUES ($1, $2, 'ADJUST', $3, $4, NOW())
      `,
        `adj_${Date.now()}`,
        userId || discordId,
        action === "DEDUCT" ? -numAmount : numAmount,
        `Admin adjustment (${action}): ${note || "No reason specified"} by ${adminName}`
      );
    } catch (e) {
      // Ignore wallet_transactions error if not critical
    }

    return NextResponse.json({
      success: true,
      message: `ปรับยอดเงินสำเร็จ! ยอดปัจจุบัน: ฿${newBalance.toLocaleString()}`,
      newBalance,
      previousBalance: currentBalance,
    });
  } catch (err: any) {
    console.error("POST /api/admin/users error:", err);
    return NextResponse.json({ error: "INTERNAL_ERROR", message: err.message }, { status: 500 });
  }
}
