import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopId = (session.user as any).shopId;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const take = parseInt(searchParams.get("take") || "50");

  const where: any = { shopId };
  if (q) {
    where.OR = [
      { firstName: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
      { phone: { contains: q } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }

  const customers = await db.customer.findMany({
    where,
    orderBy: { lastName: "asc" },
    take,
    include: {
      vehicles: { select: { id: true, year: true, make: true, model: true } },
      _count: { select: { repairOrders: true } },
    },
  });

  return NextResponse.json(customers);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopId = (session.user as any).shopId;

  const body = await req.json();
  const { firstName, lastName, email, phone, altPhone, address, city, state, zip, notes, source, smsOptIn, emailOptIn } = body;

  if (!firstName || !lastName || !phone) {
    return NextResponse.json({ error: "Name and phone required" }, { status: 400 });
  }

  const customer = await db.customer.create({
    data: { shopId, firstName, lastName, email, phone, altPhone, address, city, state, zip, notes, source, smsOptIn: smsOptIn !== false, emailOptIn: emailOptIn !== false },
  });

  return NextResponse.json(customer, { status: 201 });
}
