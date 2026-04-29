import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopId = (session.user as any).shopId as string;
  const { id, itemId } = await params;

  const inspection = await db.digitalInspection.findFirst({ where: { id, shopId } });
  if (!inspection) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data = await req.json();
  const allowed: any = {};
  if (data.condition !== undefined) allowed.condition = data.condition;
  if (data.notes !== undefined) allowed.notes = data.notes;
  if (data.estimatedCost !== undefined) allowed.estimatedCost = data.estimatedCost;

  const updated = await db.inspectionItem.update({
    where: { id: itemId },
    data: allowed,
  });

  return NextResponse.json(updated);
}
