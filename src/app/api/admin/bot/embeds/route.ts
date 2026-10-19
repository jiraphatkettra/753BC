import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isDiscordAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { DEFAULT_EMBED_PRESETS, EmbedConfig } from "@/config/embedPresets";
import { sendDiscordEmbed, getPanelComponents } from "@/lib/discord-bot";

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

    // Read saved custom overrides from `settings` table
    let savedSettings: any[] = [];
    try {
      savedSettings = await prisma.$queryRawUnsafe(`
        SELECT "key", "value" 
        FROM "settings" 
        WHERE "key" LIKE 'embed_config:%'
      `);
    } catch (e) {
      console.warn("Failed to load custom embed settings from DB:", e);
    }

    const savedMap: Record<string, Partial<EmbedConfig>> = {};
    for (const s of savedSettings) {
      try {
        const parsedKey = s.key.replace(/^embed_config:/, "");
        savedMap[parsedKey] = JSON.parse(s.value);
      } catch (err) {
        console.error("Failed to parse saved embed config:", s.key, err);
      }
    }

    // Merge default presets with saved overrides
    const presets: Array<EmbedConfig & { isCustomized: boolean }> = [];
    for (const [key, preset] of Object.entries(DEFAULT_EMBED_PRESETS)) {
      const custom = savedMap[key];
      if (custom) {
        presets.push({
          ...preset,
          ...custom,
          isCustomized: true,
        });
      } else {
        presets.push({
          ...preset,
          isCustomized: false,
        });
      }
    }

    // Also include any user-created custom templates
    for (const [key, custom] of Object.entries(savedMap)) {
      if (!DEFAULT_EMBED_PRESETS[key]) {
        presets.push({
          ...(custom as EmbedConfig),
          isCustomized: true,
        });
      }
    }

    return NextResponse.json({
      success: true,
      presets,
    });
  } catch (err: any) {
    console.error("GET /api/admin/bot/embeds error:", err);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: err.message },
      { status: 500 }
    );
  }
}

// PUT - Save/update custom preset in database
export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    const isAdmin = isDiscordAdmin(session?.user?.discordId) || session?.user?.isAdmin;

    if (!isAdmin && process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "FORBIDDEN", message: "คุณไม่มีสิทธิ์ดำเนินการนี้" },
        { status: 403 }
      );
    }

    const body: EmbedConfig = await req.json();
    if (!body || !body.key) {
      return NextResponse.json(
        { error: "BAD_REQUEST", message: "ข้อมูล Embed ไม่สมบูรณ์ (ขาด key)" },
        { status: 400 }
      );
    }

    const settingKey = `embed_config:${body.key}`;
    const jsonValue = JSON.stringify(body);

    await prisma.$executeRawUnsafe(`
      INSERT INTO "settings" ("id", "key", "value", "category", "description", "updatedAt")
      VALUES (
        gen_random_uuid()::text,
        $1,
        $2,
        'embed_config',
        $3,
        NOW()
      )
      ON CONFLICT ("key") 
      DO UPDATE SET 
        "value" = EXCLUDED."value",
        "updatedAt" = NOW()
    `, settingKey, jsonValue, `Custom Embed Configuration for ${body.name || body.key}`);

    return NextResponse.json({
      success: true,
      message: `บันทึกเทมเพลต Embed '${body.name}' เรียบร้อยแล้ว`,
      embed: body,
    });
  } catch (err: any) {
    console.error("PUT /api/admin/bot/embeds error:", err);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: err.message },
      { status: 500 }
    );
  }
}

// POST - Send embed message directly to Discord channel via Bot
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const isAdmin = isDiscordAdmin(session?.user?.discordId) || session?.user?.isAdmin;

    if (!isAdmin && process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "FORBIDDEN", message: "คุณไม่มีสิทธิ์ส่ง Embed ผ่านบอท" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { channelId, embed, content } = body as {
      channelId: string;
      embed: EmbedConfig;
      content?: string;
    };

    if (!channelId || !channelId.trim()) {
      return NextResponse.json(
        { error: "BAD_REQUEST", message: "กรุณาระบุห้อง Discord (Channel ID) ที่ต้องการส่ง" },
        { status: 400 }
      );
    }

    if (!embed) {
      return NextResponse.json(
        { error: "BAD_REQUEST", message: "ข้อมูล Embed ไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    // Build Discord embed payload
    const payload: any = {
      color: embed.color?.enabled ? embed.color.hex : "#070809",
    };

    if (embed.title?.enabled && embed.title.text) {
      payload.title = embed.title.text;
      if (embed.title.url) payload.url = embed.title.url;
    }

    if (embed.descriptionText?.enabled && embed.descriptionText.text) {
      payload.description = embed.descriptionText.text;
    }

    if (embed.author?.enabled && embed.author.name) {
      payload.author = {
        name: embed.author.name,
        icon_url: embed.author.iconUrl || undefined,
        url: embed.author.url || undefined,
      };
    }

    if (embed.thumbnail?.enabled && embed.thumbnail.url) {
      payload.thumbnail = { url: embed.thumbnail.url };
    }

    if (embed.image?.enabled && embed.image.url) {
      payload.image = { url: embed.image.url };
    }

    if (embed.footer?.enabled && embed.footer.text) {
      payload.footer = {
        text: embed.footer.text,
        icon_url: embed.footer.iconUrl || undefined,
      };
    }

    if (embed.timestamp?.enabled) {
      payload.timestamp = new Date().toISOString();
    }

    if (embed.fields?.enabled && Array.isArray(embed.fields.items)) {
      payload.fields = embed.fields.items
        .filter((f) => f.name && f.value)
        .map((f) => ({
          name: f.name,
          value: f.value,
          inline: Boolean(f.inline),
        }));
    }

    const components = getPanelComponents(embed.key);
    const result = await sendDiscordEmbed(channelId.trim(), payload, content, components);

    return NextResponse.json({
      success: true,
      message: `ส่งแผงควบคุม / Embed '${embed.name}' ไปยังห้อง Discord สำเร็จ! (Message ID: ${result.id})`,
      messageId: result.id,
      channelId,
    });
  } catch (err: any) {
    console.error("POST /api/admin/bot/embeds error:", err);
    return NextResponse.json(
      { error: "DISCORD_ERROR", message: err.message || "เกิดข้อผิดพลาดในการส่ง Embed" },
      { status: 500 }
    );
  }
}
