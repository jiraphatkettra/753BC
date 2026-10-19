import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isDiscordAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET - List users and their voice hours with search and pagination
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

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("q")?.trim() || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") || "10", 10)));
    const offset = (page - 1) * limit;

    // Aggregated query of users with their voice statistics
    let usersQuery = `
      SELECT 
        u.id,
        u."discordId",
        u.username,
        u."displayName",
        u.avatar,
        u.role,
        ROUND(COALESCE(SUM(vs.duration), 0) / 3600.0, 1)::float as "hours",
        COALESCE(SUM(vs.duration), 0)::int as "totalSeconds",
        COUNT(vs.id)::int as "sessionCount",
        MAX(vs."joinedAt") as "lastActiveAt"
      FROM "users" u
      LEFT JOIN "voice_sessions" vs ON u.id = vs."userId"
    `;

    const conditions: string[] = [];
    const params: any[] = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(u.username ILIKE $${params.length} OR u."displayName" ILIKE $${params.length} OR u."discordId" ILIKE $${params.length})`);
    }

    if (conditions.length > 0) {
      usersQuery += ` WHERE ${conditions.join(" AND ")}`;
    }

    usersQuery += `
      GROUP BY u.id, u."discordId", u.username, u."displayName", u.avatar, u.role
      ORDER BY "totalSeconds" DESC, u."createdAt" DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const countQuery = `
      SELECT COUNT(*)::int as total
      FROM "users" u
      ${conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""}
    `;

    const [users, totalCountResult] = (await Promise.all([
      prisma.$queryRawUnsafe(usersQuery, ...params),
      prisma.$queryRawUnsafe(countQuery, ...params),
    ])) as [any[], any[]];

    const total = totalCountResult[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      users: users.map((u) => ({
        id: u.id,
        discordId: u.discordId,
        username: u.username,
        displayName: u.displayName || u.username,
        avatar: u.avatar,
        role: u.role,
        hours: Number(u.hours || 0),
        totalSeconds: Number(u.totalSeconds || 0),
        sessionCount: Number(u.sessionCount || 0),
        lastActiveAt: u.lastActiveAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (err: any) {
    console.error("GET /api/admin/voice error:", err);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: err.message },
      { status: 500 }
    );
  }
}

// POST - Adjust or set a user's voice hours
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const isAdmin = isDiscordAdmin(session?.user?.discordId) || session?.user?.isAdmin;

    if (!isAdmin && process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "FORBIDDEN", message: "คุณไม่มีสิทธิ์แก้ไขชั่วโมงเสียง" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { userId, mode, hours, note } = body as {
      userId: string;
      mode: "ADD" | "SET"; // ADD = add delta hours, SET = override to exact hours
      hours: number;
      note?: string;
    };

    if (!userId) {
      return NextResponse.json(
        { error: "BAD_REQUEST", message: "กรุณาระบุ User ID ที่ต้องการปรับชั่วโมงเสียง" },
        { status: 400 }
      );
    }

    if (typeof hours !== "number" || isNaN(hours)) {
      return NextResponse.json(
        { error: "BAD_REQUEST", message: "จำนวนชั่วโมงต้องเป็นตัวเลขที่ถูกต้อง" },
        { status: 400 }
      );
    }

    // Verify user exists
    const userResult: any[] = await prisma.$queryRawUnsafe(
      `SELECT "id", "discordId", "username", "displayName" FROM "users" WHERE "id" = $1 LIMIT 1`,
      userId
    );

    if (!userResult || userResult.length === 0) {
      return NextResponse.json(
        { error: "NOT_FOUND", message: "ไม่พบผู้ใช้ในระบบ" },
        { status: 404 }
      );
    }

    const user = userResult[0];

    // Compute current total seconds
    const currentStats: any[] = await prisma.$queryRawUnsafe(
      `SELECT COALESCE(SUM("duration"), 0)::int as total FROM "voice_sessions" WHERE "userId" = $1`,
      userId
    );
    const currentSeconds = Number(currentStats[0]?.total || 0);

    let deltaSeconds = 0;
    if (mode === "ADD") {
      deltaSeconds = Math.round(hours * 3600);
    } else {
      // SET exact target hours
      const targetSeconds = Math.max(0, Math.round(hours * 3600));
      deltaSeconds = targetSeconds - currentSeconds;
    }

    if (deltaSeconds === 0) {
      return NextResponse.json({
        success: true,
        message: "จำนวนชั่วโมงเท่าเดิม ไม่มีการเปลี่ยนแปลง",
        currentHours: Number((currentSeconds / 3600).toFixed(1)),
      });
    }

    // Insert adjustment record in `voice_sessions`
    const now = new Date();
    await prisma.$executeRawUnsafe(`
      INSERT INTO "voice_sessions" (
        "id",
        "userId",
        "channelId",
        "channelName",
        "guildId",
        "joinedAt",
        "leftAt",
        "duration",
        "createdAt"
      ) VALUES (
        gen_random_uuid()::text,
        $1,
        'manual_admin_adjust',
        $2,
        $3,
        $4,
        $4,
        $5,
        $4
      )
    `,
      userId,
      `[ADMIN] ${note || (mode === "ADD" ? `ปรับเพิ่ม ${hours} ชม.` : `กำหนดเป็น ${hours} ชม.`)}`,
      process.env.DISCORD_GUILD_ID || "1549749097412431896",
      now,
      deltaSeconds
    );

    // Write audit log if table exists
    try {
      await prisma.$executeRawUnsafe(`
        INSERT INTO "audit_logs" (
          "id", "userId", "action", "category", "details", "createdAt"
        ) VALUES (
          gen_random_uuid()::text,
          $1,
          'VOICE_HOURS_ADJUSTED',
          'VOICE',
          $2,
          NOW()
        )
      `,
        session?.user?.id || userId,
        `ปรับชั่วโมงเสียงให้ ${user.displayName || user.username} (${mode === "ADD" ? `+${hours}` : `SET=${hours}`} ชม.) โดย ${session?.user?.name || "Admin"}`
      );
    } catch {
      // Ignore audit log error if not table exists
    }

    const newTotalSeconds = Math.max(0, currentSeconds + deltaSeconds);
    const newTotalHours = Number((newTotalSeconds / 3600).toFixed(1));

    return NextResponse.json({
      success: true,
      message: `ปรับปรุงชั่วโมงเสียงของ ${user.displayName || user.username} เรียบร้อยแล้ว (รวม ${newTotalHours} ชม.)`,
      newTotalHours,
      deltaHours: Number((deltaSeconds / 3600).toFixed(1)),
    });
  } catch (err: any) {
    console.error("POST /api/admin/voice error:", err);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: err.message },
      { status: 500 }
    );
  }
}
