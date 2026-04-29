import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { DiscountManagerClient } from "@/components/admin/DiscountManagerClient";

export default async function AdminDiscountsPage() {
  const session = await auth();
  if ((session!.user as any).role !== "platform_owner") return null;

  const discounts = await db.discountCode.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      shopDiscounts: {
        include: {
          shop: { select: { id: true, name: true } },
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Discounts & Promo Codes</h1>
        <p className="text-slate-500 text-sm mt-1">
          Create promo codes, admin-applied deals, time-limited offers, and add-on bundles.
        </p>
      </div>
      <DiscountManagerClient discounts={discounts as any} />
    </div>
  );
}
