import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { createConnectAccount, createConnectAccountLink } from "@/lib/stripe";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopId = (session.user as any).shopId as string;

  const shop = await db.shop.findUnique({
    where: { id: shopId },
    select: { id: true, name: true, stripeAccountId: true, email: true },
  });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  let connectId = shop.stripeAccountId;
  if (!connectId) {
    const account = await createConnectAccount(shop.email ?? "");
    connectId = account.id;
    await db.shop.update({ where: { id: shopId }, data: { stripeAccountId: connectId } });
  }

  const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/shop/integrations?connect=success`;
  const refreshUrl = `${process.env.NEXT_PUBLIC_APP_URL}/shop/integrations?connect=refresh`;
  const url = await createConnectAccountLink(connectId, returnUrl, refreshUrl);

  return NextResponse.json({ url });
}
