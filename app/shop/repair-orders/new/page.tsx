import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NewROClient } from "@/components/shop/NewROClient";

export default async function NewROPage() {
  const session = await auth();
  const shopId = (session!.user as any).shopId as string;

  const [customers, technicians, cannedJobs] = await Promise.all([
    db.customer.findMany({
      where: { shopId },
      select: { id: true, firstName: true, lastName: true, phone: true, email: true },
      orderBy: { lastName: "asc" },
      take: 500,
    }),
    db.user.findMany({
      where: { shopId, isActive: true, role: { in: ["technician", "service_writer"] } },
      select: { id: true, name: true, role: true },
    }),
    db.cannedJob.findMany({
      where: { shopId },
      orderBy: { name: "asc" },
    }),
  ]);

  return <NewROClient customers={customers as any} technicians={technicians as any} cannedJobs={cannedJobs as any} />;
}
