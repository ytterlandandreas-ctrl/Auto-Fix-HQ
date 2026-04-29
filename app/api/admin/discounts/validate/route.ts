import { db } from "@/lib/db";
import { NextResponse } from "next/server";

// Public endpoint — no auth required. Used at registration to validate promo codes.
export async function POST(req: Request) {
  const { code } = await req.json();
  if (!code || typeof code !== "string") {
    return NextResponse.json({ valid: false, error: "Code required" }, { status: 400 });
  }

  const discount = await db.discountCode.findFirst({
    where: {
      code: code.toUpperCase().trim(),
      isActive: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
    select: {
      id: true,
      label: true,
      discountType: true,
      discountValue: true,
      durationMonths: true,
      maxRedemptions: true,
      redemptionCount: true,
    },
  });

  if (!discount) {
    return NextResponse.json({ valid: false, error: "Code not found or expired" });
  }

  if (discount.maxRedemptions && discount.redemptionCount >= discount.maxRedemptions) {
    return NextResponse.json({ valid: false, error: "Code has reached its usage limit" });
  }

  return NextResponse.json({
    valid: true,
    label: discount.label,
    discountType: discount.discountType,
    discountValue: discount.discountValue,
    durationMonths: discount.durationMonths,
  });
}
