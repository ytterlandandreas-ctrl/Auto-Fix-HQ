import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopId = (session.user as any).shopId as string;
  const { id } = await params;

  const data = await req.json();
  const campaign = await db.cRMCampaign.findFirst({ where: { id, shopId } });
  if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await db.cRMCampaign.update({ where: { id }, data });
  return NextResponse.json(updated);
}
