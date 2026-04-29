import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ROType } from "@prisma/client";
import { invalidateShopCache } from "@/lib/redis";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopId = (session.user as any).shopId;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const q = searchParams.get("q");

  const where: any = { shopId };
  if (status) where.status = status;
  if (q) {
    where.OR = [
      { roNumber: { contains: q, mode: "insensitive" } },
      { customer: { firstName: { contains: q, mode: "insensitive" } } },
      { customer: { lastName: { contains: q, mode: "insensitive" } } },
    ];
  }

  const ros = await db.repairOrder.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: {
      customer: { select: { firstName: true, lastName: true, phone: true } },
      vehicle: { select: { year: true, make: true, model: true } },
    },
  });

  return NextResponse.json(ros);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopId = (session.user as any).shopId;

  const body = await req.json();
  const { customerId, vehicleId, mileageIn, customerConcern, roType, promisedAt, locationId } = body;

  if (!customerId || !vehicleId) {
    return NextResponse.json({ error: "Customer and vehicle required" }, { status: 400 });
  }

  // Check for comeback (same vehicle, same repair type within 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentRO = await db.repairOrder.findFirst({
    where: {
      shopId,
      vehicleId,
      status: { in: ["completed", "invoiced", "paid"] },
      completedAt: { gte: thirtyDaysAgo },
    },
    orderBy: { completedAt: "desc" },
  });

  // Generate RO number
  const count = await db.repairOrder.count({ where: { shopId } });
  const roNumber = String(count + 1).padStart(5, "0");

  const ro = await db.repairOrder.create({
    data: {
      shopId,
      locationId,
      roNumber,
      customerId,
      vehicleId,
      mileageIn,
      customerConcern,
      roType: roType || "mechanical",
      promisedAt: promisedAt ? new Date(promisedAt) : undefined,
      writerId: (session.user as any).id,
      status: "estimate",
      isComeback: !!recentRO,
      comebackFromId: recentRO?.id,
    },
  });

  await invalidateShopCache(shopId);

  await db.auditLog.create({
    data: {
      shopId,
      userId: (session.user as any).id,
      repairOrderId: ro.id,
      action: "create",
      entityType: "RepairOrder",
      entityId: ro.id,
      after: ro,
    },
  });

  return NextResponse.json(ro, { status: 201 });
}
