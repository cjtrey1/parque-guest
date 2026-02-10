import { NextResponse } from "next/server";
import { sendSMS } from "@/lib/twilio";

export async function POST(req: Request) {
  try {
    const { to, body } = await req.json();

    if (!to || !body) {
      return NextResponse.json({ error: "to and body are required" }, { status: 400 });
    }

    const result = await sendSMS(to, body);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to send SMS";
    console.error("SMS error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
