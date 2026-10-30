import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET() {
  try {
    // 1. Find currently active event first (latest created)
    let event = await prisma.candyEvent.findFirst({
      where: { status: { in: ["RUNNING", "PAUSED", "SCHEDULED"] } },
      orderBy: { createdAt: "desc" },
    });

    // 2. If no running event, fall back to the most recent event (even if ENDED or DRAFT)
    if (!event) {
      event = await prisma.candyEvent.findFirst({
        orderBy: { createdAt: "desc" },
      });
    }

    const eventId = event?.id;

    // 3. Exact real-time aggregates directly from database records
    const [totalDrops, activeDrops, totalClaims, claimsAgg, activeDropsAgg, totalUsers] = await Promise.all([
      eventId ? prisma.candyDrop.count({ where: { eventId } }) : 0,
      eventId ? prisma.candyDrop.count({ where: { eventId, status: "ACTIVE" } }) : 0,
      eventId ? prisma.candyClaim.count({ where: { eventId } }) : 0,
      eventId
        ? prisma.candyClaim.aggregate({ where: { eventId }, _sum: { amount: true } })
        : { _sum: { amount: 0 } },
      eventId
        ? prisma.candyDrop.aggregate({ where: { eventId, status: "ACTIVE" }, _sum: { amount: true } })
        : { _sum: { amount: 0 } },
      prisma.candyWallet.count(),
    ]);

    const actualClaimed = Math.max(event?.budgetClaimed || 0, claimsAgg._sum?.amount || 0);
    const activeReserved = activeDropsAgg._sum?.amount || 0;
    const actualReserved = Math.max(event?.budgetReserved || 0, actualClaimed + activeReserved);
    const budgetTotal = event?.budgetTotal || 0;
    const budgetRemaining = Math.max(0, budgetTotal - actualReserved);

    // 4. Fetch recent claims with user display names
    const recentClaimsRaw = await prisma.candyClaim.findMany({
      where: eventId ? { eventId } : undefined,
      take: 8,
      orderBy: { createdAt: "desc" },
    });

    const userIds = [...new Set(recentClaimsRaw.map((c) => c.discordId))];
    const wallets = await prisma.candyWallet.findMany({
      where: { discordId: { in: userIds } },
      select: { discordId: true, username: true, displayName: true, avatar: true },
    });
    const walletMap = new Map(wallets.map((w) => [w.discordId, w]));

    const recentClaims = recentClaimsRaw.map((c) => {
      const w = walletMap.get(c.discordId);
      return {
        ...c,
        userName: w?.displayName || w?.username || c.discordId,
        avatarUrl: w?.avatar,
      };
    });

    // 5. Fetch recent drops with human-readable channel names
    const recentDropsRaw = await prisma.candyDrop.findMany({
      where: eventId ? { eventId } : undefined,
      take: 6,
      orderBy: { createdAt: "desc" },
    });

    const channelIds = [...new Set(recentDropsRaw.map((d) => d.channelId))];
    const channels = await prisma.candyChannel.findMany({
      where: { channelId: { in: channelIds } },
      select: { channelId: true, name: true },
    });
    const channelMap = new Map(channels.map((ch) => [ch.channelId, ch.name]));

    const recentDrops = recentDropsRaw.map((d) => ({
      ...d,
      channelName: channelMap.get(d.channelId) || d.channelId,
    }));

    return NextResponse.json(
      {
        success: true,
        event,
        stats: {
          budgetTotal,
          budgetClaimed: actualClaimed,
          budgetReserved: actualReserved,
          budgetRemaining,
          totalDrops,
          activeDrops,
          totalClaims,
          totalUsers,
        },
        recentClaims,
        recentDrops,
        timestamp: Date.now(),
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
