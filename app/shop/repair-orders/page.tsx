import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { RepairOrdersClient } from "@/components/shop/RepairOrdersClient";

export default async function RepairOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; filter?: string; q?: string }>;
}) {
  const session = await auth();
  const shopId = (session!.user as any).shopId as string;
  const sp = await searchParams;
  const view = sp.view || "kanban";
  const filter = sp.filter;
  const q = sp.q;

  const where: any = { shopId };

  if (filter === "open") {
    where.status = { in: ["approved", "in_progress", "qc"] };
  } else if (filter === "overdue") {
    where.status = { in: ["approved", "in_progress"] };
    where.promisedAt = { lt: new Date() };
  } else if (filter === "comeback") {
    where.isComeback = true;
  }

  if (q) {
    where.OR = [
      { roNumber: { contains: q, mode: "insensitive" } },
      { customer: { firstName: { contains: q, mode: "insensitive" } } },
      { customer: { lastName: { contains: q, mode: "insensitive" } } },
      { vehicle: { make: { contains: q, mode: "insensitive" } } },
      { vehicle: { model: { contains: q, mode: "insensitive" } } },
    ];
  }

  const ros = await db.repairOrder.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: {
      customer: { select: { id: true, firstName: true, lastName: true, phone: true } },
      vehicle: { select: { year: true, make: true, model: true } },
      writer: { select: { name: true } },
      techClocks: {
        where: { clockedOutAt: null },
        include: { technician: { select: { name: true } } },
      },
    },
  });

  return <RepairOrdersClient ros={ros as any} view={view} filter={filter} q={q} />;
}
