import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { STRIPE_PRICES } from "@/app/lib/stripe-prices";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { planId, term, userId, userEmail } = await req.json();

    const priceId = STRIPE_PRICES[planId]?.[term];
    if (!priceId) {
      return NextResponse.json({ error: "Unknown plan or term" }, { status: 400 });
    }

    const origin = req.headers.get("origin") || "https://alqb.co.uk";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: userEmail,
      metadata: { userId, planId, term },
      success_url: `${origin}/dashboard?purchase=success`,
      cancel_url: `${origin}/subscriptions?purchase=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}