import { NextResponse } from "next/server";
import { getAdminDiscordIds, isDiscordAdmin } from "@/lib/admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { discordId } = body;

    if (!discordId || typeof discordId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid discordId" },
        { status: 400 }
      );
    }

    const isAdmin = isDiscordAdmin(discordId);
    const adminList = getAdminDiscordIds();

    return NextResponse.json({
      authorized: isAdmin,
      discordId: discordId.trim(),
      adminCount: adminList.length,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const adminIds = getAdminDiscordIds();
  return NextResponse.json({
    totalAdmins: adminIds.length,
    configured: adminIds.length > 0,
  });
}
