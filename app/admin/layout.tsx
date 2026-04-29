import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { DEV_ADMIN_SESSION } from "@/lib/dev-session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (process.env.DEV_BYPASS === "true") {
    return <AdminShell user={DEV_ADMIN_SESSION.user as any}>{children}</AdminShell>;
  }

  const session = await auth();
  if (!session) redirect("/login");
  if ((session.user as any).role !== "platform_owner") redirect("/shop/dashboard");

  return <AdminShell user={session.user}>{children}</AdminShell>;
}
