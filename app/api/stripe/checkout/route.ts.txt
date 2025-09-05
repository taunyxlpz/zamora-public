import Stripe from "stripe";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });

function amountFor(kind: "photo"|"video") {
  return kind === "video" ? 2000 : 1000; // cents
}

export async function POST(req: Request) {
  try {
    const { kind }:{ kind:"photo"|"video" } = await req.json();
    if (!kind) return NextResponse.json({ error: "kind required" }, { status: 400 });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: { name: kind === "video" ? "ShowYo Video" : "ShowYo Photo" },
          unit_amount: amountFor(kind),
        },
        quantity: 1,
      }],
      success_url: `${process.env.NEXT_PUBLIC_APP_BASE_URL}/upload?session_id={CHECKOUT_SESSION_ID}&kind=${kind}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_BASE_URL}/buy`,
      metadata: { kind },
    });

    return NextResponse.json({ url: session.url });
  } catch (e:any) {
    return NextResponse.json({ error: e.message || "stripe error" }, { status: 500 });
  }
}
