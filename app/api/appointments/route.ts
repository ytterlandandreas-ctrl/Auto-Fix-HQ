import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopId = (session.user as any).shopId as string;

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const appointments = await db.appointment.findMany({
    where: {
      shopId,
      ...(from && to ? { scheduledAt: { gte: new Date(from), lt: new Date(to) } } : {}),
    },
    include: {
      customer: { select: { id: true, firstName: true, lastName: true, phone: true } },
      vehicle: { select: { id: true, year: true, make: true, model: true } },
      technician: { select: { id: true, name: true } },
    },
    orderBy: { scheduledAt: "asc" },
  });

  return NextResponse.json(appointments);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopId = (session.user as any).shopId as string;

  const body = await req.json();
  const { customerId, vehicleId, technicianId, scheduledAt, estimatedDuration, serviceType, notes } = body;

  if (!customerId || !scheduledAt) {
    return NextResponse.json({ error: "customerId and scheduledAt are required" }, { status: 400 });
  }

  const appt = await db.appointment.create({
    data: {
      shopId,
      customerId,
      vehicleId: vehicleId || null,
      technicianId: technicianId || null,
      scheduledAt: new Date(scheduledAt),
      durationMins: estimatedDuration ?? 60,
      serviceType: serviceType || null,
      notes: notes || null,
      status: "scheduled",
    },
  });

  return NextResponse.json(appt, { status: 201 });
}
