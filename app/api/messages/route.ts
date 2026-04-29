import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { sendSMS } from "@/lib/twilio";
import { sendEmail } from "@/lib/resend";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopId = (session.user as any).shopId as string;

  const { customerId, channel, body, subject } = await req.json();
  if (!customerId || !channel || !body) {
    return NextResponse.json({ error: "customerId, channel, and body are required" }, { status: 400 });
  }

  const customer = await db.customer.findUnique({
    where: { id: customerId },
    select: { id: true, phone: true, email: true, firstName: true, lastName: true, smsOptIn: true },
  });
  if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  let externalId: string | null = null;

  if (channel === "sms") {
    if (!customer.phone) return NextResponse.json({ error: "Customer has no phone number" }, { status: 400 });
    if (!customer.smsOptIn) return NextResponse.json({ error: "Customer has opted out of SMS" }, { status: 400 });
    try {
      const sid = await sendSMS({ to: customer.phone, body, shopId, customerId });
      externalId = sid ?? null;
    } catch (err: any) {
      return NextResponse.json({ error: err.message || "SMS failed" }, { status: 500 });
    }
  } else if (channel === "email") {
    if (!customer.email) return NextResponse.json({ error: "Customer has no email address" }, { status: 400 });
    try {
      const shop = await db.shop.findUnique({ where: { id: shopId }, select: { name: true } });
      await sendEmail({
        to: customer.email,
        subject: subject || `Message from ${shop?.name ?? "Your Shop"}`,
        html: `<p>${body.replace(/\n/g, "<br>")}</p>`,
        shopId,
      });
    } catch (err: any) {
      return NextResponse.json({ error: err.message || "Email failed" }, { status: 500 });
    }
  } else {
    return NextResponse.json({ error: "Invalid channel" }, { status: 400 });
  }

  const message = await db.message.create({
    data: {
      shopId,
      customerId,
      channel,
      direction: "outbound",
      body,
      externalId,
      isRead: true,
    },
  });

  return NextResponse.json(message, { status: 201 });
}
