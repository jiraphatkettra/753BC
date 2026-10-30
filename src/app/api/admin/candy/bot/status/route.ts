import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const setting = await prisma.candySetting.findUnique({
      where: { key: "bot:heartbeat" },
    });
    if (!setting) {
      return NextResponse.json({ online: false });
    }
    return NextResponse.json(setting.value);
  } catch (err: any) {
    return NextResponse.json({ online: false, error: err.message });
  }
}

