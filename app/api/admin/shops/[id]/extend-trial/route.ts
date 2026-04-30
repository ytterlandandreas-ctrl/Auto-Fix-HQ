import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if ((session?.user as any)?.role !== "platform_owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;

  const { days } = await req.json();
  if (!days || days < 1) return NextResponse.json({ error: "Invalid days" }, { status: 400 });

  const subscription = await db.shopSubscription.findFirst({
    where: { shopId: id, status: "trialing" },
    include: { shop: true },
  });
  if (!subscription) return NextResponse.json({ error: "No trialing subscription" }, { status: 404 });

  const newTrialEnd = new Date((subscription.shop.trialEndsAt ?? new Date()).getTime() + days * 24 * 60 * 60 * 1000);

  // Update Stripe (only if linked)
  if (subscription.stripeSubscriptionId) {
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      trial_end: Math.floor(newTrialEnd.getTime() / 1000),
      proration_behavior: "none",
    });
  }

  await db.shop.update({
    where: { id },
    data: { trialEndsAt: newTrialEnd },
  });

  return NextResponse.json({ ok: true, newTrialEnd });
}
