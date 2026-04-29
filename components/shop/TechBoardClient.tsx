"use client";

import { useEffect, useState } from "react";
import { pusherClient, CHANNELS, EVENTS } from "@/lib/pusher";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { Clock, UserCheck, UserX, Zap, AlertTriangle, Car } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export function TechBoardClient({ technicians, openROs, shopId, currentUserId, currentUserRole }: {
  technicians: any[]; openROs: any[]; shopId: string; currentUserId: string; currentUserRole: string;
}) {
  const { t } = useLocale();
  const [techs, setTechs] = useState(technicians);
  const [ros, setRos] = useState(openROs);
  const [clockingId, setClockingId] = useState<string | null>(null);
  const [selectedRO, setSelectedRO] = useState<string>("");

  useEffect(() => {
    const channel = pusherClient.subscribe(CHANNELS.techBoard(shopId));

    channel.bind(EVENTS.TECH_CLOCKED_IN, (data: any) => {
      setTechs((prev) =>
        prev.map((t) =>
          t.id === data.technicianId
            ? { ...t, techClocks: [{ clockedInAt: new Date(), repairOrder: ros.find((r) => r.id === data.repairOrderId) }] }
            : t
        )
      );
    });

    channel.bind(EVENTS.TECH_CLOCKED_OUT, (data: any) => {
      setTechs((prev) =>
        prev.map((t) =>
          t.id === data.technicianId ? { ...t, techClocks: [] } : t
        )
      );
    });

    channel.bind(EVENTS.RO_STATUS_CHANGED, () => {
      window.location.reload();
    });

    return () => {
      pusherClient.unsubscribe(CHANNELS.techBoard(shopId));
    };
  }, [shopId]);

  async function clockIn(techId: string) {
    setClockingId(techId);
    const res = await fetch("/api/technicians/clock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "in", repairOrderId: selectedRO || null }),
    });
    setClockingId(null);
    if (res.ok) toast.success(t.technicians.clockedIn);
    else toast.error(t.technicians.clockInFailed);
  }

  async function clockOut(techId: string) {
    setClockingId(techId);
    const res = await fetch("/api/technicians/clock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "out" }),
    });
    setClockingId(null);
    if (res.ok) toast.success(t.technicians.clockedOut);
    else toast.error(t.technicians.clockOutFailed);
  }

  const isMyBoard = currentUserRole === "technician";

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{t.technicians.title}</h1>
          <p className="text-xs sm:text-sm text-slate-500">{t.technicians.subtitle}</p>
        </div>
        {isMyBoard && (
          <div className="flex items-center gap-2 flex-wrap">
            <select
              className="flex-1 sm:flex-initial min-w-0 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
              value={selectedRO}
              onChange={(e) => setSelectedRO(e.target.value)}
            >
              <option value="">{t.technicians.noROSelected}</option>
              {ros.map((ro) => (
                <option key={ro.id} value={ro.id}>
                  #{ro.roNumber} — {ro.vehicle.year} {ro.vehicle.make} {ro.vehicle.model}
                </option>
              ))}
            </select>
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => clockIn(currentUserId)}
              disabled={!!clockingId}
            >
              <Clock className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">{t.technicians.clockIn}</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => clockOut(currentUserId)}
              disabled={!!clockingId}
            >
              {t.technicians.clockOut}
            </Button>
          </div>
        )}
      </div>

      {/* Tech cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {techs.map((tech) => {
          const activeEntry = tech.techClocks?.[0];
          const isActive = !!activeEntry;
          const eff = tech.efficiencyScores?.[0];
          const effPct = eff?.efficiencyPct ?? 0;

          return (
            <div
              key={tech.id}
              className={cn(
                "bg-white border-2 rounded-xl p-5 space-y-4 transition-all",
                isActive ? "border-green-300 shadow-md" : "border-slate-200"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center font-bold text-white",
                    isActive ? "bg-green-500" : "bg-slate-400"
                  )}>
                    {tech.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{tech.name}</p>
                    <p className="text-xs text-slate-400 capitalize">{tech.role.replace("_", " ")}</p>
                  </div>
                </div>
                <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold",
                  isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                )}>
                  {isActive ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                  {isActive ? t.technicians.activeStatus : t.technicians.offStatus}
                </div>
              </div>

              {isActive && activeEntry.repairOrder && (
                <Link href={`/shop/repair-orders/${activeEntry.repairOrder.id}`}>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-green-800 text-sm">
                        #{activeEntry.repairOrder.roNumber}
                      </span>
                    </div>
                    <p className="text-xs text-green-700 mt-1">
                      {activeEntry.repairOrder.vehicle.year} {activeEntry.repairOrder.vehicle.make} {activeEntry.repairOrder.vehicle.model}
                    </p>
                    <p className="text-xs text-green-600">
                      {activeEntry.repairOrder.customer.firstName} {activeEntry.repairOrder.customer.lastName}
                    </p>
                  </div>
                </Link>
              )}

              {eff && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3" /> {t.technicians.todaysEfficiency}
                    </span>
                    <span className={cn("font-bold",
                      effPct >= 80 ? "text-green-600" : effPct >= 60 ? "text-yellow-600" : "text-red-500"
                    )}>
                      {effPct.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all",
                        effPct >= 80 ? "bg-green-500" : effPct >= 60 ? "bg-yellow-500" : "bg-red-500"
                      )}
                      style={{ width: `${Math.min(effPct, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>{t.technicians.billed}: {eff.billedHours.toFixed(1)}h</span>
                    <span>{t.technicians.clocked}: {eff.clockedHours.toFixed(1)}h</span>
                  </div>
                  {effPct < 60 && eff.clockedHours > 0 && (
                    <div className="flex items-center gap-1 text-xs text-red-600 bg-red-50 rounded px-2 py-1">
                      <AlertTriangle className="w-3 h-3" /> {t.technicians.below60}
                    </div>
                  )}
                </div>
              )}

              {!isMyBoard && tech.id !== currentUserId && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-xs"
                    onClick={() => clockIn(tech.id)}
                    disabled={!!clockingId || isActive}
                  >
                    {t.technicians.clockIn}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs"
                    onClick={() => clockOut(tech.id)}
                    disabled={!!clockingId || !isActive}
                  >
                    {t.technicians.clockOut}
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Open ROs without active techs */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-3">{t.technicians.openROs}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {ros.filter((ro) => ro.techClocks.length === 0).map((ro) => (
            <Link key={ro.id} href={`/shop/repair-orders/${ro.id}`}>
              <div className="bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all">
                <div className="flex justify-between items-start">
                  <span className="font-mono text-sm font-bold text-blue-600">#{ro.roNumber}</span>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full",
                    ro.status === "in_progress" ? "bg-yellow-100 text-yellow-700" :
                    ro.status === "approved" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                  )}>
                    {ro.status.replace("_", " ")}
                  </span>
                </div>
                <p className="text-sm font-medium mt-1">{ro.vehicle.year} {ro.vehicle.make} {ro.vehicle.model}</p>
                <p className="text-xs text-slate-500">{ro.customer.firstName} {ro.customer.lastName}</p>
                <p className="text-xs text-slate-400 mt-2 bg-amber-50 text-amber-600 px-2 py-1 rounded">{t.technicians.noTechAssigned}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
