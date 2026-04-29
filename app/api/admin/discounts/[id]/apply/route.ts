import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { applyDiscountToSubscription } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if ((session?.user as any)?.role !== "platform_owner") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { shopId } = await req.json();

  if (!shopId) return NextResponse.json({ error: "shopId required" }, { status: 400 });

  const [discount, shopSub] = await Promise.all([
    db.discountCode.findUnique({ where: { id } }),
    db.shopSubscription.findUnique({ where: { shopId } }),
  ]);

  if (!discount || !discount.isActive) {
    return NextResponse.json({ error: "Discount not found or inactive" }, { status: 404 });
  }
  if (!shopSub) {
    return NextResponse.json({ error: "Shop has no subscription" }, { status: 404 });
  }

  // Check for existing discount on this shop
  const existing = await db.shopDiscount.findFirst({ where: { shopId } });
  if (existing) {
    return NextResponse.json(
      { error: "Shop already has an active discount. Remove it first before applying a new one." },
      { status: 409 }
    );
  }

  let stripeDiscountId: string | null = null;
  if (shopSub.stripeSubscriptionId && discount.stripeId) {
    try {
      await applyDiscountToSubscription(shopSub.stripeSubscriptionId, discount.stripeId);
      // The Stripe discount ID is set automatically on the subscription
    } catch (err: any) {
      console.error("Stripe discount apply error:", err);
      // Continue — still record in DB even if Stripe fails
    }
  }

  const shopDiscount = await db.shopDiscount.create({
    data: {
      shopId,
      discountCodeId: id,
      appliedByAdminId: (session!.user as any).id,
      stripeId: stripeDiscountId,
    },
  });

  // Increment redemption count
  await db.discountCode.update({
    where: { id },
    data: { redemptionCount: { increment: 1 } },
  });

  return NextResponse.json({ shopDiscount }, { status: 201 });
}
