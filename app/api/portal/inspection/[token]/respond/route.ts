import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const inspection = await db.digitalInspection.findUnique({
    where: { token },
    include: { items: true, repairOrder: { include: { customer: true } } },
  });
  if (!inspection) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (["approved", "declined"].includes(inspection.status)) {
    return NextResponse.json({ error: "Already responded" }, { status: 409 });
  }

  const { decisions } = await req.json();

  // Update each item
  for (const [itemId, decision] of Object.entries(decisions)) {
    await db.inspectionItem.updateMany({
      where: { id: itemId, inspectionId: inspection.id },
      data: { decision: decision as "approved" | "declined" | "pending" },
    });
  }

  const allDecisions = Object.values(decisions) as string[];
  const allApproved = allDecisions.every((d) => d === "approved" || d === "pending");
  const allDeclined = allDecisions.every((d) => d === "declined" || d === "pending");
  const someApproved = allDecisions.some((d) => d === "approved");

  const newStatus = allApproved
    ? "approved"
    : allDeclined
    ? "declined"
    : "partially_approved";

  await db.digitalInspection.update({
    where: { id: inspection.id },
    data: { status: newStatus, respondedAt: new Date() },
  });

  // Auto-create line items on RO for approved items
  if (someApproved) {
    const approvedItems = inspection.items.filter(
      (i) => decisions[i.id] === "approved" && i.estimatedCost
    );
    for (const item of approvedItems) {
      const count = await db.rOLineItem.count({ where: { repairOrderId: inspection.repairOrderId } });
      await db.rOLineItem.create({
        data: {
          repairOrderId: inspection.repairOrderId,
          type: "labor",
          description: `${item.name} (Approved via Inspection)`,
          quantity: 1,
          unitPrice: item.estimatedCost || 0,
          isTaxable: true,
          sortOrder: count,
        },
      });
    }
  }

  return NextResponse.json({ status: newStatus });
}
