import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auditLogs = await prisma.candyAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const commands = await prisma.candyCommand.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ success: true, auditLogs, commands });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

