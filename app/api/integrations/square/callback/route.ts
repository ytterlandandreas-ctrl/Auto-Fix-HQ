import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const stateRaw = searchParams.get("state");
  const base = process.env.NEXT_PUBLIC_APP_URL;

  if (!code || !stateRaw) {
    return NextResponse.redirect(`${base}/shop/integrations?square=error`);
  }

  let shopId: string;
  try {
    const decoded = JSON.parse(Buffer.from(stateRaw, "base64").toString());
    shopId = decoded.shopId;
  } catch {
    return NextResponse.redirect(`${base}/shop/integrations?square=error`);
  }

  const appId = process.env.SQUARE_APPLICATION_ID!;
  const appSecret = process.env.SQUARE_APPLICATION_SECRET!;
  const redirectUri = `${base}/api/integrations/square/callback`;

  const tokenRes = await fetch("https://connect.squareup.com/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Square-Version": "2024-01-17" },
    body: JSON.stringify({
      client_id: appId,
      client_secret: appSecret,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${base}/shop/integrations?square=error`);
  }

  const { access_token, refresh_token, expires_at, merchant_id } = await tokenRes.json();

  await db.integration.upsert({
    where: { shopId_type: { shopId, type: "square" } },
    create: {
      shopId,
      type: "square",
      status: "healthy",
      accessToken: access_token,
      refreshToken: refresh_token ?? null,
      tokenExpiresAt: expires_at ? new Date(expires_at) : null,
      config: { merchantId: merchant_id },
      connectedAt: new Date(),
    },
    update: {
      status: "healthy",
      accessToken: access_token,
      refreshToken: refresh_token ?? null,
      tokenExpiresAt: expires_at ? new Date(expires_at) : null,
      config: { merchantId: merchant_id },
      connectedAt: new Date(),
    },
  });

  return NextResponse.redirect(`${base}/shop/integrations?square=success`);
}
