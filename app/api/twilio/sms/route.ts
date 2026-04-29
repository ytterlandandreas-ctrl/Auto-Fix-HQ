import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseTwilioInbound } from "@/lib/twilio";
import { triggerRoUpdate, EVENTS, CHANNELS } from "@/lib/pusher";
import { pusherServer } from "@/lib/pusher";

export async function POST(req: NextRequest) {
  const body = Object.fromEntries(await req.formData() as any);
  const { from, to, messageBody, twilioSid } = parseTwilioInbound(body as Record<string, string>);

  // Find shop by Twilio number
  const normalizedFrom = from.replace(/\D/g, "");

  const customer = await db.customer.findFirst({
    where: { phone: { contains: normalizedFrom.slice(-10) } },
    include: { shop: true },
  });

  if (!customer) {
    return new NextResponse("<?xml version='1.0'?><Response></Response>", {
      headers: { "Content-Type": "text/xml" },
    });
  }

  // Handle STOP
  if (messageBody.trim().toUpperCase() === "STOP") {
    await db.customer.update({
      where: { id: customer.id },
      data: { smsOptIn: false },
    });
    return new NextResponse(
      "<?xml version='1.0'?><Response><Message>You have been unsubscribed. Reply START to re-subscribe.</Message></Response>",
      { headers: { "Content-Type": "text/xml" } }
    );
  }

  // Handle START
  if (messageBody.trim().toUpperCase() === "START") {
    await db.customer.update({
      where: { id: customer.id },
      data: { smsOptIn: true },
    });
    return new NextResponse(
      "<?xml version='1.0'?><Response><Message>You have been re-subscribed to messages.</Message></Response>",
      { headers: { "Content-Type": "text/xml" } }
    );
  }

  // Find open RO for customer
  const openRO = await db.repairOrder.findFirst({
    where: {
      shopId: customer.shopId,
      customerId: customer.id,
      status: { in: ["estimate", "approved", "in_progress", "qc"] },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Store inbound message
  await db.message.create({
    data: {
      shopId: customer.shopId,
      customerId: customer.id,
      repairOrderId: openRO?.id,
      channel: "sms",
      direction: "inbound",
      from,
      to,
      body: messageBody,
      status: "delivered",
      twilioSid,
      deliveredAt: new Date(),
    },
  });

  // Notify shop in real-time
  await pusherServer.trigger(CHANNELS.messages(customer.shopId), EVENTS.NEW_MESSAGE, {
    customerId: customer.id,
    customerName: `${customer.firstName} ${customer.lastName}`,
    body: messageBody,
    repairOrderId: openRO?.id,
  });

  return new NextResponse("<?xml version='1.0'?><Response></Response>", {
    headers: { "Content-Type": "text/xml" },
  });
}
