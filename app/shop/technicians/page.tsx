import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { TechBoardClient } from "@/components/shop/TechBoardClient";

export default async function TechnicianBoardPage() {
  const session = await auth();
  const shopId = (session!.user as any).shopId as string;

  const technicians = await db.user.findMany({
    where: { shopId, isActive: true, role: { in: ["technician", "service_writer"] } },
    select: {
      id: true, name: true, role: true,
      techClocks: {
        where: { clockedOutAt: null },
        take: 1,
        include: {
          repairOrder: {
            select: {
              id: true, roNumber: true,
              vehicle: { select: { year: true, make: true, model: true } },
              customer: { select: { firstName: true, lastName: true } },
            },
          },
        },
      },
      efficiencyScores: {
        where: { date: { gte: new Date(new Date().setHours(0,0,0,0)) } },
        take: 1,
      },
    },
    orderBy: { name: "asc" },
  });

  const openROs = await db.repairOrder.findMany({
    where: { shopId, status: { in: ["approved", "in_progress", "qc"] } },
    select: {
      id: true, roNumber: true, status: true,
      vehicle: { select: { year: true, make: true, model: true } },
      customer: { select: { firstName: true, lastName: true } },
      techClocks: { where: { clockedOutAt: null }, take: 1, include: { technician: { select: { name: true } } } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const currentUserId = (session!.user as any).id;
  const currentUserRole = (session!.user as any).role;

  return (
    <TechBoardClient
      technicians={technicians as any}
      openROs={openROs as any}
      shopId={shopId}
      currentUserId={currentUserId}
      currentUserRole={currentUserRole}
    />
  );
}
