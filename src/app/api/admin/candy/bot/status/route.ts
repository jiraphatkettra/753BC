import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET() {
  try {
    const setting = await prisma.candySetting.findUnique({
      where: { key: "bot:heartbeat" },
    });
    if (!setting) {
      return NextResponse.json({ online: false });
    }
    return NextResponse.json(setting.value, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ online: false, error: err.message }, { status: 500 });
  }
}
