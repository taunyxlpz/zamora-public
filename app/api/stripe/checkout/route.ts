import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: Request) {
  const { kind } = await req.json() as { kind: "photo" | "video" };
  if (kind !== "photo" && kind !== "video") return NextResponse.json({error:"bad kind"},{status:400});

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" as any });
  const price = kind === "photo" ? process.env.STRIPE_PRICE_PHOTO! : process.env.STRIPE_PRICE_VIDEO!;
  const origin = process.env.NEXT_PUBLIC_SITE_URL || (await import("next/headers")).headers().get("origin") || "";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price, quantity: 1 }],
    success_url: `${origin}/upload?kind=${kind}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/`,
    metadata: { kind },
  });

  return NextResponse.json({ url: session.url });
}