import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Papa from "papaparse";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopId = (session.user as any).shopId;

  const { searchParams } = new URL(req.url);
  const filter = searchParams.get("filter");
  const q = searchParams.get("q");

  const where: any = { shopId };
  if (filter === "low") {
    where.quantityOnHand = { lte: db.inventoryItem.fields.reorderPoint };
  }
  if (q) {
    where.OR = [
      { partNumber: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  const items = await db.inventoryItem.findMany({
    where,
    orderBy: { description: "asc" },
    take: 200,
  });

  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopId = (session.user as any).shopId;

  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    // Bulk CSV import
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const text = await file.text();
    const { data, errors } = Papa.parse(text, { header: true, skipEmptyLines: true });

    if (errors.length > 0) {
      return NextResponse.json({ error: "CSV parse error", details: errors }, { status: 400 });
    }

    let imported = 0;
    let skipped = 0;

    for (const row of data as any[]) {
      if (!row.partNumber || !row.description) { skipped++; continue; }
      await db.inventoryItem.upsert({
        where: { shopId_partNumber: { shopId, partNumber: row.partNumber } },
        update: {
          description: row.description,
          brand: row.brand || null,
          category: row.category || null,
          quantityOnHand: parseFloat(row.quantityOnHand || "0"),
          reorderPoint: parseFloat(row.reorderPoint || "0"),
          reorderQty: parseFloat(row.reorderQty || "0"),
          costPrice: parseFloat(row.costPrice || "0"),
          retailPrice: parseFloat(row.retailPrice || "0"),
        },
        create: {
          shopId,
          partNumber: row.partNumber,
          description: row.description,
          brand: row.brand || null,
          category: row.category || null,
          quantityOnHand: parseFloat(row.quantityOnHand || "0"),
          reorderPoint: parseFloat(row.reorderPoint || "0"),
          reorderQty: parseFloat(row.reorderQty || "0"),
          costPrice: parseFloat(row.costPrice || "0"),
          retailPrice: parseFloat(row.retailPrice || "0"),
        },
      });
      imported++;
    }

    return NextResponse.json({ imported, skipped });
  }

  // Single item creation
  const body = await req.json();
  const { partNumber, description, brand, category, quantityOnHand, reorderPoint, reorderQty, costPrice, retailPrice, location } = body;

  if (!partNumber || !description) {
    return NextResponse.json({ error: "Part number and description required" }, { status: 400 });
  }

  const item = await db.inventoryItem.create({
    data: {
      shopId, partNumber, description, brand, category,
      quantityOnHand: quantityOnHand || 0,
      reorderPoint: reorderPoint || 0,
      reorderQty: reorderQty || 0,
      costPrice: costPrice || 0,
      retailPrice: retailPrice || 0,
      location,
    },
  });

  return NextResponse.json(item, { status: 201 });
}
