import Stripe from "stripe";
import { NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("session_id");
  if (!id) return NextResponse.json({ paid:false });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion:"2024-06-20" });
  const s = await stripe.checkout.sessions.retrieve(id);
  const paid = s.payment_status === "paid";
  const kind = (s.metadata?.kind as "photo"|"video") || null;
  return NextResponse.json({ paid, kind });
}
