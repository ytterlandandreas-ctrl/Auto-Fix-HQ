"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { pusherClient, CHANNELS, EVENTS } from "@/lib/pusher";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { Send, MessageSquare, Mail, Phone, User, CheckCheck, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export function CommunicationsClient({ conversations, thread, selectedCustomer, unreadCount, channelFilter }: {
  conversations: any[];
  thread: any[];
  selectedCustomer: any;
  unreadCount: number;
  channelFilter?: string;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const [messages, setMessages] = useState(thread);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");
  const [channel, setChannel] = useState<"sms" | "email">("sms");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(thread);
  }, [thread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!selectedCustomer) return;
    // subscribe to new messages from this customer via Pusher shop channel
    // In production, the twilio inbound webhook triggers pusher EVENTS.NEW_MESSAGE
    // We reload to get new messages for simplicity here
    const handler = () => router.refresh();
    window.addEventListener("focus", handler);
    return () => window.removeEventListener("focus", handler);
  }, [selectedCustomer, router]);

  async function sendMessage() {
    if (!text.trim() || !selectedCustomer) return;
    setSending(true);
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: selectedCustomer.id,
        channel,
        body: text.trim(),
      }),
    });
    setSending(false);
    if (res.ok) {
      const msg = await res.json();
      setMessages((prev) => [...prev, msg]);
      setText("");
    } else {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error || t.comms.sendFailed);
    }
  }

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-100px)] sm:h-[calc(100vh-120px)] gap-3 sm:gap-4">
      {/* Conversation list */}
      <div className={cn(
        "w-full md:w-72 shrink-0 bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden",
        selectedCustomer && "hidden md:flex"
      )}>
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-900">{t.comms.inbox}</h2>
            {unreadCount > 0 && (
              <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex gap-1">
            {[
              { label: t.comms.tabAll, val: undefined },
              { label: t.comms.tabSMS, val: "sms" },
              { label: t.comms.tabEmail, val: "email" },
            ].map((tab) => (
              <Link key={tab.label} href={`/shop/communications${tab.val ? `?channel=${tab.val}` : ""}`}>
                <button className={cn("px-2.5 py-1 text-xs rounded-lg font-medium",
                  channelFilter === tab.val ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"
                )}>
                  {tab.label}
                </button>
              </Link>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {conversations.length === 0 && (
            <div className="p-6 text-center text-sm text-slate-400">{t.comms.noMessages}</div>
          )}
          {conversations.map((conv) => {
            const isSelected = conv.customer?.id === selectedCustomer?.id;
            const isUnread = conv.direction === "inbound" && !conv.isRead;
            return (
              <Link key={conv.id} href={`/shop/communications?customerId=${conv.customer?.id}`}>
                <div className={cn("px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors",
                  isSelected && "bg-blue-50"
                )}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={cn("text-sm font-medium", isUnread ? "text-slate-900" : "text-slate-700")}>
                      {conv.customer?.firstName} {conv.customer?.lastName}
                    </span>
                    <div className="flex items-center gap-1">
                      {conv.channel === "sms" ? (
                        <MessageSquare className="w-3 h-3 text-slate-400" />
                      ) : (
                        <Mail className="w-3 h-3 text-slate-400" />
                      )}
                      {isUnread && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                    </div>
                  </div>
                  <p className={cn("text-xs truncate", isUnread ? "text-slate-700 font-medium" : "text-slate-400")}>
                    {conv.direction === "outbound" && `${t.comms.you}: `}{conv.body}
                  </p>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {new Date(conv.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Message thread */}
      <div className={cn(
        "flex-1 bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden min-h-0",
        !selectedCustomer && "hidden md:flex"
      )}>
        {!selectedCustomer ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-slate-400">
              <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">{t.comms.selectConversation}</p>
            </div>
          </div>
        ) : (
          <>
            {/* Thread header */}
            <div className="px-3 sm:px-5 py-3 border-b border-slate-100 flex items-center gap-2 sm:gap-3">
              {/* Mobile back to list */}
              <button onClick={() => router.push("/shop/communications")}
                className="md:hidden p-1 -ml-1 text-slate-500"
                aria-label="Back">
                ←
              </button>
              <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-slate-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900 truncate">{selectedCustomer.firstName} {selectedCustomer.lastName}</p>
                <div className="flex items-center gap-2 sm:gap-3 text-xs text-slate-400 flex-wrap">
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{selectedCustomer.phone}</span>
                  {selectedCustomer.email && <span className="hidden sm:flex items-center gap-1"><Mail className="w-3 h-3" />{selectedCustomer.email}</span>}
                  {!selectedCustomer.smsOptIn && (
                    <span className="flex items-center gap-1 text-amber-600">
                      <AlertCircle className="w-3 h-3" /> {t.customers.smsOptOut}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => {
                const isOut = msg.direction === "outbound";
                return (
                  <div key={msg.id} className={cn("flex", isOut ? "justify-end" : "justify-start")}>
                    <div className={cn("max-w-[70%] px-4 py-2.5 rounded-2xl text-sm",
                      isOut
                        ? "bg-blue-600 text-white rounded-br-sm"
                        : "bg-slate-100 text-slate-800 rounded-bl-sm"
                    )}>
                      <p>{msg.body}</p>
                      <div className={cn("flex items-center justify-end gap-1 mt-1 text-xs",
                        isOut ? "text-blue-200" : "text-slate-400"
                      )}>
                        {msg.channel === "sms" ? <MessageSquare className="w-3 h-3" /> : <Mail className="w-3 h-3" />}
                        {new Date(msg.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                        {isOut && <CheckCheck className="w-3 h-3" />}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Compose */}
            <div className="px-4 py-3 border-t border-slate-100 space-y-2">
              <div className="flex gap-2">
                <button onClick={() => setChannel("sms")}
                  className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium",
                    channel === "sms" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"
                  )}>
                  <MessageSquare className="w-3.5 h-3.5" /> {t.comms.tabSMS}
                </button>
                <button onClick={() => setChannel("email")}
                  className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium",
                    channel === "email" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"
                  )}>
                  <Mail className="w-3.5 h-3.5" /> {t.comms.tabEmail}
                </button>
              </div>
              <div className="flex gap-2">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder={channel === "sms" ? t.comms.smsPlaceholder : t.comms.emailPlaceholder}
                  rows={2}
                  className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button onClick={sendMessage} disabled={sending || !text.trim()} className="bg-blue-600 hover:bg-blue-700 self-end">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              {channel === "sms" && !selectedCustomer.smsOptIn && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {t.comms.smsOptOutWarning}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
