"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Tag, Trash2, Users, Clock, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

interface Discount {
  id: string;
  code: string | null;
  label: string;
  discountType: string;
  discountValue: number;
  durationMonths: number | null;
  expiresAt: string | null;
  maxRedemptions: number | null;
  redemptionCount: number;
  isActive: boolean;
  stripeId: string | null;
  createdAt: string;
  shopDiscounts: { id: string; shop: { id: string; name: string } }[];
}

function DiscountValueDisplay({ type, value }: { type: string; value: number }) {
  return (
    <span className="font-semibold text-slate-800">
      {type === "percent" ? `${value}% off` : `${formatCurrency(value)} off`}
    </span>
  );
}

function DurationDisplay({ months }: { months: number | null }) {
  if (!months) return <span className="text-slate-500">Forever</span>;
  return <span className="text-slate-500">{months} month{months > 1 ? "s" : ""}</span>;
}

function CreateDiscountForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    code: "",
    label: "",
    discountType: "percent",
    discountValue: "",
    duration: "forever",
    durationMonths: "",
    expiresAt: "",
    maxRedemptions: "",
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/admin/discounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: form.code.trim() || null,
        label: form.label,
        discountType: form.discountType,
        discountValue: parseFloat(form.discountValue),
        durationMonths: form.duration === "repeating" && form.durationMonths ? parseInt(form.durationMonths) : null,
        expiresAt: form.expiresAt || null,
        maxRedemptions: form.maxRedemptions ? parseInt(form.maxRedemptions) : null,
      }),
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Discount created");
      onCreated();
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Failed to create discount");
    }
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900">New Discount / Promo Code</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
      </div>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">Internal label *</label>
          <input required value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
            placeholder="e.g. Beta Launch 50% Off"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">
            Promo code{" "}
            <span className="text-slate-400 font-normal">(leave blank for admin-applied deal)</span>
          </label>
          <input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            placeholder="e.g. LAUNCH50"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white uppercase"
            style={{ textTransform: "uppercase" }} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">Discount type *</label>
          <select value={form.discountType} onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value }))}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white">
            <option value="percent">Percentage off</option>
            <option value="fixed_amount">Fixed dollar amount off</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">
            Value *{" "}
            <span className="text-slate-400 font-normal">
              {form.discountType === "percent" ? "(0–100)" : "(dollars)"}
            </span>
          </label>
          <input required type="number" min="0" step="0.01"
            value={form.discountValue} onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))}
            placeholder={form.discountType === "percent" ? "50" : "25.00"}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">Duration</label>
          <select value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white">
            <option value="forever">Forever</option>
            <option value="once">Once (first invoice only)</option>
            <option value="repeating">Repeating (N months)</option>
          </select>
        </div>
        {form.duration === "repeating" && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Number of months *</label>
            <input required type="number" min="1" value={form.durationMonths}
              onChange={(e) => setForm((f) => ({ ...f, durationMonths: e.target.value }))}
              placeholder="3"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white" />
          </div>
        )}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">Expires at <span className="text-slate-400 font-normal">(optional)</span></label>
          <input type="date" value={form.expiresAt} onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">Max redemptions <span className="text-slate-400 font-normal">(optional, blank = unlimited)</span></label>
          <input type="number" min="1" value={form.maxRedemptions}
            onChange={(e) => setForm((f) => ({ ...f, maxRedemptions: e.target.value }))}
            placeholder="100"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white" />
        </div>
        <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700" disabled={saving}>
            {saving ? "Creating…" : "Create discount"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function ApplyToShopModal({
  discountId,
  onClose,
  onApplied,
}: { discountId: string; onClose: () => void; onApplied: () => void }) {
  const [query, setQuery] = useState("");
  const [shops, setShops] = useState<{ id: string; name: string; email: string }[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [searched, setSearched] = useState(false);

  async function search() {
    if (!query.trim()) return;
    const res = await fetch(`/api/admin/shops/search?q=${encodeURIComponent(query)}`);
    if (res.ok) {
      const data = await res.json();
      setShops(data.shops ?? []);
      setSearched(true);
    }
  }

  async function apply() {
    if (!selected) return;
    setApplying(true);
    const res = await fetch(`/api/admin/discounts/${discountId}/apply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shopId: selected }),
    });
    setApplying(false);
    if (res.ok) {
      toast.success("Discount applied to shop");
      onApplied();
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Failed to apply discount");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Apply discount to shop</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        <div className="flex gap-2">
          <input value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search shop name or email…"
            onKeyDown={(e) => e.key === "Enter" && search()}
            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
          <Button size="sm" variant="outline" onClick={search}>Search</Button>
        </div>
        {searched && shops.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-2">No shops found</p>
        )}
        {shops.map((shop) => (
          <button key={shop.id} onClick={() => setSelected(shop.id)}
            className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors ${
              selected === shop.id ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:bg-slate-50"
            }`}>
            <p className="font-medium text-slate-900">{shop.name}</p>
            <p className="text-slate-400 text-xs">{shop.email}</p>
          </button>
        ))}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700"
            disabled={!selected || applying} onClick={apply}>
            {applying ? "Applying…" : "Apply discount"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function DiscountManagerClient({ discounts: initial }: { discounts: Discount[] }) {
  const router = useRouter();
  const [discounts, setDiscounts] = useState(initial);
  const [showCreate, setShowCreate] = useState(false);
  const [applyTarget, setApplyTarget] = useState<string | null>(null);

  function refresh() {
    router.refresh();
    setShowCreate(false);
    setApplyTarget(null);
  }

  async function deactivate(id: string, label: string) {
    if (!confirm(`Deactivate "${label}"? This cannot be reactivated from the UI — you'd need to create a new discount.`)) return;
    const res = await fetch(`/api/admin/discounts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: false }),
    });
    if (res.ok) { toast.success("Discount deactivated"); router.refresh(); }
    else toast.error("Failed to deactivate");
  }

  const active = discounts.filter((d) => d.isActive);
  const inactive = discounts.filter((d) => !d.isActive);

  return (
    <div className="space-y-6">
      {/* Create form */}
      {showCreate ? (
        <CreateDiscountForm
          onClose={() => setShowCreate(false)}
          onCreated={refresh}
        />
      ) : (
        <Button onClick={() => setShowCreate(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" /> New discount / promo code
        </Button>
      )}

      {/* Active discounts */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Active Discounts ({active.length})</h2>
        </div>
        {active.length === 0 ? (
          <div className="px-5 py-10 text-center text-slate-400 text-sm">
            No active discounts. Create one above.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-5 py-3 font-medium text-slate-500">Label / Code</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Discount</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Duration</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Expires</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Redemptions</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Applied to</th>
                <th className="text-right px-5 py-3 font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {active.map((d) => (
                <tr key={d.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-800">{d.label}</p>
                    {d.code ? (
                      <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 font-mono px-2 py-0.5 rounded mt-0.5">
                        <Tag className="w-3 h-3" /> {d.code}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Admin-applied (no code)</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <DiscountValueDisplay type={d.discountType} value={d.discountValue} />
                  </td>
                  <td className="px-5 py-3">
                    <DurationDisplay months={d.durationMonths} />
                  </td>
                  <td className="px-5 py-3 text-slate-500 text-xs">
                    {d.expiresAt ? new Date(d.expiresAt).toLocaleDateString() : "Never"}
                  </td>
                  <td className="px-5 py-3 text-slate-600">
                    {d.redemptionCount}
                    {d.maxRedemptions ? ` / ${d.maxRedemptions}` : " / ∞"}
                  </td>
                  <td className="px-5 py-3">
                    {d.shopDiscounts.length === 0 ? (
                      <span className="text-slate-300 text-xs">None yet</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {d.shopDiscounts.slice(0, 3).map((sd) => (
                          <span key={sd.id} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                            {sd.shop.name}
                          </span>
                        ))}
                        {d.shopDiscounts.length > 3 && (
                          <span className="text-xs text-slate-400">+{d.shopDiscounts.length - 3} more</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button size="sm" variant="outline" className="text-xs h-7 px-2"
                        onClick={() => setApplyTarget(d.id)}>
                        <Users className="w-3 h-3 mr-1" /> Apply
                      </Button>
                      <Button size="sm" variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50 text-xs h-7 px-2"
                        onClick={() => deactivate(d.id, d.label)}>
                        <XCircle className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Inactive discounts */}
      {inactive.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden opacity-60">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-600">Inactive Discounts ({inactive.length})</h2>
          </div>
          <table className="w-full text-sm">
            <tbody>
              {inactive.map((d) => (
                <tr key={d.id} className="border-b border-slate-50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-500 line-through">{d.label}</p>
                    {d.code && <span className="text-xs text-slate-300 font-mono">{d.code}</span>}
                  </td>
                  <td className="px-5 py-3 text-slate-400 text-xs">
                    <DiscountValueDisplay type={d.discountType} value={d.discountValue} />
                  </td>
                  <td className="px-5 py-3 text-slate-400 text-xs">
                    {d.redemptionCount} redemptions
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Apply to shop modal */}
      {applyTarget && (
        <ApplyToShopModal
          discountId={applyTarget}
          onClose={() => setApplyTarget(null)}
          onApplied={refresh}
        />
      )}
    </div>
  );
}
