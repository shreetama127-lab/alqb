import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// How long each term grants access for
function expiryFor(term: string): string {
  const now = new Date();
  switch (term) {
    case "1month":
      now.setMonth(now.getMonth() + 1);
      break;
    case "6months":
      now.setMonth(now.getMonth() + 6);
      break;
    case "1year":
      now.setFullYear(now.getFullYear() + 1);
      break;
    case "exam":
      // "Until my exam" — grant until end of the next August (covers the exam season)
      now.setFullYear(now.getMonth() >= 8 ? now.getFullYear() + 1 : now.getFullYear());
      now.setMonth(7, 31); // 31 August
      break;
    default:
      now.setFullYear(now.getFullYear() + 1);
  }
  return now.toISOString();
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig!, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const planId = session.metadata?.planId;
    const term = session.metadata?.term || "1year";

    if (userId && planId) {
      const { error } = await supabaseAdmin.from("subscriptions").insert({
        user_id: userId,
        plan_id: planId,
        status: "active",
        started_at: new Date().toISOString(),
        expires_at: expiryFor(term),
      });
      if (error) {
        console.error("Failed to grant subscription:", error);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true });
}