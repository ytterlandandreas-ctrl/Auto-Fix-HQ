import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripe, ADDON_PRICES } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopId = (session.user as any).shopId as string;

  const { name, address, city, state, zip, phone, laborRate, taxRate, shopType, addons } = await req.json();

  await db.$transaction(async (tx) => {
    await tx.shop.update({
      where: { id: shopId },
      data: {
        name,
        shopType,
        laborRate: parseFloat(laborRate),
        taxRate: parseFloat(taxRate),
        onboardedAt: new Date(),
      },
    });

    await tx.shopLocation.updateMany({
      where: { shopId, isPrimary: true },
      data: { address, city, state, zip, phone },
    });

    // Add selected add-ons to subscription
    if (Array.isArray(addons) && addons.length > 0) {
      const subscription = await tx.shopSubscription.findFirst({
        where: { shopId, status: { in: ["active", "trialing"] } },
      });

      if (subscription) {
        for (const addonKey of addons) {
          await tx.shopAddon.create({
            data: { subscriptionId: subscription.id, addonKey, isActive: true },
          }).catch(() => {});
        }

        // Update Stripe subscription items (best-effort)
        try {
          const items = addons
            .map((key: string) => ADDON_PRICES[key])
            .filter(Boolean)
            .map((price: string) => ({ price }));
          if (items.length > 0) {
            for (const item of items) {
              await stripe.subscriptionItems.create({
                subscription: subscription.stripeSubscriptionId,
                price: item.price,
                proration_behavior: "none",
              }).catch(() => {});
            }
          }
        } catch {
          // non-fatal
        }
      }
    }
  });

  return NextResponse.json({ ok: true });
}
