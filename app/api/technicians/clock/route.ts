import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { triggerTechUpdate, EVENTS } from "@/lib/pusher";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopId = (session.user as any).shopId;
  const technicianId = (session.user as any).id;

  const { action, repairOrderId, notes } = await req.json();

  if (action === "in") {
    // Auto clock out any open entries first
    const open = await db.technicianTimeClock.findFirst({
      where: { technicianId, clockedOutAt: null },
    });
    if (open) {
      const mins = Math.round((Date.now() - open.clockedInAt.getTime()) / 60000);
      await db.technicianTimeClock.update({
        where: { id: open.id },
        data: { clockedOutAt: new Date(), totalMinutes: mins },
      });
    }

    const entry = await db.technicianTimeClock.create({
      data: {
        shopId,
        technicianId,
        repairOrderId: repairOrderId || null,
        clockedInAt: new Date(),
        notes,
      },
    });

    const tech = await db.user.findUnique({ where: { id: technicianId }, select: { name: true } });
    await triggerTechUpdate(shopId, EVENTS.TECH_CLOCKED_IN, {
      technicianId,
      technicianName: tech?.name,
      repairOrderId,
    });

    return NextResponse.json(entry, { status: 201 });
  }

  if (action === "out") {
    const open = await db.technicianTimeClock.findFirst({
      where: { technicianId, clockedOutAt: null },
    });
    if (!open) return NextResponse.json({ error: "Not clocked in" }, { status: 400 });

    const mins = Math.round((Date.now() - open.clockedInAt.getTime()) / 60000);
    const updated = await db.technicianTimeClock.update({
      where: { id: open.id },
      data: { clockedOutAt: new Date(), totalMinutes: mins, notes },
    });

    const tech = await db.user.findUnique({ where: { id: technicianId }, select: { name: true } });
    await triggerTechUpdate(shopId, EVENTS.TECH_CLOCKED_OUT, {
      technicianId,
      technicianName: tech?.name,
      totalMinutes: mins,
    });

    // Update efficiency score
    await updateEfficiencyScore(shopId, technicianId);

    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

async function updateEfficiencyScore(shopId: string, technicianId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const clocks = await db.technicianTimeClock.findMany({
    where: {
      technicianId,
      clockedInAt: { gte: today, lt: tomorrow },
      clockedOutAt: { not: null },
    },
  });

  const clockedMins = clocks.reduce((s, c) => s + (c.totalMinutes || 0), 0);
  const clockedHours = clockedMins / 60;

  // Get billed hours from line items today
  const ros = await db.repairOrder.findMany({
    where: {
      shopId,
      updatedAt: { gte: today, lt: tomorrow },
      techClocks: { some: { technicianId } },
    },
    include: { lineItems: { where: { type: "labor", technicianId } } },
  });

  const billedHours = ros.flatMap((r) => r.lineItems).reduce((s, i) => s + (i.laborHours || 0), 0);
  const efficiencyPct = clockedHours > 0 ? (billedHours / clockedHours) * 100 : 0;

  await db.technicianEfficiencyScore.upsert({
    where: { technicianId_date: { technicianId, date: today } },
    update: { clockedHours, billedHours, efficiencyPct },
    create: { shopId, technicianId, date: today, clockedHours, billedHours, efficiencyPct },
  });
}
