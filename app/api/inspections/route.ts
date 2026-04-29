import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopId = (session.user as any).shopId;

  const { repairOrderId } = await req.json();

  const ro = await db.repairOrder.findFirst({ where: { id: repairOrderId, shopId } });
  if (!ro) return NextResponse.json({ error: "RO not found" }, { status: 404 });

  const existing = await db.digitalInspection.findUnique({ where: { repairOrderId } });
  if (existing) return NextResponse.json(existing);

  const token = uuidv4();

  const inspection = await db.digitalInspection.create({
    data: {
      shopId,
      repairOrderId,
      technicianId: (session.user as any).id,
      token,
      status: "draft",
      items: {
        createMany: {
          data: DEFAULT_INSPECTION_ITEMS.map((item, idx) => ({
            category: item.category,
            name: item.name,
            condition: "ok",
            sortOrder: idx,
          })),
        },
      },
    },
    include: { items: { include: { media: true } } },
  });

  return NextResponse.json(inspection, { status: 201 });
}

const DEFAULT_INSPECTION_ITEMS = [
  { category: "brakes", name: "Front Brake Pads" },
  { category: "brakes", name: "Rear Brake Pads" },
  { category: "brakes", name: "Brake Rotors" },
  { category: "brakes", name: "Brake Fluid" },
  { category: "tires", name: "Left Front Tire" },
  { category: "tires", name: "Right Front Tire" },
  { category: "tires", name: "Left Rear Tire" },
  { category: "tires", name: "Right Rear Tire" },
  { category: "fluids", name: "Engine Oil" },
  { category: "fluids", name: "Coolant" },
  { category: "fluids", name: "Power Steering Fluid" },
  { category: "fluids", name: "Windshield Washer Fluid" },
  { category: "belts", name: "Serpentine Belt" },
  { category: "belts", name: "Drive Belts" },
  { category: "lights", name: "Headlights" },
  { category: "lights", name: "Brake Lights" },
  { category: "lights", name: "Turn Signals" },
  { category: "engine", name: "Air Filter" },
  { category: "engine", name: "Battery" },
  { category: "suspension", name: "Shocks/Struts" },
  { category: "suspension", name: "Ball Joints" },
  { category: "hvac", name: "Cabin Air Filter" },
  { category: "glass", name: "Windshield" },
  { category: "body", name: "Wipers" },
];
