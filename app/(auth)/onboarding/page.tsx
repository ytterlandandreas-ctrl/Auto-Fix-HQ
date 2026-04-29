import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { OnboardingWizard } from "@/components/shared/OnboardingWizard";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const shopId = (session.user as any).shopId as string;
  const shop = await db.shop.findUnique({
    where: { id: shopId },
    include: { locations: true, subscriptions: true },
  });

  if (shop?.onboardedAt) redirect("/shop/dashboard");

  return <OnboardingWizard shop={shop as any} />;
}
