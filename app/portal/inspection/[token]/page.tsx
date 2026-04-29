import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { InspectionPortalClient } from "@/components/portal/InspectionPortalClient";

export default async function InspectionPortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const inspection = await db.digitalInspection.findUnique({
    where: { token },
    include: {
      repairOrder: {
        include: {
          vehicle: true,
          customer: { select: { firstName: true, lastName: true } },
        },
      },
      items: {
        include: { media: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!inspection) notFound();

  const shop = await db.shop.findUnique({
    where: { id: inspection.shopId },
    select: { name: true, phone: true, logoUrl: true },
  });

  return (
    <InspectionPortalClient
      inspection={inspection as any}
      shop={shop as any}
    />
  );
}
