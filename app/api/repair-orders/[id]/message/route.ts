import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendSMS } from "@/lib/twilio";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopId = (session.user as any).shopId;
  const { id } = await params;

  const ro = await db.repairOrder.findFirst({
    where: { id, shopId },
    include: { customer: true },
  });
  if (!ro) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!ro.customer.phone) return NextResponse.json({ error: "Customer has no phone" }, { status: 400 });
  if (!ro.customer.smsOptIn) return NextResponse.json({ error: "Customer opted out of SMS" }, { status: 400 });

  const { body } = await req.json();
  if (!body?.trim()) return NextResponse.json({ error: "Message body required" }, { status: 400 });

  await sendSMS(ro.customer.phone, body, shopId, ro.customerId, ro.id);

  return NextResponse.json({ success: true });
}
