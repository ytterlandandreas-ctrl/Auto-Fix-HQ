import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AppointmentsClient } from "@/components/shop/AppointmentsClient";

export default async function AppointmentsPage({
  searchParams,
}: { searchParams: Promise<{ view?: string; date?: string }> }) {
  const session = await auth();
  const shopId = (session!.user as any).shopId as string;

  const sp = await searchParams;
  const view = sp.view ?? "week";
  const dateParam = sp.date ?? new Date().toISOString().split("T")[0];
  const focusDate = new Date(dateParam + "T00:00:00");

  let start: Date, end: Date;
  if (view === "day") {
    start = new Date(focusDate);
    end = new Date(focusDate);
    end.setDate(end.getDate() + 1);
  } else if (view === "month") {
    start = new Date(focusDate.getFullYear(), focusDate.getMonth(), 1);
    end = new Date(focusDate.getFullYear(), focusDate.getMonth() + 1, 1);
  } else {
    // week — Mon to Sun
    const day = focusDate.getDay();
    const diff = (day === 0 ? -6 : 1 - day);
    start = new Date(focusDate);
    start.setDate(start.getDate() + diff);
    end = new Date(start);
    end.setDate(end.getDate() + 7);
  }

  const appointments = await db.appointment.findMany({
    where: {
      shopId,
      scheduledAt: { gte: start, lt: end },
    },
    include: {
      customer: { select: { id: true, firstName: true, lastName: true, phone: true } },
      vehicle: { select: { id: true, year: true, make: true, model: true } },
      technician: { select: { id: true, name: true } },
    },
    orderBy: { scheduledAt: "asc" },
  });

  const technicians = await db.user.findMany({
    where: { shopId, isActive: true, role: { in: ["technician", "service_writer"] } },
    select: { id: true, name: true, role: true },
    orderBy: { name: "asc" },
  });

  const customers = await db.customer.findMany({
    where: { shopId },
    select: { id: true, firstName: true, lastName: true, phone: true, email: true },
    orderBy: { lastName: "asc" },
    take: 500,
  });

  return (
    <AppointmentsClient
      appointments={appointments as any}
      technicians={technicians as any}
      customers={customers as any}
      shopId={shopId}
      view={view}
      focusDate={focusDate.toISOString()}
    />
  );
}
