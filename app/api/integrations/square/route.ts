import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const appId = process.env.SQUARE_APPLICATION_ID;
  if (!appId) return NextResponse.json({ error: "Square not configured" }, { status: 500 });

  const shopId = (session.user as any).shopId as string;
  const base = process.env.NEXT_PUBLIC_APP_URL;
  const redirectUri = encodeURIComponent(`${base}/api/integrations/square/callback`);

  // state carries shopId so the callback can associate the account
  const state = Buffer.from(JSON.stringify({ shopId })).toString("base64");

  const scope = "MERCHANT_PROFILE_READ PAYMENTS_WRITE PAYMENTS_READ ORDERS_WRITE ORDERS_READ INVOICES_WRITE INVOICES_READ";

  const url =
    `https://connect.squareup.com/oauth2/authorize` +
    `?client_id=${appId}` +
    `&scope=${encodeURIComponent(scope)}` +
    `&state=${state}` +
    `&redirect_uri=${redirectUri}`;

  return NextResponse.json({ url });
}
