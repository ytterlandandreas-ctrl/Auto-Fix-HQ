import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { sendSMS } from "@/lib/twilio";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopId = (session.user as any).shopId as string;
  const { id } = await params;

  const campaign = await db.cRMCampaign.findFirst({ where: { id, shopId } });
  if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Get target customers based on trigger type
  let customers: any[] = [];
  const now = new Date();

  if (campaign.triggerType === "win_back") {
    const cutoff = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    customers = await db.customer.findMany({
      where: { shopId, smsOptIn: true, phone: { not: null }, lastVisitAt: { lt: cutoff } },
      select: { id: true, firstName: true, lastName: true, phone: true },
    });
  } else if (campaign.triggerType === "oil_change_due") {
    const cutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    customers = await db.customer.findMany({
      where: { shopId, smsOptIn: true, phone: { not: null }, lastVisitAt: { lt: cutoff } },
      select: { id: true, firstName: true, lastName: true, phone: true },
    });
  } else if (campaign.triggerType === "manual_segment") {
    customers = await db.customer.findMany({
      where: { shopId, smsOptIn: true, phone: { not: null } },
      select: { id: true, firstName: true, lastName: true, phone: true },
    });
  } else {
    customers = await db.customer.findMany({
      where: { shopId, smsOptIn: true, phone: { not: null } },
      select: { id: true, firstName: true, lastName: true, phone: true },
    });
  }

  // Filter already enrolled
  const existing = await db.cRMEnrollment.findMany({
    where: { campaignId: id },
    select: { customerId: true },
  });
  const enrolledSet = new Set(existing.map((e) => e.customerId));
  const targets = customers.filter((c) => !enrolledSet.has(c.id));

  let sent = 0;
  let failed = 0;

  for (const customer of targets) {
    try {
      const body = (campaign.messageTemplate as string)
        .replace(/\{first_name\}/gi, customer.firstName)
        .replace(/\{last_name\}/gi, customer.lastName ?? "");

      if (campaign.channel === "sms" && customer.phone) {
        await sendSMS({ to: customer.phone, body, shopId, customerId: customer.id });
      }

      await db.cRMEnrollment.create({
        data: { campaignId: id, customerId: customer.id, status: "sent", sentAt: now },
      });
      sent++;
    } catch {
      failed++;
    }
  }

  return NextResponse.json({ sent, failed, total: targets.length });
}
