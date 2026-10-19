import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isDiscordAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const isAdmin = isDiscordAdmin(session?.user?.discordId) || session?.user?.isAdmin;

    // Allow in development or if user is authorized admin
    if (!isAdmin && process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "FORBIDDEN", message: "คุณไม่มีสิทธิ์เข้าถึงหน้านี้" },
        { status: 403 }
      );
    }

    // 1. Slips & Revenue statistics
    let totalRevenue = 0;
    let pendingSlipsCount = 0;
    let approvedSlipsCount = 0;
    let rejectedSlipsCount = 0;
    let recentSlips: any[] = [];

    try {
      const slipStats: any = await prisma.$queryRawUnsafe(`
        SELECT 
          COUNT(CASE WHEN "status"::text = 'PENDING' THEN 1 END) as pending_count,
          COUNT(CASE WHEN "status"::text = 'APPROVED' THEN 1 END) as approved_count,
          COUNT(CASE WHEN "status"::text = 'REJECTED' THEN 1 END) as rejected_count,
          COALESCE(SUM(CASE WHEN "status"::text = 'APPROVED' THEN "amount" ELSE 0 END), 0) as total_revenue
        FROM "slips"
      `);

      if (slipStats && slipStats[0]) {
        pendingSlipsCount = Number(slipStats[0].pending_count || 0);
        approvedSlipsCount = Number(slipStats[0].approved_count || 0);
        rejectedSlipsCount = Number(slipStats[0].rejected_count || 0);
        totalRevenue = Number(slipStats[0].total_revenue || 0);
      }

      recentSlips = await prisma.$queryRawUnsafe(`
        SELECT "id", "userId", "discordId", "discordName", "amount", "status"::text as "status", "imageUrl", "createdAt"
        FROM "slips"
        ORDER BY "createdAt" DESC
        LIMIT 6
      `);
    } catch (e) {
      console.warn("Slips stats query fallback:", e);
    }

    // 2. Events statistics
    let totalEvents = 0;
    let openEventsCount = 0;
    try {
      totalEvents = await prisma.event.count();
      openEventsCount = await prisma.event.count({
        where: {
          status: { in: ["OPEN", "UPCOMING"] },
        },
      });
    } catch (e) {
      console.warn("Events stats query fallback:", e);
    }

    // 3. Users count
    let totalUsers = 0;
    let totalBalanceInSystem = 0;
    try {
      const userStats: any = await prisma.$queryRawUnsafe(`
        SELECT 
          COUNT(*) as user_count,
          COALESCE(SUM("balance"), 0) as total_balance
        FROM "users"
      `);
      if (userStats && userStats[0]) {
        totalUsers = Number(userStats[0].user_count || 0);
        totalBalanceInSystem = Number(userStats[0].total_balance || 0);
      }
    } catch (e) {
      console.warn("User stats query fallback:", e);
    }

    return NextResponse.json({
      revenue: totalRevenue,
      pendingSlips: pendingSlipsCount,
      approvedSlips: approvedSlipsCount,
      rejectedSlips: rejectedSlipsCount,
      totalEvents,
      openEvents: openEventsCount,
      totalUsers,
      totalBalance: totalBalanceInSystem,
      recentSlips: recentSlips || [],
      serverTime: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("Admin overview error:", err);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: err.message },
      { status: 500 }
    );
  }
}
