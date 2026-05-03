import Stripe from "stripe";

let _stripe: Stripe | null = null;
export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    if (!_stripe) {
      _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: "2026-04-22.dahlia",
        typescript: true,
      });
    }
    const val = (_stripe as any)[prop];
    return typeof val === "function" ? val.bind(_stripe) : val;
  },
});

// ─── Plan Tier Prices ───────────────────────────────────────────────────────
// Free tier has no Stripe price (shop is not billed)
export const TIER_STRIPE_PRICES: Record<string, string | undefined> = {
  free: undefined,
  starter: process.env.STRIPE_PRICE_STARTER ?? process.env.STRIPE_PRICE_BASE!,
  pro: process.env.STRIPE_PRICE_PRO!,
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE!,
};

export const TIER_DISPLAY_PRICES: Record<string, number> = {
  free: 0,
  starter: 149,
  pro: 249,
  enterprise: 449,
};

// ─── Add-on Prices ──────────────────────────────────────────────────────────
export const ADDON_PRICES: Record<string, string> = {
  quickbooks: process.env.STRIPE_PRICE_QUICKBOOKS!,
  crm: process.env.STRIPE_PRICE_CRM!,
  dvi_pro: process.env.STRIPE_PRICE_DVI_PRO!,
  partstech: process.env.STRIPE_PRICE_PARTSTECH!,
  google_reviews: process.env.STRIPE_PRICE_GOOGLE_REVIEWS!,
  tech_suite: process.env.STRIPE_PRICE_TECH_SUITE!,
  collision: process.env.STRIPE_PRICE_COLLISION!,
  sms_campaigns: process.env.STRIPE_PRICE_SMS_CAMPAIGNS!,
  extra_location: process.env.STRIPE_PRICE_EXTRA_LOCATION!,
};

export const ADDON_LABELS: Record<string, string> = {
  quickbooks: "QuickBooks Online Sync",
  crm: "Advanced CRM & Lifecycle Campaigns",
  dvi_pro: "DVI Pro (Video + Annotated Photos)",
  partstech: "PartsTech Parts Ordering",
  google_reviews: "Google Reviews Automation",
  tech_suite: "Technician Efficiency Suite",
  collision: "Body/Collision Insurance Module",
  sms_campaigns: "SMS Marketing Campaigns",
  extra_location: "Additional Location",
};

export const ADDON_PRICES_DISPLAY: Record<string, number> = {
  quickbooks: 25,
  crm: 29,
  dvi_pro: 19,
  partstech: 15,
  google_reviews: 19,
  tech_suite: 19,
  collision: 39,
  sms_campaigns: 29,
  extra_location: 49,
};

export async function createStripeCustomer(email: string, name: string) {
  return stripe.customers.create({ email, name });
}

export async function createSubscription(
  customerId: string,
  priceId: string,
  trialDays = 14
) {
  return stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    trial_period_days: trialDays,
    payment_behavior: "default_incomplete",
    payment_settings: { save_default_payment_method: "on_subscription" },
    expand: ["latest_invoice.payment_intent"],
  });
}

export async function createConnectAccount(email: string) {
  return stripe.accounts.create({
    type: "express",
    email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });
}

export async function createConnectAccountLink(
  accountId: string,
  returnUrl: string,
  refreshUrl: string
) {
  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: "account_onboarding",
  });
  return link.url;
}

export async function createPaymentLink(
  amount: number,
  invoiceId: string,
  shopStripeAccountId: string,
  description: string
) {
  const session = await stripe.checkout.sessions.create(
    {
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: description },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      metadata: { invoiceId },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/portal/invoice/${invoiceId}?paid=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/portal/invoice/${invoiceId}`,
      payment_intent_data: {
        application_fee_amount: Math.round(amount * 100 * 0.015), // 1.5% platform fee
      },
    },
    { stripeAccount: shopStripeAccountId }
  );
  return session;
}

export function constructWebhookEvent(body: string, signature: string) {
  return stripe.webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );
}

// ─── Plan Management Helpers ────────────────────────────────────────────────

/** Change a subscription's base plan price (with immediate proration invoice) */
export async function changePlan(subscriptionId: string, newPriceId: string) {
  const sub = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["items"],
  });
  const baseItem = sub.items.data[0];
  return stripe.subscriptions.update(subscriptionId, {
    items: [{ id: baseItem.id, price: newPriceId }],
    proration_behavior: "always_invoice",
  });
}

// ─── Discount / Coupon Helpers ──────────────────────────────────────────────

/** Create a Stripe coupon. Returns the coupon object. */
export async function createStripeCoupon(params: {
  name: string;
  percentOff?: number;
  amountOff?: number;   // in cents
  duration: "once" | "repeating" | "forever";
  durationInMonths?: number;
}) {
  return stripe.coupons.create({
    name: params.name,
    percent_off: params.percentOff,
    amount_off: params.amountOff,
    currency: params.amountOff ? "usd" : undefined,
    duration: params.duration,
    duration_in_months: params.durationInMonths,
  });
}

/** Create a Stripe Promotion Code tied to a coupon. Code is optional — omit for admin-applied deals. */
export async function createStripePromoCode(couponId: string, code?: string) {
  return stripe.promotionCodes.create({
    coupon: couponId,
    ...(code ? { code } : {}),
  } as any);
}

/** Apply a discount (via promotion code or coupon) to an existing subscription */
export async function applyDiscountToSubscription(
  subscriptionId: string,
  couponId: string
) {
  return stripe.subscriptions.update(subscriptionId, {
    discounts: [{ coupon: couponId }],
  });
}

/** Remove the active discount from a subscription */
export async function removeDiscountFromSubscription(subscriptionId: string) {
  return stripe.subscriptions.update(subscriptionId, {
    discounts: [],
  });
}

/** Validate a promo code string. Returns the promotion code object or null. */
export async function validatePromoCode(code: string) {
  const results = await stripe.promotionCodes.list({
    code,
    active: true,
    limit: 1,
  });
  return results.data[0] ?? null;
}

/** Get the default payment method for a Stripe customer (for display) */
export async function getCustomerPaymentMethod(customerId: string) {
  try {
    const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
    if (customer.deleted) return null;
    const pmId = customer.invoice_settings?.default_payment_method as string | null;
    if (!pmId) return null;
    return stripe.paymentMethods.retrieve(pmId);
  } catch {
    return null;
  }
}
