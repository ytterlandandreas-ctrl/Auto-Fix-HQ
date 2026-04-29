import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopId = (session.user as any).shopId as string;
  const role = (session.user as any).role as string;

  if (!["shop_owner", "shop_manager"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, email, role: newRole, password } = await req.json();
  if (!name || !email || !password) {
    return NextResponse.json({ error: "name, email, and password are required" }, { status: 400 });
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "Email already in use" }, { status: 409 });

  const hashed = await bcrypt.hash(password, 12);
  const user = await db.user.create({
    data: { shopId, name, email, passwordHash: hashed, role: newRole ?? "service_writer", isActive: true },
  });

  return NextResponse.json({ id: user.id, name: user.name, email: user.email, role: user.role }, { status: 201 });
}
