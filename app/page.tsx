import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function Home() {
  if (process.env.DEV_BYPASS === "true") {
    redirect("/dev");
  }

  const session = await auth();
  if (!session) redirect("/login");

  const role = (session.user as any).role;
  if (role === "platform_owner") redirect("/admin/dashboard");
  redirect("/shop/dashboard");
}
