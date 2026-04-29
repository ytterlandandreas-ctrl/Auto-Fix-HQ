import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const shopId = searchParams.get("shopId");

  if (!code || !shopId) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/shop/integrations?paypal=error`);
  }

  const clientId = process.env.PAYPAL_CLIENT_ID!;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET!;
  const base = process.env.NEXT_PUBLIC_APP_URL;
  const redirectUri = `${base}/api/integrations/paypal/callback?shopId=${shopId}`;

  // Exchange authorization code for access token
  const tokenRes = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${base}/shop/integrations?paypal=error`);
  }

  const { access_token, refresh_token, expires_in } = await tokenRes.json();

  await db.integration.upsert({
    where: { shopId_type: { shopId, type: "paypal" } },
    create: {
      shopId,
      type: "paypal",
      status: "healthy",
      accessToken: access_token,
      refreshToken: refresh_token,
      tokenExpiresAt: new Date(Date.now() + expires_in * 1000),
      connectedAt: new Date(),
    },
    update: {
      status: "healthy",
      accessToken: access_token,
      refreshToken: refresh_token,
      tokenExpiresAt: new Date(Date.now() + expires_in * 1000),
      connectedAt: new Date(),
    },
  });

  return NextResponse.redirect(`${base}/shop/integrations?paypal=success`);
}
