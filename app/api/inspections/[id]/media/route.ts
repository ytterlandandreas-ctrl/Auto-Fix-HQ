import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopId = (session.user as any).shopId as string;
  const { id } = await params;

  const inspection = await db.digitalInspection.findFirst({ where: { id, shopId } });
  if (!inspection) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get("file") as File;
  const inspectionItemId = formData.get("inspectionItemId") as string;

  if (!file || !inspectionItemId) return NextResponse.json({ error: "Missing file or itemId" }, { status: 400 });

  const blob = await put(`inspections/${id}/${Date.now()}-${file.name}`, file, {
    access: "public",
    addRandomSuffix: true,
  });

  const media = await db.inspectionMedia.create({
    data: {
      itemId: inspectionItemId,
      type: file.type.startsWith("video/") ? "video" : "photo",
      url: blob.url,
      blobKey: blob.pathname,
      caption: file.name,
    },
  });

  return NextResponse.json(media, { status: 201 });
}
