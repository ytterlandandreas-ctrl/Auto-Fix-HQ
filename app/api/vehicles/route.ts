import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopId = (session.user as any).shopId as string;

  const body = await req.json();
  const { customerId, year, make, model, vin, mileage, color, licensePlate } = body;

  if (!customerId || !year || !make || !model) {
    return NextResponse.json({ error: "customerId, year, make, model required" }, { status: 400 });
  }

  // Verify customer belongs to shop
  const customer = await db.customer.findFirst({ where: { id: customerId, shopId } });
  if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  const vehicle = await db.vehicle.create({
    data: {
      shopId, customerId, year, make, model,
      vin: vin || null, color: color || null,
      licensePlate: licensePlate || null,
      mileage: mileage || null,
    },
  });

  return NextResponse.json(vehicle, { status: 201 });
}
