import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if ((session?.user as any)?.role !== "platform_owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;

  const subscription = await db.shopSubscription.findUnique({ where: { id } });
  if (!subscription) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (subscription.stripeSubscriptionId) {
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });
  }

  await db.shopSubscription.update({
    where: { id },
    data: { status: "active", cancelAtPeriodEnd: false, canceledAt: null },
  });

  // Unsuspend the shop
  await db.shop.update({
    where: { id: subscription.shopId },
    data: { isSuspended: false },
  });

  return NextResponse.json({ ok: true });
}
