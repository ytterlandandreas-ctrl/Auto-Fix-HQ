import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopId = (session.user as any).shopId as string;

  const { claimNumber, insuranceCompanyId, adjusterName, adjusterPhone, adjusterEmail, coverageType, deductible, roId } = await req.json();

  if (!insuranceCompanyId) return NextResponse.json({ error: "insuranceCompanyId required" }, { status: 400 });
  if (!roId) return NextResponse.json({ error: "roId required" }, { status: 400 });

  const ro = await db.repairOrder.findFirst({ where: { id: roId, shopId } });
  if (!ro) return NextResponse.json({ error: "Repair order not found" }, { status: 404 });

  const claim = await db.collisionClaim.create({
    data: {
      shopId,
      repairOrderId: roId,
      insuranceCoId: insuranceCompanyId,
      claimNumber: claimNumber || null,
      adjusterName: adjusterName || null,
      adjusterPhone: adjusterPhone || null,
      adjusterEmail: adjusterEmail || null,
      coverageType: coverageType || "collision",
      deductible: deductible ?? 0,
      status: "open",
    },
  });

  return NextResponse.json(claim, { status: 201 });
}
