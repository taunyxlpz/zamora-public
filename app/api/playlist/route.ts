import { NextResponse } from "next/server";
import { readPlaylist } from "@/lib/playlist";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const items = await readPlaylist();
    return NextResponse.json(items ?? [], {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err: any) {
    console.error("[/api/playlist] failed:", err?.stack || err);
    return NextResponse.json([], { status: 200 });
  }
}