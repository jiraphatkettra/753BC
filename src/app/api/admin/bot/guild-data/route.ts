import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isDiscordAdmin } from "@/lib/admin";
import { fetchGuildChannels, fetchGuildRoles } from "@/lib/discord-bot";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const isAdmin = isDiscordAdmin(session?.user?.discordId) || session?.user?.isAdmin;

    if (!isAdmin && process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "FORBIDDEN", message: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้" },
        { status: 403 }
      );
    }

    try {
      const [channels, roles] = await Promise.all([
        fetchGuildChannels(),
        fetchGuildRoles(),
      ]);

      return NextResponse.json({
        success: true,
        channels,
        roles,
      });
    } catch (botErr: any) {
      console.warn("Discord Bot API error (fallback provided):", botErr.message);
      // Fallback for offline bot or local testing
      return NextResponse.json({
        success: true,
        isFallback: true,
        message: botErr.message,
        channels: [
          { id: "1553705384018051112", name: "╭﹒ พูดคุย · 01 ﹒🥪 ⁺", type: 0 },
          { id: "1553705384018051113", name: "📢﹒ประกาศทางการ", type: 5 },
          { id: "1553705384018051114", name: "🛒﹒สั่งซื้อสินค้า-nitro", type: 0 },
          { id: "1553705384018051115", name: "🚀﹒บริการบูสต์-boost", type: 0 },
          { id: "1553705384018051116", name: "🎫﹒เปิดตั๋วติดต่อ", type: 0 },
        ],
        roles: [
          { id: "r1", name: "👑 เจ้าของเซิร์ฟเวอร์ (Owner)", color: "#ef4444", position: 10 },
          { id: "r2", name: "🛡️ ผู้ดูแลระบบ (Admin)", color: "#3b82f6", position: 9 },
          { id: "r3", name: "💎 753BC VIP", color: "#a855f7", position: 5 },
        ],
      });
    }
  } catch (err: any) {
    console.error("GET /api/admin/bot/guild-data error:", err);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: err.message },
      { status: 500 }
    );
  }
}
