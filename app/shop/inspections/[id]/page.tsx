import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { InspectionCaptureClient } from "@/components/shop/InspectionCaptureClient";

export default async function InspectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const shopId = (session!.user as any).shopId as string;
  const { id } = await params;

  const inspection = await db.digitalInspection.findFirst({
    where: { id, shopId },
    include: {
      repairOrder: {
        include: {
          customer: { select: { firstName: true, lastName: true, phone: true, email: true } },
          vehicle: { select: { year: true, make: true, model: true, vin: true, mileage: true } },
        },
      },
      items: { include: { media: true }, orderBy: { sortOrder: "asc" } },
      technician: { select: { name: true } },
    },
  });

  if (!inspection) notFound();

  return <InspectionCaptureClient inspection={inspection as any} />;
}
