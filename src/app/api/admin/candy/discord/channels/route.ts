import { NextResponse } from "next/server";
import { fetchGuildChannels } from "@/lib/discord";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const channels = await fetchGuildChannels();
    return NextResponse.json({ success: true, channels });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

