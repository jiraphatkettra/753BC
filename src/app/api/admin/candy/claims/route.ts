import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const suspicious = searchParams.get("suspicious");

    const where: any = {};
    if (suspicious === "1") {
      // Latency < 250ms or voiceSeconds < 10
      where.OR = [
        { latencyMs: { lte: 250 } },
        { voiceSeconds: { lt: 10 } },
      ];
    }

    const claims = await prisma.candyClaim.findMany({
      where,
      include: { drop: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json(
      { success: true, claims },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
