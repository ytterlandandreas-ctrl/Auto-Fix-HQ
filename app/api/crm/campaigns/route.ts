import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopId = (session.user as any).shopId as string;

  const campaigns = await db.cRMCampaign.findMany({
    where: { shopId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(campaigns);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopId = (session.user as any).shopId as string;

  const { name, triggerType, channel, messageTemplate, body, subject, isActive } = await req.json();
  const messageBody = body ?? messageTemplate;
  if (!name || !triggerType || !channel || !messageBody) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const campaign = await db.cRMCampaign.create({
    data: {
      shopId,
      name,
      triggerType,
      channel,
      body: messageBody,
      subject: subject ?? null,
      isActive: isActive ?? true,
    },
  });
  return NextResponse.json(campaign, { status: 201 });
}
