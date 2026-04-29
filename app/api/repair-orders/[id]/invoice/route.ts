import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { createPaymentLink } from "@/lib/stripe";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopId = (session.user as any).shopId;
  const { id } = await params;

  const ro = await db.repairOrder.findFirst({
    where: { id, shopId, status: "completed" },
    include: { shop: true, customer: true },
  });
  if (!ro) return NextResponse.json({ error: "RO not found or not completed" }, { status: 404 });

  if (ro.invoice) {
    return NextResponse.json({ invoiceId: ro.invoice }, { status: 200 });
  }

  const count = await db.invoice.count({ where: { shopId } });
  const invoiceNumber = `INV-${String(count + 1).padStart(5, "0")}`;
  const token = uuidv4();

  let stripePaymentLinkId: string | undefined;
  if (ro.shop.stripeAccountId && ro.shop.stripeOnboarded) {
    try {
      const session = await createPaymentLink(
        ro.grandTotal,
        token,
        ro.shop.stripeAccountId,
        `Invoice ${invoiceNumber} — ${ro.shop.name}`
      );
      stripePaymentLinkId = session.id;
    } catch (_) {}
  }

  const invoice = await db.invoice.create({
    data: {
      shopId,
      repairOrderId: id,
      invoiceNumber,
      status: "unpaid",
      token,
      subtotal: ro.grandTotal - ro.taxTotal - ro.discountTotal,
      taxTotal: ro.taxTotal,
      discountTotal: ro.discountTotal,
      total: ro.grandTotal,
      stripePaymentLinkId,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  await db.repairOrder.update({
    where: { id: id },
    data: { status: "invoiced" },
  });

  return NextResponse.json({ invoiceId: invoice.id }, { status: 201 });
}
