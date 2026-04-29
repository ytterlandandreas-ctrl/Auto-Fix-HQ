import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopId = (session.user as any).shopId as string;

  const { name, phone, email, address } = await req.json();
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

  const insurer = await db.insuranceCompany.create({
    data: { shopId, name, phone: phone || null, email: email || null, address: address || null },
  });
  return NextResponse.json(insurer, { status: 201 });
}
