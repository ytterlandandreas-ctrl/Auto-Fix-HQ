import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { LineItemType } from "@prisma/client";
import { invalidateShopCache } from "@/lib/redis";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopId = (session.user as any).shopId;
  const { id } = await params;

  const ro = await db.repairOrder.findFirst({ where: { id, shopId } });
  if (!ro) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { lineItems } = await req.json();

  // Delete existing and recreate — simplest correct approach
  await db.rOLineItem.deleteMany({ where: { repairOrderId: id } });

  const types: LineItemType[] = ["labor", "part", "sublet", "fee"];

  const created = await db.rOLineItem.createMany({
    data: lineItems
      .filter((i: any) => i.description?.trim())
      .map((item: any, idx: number) => ({
        repairOrderId: id,
        type: types.includes(item.type) ? item.type : "labor",
        description: item.description,
        technicianId: item.technicianId || null,
        partNumber: item.partNumber || null,
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || 0,
        laborHours: item.laborHours || null,
        laborTimeGuide: item.laborTimeGuide || null,
        isTaxable: item.isTaxable !== false,
        isOem: item.isOem || null,
        sortOrder: idx,
      })),
  });

  // Recalculate totals
  const all = await db.rOLineItem.findMany({ where: { repairOrderId: id } });
  const labor = all.filter((i) => i.type === "labor").reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const parts = all.filter((i) => i.type === "part").reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const sublet = all.filter((i) => i.type === "sublet").reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const fees = all.filter((i) => i.type === "fee").reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const subtotal = labor + parts + sublet + fees;
  const shop = await db.shop.findUnique({ where: { id: shopId }, select: { taxRate: true } });
  const taxTotal = subtotal * ((shop?.taxRate || 0) / 100);

  await db.repairOrder.update({
    where: { id: id },
    data: {
      laborTotal: labor,
      partsTotal: parts,
      subletTotal: sublet,
      feeTotal: fees,
      taxTotal,
      grandTotal: subtotal + taxTotal,
    },
  });

  await invalidateShopCache(shopId);

  return NextResponse.json({ count: created.count });
}
