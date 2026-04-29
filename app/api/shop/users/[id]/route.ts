import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopId = (session.user as any).shopId as string;
  const role = (session.user as any).role as string;
  const currentUserId = (session.user as any).id as string;
  const { id } = await params;

  if (!["shop_owner", "shop_manager"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (id === currentUserId) {
    return NextResponse.json({ error: "Cannot deactivate yourself" }, { status: 400 });
  }

  const user = await db.user.findFirst({ where: { id, shopId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  await db.user.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ ok: true });
}
