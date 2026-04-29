"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { Plus, X, Send, Users, RefreshCw, Clock, Star, Zap } from "lucide-react";
import { toast } from "sonner";

export function CRMClient({ campaigns, winBackCount, oilChangeDueCount }: {
  campaigns: any[];
  winBackCount: number;
  oilChangeDueCount: number;
}) {
  const { t } = useLocale();
  const router = useRouter();

  const TRIGGER_TYPES = [
    { value: "win_back", label: t.crm.triggerWinBack, icon: RefreshCw },
    { value: "oil_change_due", label: t.crm.triggerOilChange, icon: Clock },
    { value: "post_service", label: t.crm.triggerPostService, icon: Star },
    { value: "inspection_due", label: t.crm.triggerInspection, icon: Zap },
    { value: "birthday", label: t.crm.triggerBirthday, icon: Star },
    { value: "manual_segment", label: t.crm.triggerManual, icon: Users },
  ];
  const [showNew, setShowNew] = useState(false);
  const [launching, setLaunching] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    triggerType: "win_back",
    channel: "sms",
    messageTemplate: "",
    isActive: true,
  });
  const [saving, setSaving] = useState(false);

  async function createCampaign(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/crm/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      toast.success(t.crm.campaignCreated);
      setShowNew(false);
      router.refresh();
    } else {
      toast.error(t.crm.campaignFailed);
    }
  }

  async function launchCampaign(id: string) {
    setLaunching(id);
    const res = await fetch(`/api/crm/campaigns/${id}/launch`, { method: "POST" });
    setLaunching(null);
    if (res.ok) {
      const data = await res.json();
      toast.success(`${t.crm.launch} — ${data.sent}`);
      router.refresh();
    } else {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error || t.common.error);
    }
  }

  async function toggleCampaign(id: string, isActive: boolean) {
    const res = await fetch(`/api/crm/campaigns/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    if (res.ok) router.refresh();
    else toast.error(t.common.error);
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{t.crm.title}</h1>
          <p className="text-xs sm:text-sm text-slate-500">{t.crm.subtitle}</p>
        </div>
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowNew(true)}>
          <Plus className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">{t.crm.newCampaign}</span>
        </Button>
      </div>

      {/* Opportunity cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <RefreshCw className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-semibold text-amber-800">{t.crm.winBackOpps}</span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-amber-700">{winBackCount}</div>
          <p className="text-xs text-amber-600 mt-1">{t.crm.winBackDesc}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-blue-800">{t.crm.oilChangeDue}</span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-blue-700">{oilChangeDueCount}</div>
          <p className="text-xs text-blue-600 mt-1">{t.crm.oilChangeDesc}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-green-600" />
            <span className="text-sm font-semibold text-green-800">{t.crm.activeCampaigns}</span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-green-700">{campaigns.filter((c) => c.isActive).length}</div>
          <p className="text-xs text-green-600 mt-1">{t.crm.activeCampaignsDesc}</p>
        </div>
      </div>

      {/* New campaign form */}
      {showNew && (
        <div className="bg-white border-2 border-blue-200 rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-slate-900">{t.crm.newCampaign}</h3>
            <button onClick={() => setShowNew(false)}><X className="w-5 h-5 text-slate-400" /></button>
          </div>
          <form onSubmit={createCampaign} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">{t.crm.campaignName} *</label>
                <input required value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder={t.crm.campaignNamePlaceholder}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">{t.crm.trigger}</label>
                <select value={form.triggerType}
                  onChange={(e) => setForm((f) => ({ ...f, triggerType: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                  {TRIGGER_TYPES.map((trig) => <option key={trig.value} value={trig.value}>{trig.label}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">{t.crm.channel}</label>
                <select value={form.channel}
                  onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                  <option value="sms">{t.comms.tabSMS}</option>
                  <option value="email">{t.comms.tabEmail}</option>
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">
                {t.crm.messageTemplate} *
                <span className="ml-2 font-normal text-slate-400">{t.crm.messageTemplateHint}</span>
              </label>
              <textarea required rows={3} value={form.messageTemplate}
                onChange={(e) => setForm((f) => ({ ...f, messageTemplate: e.target.value }))}
                placeholder={t.crm.messageTemplatePlaceholder}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none" />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowNew(false)}>{t.common.cancel}</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={saving}>
                {saving ? t.common.saving : t.crm.newCampaign}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Campaigns table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="text-left px-5 py-3 font-medium text-slate-500">{t.common.name}</th>
              <th className="text-left px-5 py-3 font-medium text-slate-500">{t.crm.trigger}</th>
              <th className="text-left px-5 py-3 font-medium text-slate-500">{t.crm.channel}</th>
              <th className="text-right px-5 py-3 font-medium text-slate-500">{t.crm.enrollments}</th>
              <th className="text-left px-5 py-3 font-medium text-slate-500">{t.common.status}</th>
              <th className="text-right px-5 py-3 font-medium text-slate-500">{t.common.actions}</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => {
              const trigger = TRIGGER_TYPES.find((tr) => tr.value === c.triggerType);
              return (
                <tr key={c.id} className="border-b border-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-800">{c.name}</td>
                  <td className="px-5 py-3 text-slate-600">{trigger?.label ?? c.triggerType}</td>
                  <td className="px-5 py-3 capitalize text-slate-500">{c.channel}</td>
                  <td className="px-5 py-3 text-right text-slate-600">{c._count.enrollments}</td>
                  <td className="px-5 py-3">
                    <button onClick={() => toggleCampaign(c.id, c.isActive)}
                      className={cn("text-xs px-2.5 py-1 rounded-full font-medium border",
                        c.isActive ? "bg-green-100 text-green-700 border-green-200" : "bg-slate-100 text-slate-500 border-slate-200"
                      )}>
                      {c.isActive ? t.common.active : t.crm.paused}
                    </button>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {c.triggerType === "manual_segment" && (
                      <Button size="sm" variant="outline" className="text-xs"
                        onClick={() => launchCampaign(c.id)}
                        disabled={launching === c.id}>
                        <Send className={cn("w-3 h-3 mr-1", launching === c.id && "animate-spin")} />
                        {launching === c.id ? t.crm.launching : t.crm.launch}
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
            {campaigns.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-400">{t.crm.noCampaigns}</td></tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
