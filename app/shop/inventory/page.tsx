import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { InventoryClient } from "@/components/shop/InventoryClient";

export default async function InventoryPage({
  searchParams,
}: { searchParams: Promise<{ filter?: string; q?: string }> }) {
  const session = await auth();
  const shopId = (session!.user as any).shopId as string;
  const sp = await searchParams;
  const filter = sp.filter;
  const q = sp.q;

  const where: any = { shopId };
  if (filter === "low") {
    where.quantityOnHand = { lte: db.inventoryItem.fields.reorderPoint };
  }
  if (q) {
    where.OR = [
      { partNumber: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  const items = await db.inventoryItem.findMany({
    where,
    orderBy: { description: "asc" },
    take: 300,
  });

  const lowCount = await db.inventoryItem.count({
    where: { shopId, quantityOnHand: { lte: db.inventoryItem.fields.reorderPoint } },
  });

  return <InventoryClient items={items} lowCount={lowCount} filter={filter} q={q} />;
}
