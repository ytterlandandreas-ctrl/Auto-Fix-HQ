import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = process.env.PAYPAL_CLIENT_ID;
  if (!clientId) return NextResponse.json({ error: "PayPal not configured" }, { status: 500 });

  const shopId = (session.user as any).shopId as string;
  const base = process.env.NEXT_PUBLIC_APP_URL;
  const returnUrl = encodeURIComponent(`${base}/api/integrations/paypal/callback?shopId=${shopId}`);

  const scope = encodeURIComponent(
    "openid email https://uri.paypal.com/services/paypalattributes https://uri.paypal.com/payments/payouts"
  );

  const url =
    `https://www.paypal.com/signin/authorize` +
    `?client_id=${clientId}` +
    `&response_type=code` +
    `&scope=${scope}` +
    `&redirect_uri=${returnUrl}`;

  return NextResponse.json({ url });
}
