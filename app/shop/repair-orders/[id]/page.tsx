import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { RODetailClient } from "@/components/shop/RODetailClient";

export default async function RODetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const shopId = (session!.user as any).shopId as string;
  const { id } = await params;

  const ro = await db.repairOrder.findFirst({
    where: { id, shopId },
    include: {
      customer: true,
      vehicle: true,
      lineItems: { orderBy: { sortOrder: "asc" } },
      writer: { select: { id: true, name: true } },
      inspection: { include: { items: { include: { media: true }, orderBy: { sortOrder: "asc" } } } },
      invoice: true,
      techClocks: {
        include: { technician: { select: { id: true, name: true } } },
        orderBy: { clockedInAt: "desc" },
      },
      messages: { orderBy: { createdAt: "asc" }, take: 50 },
      collisionClaim: { include: { insurance: true, supplements: true } },
      auditLogs: { orderBy: { createdAt: "desc" }, take: 20, include: { user: { select: { name: true } } } },
    },
  });

  if (!ro) notFound();

  const users = await db.user.findMany({
    where: { shopId, isActive: true, role: { in: ["technician", "service_writer", "shop_manager", "shop_owner"] } },
    select: { id: true, name: true, role: true },
    orderBy: { name: "asc" },
  });

  const cannedJobs = await db.cannedJob.findMany({
    where: { shopId },
    orderBy: { name: "asc" },
  });

  return (
    <RODetailClient
      ro={ro as any}
      users={users}
      cannedJobs={cannedJobs}
      currentUserId={(session!.user as any).id}
      currentUserRole={(session!.user as any).role}
    />
  );
}
