import { Resend } from "resend";

let _resend: Resend | null = null;
export const resend: Resend = new Proxy({} as Resend, {
  get(_target, prop) {
    if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY!);
    const val = (_resend as any)[prop];
    return typeof val === "function" ? val.bind(_resend) : val;
  },
});

const FROM = process.env.EMAIL_FROM || "noreply@autofixhq.com";

/** Generic email sender. Returns the Resend response object. */
export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  shopId?: string;
}) {
  return resend.emails.send({
    from: FROM,
    to: params.to,
    subject: params.subject,
    html: params.html,
  });
}

export async function sendInvoiceEmail(
  to: string,
  customerName: string,
  shopName: string,
  invoiceNumber: string,
  total: number,
  token: string
) {
  const link = `${process.env.NEXT_PUBLIC_APP_URL}/portal/invoice/${token}`;
  return resend.emails.send({
    from: FROM,
    to,
    subject: `Invoice #${invoiceNumber} from ${shopName}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#1e293b">${shopName}</h2>
        <p>Hi ${customerName},</p>
        <p>Your invoice #${invoiceNumber} is ready for payment.</p>
        <p style="font-size:24px;font-weight:bold;color:#0f172a">Total: $${total.toFixed(2)}</p>
        <a href="${link}" style="display:inline-block;background:#2563eb;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">
          View & Pay Invoice
        </a>
        <p style="margin-top:24px;color:#64748b;font-size:14px">
          If you have questions, please reply to this email or contact ${shopName} directly.
        </p>
      </div>
    `,
  });
}

export async function sendEstimateEmail(
  to: string,
  customerName: string,
  shopName: string,
  total: number,
  token: string
) {
  const link = `${process.env.NEXT_PUBLIC_APP_URL}/portal/estimate/${token}`;
  return resend.emails.send({
    from: FROM,
    to,
    subject: `Estimate from ${shopName} — Ready for Your Review`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#1e293b">${shopName}</h2>
        <p>Hi ${customerName},</p>
        <p>Your estimate is ready. Estimated total:</p>
        <p style="font-size:24px;font-weight:bold;color:#0f172a">$${total.toFixed(2)}</p>
        <a href="${link}" style="display:inline-block;background:#16a34a;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">
          Review & Approve Estimate
        </a>
      </div>
    `,
  });
}

export async function sendInspectionEmail(
  to: string,
  customerName: string,
  shopName: string,
  token: string
) {
  const link = `${process.env.NEXT_PUBLIC_APP_URL}/portal/inspection/${token}`;
  return resend.emails.send({
    from: FROM,
    to,
    subject: `Your Vehicle Inspection Report from ${shopName}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#1e293b">${shopName}</h2>
        <p>Hi ${customerName},</p>
        <p>Our technician has completed your digital vehicle inspection. Review the findings and approve any recommended services:</p>
        <a href="${link}" style="display:inline-block;background:#7c3aed;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">
          View Inspection Report
        </a>
      </div>
    `,
  });
}

export async function sendReviewRequestEmail(
  to: string,
  customerName: string,
  shopName: string,
  googleReviewUrl: string
) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: `How was your visit to ${shopName}?`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#1e293b">${shopName}</h2>
        <p>Hi ${customerName},</p>
        <p>Thank you for choosing ${shopName}! We hope your experience was great.</p>
        <p>If you have a moment, a quick Google review would mean the world to us:</p>
        <a href="${googleReviewUrl}" style="display:inline-block;background:#f59e0b;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">
          ⭐ Leave a Review
        </a>
        <p style="margin-top:24px;color:#64748b;font-size:14px">Thank you for your support!</p>
      </div>
    `,
  });
}

export async function sendWelcomeEmail(
  to: string,
  name: string,
  shopName: string,
  tempPassword: string
) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: `Welcome to Auto Fix HQ — ${shopName}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#1e293b">Welcome to Auto Fix HQ</h2>
        <p>Hi ${name},</p>
        <p>Your account for <strong>${shopName}</strong> has been created.</p>
        <p><strong>Email:</strong> ${to}<br/>
        <strong>Temporary password:</strong> ${tempPassword}</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" style="display:inline-block;background:#2563eb;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">
          Log In Now
        </a>
        <p style="color:#64748b;font-size:14px;margin-top:16px">Please change your password after first login.</p>
      </div>
    `,
  });
}
