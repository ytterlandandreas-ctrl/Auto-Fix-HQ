import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { CommunicationsClient } from "@/components/shop/CommunicationsClient";

export default async function CommunicationsPage({
  searchParams,
}: { searchParams: Promise<{ customerId?: string; channel?: string }> }) {
  const session = await auth();
  const shopId = (session!.user as any).shopId as string;

  const sp = await searchParams;
  const selectedCustomerId = sp.customerId;
  const channel = sp.channel;

  const where: any = { shopId };
  if (channel) where.channel = channel;

  // Get unique customer conversations (most recent message per customer)
  const conversations = await db.message.findMany({
    where,
    orderBy: { createdAt: "desc" },
    distinct: ["customerId"],
    include: {
      customer: { select: { id: true, firstName: true, lastName: true, phone: true, email: true, smsOptIn: true } },
    },
    take: 100,
  });

  // If a customer is selected, get their full message thread
  let thread: any[] = [];
  let selectedCustomer: any = null;
  if (selectedCustomerId) {
    thread = await db.message.findMany({
      where: { shopId, customerId: selectedCustomerId },
      orderBy: { createdAt: "asc" },
      take: 200,
    });
    selectedCustomer = await db.customer.findUnique({
      where: { id: selectedCustomerId },
      select: { id: true, firstName: true, lastName: true, phone: true, email: true, smsOptIn: true },
    });
  }

  const unreadCount = await db.message.count({
    where: { shopId, direction: "inbound", isRead: false },
  });

  return (
    <CommunicationsClient
      conversations={conversations as any}
      thread={thread as any}
      selectedCustomer={selectedCustomer as any}
      unreadCount={unreadCount}
      channelFilter={channel}
    />
  );
}
