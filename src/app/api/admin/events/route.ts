import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isDiscordAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const isAdmin = isDiscordAdmin(session?.user?.discordId) || session?.user?.isAdmin;

    if (!isAdmin && process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const events = await prisma.event.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { participants: true },
        },
      },
    });

    return NextResponse.json({ events });
  } catch (err: any) {
    console.error("GET /api/admin/events error:", err);
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
      title,
      description,
      bannerUrl,
      category = "General",
      startDate,
      endDate,
      maxParticipants,
      status = "UPCOMING",
    } = body;

    if (!title || !description) {
      return NextResponse.json(
        { error: "BAD_REQUEST", message: "กรุณาระบุชื่อและรายละเอียดกิจกรรม" },
        { status: 400 }
      );
    }

    const event = await prisma.event.create({
      data: {
        title,
        description,
        bannerUrl: bannerUrl || null,
        category,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        maxParticipants: maxParticipants ? parseInt(maxParticipants) : null,
        status: status as any,
      },
    });

    return NextResponse.json({ success: true, event });
  } catch (err: any) {
    console.error("POST /api/admin/events error:", err);
    return NextResponse.json({ error: "INTERNAL_ERROR", message: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    const isAdmin = isDiscordAdmin(session?.user?.discordId) || session?.user?.isAdmin;

    if (!isAdmin && process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const body = await req.json();
    const {
      id,
      title,
      description,
      bannerUrl,
      category,
      startDate,
      endDate,
      maxParticipants,
      status,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "BAD_REQUEST", message: "Missing event ID" }, { status: 400 });
    }

    const updated = await prisma.event.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(bannerUrl !== undefined && { bannerUrl }),
        ...(category && { category }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(maxParticipants !== undefined && {
          maxParticipants: maxParticipants ? parseInt(maxParticipants) : null,
        }),
        ...(status && { status: status as any }),
      },
    });

    return NextResponse.json({ success: true, event: updated });
  } catch (err: any) {
    console.error("PUT /api/admin/events error:", err);
    return NextResponse.json({ error: "INTERNAL_ERROR", message: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    const isAdmin = isDiscordAdmin(session?.user?.discordId) || session?.user?.isAdmin;

    if (!isAdmin && process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "BAD_REQUEST", message: "Missing event ID" }, { status: 400 });
    }

    await prisma.event.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "ลบกิจกรรมเรียบร้อยแล้ว" });
  } catch (err: any) {
    console.error("DELETE /api/admin/events error:", err);
    return NextResponse.json({ error: "INTERNAL_ERROR", message: err.message }, { status: 500 });
  }
}
