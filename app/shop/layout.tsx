import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ShopShell } from "@/components/shop/ShopShell";
import { DEV_SHOP_SESSION, DEV_MOCK_SHOP } from "@/lib/dev-session";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  if (process.env.DEV_BYPASS === "true") {
    return (
      <ShopShell
        shop={{ name: DEV_MOCK_SHOP.name, logoUrl: DEV_MOCK_SHOP.logoUrl }}
        user={DEV_SHOP_SESSION.user as any}
        activeAddons={[]}
        userRole="shop_owner"
      >
        {children}
      </ShopShell>
    );
  }

  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = (session.user as any).role;
  const shopId = (session.user as any).shopId;

  if (role === "platform_owner") redirect("/admin/dashboard");
  if (!shopId) redirect("/register");

  const shop = await db.shop.findUnique({
    where: { id: shopId },
    include: {
      addons: { where: { isActive: true } },
    },
  });

  if (!shop) redirect("/register");

  if (shop.isSuspended) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="text-center max-w-md p-6 sm:p-8 bg-white rounded-2xl shadow-lg w-full">
          <h1 className="text-xl sm:text-2xl font-bold text-red-600 mb-2">Account Suspended</h1>
          <p className="text-slate-600 text-sm sm:text-base">
            Your Auto Fix HQ subscription has been suspended. Please contact support at{" "}
            <a href="mailto:support@autofixhq.com" className="text-blue-600 underline">
              support@autofixhq.com
            </a>
            .
          </p>
        </div>
      </div>
    );
  }

  const activeAddons = shop.addons.map((a) => a.addonKey);

  return (
    <ShopShell
      shop={{ name: shop.name, logoUrl: shop.logoUrl }}
      user={session.user}
      activeAddons={activeAddons}
      userRole={role}
    >
      {children}
    </ShopShell>
  );
}
