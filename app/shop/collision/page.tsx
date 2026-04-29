import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { CollisionClient } from "@/components/shop/CollisionClient";
import { CollisionGate } from "@/components/shop/CollisionGate";

export default async function CollisionPage() {
  const session = await auth();
  const shopId = (session!.user as any).shopId as string;

  const subscription = await db.shopSubscription.findFirst({
    where: { shopId, status: { in: ["active", "trialing"] } },
    include: { addons: true },
  });

  const hasCollision = subscription?.addons?.some((a) => a.addonKey === "collision") ?? false;

  if (!hasCollision) {
    return <CollisionGate />;
  }

  const [claims, insurers] = await Promise.all([
    db.collisionClaim.findMany({
      where: { repairOrder: { shopId } },
      include: {
        repairOrder: {
          select: {
            id: true, roNumber: true,
            vehicle: { select: { year: true, make: true, model: true } },
            customer: { select: { firstName: true, lastName: true } },
          },
        },
        insuranceCompany: true,
        supplements: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    db.insuranceCompany.findMany({
      where: { shopId },
      orderBy: { name: "asc" },
    }),
  ]);

  return <CollisionClient claims={claims as any} insurers={insurers as any} shopId={shopId} />;
}
