import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const { ticketId, tipAmount = 0 } = await req.json();

    if (!ticketId) {
      return NextResponse.json({ error: "ticketId is required" }, { status: 400 });
    }

    // Fetch ticket + job for payment config
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .select("*, jobs(*)")
      .eq("id", ticketId)
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const job = (ticket as Record<string, unknown>).jobs as Record<string, unknown> | null;
    const paymentConfig = job?.payment_config as Record<string, unknown> | null;
    const baseRate = (paymentConfig?.baseRate as number) || 0;
    const totalAmount = baseRate + Math.round(tipAmount * 100); // tipAmount in dollars, convert to cents

    if (totalAmount <= 0) {
      return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: "usd",
      metadata: {
        ticketId,
        jobId: (job?.id as string) || "",
        ticketCode: (ticket as Record<string, unknown>).ticket_code as string || "",
        baseRate: String(baseRate),
        tipAmount: String(Math.round(tipAmount * 100)),
      },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("Payment intent error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
