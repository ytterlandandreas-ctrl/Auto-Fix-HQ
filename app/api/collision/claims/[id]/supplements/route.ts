import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopId = (session.user as any).shopId as string;
  const { id } = await params;

  const { description, amount } = await req.json();
  if (!description || amount == null) return NextResponse.json({ error: "description and amount required" }, { status: 400 });

  // Verify claim belongs to shop via RO
  const claim = await db.collisionClaim.findFirst({
    where: { id, repairOrder: { shopId } },
  });
  if (!claim) return NextResponse.json({ error: "Claim not found" }, { status: 404 });

  const supplement = await db.supplementRequest.create({
    data: { claimId: id, description, amount, status: "draft" },
  });

  return NextResponse.json(supplement, { status: 201 });
}
