import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createStripeCoupon, createStripePromoCode } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if ((session?.user as any)?.role !== "platform_owner") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const active = searchParams.get("active");

  const discounts = await db.discountCode.findMany({
    where: active === "true" ? { isActive: true } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      shopDiscounts: {
        include: { shop: { select: { id: true, name: true } } },
      },
    },
  });
  return NextResponse.json({ discounts });
}

export async function POST(req: Request) {
  const session = await auth();
  if ((session?.user as any)?.role !== "platform_owner") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { code, label, discountType, discountValue, durationMonths, expiresAt, maxRedemptions } = body;

  if (!label || !discountType || discountValue == null) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (discountType === "percent" && (discountValue <= 0 || discountValue > 100)) {
    return NextResponse.json({ error: "Percent must be between 1 and 100" }, { status: 400 });
  }

  try {
    // Determine Stripe duration params
    const duration = durationMonths ? "repeating" : "forever";

    // Create Stripe coupon
    const coupon = await createStripeCoupon({
      name: label,
      percentOff: discountType === "percent" ? discountValue : undefined,
      amountOff: discountType === "fixed_amount" ? Math.round(discountValue * 100) : undefined,
      duration,
      durationInMonths: durationMonths ?? undefined,
    });

    let stripePromoId: string | null = null;
    if (code) {
      const promo = await createStripePromoCode(coupon.id, code.toUpperCase());
      stripePromoId = promo.id;
    }

    const discount = await db.discountCode.create({
      data: {
        code: code?.toUpperCase() || null,
        label,
        discountType,
        discountValue,
        durationMonths: durationMonths ?? null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        maxRedemptions: maxRedemptions ?? null,
        stripeId: stripePromoId ?? coupon.id,
        createdByAdminId: (session!.user as any).id,
      },
    });

    return NextResponse.json({ discount }, { status: 201 });
  } catch (err: any) {
    console.error("Create discount error:", err);
    return NextResponse.json({ error: err.message || "Failed to create discount" }, { status: 500 });
  }
}
