import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { CheckCircle, Wrench, Phone } from "lucide-react";

export default async function InvoicePortalPage({ params, searchParams }: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ paid?: string }>;
}) {
  const { token } = await params;
  const sp = await searchParams;
  const invoice = await db.invoice.findUnique({
    where: { token },
    include: {
      repairOrder: {
        include: {
          customer: true,
          vehicle: true,
          lineItems: { orderBy: { sortOrder: "asc" } },
        },
      },
    },
  });

  if (!invoice) notFound();

  const shop = await db.shop.findUnique({
    where: { id: invoice.shopId },
    select: { name: true, phone: true, email: true, logoUrl: true },
  });

  const justPaid = sp.paid === "true";
  const isPaid = invoice.status === "paid" || justPaid;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <Wrench className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-xl text-slate-900">{shop?.name}</p>
            {shop?.phone && <p className="text-sm text-slate-500">{shop.phone}</p>}
          </div>
        </div>

        {/* Paid confirmation */}
        {isPaid && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-5 flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-green-800">Payment Received</p>
              <p className="text-sm text-green-700">Thank you! Your invoice has been paid.</p>
            </div>
          </div>
        )}

        {/* Invoice card */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-xl font-bold text-slate-900">Invoice #{invoice.invoiceNumber}</h1>
                <p className="text-slate-500 text-sm mt-1">
                  {invoice.repairOrder.vehicle.year} {invoice.repairOrder.vehicle.make} {invoice.repairOrder.vehicle.model}
                </p>
                <p className="text-slate-500 text-sm">
                  {invoice.repairOrder.customer.firstName} {invoice.repairOrder.customer.lastName}
                </p>
              </div>
              <div className="text-right">
                <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${
                  isPaid ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                }`}>
                  {isPaid ? "Paid" : "Due"}
                </span>
                {invoice.dueDate && !isPaid && (
                  <p className="text-xs text-slate-400 mt-1">
                    Due {new Date(invoice.dueDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Line items */}
          <div className="p-5 space-y-2">
            {invoice.repairOrder.lineItems.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <div>
                  <span className="font-medium text-slate-700">{item.description}</span>
                  <span className="text-slate-400 ml-2 text-xs">
                    {item.type === "labor" ? `${item.laborHours ?? item.quantity}h @ ${formatCurrency(item.unitPrice)}/hr` :
                    `${item.quantity} × ${formatCurrency(item.unitPrice)}`}
                  </span>
                </div>
                <span className="font-medium">{formatCurrency(item.unitPrice * item.quantity)}</span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="bg-slate-50 p-5 space-y-2 border-t border-slate-100">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Subtotal</span>
              <span>{formatCurrency(invoice.subtotal)}</span>
            </div>
            {invoice.taxTotal > 0 && (
              <div className="flex justify-between text-sm text-slate-600">
                <span>Tax</span>
                <span>{formatCurrency(invoice.taxTotal)}</span>
              </div>
            )}
            {invoice.discountTotal > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount</span>
                <span>-{formatCurrency(invoice.discountTotal)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg text-slate-900 border-t border-slate-200 pt-2">
              <span>Total</span>
              <span>{formatCurrency(invoice.total)}</span>
            </div>
            {invoice.paidAmount > 0 && invoice.paidAmount < invoice.total && (
              <div className="flex justify-between text-sm text-slate-500">
                <span>Paid</span>
                <span>{formatCurrency(invoice.paidAmount)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Pay button */}
        {!isPaid && invoice.stripePaymentLinkId && (
          <a
            href={`https://checkout.stripe.com/pay/${invoice.stripePaymentLinkId}`}
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center font-bold py-4 rounded-xl transition-colors text-lg"
          >
            Pay {formatCurrency(invoice.total - invoice.paidAmount)} Now
          </a>
        )}

        <p className="text-center text-xs text-slate-400">
          Powered by Auto Fix HQ · Secure payments via Stripe
        </p>
      </div>
    </div>
  );
}
