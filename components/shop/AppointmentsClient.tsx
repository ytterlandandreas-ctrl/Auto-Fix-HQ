"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { ChevronLeft, ChevronRight, Plus, X, Clock, User, Car, Phone } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700 border-blue-200",
  confirmed: "bg-green-100 text-green-700 border-green-200",
  in_progress: "bg-yellow-100 text-yellow-700 border-yellow-200",
  completed: "bg-slate-100 text-slate-600 border-slate-200",
  cancelled: "bg-red-100 text-red-600 border-red-200",
  no_show: "bg-orange-100 text-orange-700 border-orange-200",
};

const HOURS = Array.from({ length: 11 }, (_, i) => i + 7); // 7am–5pm

export function AppointmentsClient({ appointments, technicians, customers, shopId, view, focusDate }: {
  appointments: any[];
  technicians: any[];
  customers: any[];
  shopId: string;
  view: string;
  focusDate: string;
}) {
  const { t, locale } = useLocale();
  const router = useRouter();
  const focus = new Date(focusDate);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    customerId: "",
    vehicleId: "",
    technicianId: "",
    scheduledAt: "",
    estimatedDuration: "60",
    serviceType: "",
    notes: "",
  });
  const [selectedCustomerVehicles, setSelectedCustomerVehicles] = useState<any[]>([]);

  function navigate(dir: number) {
    const d = new Date(focus);
    if (view === "day") d.setDate(d.getDate() + dir);
    else if (view === "week") d.setDate(d.getDate() + dir * 7);
    else d.setMonth(d.getMonth() + dir);
    const dateStr = d.toISOString().split("T")[0];
    router.push(`/shop/appointments?view=${view}&date=${dateStr}`);
  }

  function setView(v: string) {
    const dateStr = focus.toISOString().split("T")[0];
    router.push(`/shop/appointments?view=${v}&date=${dateStr}`);
  }

  async function loadVehicles(customerId: string) {
    if (!customerId) { setSelectedCustomerVehicles([]); return; }
    const res = await fetch(`/api/customers/${customerId}/vehicles`);
    if (res.ok) setSelectedCustomerVehicles(await res.json());
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        estimatedDuration: parseInt(form.estimatedDuration),
      }),
    });
    setSaving(false);
    if (res.ok) {
      toast.success(t.appointments.booked);
      setShowNew(false);
      router.refresh();
    } else {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error || t.common.error);
    }
  }

  const dtLocale = locale === "es" ? "es-MX" : "en-US";
  const title = view === "day"
    ? focus.toLocaleDateString(dtLocale, { weekday: "long", month: "long", day: "numeric", year: "numeric" })
    : view === "month"
    ? focus.toLocaleDateString(dtLocale, { month: "long", year: "numeric" })
    : `${getWeekStart(focus).toLocaleDateString(dtLocale, { month: "short", day: "numeric" })}`;

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{t.appointments.title}</h1>
          <p className="text-xs sm:text-sm text-slate-500">{appointments.length} {view === "day" ? t.appointments.thisDay : view === "week" ? t.appointments.thisWeek : t.appointments.thisMonth}</p>
        </div>
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowNew(true)}>
          <Plus className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">{t.appointments.newAppointment}</span>
        </Button>
      </div>

      {/* Calendar navigation */}
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        <div className="flex items-center gap-1">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-slate-100" aria-label="Previous">
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <span className="text-xs sm:text-sm font-medium text-slate-800 min-w-[140px] sm:min-w-[200px] text-center">{title}</span>
          <button onClick={() => navigate(1)} className="p-1.5 rounded-lg hover:bg-slate-100" aria-label="Next">
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>
        </div>
        <div className="flex gap-1">
          {[
            { val: "day", label: t.appointments.viewDay },
            { val: "week", label: t.appointments.viewWeek },
            { val: "month", label: t.appointments.viewMonth },
          ].map((v) => (
            <button key={v.val} onClick={() => setView(v.val)}
              className={cn("px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm rounded-lg font-medium",
                view === v.val ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"
              )}>
              {v.label}
            </button>
          ))}
        </div>
        <button onClick={() => {
          const today = new Date().toISOString().split("T")[0];
          router.push(`/shop/appointments?view=${view}&date=${today}`);
        }} className="ml-auto text-xs sm:text-sm text-blue-600 hover:underline">{t.appointments.today}</button>
      </div>

      {/* New appointment form */}
      {showNew && (
        <div className="bg-white border-2 border-blue-200 rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-slate-900">{t.appointments.newAppointment}</h3>
            <button onClick={() => setShowNew(false)}><X className="w-5 h-5 text-slate-400" /></button>
          </div>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">{t.ro.customer} *</label>
              <select required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                value={form.customerId}
                onChange={(e) => {
                  setForm((f) => ({ ...f, customerId: e.target.value, vehicleId: "" }));
                  loadVehicles(e.target.value);
                }}>
                <option value="">{t.appointments.selectCustomer}</option>
                {customers.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.firstName} {c.lastName} — {c.phone}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">{t.ro.vehicle}</label>
              <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                value={form.vehicleId}
                onChange={(e) => setForm((f) => ({ ...f, vehicleId: e.target.value }))}>
                <option value="">{t.appointments.selectVehicle}</option>
                {selectedCustomerVehicles.map((v: any) => (
                  <option key={v.id} value={v.id}>{v.year} {v.make} {v.model}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">{t.appointments.dateTime} *</label>
              <input type="datetime-local" required
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                value={form.scheduledAt}
                onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">{t.appointments.duration}</label>
              <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                value={form.estimatedDuration}
                onChange={(e) => setForm((f) => ({ ...f, estimatedDuration: e.target.value }))}>
                {[30, 60, 90, 120, 180, 240, 300, 360, 480].map((d) => (
                  <option key={d} value={d}>{d < 60 ? `${d}m` : `${d / 60}h${d % 60 ? ` ${d % 60}m` : ""}`}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">{t.appointments.serviceType}</label>
              <input type="text" placeholder={t.appointments.serviceTypePlaceholder}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                value={form.serviceType}
                onChange={(e) => setForm((f) => ({ ...f, serviceType: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">{t.appointments.technician}</label>
              <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                value={form.technicianId}
                onChange={(e) => setForm((f) => ({ ...f, technicianId: e.target.value }))}>
                <option value="">{t.appointments.unassigned}</option>
                {technicians.map((tech: any) => <option key={tech.id} value={tech.id}>{tech.name}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-medium text-slate-600">{t.common.notes}</label>
              <textarea rows={2} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
            <div className="sm:col-span-2 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowNew(false)}>{t.common.cancel}</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={saving}>
                {saving ? t.appointments.booking : t.appointments.bookAppointment}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Calendar view */}
      {view === "month" ? (
        <MonthView appointments={appointments} focus={focus} />
      ) : view === "day" ? (
        <DayView appointments={appointments} focus={focus} />
      ) : (
        <WeekView appointments={appointments} focus={focus} />
      )}
    </div>
  );
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return d;
}

function AppointmentChip({ appt }: { appt: any }) {
  return (
    <Link href={appt.repairOrder ? `/shop/repair-orders/${appt.repairOrder.id}` : "#"}>
      <div className={cn("text-xs px-2 py-1 rounded border mb-1 cursor-pointer hover:opacity-80 transition-opacity",
        STATUS_COLORS[appt.status] ?? "bg-slate-100 text-slate-600 border-slate-200"
      )}>
        <div className="font-medium truncate">
          {new Date(appt.scheduledAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
          {" · "}{appt.customer.firstName} {appt.customer.lastName}
        </div>
        {appt.vehicle && (
          <div className="text-[10px] opacity-70 truncate">{appt.vehicle.year} {appt.vehicle.make} {appt.vehicle.model}</div>
        )}
        {appt.serviceType && <div className="text-[10px] opacity-60 truncate">{appt.serviceType}</div>}
      </div>
    </Link>
  );
}

function WeekView({ appointments, focus }: { appointments: any[]; focus: Date }) {
  const weekStart = getWeekStart(focus);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
      <div className="min-w-[700px]">
      <div className="grid grid-cols-8 border-b border-slate-100">
        <div className="px-3 py-2 text-xs text-slate-400 font-medium">Time</div>
        {days.map((d) => {
          const isToday = d.toDateString() === new Date().toDateString();
          return (
            <div key={d.toISOString()} className="px-2 py-2 text-center border-l border-slate-100">
              <div className={cn("text-xs font-medium", isToday ? "text-blue-600" : "text-slate-500")}>
                {d.toLocaleDateString("en-US", { weekday: "short" })}
              </div>
              <div className={cn("text-sm font-bold", isToday ? "text-blue-600" : "text-slate-800")}>
                {d.getDate()}
              </div>
            </div>
          );
        })}
      </div>
      <div className="overflow-y-auto" style={{ maxHeight: "600px" }}>
        {HOURS.map((hour) => (
          <div key={hour} className="grid grid-cols-8 border-b border-slate-50 min-h-[60px]">
            <div className="px-3 py-1 text-xs text-slate-400 font-medium sticky left-0">
              {hour % 12 || 12}{hour < 12 ? "am" : "pm"}
            </div>
            {days.map((d) => {
              const dayAppts = appointments.filter((a) => {
                const apptDate = new Date(a.scheduledAt);
                return apptDate.toDateString() === d.toDateString() && apptDate.getHours() === hour;
              });
              return (
                <div key={d.toISOString()} className="px-1 py-1 border-l border-slate-50">
                  {dayAppts.map((a) => <AppointmentChip key={a.id} appt={a} />)}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}

function DayView({ appointments, focus }: { appointments: any[]; focus: Date }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="overflow-y-auto" style={{ maxHeight: "600px" }}>
        {HOURS.map((hour) => {
          const hourAppts = appointments.filter((a) => new Date(a.scheduledAt).getHours() === hour);
          return (
            <div key={hour} className="flex border-b border-slate-50 min-h-[70px]">
              <div className="w-16 px-3 py-2 text-xs text-slate-400 font-medium shrink-0">
                {hour % 12 || 12}{hour < 12 ? "am" : "pm"}
              </div>
              <div className="flex-1 px-2 py-2 space-y-1">
                {hourAppts.map((a) => (
                  <Link key={a.id} href={a.repairOrder ? `/shop/repair-orders/${a.repairOrder.id}` : "#"}>
                    <div className={cn("px-3 py-2 rounded-lg border text-sm", STATUS_COLORS[a.status] ?? "bg-slate-100 text-slate-600 border-slate-200")}>
                      <div className="flex items-center gap-2 font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(a.scheduledAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                        {" — "}{a.customer.firstName} {a.customer.lastName}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs opacity-80">
                        {a.vehicle && (
                          <span className="flex items-center gap-1">
                            <Car className="w-3 h-3" /> {a.vehicle.year} {a.vehicle.make} {a.vehicle.model}
                          </span>
                        )}
                        {a.assignedTech && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" /> {a.assignedTech.name}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {a.customer.phone}
                        </span>
                      </div>
                      {a.serviceType && <div className="text-xs mt-0.5 opacity-70">{a.serviceType}</div>}
                      {a.notes && <div className="text-xs mt-0.5 opacity-60 italic">{a.notes}</div>}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MonthView({ appointments, focus }: { appointments: any[]; focus: Date }) {
  const year = focus.getFullYear();
  const month = focus.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = (firstDay.getDay() + 6) % 7; // Mon = 0
  const totalCells = Math.ceil((startPad + lastDay.getDate()) / 7) * 7;

  const cells = Array.from({ length: totalCells }, (_, i) => {
    const dayNum = i - startPad + 1;
    if (dayNum < 1 || dayNum > lastDay.getDate()) return null;
    const d = new Date(year, month, dayNum);
    const dayAppts = appointments.filter((a) => new Date(a.scheduledAt).toDateString() === d.toDateString());
    return { day: dayNum, date: d, appts: dayAppts };
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="grid grid-cols-7 border-b border-slate-100">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="px-2 py-2 text-center text-xs font-medium text-slate-500">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
        {cells.map((cell, i) => (
          <div key={i} className={cn("min-h-[100px] p-2", !cell && "bg-slate-50/50")}>
            {cell && (
              <>
                <div className={cn("text-sm font-medium mb-1",
                  cell.date.toDateString() === new Date().toDateString() ? "text-blue-600" : "text-slate-700"
                )}>
                  {cell.day}
                </div>
                {cell.appts.slice(0, 3).map((a) => <AppointmentChip key={a.id} appt={a} />)}
                {cell.appts.length > 3 && (
                  <div className="text-xs text-slate-400">+{cell.appts.length - 3} more</div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
