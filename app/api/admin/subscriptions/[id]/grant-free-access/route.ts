import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

const VALID_MODES = ["permanent_free", "extended_trial", "complimentary"] as const;
type FreeMode = (typeof VALID_MODES)[number];

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if ((session?.user as any)?.role !== "platform_owner") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { mode, note, durationDays } = await req.json();

  if (!VALID_MODES.includes(mode as FreeMode)) {
    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  }

  const sub = await db.shopSubscription.findUnique({
    where: { id },
    include: { shop: { select: { id: true } } },
  });
  if (!sub) return NextResponse.json({ error: "Subscription not found" }, { status: 404 });

  try {
    if (mode === "permanent_free") {
      // Cancel Stripe subscription, move to free tier
      if (sub.stripeSubscriptionId) {
        const { stripe } = await import("@/lib/stripe");
        await stripe.subscriptions.cancel(sub.stripeSubscriptionId);
      }
      await db.shopSubscription.update({
        where: { id },
        data: {
          planTier: "free",
          status: "free",
          freeAccessMode: "permanent_free",
          freeAccessNote: note || null,
          stripeSubscriptionId: null,
          stripePriceId: null,
        },
      });
    } else if (mode === "extended_trial") {
      // Extend trial end date
      const days = durationDays ?? 30;
      const newTrialEnd = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

      if (sub.stripeSubscriptionId && sub.status === "trialing") {
        const { stripe } = await import("@/lib/stripe");
        await stripe.subscriptions.update(sub.stripeSubscriptionId, {
          trial_end: Math.floor(newTrialEnd.getTime() / 1000),
        });
      }

      await db.$transaction([
        db.shopSubscription.update({
          where: { id },
          data: {
            freeAccessMode: "extended_trial",
            freeAccessNote: note || null,
            status: "trialing",
          },
        }),
        db.shop.update({
          where: { id: sub.shop.id },
          data: { trialEndsAt: newTrialEnd },
        }),
      ]);
    } else if (mode === "complimentary") {
      // Full access at no charge — just flag it, no Stripe change needed
      await db.shopSubscription.update({
        where: { id },
        data: {
          freeAccessMode: "complimentary",
          freeAccessNote: note || null,
        },
      });
    }

    return NextResponse.json({ success: true, mode });
  } catch (err: any) {
    console.error("Grant free access error:", err);
    return NextResponse.json({ error: err.message || "Failed to grant free access" }, { status: 500 });
  }
}
