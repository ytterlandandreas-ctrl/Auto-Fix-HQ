import { redirect } from "next/navigation";
import { Wrench, ShieldAlert } from "lucide-react";

// Only accessible when DEV_BYPASS=true — hard redirect in production
export default function DevPreviewPage() {
  if (process.env.DEV_BYPASS !== "true") {
    redirect("/login");
  }

  const adminLinks = [
    { label: "Admin Dashboard", href: "/admin/dashboard" },
    { label: "Admin — Shops", href: "/admin/shops" },
    { label: "Admin — Subscriptions", href: "/admin/subscriptions" },
    { label: "Admin — Analytics", href: "/admin/analytics" },
    { label: "Admin — Billing", href: "/admin/billing" },
  ];

  const shopLinks = [
    { label: "Shop Dashboard", href: "/shop/dashboard" },
    { label: "Customers", href: "/shop/customers" },
    { label: "Repair Orders", href: "/shop/repair-orders" },
    { label: "Invoices", href: "/shop/invoices" },
    { label: "Inspections", href: "/shop/inspections" },
    { label: "Appointments", href: "/shop/appointments" },
    { label: "Inventory", href: "/shop/inventory" },
    { label: "CRM", href: "/shop/crm" },
    { label: "Technicians", href: "/shop/technicians" },
    { label: "Vehicles", href: "/shop/vehicles" },
    { label: "Analytics", href: "/shop/analytics" },
    { label: "Collision", href: "/shop/collision" },
    { label: "Integrations", href: "/shop/integrations" },
    { label: "Settings", href: "/shop/settings" },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-3xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Auto Fix HQ — Dev Preview</h1>
            <p className="text-slate-400 text-sm">Internal navigation for pre-launch review</p>
          </div>
        </div>

        {/* Warning banner */}
        <div className="flex items-start gap-3 bg-yellow-900/40 border border-yellow-600/50 rounded-xl p-4">
          <ShieldAlert className="w-5 h-5 text-yellow-400 mt-0.5 shrink-0" />
          <p className="text-yellow-200 text-sm">
            <strong>Dev bypass is active.</strong> All auth and database checks are skipped. This page
            and the bypass are only available while <code className="bg-yellow-900/60 px-1 rounded">DEV_BYPASS=true</code> is
            set in <code className="bg-yellow-900/60 px-1 rounded">.env.local</code>. Remove that variable before going live.
          </p>
        </div>

        {/* Admin section */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
            Platform Admin (platform_owner role)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {adminLinks.map(({ label, href }) => (
              <a
                key={href}
                href={href}
                className="block bg-slate-800 hover:bg-slate-700 rounded-lg px-4 py-3 text-sm font-medium transition-colors"
              >
                {label}
              </a>
            ))}
          </div>
        </section>

        {/* Shop section */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
            Shop Operator (shop_owner role — "Dev Auto Shop")
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {shopLinks.map(({ label, href }) => (
              <a
                key={href}
                href={href}
                className="block bg-slate-800 hover:bg-slate-700 rounded-lg px-4 py-3 text-sm font-medium transition-colors"
              >
                {label}
              </a>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
