import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ShopDetailClient } from "@/components/admin/ShopDetailClient";
import { notFound } from "next/navigation";

export default async function AdminShopDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if ((session!.user as any).role !== "platform_owner") return null;

  const { id } = await params;

  const shop = await db.shop.findUnique({
    where: { id },
    include: {
      locations: true,
      subscription: true,
      addons: true,
      users: { select: { id: true, name: true, email: true, role: true, isActive: true, lastLoginAt: true } },
      _count: {
        select: {
          repairOrders: true,
          customers: true,
          inventoryItems: true,
        },
      },
    },
  });

  if (!shop) notFound();

  // Latest activity
  const recentROs = await db.repairOrder.findMany({
    where: { shopId: id },
    orderBy: { updatedAt: "desc" },
    take: 5,
    select: { id: true, roNumber: true, status: true, grandTotal: true, updatedAt: true },
  });

  const integrations = await db.integration.findMany({ where: { shopId: id } });

  return (
    <ShopDetailClient shop={shop as any} recentROs={recentROs as any} integrations={integrations as any} />
  );
}
