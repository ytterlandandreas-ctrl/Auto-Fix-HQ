"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, X, Search, UserPlus } from "lucide-react";
import { toast } from "sonner";

export function NewROClient({ customers, technicians, cannedJobs }: {
  customers: any[]; technicians: any[]; cannedJobs: any[];
}) {
  const router = useRouter();
  const [step, setStep] = useState<"customer" | "vehicle" | "details">("customer");
  const [saving, setSaving] = useState(false);

  // Customer state
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ firstName: "", lastName: "", phone: "", email: "" });

  // Vehicle state
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [showNewVehicle, setShowNewVehicle] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ year: "", make: "", model: "", vin: "", mileage: "", color: "", licensePlate: "" });

  // RO details
  const [roType, setROType] = useState<"mechanical" | "collision">("mechanical");
  const [complaint, setComplaint] = useState("");
  const [assignedTechId, setAssignedTechId] = useState("");
  const [priority, setPriority] = useState("normal");
  const [selectedCannedJobs, setSelectedCannedJobs] = useState<string[]>([]);

  const filteredCustomers = customerSearch
    ? customers.filter((c) =>
        `${c.firstName} ${c.lastName} ${c.phone} ${c.email ?? ""}`.toLowerCase().includes(customerSearch.toLowerCase())
      ).slice(0, 10)
    : customers.slice(0, 10);

  useEffect(() => {
    if (selectedCustomer) {
      fetch(`/api/customers/${selectedCustomer.id}/vehicles`)
        .then((r) => r.ok ? r.json() : [])
        .then(setVehicles)
        .catch(() => setVehicles([]));
    }
  }, [selectedCustomer]);

  async function createCustomer() {
    if (!newCustomer.firstName || !newCustomer.lastName || !newCustomer.phone) {
      toast.error("First name, last name, and phone are required");
      return;
    }
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCustomer),
    });
    if (res.ok) {
      const c = await res.json();
      setSelectedCustomer(c);
      setShowNewCustomer(false);
      setVehicles([]);
      toast.success("Customer created");
    } else {
      toast.error("Failed to create customer");
    }
  }

  async function createVehicle() {
    if (!newVehicle.year || !newVehicle.make || !newVehicle.model) {
      toast.error("Year, make, and model are required");
      return;
    }
    const res = await fetch("/api/vehicles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...newVehicle,
        year: parseInt(newVehicle.year),
        mileage: newVehicle.mileage ? parseInt(newVehicle.mileage) : null,
        customerId: selectedCustomer.id,
      }),
    });
    if (res.ok) {
      const v = await res.json();
      setVehicles((prev) => [v, ...prev]);
      setSelectedVehicle(v);
      setShowNewVehicle(false);
      toast.success("Vehicle added");
    } else {
      toast.error("Failed to add vehicle");
    }
  }

  async function createRO() {
    if (!selectedCustomer || !selectedVehicle) {
      toast.error("Select a customer and vehicle first");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/repair-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: selectedCustomer.id,
        vehicleId: selectedVehicle.id,
        type: roType,
        complaint,
        assignedTechId: assignedTechId || null,
        priority,
        cannedJobIds: selectedCannedJobs,
      }),
    });
    setSaving(false);
    if (res.ok) {
      const ro = await res.json();
      toast.success(`RO #${ro.roNumber} created`);
      router.push(`/shop/repair-orders/${ro.id}`);
    } else {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error || "Failed to create RO");
    }
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <Link href="/shop/repair-orders" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="w-4 h-4" /> Back to repair orders
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">New Repair Order</h1>
        <p className="text-sm text-slate-500">Select a customer, vehicle, and complaint to start a new RO.</p>
      </div>

      {/* Step indicator */}
      <div className="flex gap-2">
        {[
          { id: "customer", label: "1. Customer", complete: !!selectedCustomer },
          { id: "vehicle", label: "2. Vehicle", complete: !!selectedVehicle },
          { id: "details", label: "3. Details", complete: false },
        ].map((s) => (
          <button key={s.id} onClick={() => setStep(s.id as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              step === s.id ? "bg-blue-600 text-white" :
              s.complete ? "bg-green-100 text-green-700" :
              "bg-slate-100 text-slate-500"
            }`}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Customer step */}
      {step === "customer" && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="Search by name, phone, or email..."
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm" />
            </div>
            <Button variant="outline" onClick={() => setShowNewCustomer(true)}>
              <UserPlus className="w-4 h-4 mr-1.5" /> New Customer
            </Button>
          </div>

          {showNewCustomer && (
            <div className="border border-blue-200 bg-blue-50/50 rounded-lg p-4 grid grid-cols-2 gap-3">
              <input placeholder="First Name *" value={newCustomer.firstName}
                onChange={(e) => setNewCustomer((c) => ({ ...c, firstName: e.target.value }))}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white" />
              <input placeholder="Last Name *" value={newCustomer.lastName}
                onChange={(e) => setNewCustomer((c) => ({ ...c, lastName: e.target.value }))}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white" />
              <input placeholder="Phone *" value={newCustomer.phone}
                onChange={(e) => setNewCustomer((c) => ({ ...c, phone: e.target.value }))}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white" />
              <input placeholder="Email" type="email" value={newCustomer.email}
                onChange={(e) => setNewCustomer((c) => ({ ...c, email: e.target.value }))}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white" />
              <div className="col-span-2 flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setShowNewCustomer(false)}>Cancel</Button>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={createCustomer}>Create</Button>
              </div>
            </div>
          )}

          <div className="space-y-1 max-h-80 overflow-y-auto">
            {filteredCustomers.map((c) => (
              <button key={c.id} onClick={() => { setSelectedCustomer(c); setStep("vehicle"); }}
                className={`w-full text-left px-3 py-2 rounded-lg flex justify-between items-center hover:bg-slate-50 ${
                  selectedCustomer?.id === c.id ? "bg-blue-50 border border-blue-200" : ""
                }`}>
                <div>
                  <p className="font-medium text-sm text-slate-800">{c.firstName} {c.lastName}</p>
                  <p className="text-xs text-slate-400">{c.phone} {c.email && `· ${c.email}`}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Vehicle step */}
      {step === "vehicle" && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-500">
              Customer: <span className="font-medium text-slate-800">{selectedCustomer?.firstName} {selectedCustomer?.lastName}</span>
            </p>
            <Button variant="outline" size="sm" onClick={() => setShowNewVehicle(true)}>
              <Plus className="w-4 h-4 mr-1.5" /> Add Vehicle
            </Button>
          </div>

          {showNewVehicle && (
            <div className="border border-blue-200 bg-blue-50/50 rounded-lg p-4 grid grid-cols-3 gap-3">
              <input placeholder="Year *" type="number" value={newVehicle.year}
                onChange={(e) => setNewVehicle((v) => ({ ...v, year: e.target.value }))}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white" />
              <input placeholder="Make *" value={newVehicle.make}
                onChange={(e) => setNewVehicle((v) => ({ ...v, make: e.target.value }))}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white" />
              <input placeholder="Model *" value={newVehicle.model}
                onChange={(e) => setNewVehicle((v) => ({ ...v, model: e.target.value }))}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white" />
              <input placeholder="VIN" value={newVehicle.vin}
                onChange={(e) => setNewVehicle((v) => ({ ...v, vin: e.target.value }))}
                className="col-span-2 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white" />
              <input placeholder="License Plate" value={newVehicle.licensePlate}
                onChange={(e) => setNewVehicle((v) => ({ ...v, licensePlate: e.target.value }))}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white" />
              <input placeholder="Mileage" type="number" value={newVehicle.mileage}
                onChange={(e) => setNewVehicle((v) => ({ ...v, mileage: e.target.value }))}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white" />
              <input placeholder="Color" value={newVehicle.color}
                onChange={(e) => setNewVehicle((v) => ({ ...v, color: e.target.value }))}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white" />
              <div className="col-span-3 flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setShowNewVehicle(false)}>Cancel</Button>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={createVehicle}>Add</Button>
              </div>
            </div>
          )}

          <div className="space-y-1">
            {vehicles.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No vehicles yet — add one to continue</p>
            ) : (
              vehicles.map((v) => (
                <button key={v.id} onClick={() => { setSelectedVehicle(v); setStep("details"); }}
                  className={`w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 ${
                    selectedVehicle?.id === v.id ? "bg-blue-50 border border-blue-200" : ""
                  }`}>
                  <p className="font-medium text-sm text-slate-800">{v.year} {v.make} {v.model}</p>
                  <p className="text-xs text-slate-400">
                    {v.color && `${v.color} · `}{v.vin && `VIN: ${v.vin}`}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Details step */}
      {step === "details" && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="bg-slate-50 rounded-lg p-3 text-sm">
            <p><span className="text-slate-500">Customer:</span> <span className="font-medium">{selectedCustomer?.firstName} {selectedCustomer?.lastName}</span></p>
            <p><span className="text-slate-500">Vehicle:</span> <span className="font-medium">{selectedVehicle?.year} {selectedVehicle?.make} {selectedVehicle?.model}</span></p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">RO Type</label>
              <select value={roType} onChange={(e) => setROType(e.target.value as any)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                <option value="mechanical">Mechanical</option>
                <option value="collision">Collision/Body</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Assigned Technician</label>
              <select value={assignedTechId} onChange={(e) => setAssignedTechId(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                <option value="">Unassigned</option>
                {technicians.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Customer Complaint / Reason for Visit</label>
            <textarea rows={3} value={complaint} onChange={(e) => setComplaint(e.target.value)}
              placeholder="e.g. Brakes squealing on right front when stopping at low speeds..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none" />
          </div>

          {cannedJobs.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600">Add Canned Jobs (templates)</label>
              <div className="flex flex-wrap gap-2">
                {cannedJobs.map((j) => (
                  <button key={j.id} onClick={() => {
                    setSelectedCannedJobs((prev) =>
                      prev.includes(j.id) ? prev.filter((id) => id !== j.id) : [...prev, j.id]
                    );
                  }}
                    className={`text-xs px-2.5 py-1 rounded-full border ${
                      selectedCannedJobs.includes(j.id)
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                    }`}>
                    {j.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setStep("vehicle")}>Back</Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={createRO} disabled={saving}>
              {saving ? "Creating..." : "Create Repair Order"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
