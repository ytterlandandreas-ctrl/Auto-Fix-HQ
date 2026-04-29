import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { del } from "@vercel/blob";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string; mediaId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopId = (session.user as any).shopId as string;
  const { id, mediaId } = await params;

  const inspection = await db.digitalInspection.findFirst({ where: { id, shopId } });
  if (!inspection) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const media = await db.inspectionMedia.findUnique({ where: { id: mediaId } });
  if (!media) return NextResponse.json({ error: "Media not found" }, { status: 404 });

  // Best-effort delete from blob storage
  try { await del(media.url); } catch {}

  await db.inspectionMedia.delete({ where: { id: mediaId } });
  return NextResponse.json({ ok: true });
}
