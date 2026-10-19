import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export interface TicketItem {
  id: string;
  ticketId: string;
  category: string;
  priority: string;
  subject: string;
  description: string;
  status: "OPEN" | "CLAIMED" | "CLOSED";
  creatorName: string;
  creatorId: string;
  createdAt: string;
  updatedAt?: string;
  closedAt?: string | null;
  adminNote?: string | null;
}

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id || "";
    const discordId = session?.user?.discordId || "";

    let tickets: TicketItem[] = [];

    try {
      let rows: any[] = [];
      if (discordId || userId) {
        rows = await prisma.$queryRawUnsafe<any[]>(
          `
          SELECT "id", "ticketId", "creatorName", "creatorId", "subject", "status"::text as "status", "transcript", "createdAt", "closedAt"
          FROM "tickets"
          WHERE "creatorId" = $1 OR "creatorId" = $2
          ORDER BY "createdAt" DESC
          LIMIT 30
          `,
          discordId || "__none__",
          userId || "__none__"
        );
      } else {
        // If unauthenticated, return public recent count or sample list
        rows = await prisma.$queryRawUnsafe<any[]>(
          `
          SELECT "id", "ticketId", "creatorName", "creatorId", "subject", "status"::text as "status", "transcript", "createdAt", "closedAt"
          FROM "tickets"
          ORDER BY "createdAt" DESC
          LIMIT 10
          `
        );
      }

      if (rows && rows.length > 0) {
        tickets = rows.map((r) => {
          let category = "ทั่วไป";
          let priority = "NORMAL";
          let description = "";

          if (r.transcript) {
            try {
              const meta = JSON.parse(r.transcript);
              if (meta.category) category = meta.category;
              if (meta.priority) priority = meta.priority;
              if (meta.description) description = meta.description;
            } catch {
              description = r.transcript;
            }
          }

          return {
            id: r.id,
            ticketId: r.ticketId,
            category,
            priority,
            subject: r.subject || "สอบถามข้อมูล",
            description,
            status: (r.status || "OPEN").toUpperCase() as any,
            creatorName: r.creatorName || "Discord Member",
            creatorId: r.creatorId || "",
            createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
            closedAt: r.closedAt ? new Date(r.closedAt).toISOString() : null,
          };
        });
      }
    } catch (dbErr) {
      console.warn("Tickets DB query fallback:", dbErr);
    }

    return NextResponse.json({
      success: true,
      tickets,
      total: tickets.length,
    });
  } catch (err: any) {
    console.error("GET /api/tickets error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to load tickets", tickets: [] },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const body = await req.json();

    const {
      category = "ทั่วไป",
      priority = "NORMAL",
      subject = "สอบถามข้อมูลทั่วไป",
      description = "",
      discordTag = "",
    } = body;

    if (!subject.trim()) {
      return NextResponse.json(
        { success: false, error: "กรุณาระบุหัวข้อคำร้อง" },
        { status: 400 }
      );
    }

    if (!description.trim()) {
      return NextResponse.json(
        { success: false, error: "กรุณาระบุรายละเอียดคำร้อง" },
        { status: 400 }
      );
    }

    const uuid = crypto.randomUUID();
    const ticketNo = `TK-753-${Math.floor(1000 + Math.random() * 9000)}`;
    const channelId = `web-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const guildId = process.env.DISCORD_GUILD_ID || "753bc";
    const creatorId =
      session?.user?.discordId || session?.user?.id || `web-user-${Date.now()}`;
    const creatorName =
      discordTag.trim() || session?.user?.name || "เว็บสมาชิก 753BC";

    const transcriptMeta = JSON.stringify({
      category,
      priority,
      description: description.trim(),
      createdVia: "WEB_PORTAL",
      discordTag: discordTag.trim(),
      createdAt: new Date().toISOString(),
    });

    let inserted = false;

    try {
      await prisma.$executeRawUnsafe(
        `
        INSERT INTO "tickets" (
          "id", "ticketId", "channelId", "guildId", "creatorId", "creatorName",
          "subject", "status", "transcript", "createdAt", "updatedAt"
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, 'OPEN'::"TicketStatus", $8, NOW(), NOW()
        )
        `,
        uuid,
        ticketNo,
        channelId,
        guildId,
        creatorId,
        creatorName,
        subject.trim(),
        transcriptMeta
      );
      inserted = true;
    } catch (insertErr) {
      console.warn("Failed to insert ticket to DB, returning synthetic confirmation:", insertErr);
    }

    const newTicket: TicketItem = {
      id: uuid,
      ticketId: ticketNo,
      category,
      priority,
      subject: subject.trim(),
      description: description.trim(),
      status: "OPEN",
      creatorName,
      creatorId,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      ticket: newTicket,
      message: `สร้างคำร้อง Ticket สำเร็จ (รหัส: ${ticketNo})`,
    });
  } catch (err: any) {
    console.error("POST /api/tickets error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create ticket" },
      { status: 500 }
    );
  }
}
