import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  // If we have a webhook secret configured, verify the signature
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } else {
      // In development without webhook secret, parse the body directly
      event = JSON.parse(body);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Invalid webhook";
    console.error("Webhook signature verification failed:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    const { ticketId, jobId, ticketCode, baseRate, tipAmount } = paymentIntent.metadata;

    // Record payment transaction
    await supabase.from("payment_transactions").insert({
      ticket_id: ticketId,
      job_id: jobId,
      amount: paymentIntent.amount,
      base_amount: parseInt(baseRate) || 0,
      tip_amount: parseInt(tipAmount) || 0,
      currency: paymentIntent.currency,
      stripe_payment_intent_id: paymentIntent.id,
      status: "succeeded",
    });

    // Update ticket with payment reference
    await supabase
      .from("tickets")
      .update({
        payment_status: "paid",
        payment_intent_id: paymentIntent.id,
      })
      .eq("id", ticketId);

    console.log(`Payment succeeded for ticket ${ticketCode}: $${(paymentIntent.amount / 100).toFixed(2)}`);
  }

  return NextResponse.json({ received: true });
}
