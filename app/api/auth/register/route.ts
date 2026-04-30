import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { stripe, createStripeCustomer, createSubscription } from "@/lib/stripe";
import { sendWelcomeEmail } from "@/lib/resend";

export async function POST(req: NextRequest) {
  try {
    const { shopName, ownerName, email, password, phone, address, city, state, zip } =
      await req.json();

    if (!shopName || !ownerName || !email || !password || password.length < 8) {
      return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const slug = shopName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 50) + "-" + Date.now().toString(36);

    const passwordHash = await bcrypt.hash(password, 12);
    const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    // Create Stripe customer
    const stripeCustomer = await createStripeCustomer(email, shopName);

    // Create subscription with 14-day trial
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomer.id,
      items: [{ price: process.env.STRIPE_PRICE_BASE! }],
      trial_end: Math.floor(trialEnd.getTime() / 1000),
      payment_behavior: "default_incomplete",
    });

    // Stripe Dahlia (2026-04-22) moved current_period_* from Subscription to subscription items
    const subItem = subscription.items.data[0];

    // Create shop + owner user in one transaction
    await db.$transaction(async (tx) => {
      const shop = await tx.shop.create({
        data: {
          name: shopName,
          slug,
          phone,
          email,
          trialEndsAt: trialEnd,
          locations: {
            create: {
              name: `${shopName} — Main`,
              address,
              city,
              state,
              zip,
              isDefault: true,
            },
          },
          subscription: {
            create: {
              stripeCustomerId: stripeCustomer.id,
              stripeSubscriptionId: subscription.id,
              stripePriceId: process.env.STRIPE_PRICE_BASE!,
              status: "trialing",
              currentPeriodStart: subItem?.current_period_start
                ? new Date(subItem.current_period_start * 1000)
                : null,
              currentPeriodEnd: subItem?.current_period_end
                ? new Date(subItem.current_period_end * 1000)
                : null,
            },
          },
        },
      });

      await tx.user.create({
        data: {
          shopId: shop.id,
          email,
          name: ownerName,
          phone,
          passwordHash,
          role: "shop_owner",
        },
      });

      return shop;
    });

    await sendWelcomeEmail(email, ownerName, shopName, password);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err: any) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
