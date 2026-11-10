import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// How long each term grants access for.
// Returns null for lifetime (never expires).
function expiryFor(term: string): string | null {
  const now = new Date();
  switch (term) {
    case "1month":
      now.setMonth(now.getMonth() + 1);
      break;
    case "3months":
      now.setMonth(now.getMonth() + 3);
      break;
    case "lifetime":
      return null;
    default:
      // Unknown term — grant 1 month to be safe.
      now.setMonth(now.getMonth() + 1);
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
    const term = session.metadata?.term || "1month";

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