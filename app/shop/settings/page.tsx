import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { SettingsClient } from "@/components/shop/SettingsClient";

export default async function SettingsPage() {
  const session = await auth();
  const shopId = (session!.user as any).shopId as string;
  const userId = (session!.user as any).id as string;
  const userRole = (session!.user as any).role as string;

  const [shop, users, subscription, activeDiscounts, stripeConnect] = await Promise.all([
    db.shop.findUnique({
      where: { id: shopId },
      include: {
        locations: { take: 1 },
      },
    }),
    db.user.findMany({
      where: { shopId },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
      orderBy: { name: "asc" },
    }),
    db.shopSubscription.findFirst({
      where: { shopId },
    }),
    db.shopDiscount.findMany({
      where: { shopId },
      include: { discountCode: true },
    }),
    db.integration.findFirst({
      where: { shopId, type: "stripe_connect" },
      select: { status: true, connectedAt: true },
    }),
  ]);

  return (
    <SettingsClient
      shop={shop as any}
      users={users as any}
      subscription={subscription as any}
      currentUserId={userId}
      currentUserRole={userRole}
      activeDiscounts={activeDiscounts as any}
      stripeConnect={stripeConnect as any}
    />
  );
}
