import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export interface TopupHistoryItem {
  id: string;
  amount: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  slipUrl: string;
  createdAt: string;
  rejectReason?: string | null;
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "กรุณาเข้าสู่ระบบ" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const discordId = session.user.discordId || "";

    let items: TopupHistoryItem[] = [];

    try {
      const rows: any = await prisma.$queryRawUnsafe(
        `
        SELECT "id", "amount", "status"::text as "status", "imageUrl", "note", "createdAt"
        FROM "slips"
        WHERE "userId" = $1 OR "discordId" = $2
        ORDER BY "createdAt" DESC
        LIMIT 20
      `,
        userId,
        discordId
      );

      if (rows && rows.length > 0) {
        items = rows.map((r: any) => ({
          id: r.id,
          amount: Number(r.amount || 0),
          status: (r.status || "PENDING").toUpperCase() as any,
          slipUrl: r.imageUrl || "",
          createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
          rejectReason: r.note || null,
        }));
      }
    } catch (err) {
      console.warn("Notice: Database topup history query fallback:", err);
    }

    return NextResponse.json({ items });
  } catch (err: any) {
    console.error("API /api/topup/history error:", err);
    return NextResponse.json(
      { error: "FETCH_FAILED", message: err.message || "Failed to fetch topup history" },
      { status: 500 }
    );
  }
}
