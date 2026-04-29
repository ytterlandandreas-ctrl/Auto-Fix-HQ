import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopId = (session.user as any).shopId as string;

  // stripeCustomerId lives on ShopSubscription, not Shop
  const subscription = await db.shopSubscription.findUnique({
    where: { shopId },
    select: { stripeCustomerId: true },
  });
  if (!subscription?.stripeCustomerId) {
    return NextResponse.json({ error: "No Stripe customer found" }, { status: 400 });
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/shop/settings?tab=billing`,
  });

  return NextResponse.json({ url: portalSession.url });
}
