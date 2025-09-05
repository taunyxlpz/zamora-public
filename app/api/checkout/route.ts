import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripeSecret = process.env.STRIPE_SECRET_KEY!;
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
const pricePhoto = process.env.STRIPE_PRICE_PHOTO;
const priceVideo = process.env.STRIPE_PRICE_VIDEO;

const stripe = new Stripe(stripeSecret, { apiVersion: "2024-06-20" });

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const kind = (body?.kind || "").toLowerCase();

    const priceId =
      kind === "photo" ? pricePhoto :
      kind === "video" ? priceVideo :
      null;

    if (!priceId) {
      return NextResponse.json(
        { error: "Invalid kind. Use 'photo' or 'video'." },
        { status: 400 }
      );
    }
    if (!stripeSecret) throw new Error("Missing STRIPE_SECRET_KEY");
    if (!baseUrl) throw new Error("Missing NEXT_PUBLIC_BASE_URL");

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/upload?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/buy?canceled=1`,
      metadata: { kind }, // helpful later (webhooks, audit, etc.)
    });

    return NextResponse.json({ id: session.id, url: session.url }, { status: 200 });
  } catch (err: any) {
    console.error("Stripe checkout error:", err?.message || err);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
