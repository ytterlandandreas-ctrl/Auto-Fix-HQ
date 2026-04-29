import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { CustomersClient } from "@/components/shop/CustomersClient";

export default async function CustomersPage({
  searchParams,
}: { searchParams: Promise<{ q?: string }> }) {
  const session = await auth();
  const shopId = (session!.user as any).shopId as string;
  const sp = await searchParams;
  const q = sp.q;

  const where: any = { shopId };
  if (q) {
    where.OR = [
      { firstName: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
      { phone: { contains: q } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }

  const customers = await db.customer.findMany({
    where,
    orderBy: { lastName: "asc" },
    take: 100,
    include: {
      vehicles: { select: { id: true, year: true, make: true, model: true } },
      _count: { select: { repairOrders: true } },
    },
  });

  return <CustomersClient customers={customers as any} q={q} />;
}
