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

  let twilioSid: string | undefined;
  let resendId: string | undefined;
  let toAddress = "";
  let fromAddress = "shop";

  if (channel === "sms") {
    if (!customer.phone) return NextResponse.json({ error: "Customer has no phone number" }, { status: 400 });
    if (!customer.smsOptIn) return NextResponse.json({ error: "Customer has opted out of SMS" }, { status: 400 });
    try {
      const result = await sendSMS(customer.phone, body, shopId, customerId);
      twilioSid = result.sid;
      toAddress = customer.phone;
      fromAddress = process.env.TWILIO_PHONE_NUMBER || "shop";
      // sendSMS already creates a Message record; return the most recent one for this twilioSid
      const existing = await db.message.findFirst({
        where: { shopId, customerId, twilioSid },
        orderBy: { createdAt: "desc" },
      });
      if (existing) return NextResponse.json(existing, { status: 201 });
    } catch (err: any) {
      return NextResponse.json({ error: err.message || "SMS failed" }, { status: 500 });
    }
  } else if (channel === "email") {
    if (!customer.email) return NextResponse.json({ error: "Customer has no email address" }, { status: 400 });
    try {
      const shop = await db.shop.findUnique({ where: { id: shopId }, select: { name: true, email: true } });
      const result = await sendEmail({
        to: customer.email,
        subject: subject || `Message from ${shop?.name ?? "Your Shop"}`,
        html: `<p>${body.replace(/\n/g, "<br>")}</p>`,
        shopId,
      });
      resendId = result.data?.id;
      toAddress = customer.email;
      fromAddress = shop?.email ?? "noreply@autofixhq.com";
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
      from: fromAddress,
      to: toAddress,
      body,
      subject: subject || null,
      ...(twilioSid ? { twilioSid } : {}),
      ...(resendId ? { resendId } : {}),
      readAt: new Date(),
      sentAt: new Date(),
    },
  });

  return NextResponse.json(message, { status: 201 });
}
