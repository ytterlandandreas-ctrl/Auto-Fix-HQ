import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendInspectionLink } from "@/lib/twilio";
import { sendInspectionEmail } from "@/lib/resend";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopId = (session.user as any).shopId;
  const { id } = await params;

  const ro = await db.repairOrder.findFirst({
    where: { id, shopId },
    include: {
      customer: true,
      shop: { select: { name: true } },
      inspection: { select: { id: true, token: true, status: true } },
    },
  });

  if (!ro) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!ro.inspection) return NextResponse.json({ error: "No inspection on this RO" }, { status: 400 });

  const { inspection, customer, shop } = ro;

  if (customer.smsOptIn && customer.phone) {
    await sendInspectionLink(customer.phone, shop.name, inspection.token, shopId, customer.id, ro.id);
  }

  if (customer.emailOptIn && customer.email) {
    await sendInspectionEmail(customer.email, `${customer.firstName} ${customer.lastName}`, shop.name, inspection.token);
  }

  await db.digitalInspection.update({
    where: { id: inspection.id },
    data: { status: "sent", sentAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
