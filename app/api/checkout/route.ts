import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ ok: false, payments: "disabled" }, { status: 200 });
}