import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopId = (session.user as any).shopId as string;
  const { id } = await params;

  const vehicles = await db.vehicle.findMany({
    where: { customerId: id, shopId },
    select: { id: true, year: true, make: true, model: true, vin: true, color: true },
    orderBy: { year: "desc" },
  });

  return NextResponse.json(vehicles);
}
