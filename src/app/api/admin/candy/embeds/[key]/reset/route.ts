import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {  DEFAULT_EMBED_TEMPLATES, TEMPLATE_REGISTRY  } from "@/lib/candy";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const records = await prisma.candyEmbedTemplate.findMany({
      orderBy: { key: "asc" },
    });

    const dbMap = new Map(records.map((r) => [r.key, r]));

    // Merge with defaults
    const templates = Object.entries(TEMPLATE_REGISTRY).map(([key, meta]) => {
      const dbRecord = dbMap.get(key);
      const defaultPayload = DEFAULT_EMBED_TEMPLATES[key];

      return {
        key,
        name: dbRecord?.name || meta.name,
        category: dbRecord?.category || meta.category,
        enabled: dbRecord ? dbRecord.enabled : true,
        payload: dbRecord?.payload || defaultPayload,
        draft: dbRecord?.draft || null,
        version: dbRecord?.version || 1,
        isDefault: dbRecord?.isDefault ?? true,
      };
    });

    return NextResponse.json({ success: true, templates });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

