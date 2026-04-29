import twilio from "twilio";
import { db } from "@/lib/db";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export async function sendSMS(
  to: string,
  body: string,
  shopId: string,
  customerId?: string,
  repairOrderId?: string
) {
  const normalizedTo = to.startsWith("+") ? to : `+1${to.replace(/\D/g, "")}`;

  let message;
  let errorMessage: string | undefined;

  try {
    message = await client.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER!,
      to: normalizedTo,
    });
  } catch (err: any) {
    errorMessage = err.message;
  }

  await db.message.create({
    data: {
      shopId,
      customerId,
      repairOrderId,
      channel: "sms",
      direction: "outbound",
      from: process.env.TWILIO_PHONE_NUMBER!,
      to: normalizedTo,
      body,
      status: message ? "sent" : "failed",
      twilioSid: message?.sid,
      errorMessage,
      sentAt: message ? new Date() : undefined,
    },
  });

  if (!message) throw new Error(errorMessage || "SMS failed");
  return message;
}

export async function sendAppointmentReminder(
  to: string,
  shopName: string,
  scheduledAt: Date,
  shopId: string,
  customerId: string
) {
  const dateStr = scheduledAt.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  return sendSMS(
    to,
    `Hi! Reminder: you have an appointment at ${shopName} on ${dateStr}. Reply STOP to opt out.`,
    shopId,
    customerId
  );
}

export async function sendInspectionLink(
  to: string,
  shopName: string,
  token: string,
  shopId: string,
  customerId: string,
  repairOrderId: string
) {
  const link = `${process.env.NEXT_PUBLIC_APP_URL}/portal/inspection/${token}`;
  return sendSMS(
    to,
    `${shopName}: Your vehicle inspection is ready. Review and approve: ${link}`,
    shopId,
    customerId,
    repairOrderId
  );
}

export async function sendInvoiceLink(
  to: string,
  shopName: string,
  token: string,
  amount: number,
  shopId: string,
  customerId: string,
  repairOrderId: string
) {
  const link = `${process.env.NEXT_PUBLIC_APP_URL}/portal/invoice/${token}`;
  return sendSMS(
    to,
    `${shopName}: Your invoice of $${amount.toFixed(2)} is ready. Pay online: ${link}`,
    shopId,
    customerId,
    repairOrderId
  );
}

export function parseTwilioInbound(body: Record<string, string>) {
  return {
    from: body.From,
    to: body.To,
    messageBody: body.Body,
    twilioSid: body.MessageSid,
  };
}
