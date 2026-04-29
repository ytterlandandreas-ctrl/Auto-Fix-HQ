import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { checkIntegrationHealth } from "@/lib/integration-health";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopId = (session.user as any).shopId as string;

  const { type } = await req.json();

  const integration = await db.integration.findFirst({ where: { shopId, type } });
  if (!integration) return NextResponse.json({ error: "Integration not found" }, { status: 404 });

  await checkIntegrationHealth(shopId, type);
  return NextResponse.json({ ok: true });
}
