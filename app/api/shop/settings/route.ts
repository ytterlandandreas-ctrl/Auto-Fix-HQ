import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopId = (session.user as any).shopId as string;
  const role = (session.user as any).role as string;

  if (!["shop_owner", "shop_manager"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, phone, address, city, state, zip, taxRate, laborRate } = await req.json();

  await db.$transaction([
    db.shop.update({ where: { id: shopId }, data: { name, taxRate, laborRate } }),
    db.shopLocation.updateMany({
      where: { shopId, isDefault: true },
      data: { phone, address, city, state, zip },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
