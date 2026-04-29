import { NextRequest, NextResponse } from "next/server";
import { constructWebhookEvent } from "@/lib/stripe";
import { db } from "@/lib/db";
import { isIdempotentKey } from "@/lib/redis";

export const config = { api: { bodyParser: false } };

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  let event;
  try {
    event = constructWebhookEvent(body, sig);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 });
  }

  // Idempotency — prevent double-processing
  const alreadyProcessed = await isIdempotentKey(`stripe:${event.id}`);
  if (alreadyProcessed) return NextResponse.json({ received: true });

  const data = event.data.object as any;

  switch (event.type) {
    case "customer.subscription.updated":
    case "customer.subscription.created": {
      await db.shopSubscription.updateMany({
        where: { stripeSubscriptionId: data.id },
        data: {
          status: data.status,
          currentPeriodStart: new Date(data.current_period_start * 1000),
          currentPeriodEnd: new Date(data.current_period_end * 1000),
          cancelAtPeriodEnd: data.cancel_at_period_end,
        },
      });
      if (data.status === "active") {
        await db.shop.updateMany({
          where: { subscription: { stripeSubscriptionId: data.id } },
          data: { isSuspended: false },
        });
      }
      break;
    }

    case "customer.subscription.deleted": {
      await db.shopSubscription.updateMany({
        where: { stripeSubscriptionId: data.id },
        data: { status: "canceled", canceledAt: new Date() },
      });
      await db.shop.updateMany({
        where: { subscription: { stripeSubscriptionId: data.id } },
        data: { isSuspended: true },
      });
      break;
    }

    case "invoice.payment_failed": {
      await db.shopSubscription.updateMany({
        where: { stripeCustomerId: data.customer },
        data: { status: "past_due" },
      });
      break;
    }

    case "invoice.payment_succeeded": {
      // Shop customer payment via Connect
      if (data.metadata?.invoiceId) {
        const token = data.metadata.invoiceId;
        await db.invoice.update({
          where: { token },
          data: {
            status: "paid",
            paidAt: new Date(),
            paidAmount: data.amount_paid / 100,
          },
        });
        await db.repairOrder.updateMany({
          where: { invoice: { token } },
          data: { status: "paid", paidAmount: data.amount_paid / 100 },
        });
      }
      break;
    }

    case "checkout.session.completed": {
      if (data.metadata?.invoiceId) {
        const token = data.metadata.invoiceId;
        const amount = data.amount_total / 100;
        const invoice = await db.invoice.findUnique({ where: { token } });
        if (invoice && invoice.status !== "paid") {
          await db.invoice.update({
            where: { token },
            data: {
              status: amount >= invoice.total ? "paid" : "partial",
              paidAt: amount >= invoice.total ? new Date() : undefined,
              paidAmount: amount,
              stripePaymentIntentId: data.payment_intent,
            },
          });
          await db.payment.create({
            data: {
              shopId: invoice.shopId,
              invoiceId: invoice.id,
              amount,
              method: "stripe",
              stripePaymentIntentId: data.payment_intent,
              processedAt: new Date(),
            },
          });
          if (amount >= invoice.total) {
            await db.repairOrder.updateMany({
              where: { id: invoice.repairOrderId },
              data: { status: "paid", paidAmount: amount },
            });
          }
        }
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
