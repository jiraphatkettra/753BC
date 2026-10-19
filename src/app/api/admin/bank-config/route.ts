import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isDiscordAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { COMMUNITY_CONFIG } from "@/config/community";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const isAdmin = isDiscordAdmin(session?.user?.discordId) || session?.user?.isAdmin;

    if (!isAdmin && process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const config = { ...COMMUNITY_CONFIG.topup };

    // Attempt to read customized values from Supabase settings table
    try {
      const rows: any = await prisma.$queryRawUnsafe(`
        SELECT "key", "value" FROM "settings"
        WHERE "key" IN ('promptpay_id', 'promptpay_account_name', 'promptpay_bank_name', 'topup_min_amount', 'topup_max_amount', 'topup_presets')
      `);

      if (rows && rows.length > 0) {
        for (const row of rows) {
          if (row.key === "promptpay_id" && row.value) config.promptPayId = row.value;
          if (row.key === "promptpay_account_name" && row.value) config.accountName = row.value;
          if (row.key === "promptpay_bank_name" && row.value) config.bankName = row.value;
          if (row.key === "topup_min_amount" && row.value) config.minAmount = Number(row.value);
          if (row.key === "topup_max_amount" && row.value) config.maxAmount = Number(row.value);
          if (row.key === "topup_presets" && row.value) {
            try {
              config.presets = JSON.parse(row.value);
            } catch {}
          }
        }
      }
    } catch (e) {
      console.warn("Settings query fallback:", e);
    }

    return NextResponse.json({ config });
  } catch (err: any) {
    console.error("GET /api/admin/bank-config error:", err);
    return NextResponse.json({ error: "INTERNAL_ERROR", message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const isAdmin = isDiscordAdmin(session?.user?.discordId) || session?.user?.isAdmin;

    if (!isAdmin && process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const body = await req.json();
    const {
      promptPayId,
      accountName,
      bankName,
      minAmount,
      maxAmount,
      presets,
    } = body;

    // Update in-memory configuration
    if (promptPayId) COMMUNITY_CONFIG.topup.promptPayId = promptPayId.trim();
    if (accountName) COMMUNITY_CONFIG.topup.accountName = accountName.trim();
    if (bankName) COMMUNITY_CONFIG.topup.bankName = bankName.trim();
    if (minAmount !== undefined) COMMUNITY_CONFIG.topup.minAmount = Number(minAmount);
    if (maxAmount !== undefined) COMMUNITY_CONFIG.topup.maxAmount = Number(maxAmount);
    if (Array.isArray(presets)) COMMUNITY_CONFIG.topup.presets = presets.map(Number);

    // Persist to Supabase settings table if available
    const upserts = [
      { key: "promptpay_id", value: COMMUNITY_CONFIG.topup.promptPayId },
      { key: "promptpay_account_name", value: COMMUNITY_CONFIG.topup.accountName },
      { key: "promptpay_bank_name", value: COMMUNITY_CONFIG.topup.bankName },
      { key: "topup_min_amount", value: String(COMMUNITY_CONFIG.topup.minAmount) },
      { key: "topup_max_amount", value: String(COMMUNITY_CONFIG.topup.maxAmount) },
      { key: "topup_presets", value: JSON.stringify(COMMUNITY_CONFIG.topup.presets) },
    ];

    for (const item of upserts) {
      try {
        await prisma.$executeRawUnsafe(
          `
          INSERT INTO "settings" ("id", "key", "value", "category", "updatedAt")
          VALUES ($1, $2, $3, 'payment', NOW())
          ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value", "updatedAt" = NOW()
        `,
          `cfg_${item.key}`,
          item.key,
          item.value
        );
      } catch (dbErr) {
        // Continue if single setting upsert errors
      }
    }

    return NextResponse.json({
      success: true,
      message: "บันทึกการตั้งค่าบัญชีและพร้อมเพย์เรียบร้อยแล้ว",
      config: COMMUNITY_CONFIG.topup,
    });
  } catch (err: any) {
    console.error("POST /api/admin/bank-config error:", err);
    return NextResponse.json({ error: "INTERNAL_ERROR", message: err.message }, { status: 500 });
  }
}
