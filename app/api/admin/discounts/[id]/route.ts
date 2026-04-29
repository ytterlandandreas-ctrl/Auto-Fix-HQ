import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if ((session?.user as any)?.role !== "platform_owner") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { isActive, label, expiresAt } = body;

  const discount = await db.discountCode.findUnique({ where: { id } });
  if (!discount) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Deactivate in Stripe if needed
  if (isActive === false && discount.stripeId) {
    try {
      // Try to deactivate as coupon or promo code
      if (discount.code) {
        await stripe.promotionCodes.update(discount.stripeId, { active: false });
      } else {
        await stripe.coupons.update(discount.stripeId, { metadata: { deactivated: "true" } });
      }
    } catch {
      // Ignore Stripe errors — still deactivate in DB
    }
  }

  const updated = await db.discountCode.update({
    where: { id },
    data: {
      ...(isActive !== undefined ? { isActive } : {}),
      ...(label ? { label } : {}),
      ...(expiresAt !== undefined ? { expiresAt: expiresAt ? new Date(expiresAt) : null } : {}),
    },
  });

  return NextResponse.json({ discount: updated });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if ((session?.user as any)?.role !== "platform_owner") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Soft delete — just deactivate
  const updated = await db.discountCode.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json({ discount: updated });
}
