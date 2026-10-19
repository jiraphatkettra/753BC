import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { COMMUNITY_CONFIG } from "@/config/community";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = { ...COMMUNITY_CONFIG.topup };

    try {
      const rows = await prisma.setting.findMany({
        where: {
          key: {
            in: [
              "promptpay_id",
              "promptpay_number",
              "promptpay_account_name",
              "promptpay_bank_name",
              "topup_min_amount",
              "topup_max_amount",
              "topup_presets",
            ],
          },
        },
      });

      if (rows && rows.length > 0) {
        for (const row of rows) {
          if ((row.key === "promptpay_id" || row.key === "promptpay_number") && row.value) {
            config.promptPayId = row.value.trim();
          }
          if (row.key === "promptpay_account_name" && row.value) {
            config.accountName = row.value.trim();
          }
          if (row.key === "promptpay_bank_name" && row.value) {
            config.bankName = row.value.trim();
          }
          if (row.key === "topup_min_amount" && row.value) {
            config.minAmount = Number(row.value);
          }
          if (row.key === "topup_max_amount" && row.value) {
            config.maxAmount = Number(row.value);
          }
          if (row.key === "topup_presets" && row.value) {
            try {
              config.presets = JSON.parse(row.value);
            } catch {}
          }
        }
      }
    } catch (dbErr) {
      console.warn("Failed to load settings from DB, using fallback:", dbErr);
    }

    return NextResponse.json({
      config,
      success: true,
    });
  } catch (err: any) {
    console.error("GET /api/topup/config error:", err);
    return NextResponse.json(
      { config: COMMUNITY_CONFIG.topup, success: false },
      { status: 500 }
    );
  }
}
