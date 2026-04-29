import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ROStatus } from "@prisma/client";
import { triggerRoUpdate, EVENTS } from "@/lib/pusher";
import { invalidateShopCache } from "@/lib/redis";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopId = (session.user as any).shopId;
  const { id } = await params;

  const { status } = await req.json();
  const validStatuses: ROStatus[] = ["estimate","approved","in_progress","qc","completed","invoiced","paid","cancelled"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const ro = await db.repairOrder.findFirst({ where: { id, shopId } });
  if (!ro) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await db.repairOrder.update({
    where: { id },
    data: {
      status,
      completedAt: status === "completed" ? new Date() : ro.completedAt,
    },
  });

  await invalidateShopCache(shopId);

  await db.auditLog.create({
    data: {
      shopId,
      userId: (session.user as any).id,
      repairOrderId: ro.id,
      action: "status_change",
      entityType: "RepairOrder",
      entityId: ro.id,
      before: { status: ro.status },
      after: { status },
    },
  });

  await triggerRoUpdate(shopId, id, EVENTS.RO_STATUS_CHANGED, { status, roNumber: ro.roNumber });

  return NextResponse.json(updated);
}
