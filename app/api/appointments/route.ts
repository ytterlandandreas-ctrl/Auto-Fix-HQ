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
      assignedTech: { select: { id: true, name: true } },
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
      assignedTechId: technicianId || null,
      scheduledAt: new Date(scheduledAt),
      estimatedDuration: estimatedDuration ?? 60,
      serviceType: serviceType || null,
      notes: notes || null,
      status: "scheduled",
    },
  });

  // Schedule SMS reminder (24h before) — fire and forget
  const apptTime = new Date(scheduledAt);
  const reminderTime = new Date(apptTime.getTime() - 24 * 60 * 60 * 1000);
  if (reminderTime > new Date()) {
    const customer = await db.customer.findUnique({ where: { id: customerId } });
    if (customer?.smsOptIn && customer.phone) {
      // Store reminder intent (actual send happens via cron/queue in production)
      await db.appointmentReminder.create({
        data: {
          appointmentId: appt.id,
          scheduledFor: reminderTime,
          type: "24h",
          status: "pending",
        },
      }).catch(() => {}); // non-fatal if reminders table doesn't exist yet
    }
  }

  return NextResponse.json(appt, { status: 201 });
}
