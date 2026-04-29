import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { changePlan, TIER_STRIPE_PRICES, TIER_DISPLAY_PRICES } from "@/lib/stripe";
import { NextResponse } from "next/server";

const VALID_TIERS = ["free", "starter", "pro", "enterprise"] as const;
type Tier = (typeof VALID_TIERS)[number];

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if ((session?.user as any)?.role !== "platform_owner") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params; // ShopSubscription id
  const { tier } = await req.json();

  if (!VALID_TIERS.includes(tier as Tier)) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }

  const sub = await db.shopSubscription.findUnique({ where: { id } });
  if (!sub) return NextResponse.json({ error: "Subscription not found" }, { status: 404 });

  const newPriceId = TIER_STRIPE_PRICES[tier as Tier];

  try {
    if (tier === "free") {
      // Cancel the paid Stripe subscription and mark as free
      if (sub.stripeSubscriptionId) {
        const { stripe } = await import("@/lib/stripe");
        await stripe.subscriptions.cancel(sub.stripeSubscriptionId);
      }
      await db.shopSubscription.update({
        where: { id },
        data: {
          planTier: "free",
          status: "free",
          stripeSubscriptionId: null,
          stripePriceId: null,
        },
      });
    } else if (newPriceId && sub.stripeSubscriptionId) {
      // Update Stripe subscription
      await changePlan(sub.stripeSubscriptionId, newPriceId);
      await db.shopSubscription.update({
        where: { id },
        data: {
          planTier: tier as Tier,
          stripePriceId: newPriceId,
          status: "active",
          freeAccessMode: null,
        },
      });
    } else {
      // No Stripe price configured (e.g., Pro/Enterprise env var missing) — still update DB
      await db.shopSubscription.update({
        where: { id },
        data: { planTier: tier as Tier },
      });
    }

    return NextResponse.json({ success: true, tier });
  } catch (err: any) {
    console.error("Change plan error:", err);
    return NextResponse.json({ error: err.message || "Failed to change plan" }, { status: 500 });
  }
}
