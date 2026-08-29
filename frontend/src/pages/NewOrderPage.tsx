import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { Button, Card, Field, inputClass, Shell } from "../components/ui";
import { LocationPickerMap } from "../components/LocationPickerMap";
import { GeocodeResult } from "../lib/geocode";

type Quote = {
  total: number;
  subtotal: number;
  volumetricWeight: number;
  chargeableWeight: number;
  zoneType: string;
  pickupZone: { name: string };
  dropZone: { name: string };
  baseFee: number;
  ratePerKg: number;
  weightCharge: number;
  codSurcharge: number;
};

const initialForm = {
  pickupAddress: "12 Connaught Place, New Delhi",
  pickupPincode: "110001",
  pickupLat: undefined as number | undefined,
  pickupLng: undefined as number | undefined,
  dropAddress: "88 Diplomatic Enclave, Chanakyapuri",
  dropPincode: "110021",
  dropLat: undefined as number | undefined,
  dropLng: undefined as number | undefined,
  lengthCm: 25,
  breadthCm: 20,
  heightCm: 15,
  actualWeightKg: 1.2,
  orderType: "B2C",
  paymentType: "COD",
  scheduledDate: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
};

export function NewOrderPage() {
  const nav = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [bookingOrder, setBookingOrder] = useState(false);
  const [error, setError] = useState("");
  const [pickMode, setPickMode] = useState<"type" | "map">("type");
  const [dropMode, setDropMode] = useState<"type" | "map">("type");

  const liveVolumetric = Number(
    ((Number(form.lengthCm) * Number(form.breadthCm) * Number(form.heightCm)) / 5000).toFixed(2)
  );
  const liveChargeable = Math.max(Number(form.actualWeightKg) || 0, liveVolumetric || 0);

  function getPayload() {
    const { actualWeightKg, ...rest } = form;
    return {
      ...rest,
      lengthCm: Number(form.lengthCm),
      breadthCm: Number(form.breadthCm),
      heightCm: Number(form.heightCm),
      actualWeight: Number(actualWeightKg),
      scheduledDate: new Date(form.scheduledDate).toISOString(),
    };
  }

  async function calculateQuote(e?: FormEvent) {
    if (e) e.preventDefault();
    setError("");
    setLoadingQuote(true);
    try {
      const q = await api<Quote>("/api/orders/quote", {
        method: "POST",
        body: JSON.stringify(getPayload()),
      });
      setQuote(q);
    } catch (err) {
      setQuote(null);
      setError(err instanceof Error ? err.message : "Quote calculation failed");
    } finally {
      setLoadingQuote(false);
    }
  }

  async function confirmOrder() {
    setError("");
    setBookingOrder(true);
    try {
      const order = await api<{ id: string }>("/api/orders", {
        method: "POST",
        body: JSON.stringify({ ...getPayload(), autoAssign: true }),
      });
      nav(`/orders/${order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Order creation failed");
      setBookingOrder(false);
    }
  }

  return (
    <Shell
      title="Create New Shipment"
      subtitle="Calculate accurate volumetric pricing and book dynamic courier dispatch"
      action={
        <Link to="/app">
          <Button variant="secondary" size="sm">
            ← Back to Shipments
          </Button>
        </Link>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
        {/* Form Column (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* 1. Origin & Destination */}
          <Card>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-outline-variant/60">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-on-secondary text-[11px] font-bold">
                1
              </span>
              <h2 className="font-label-md text-label-md uppercase tracking-wider text-on-surface">Pickup & Drop Locations</h2>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-slate-300">Pickup Origin</span>
                <div className="flex bg-surface-container rounded-md p-1 border border-outline-variant">
                  <button type="button" onClick={() => setPickMode("type")} className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${pickMode === "type" ? "bg-secondary text-on-secondary" : "text-on-surface-variant hover:text-white"}`}>Type Manually</button>
                  <button type="button" onClick={() => setPickMode("map")} className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${pickMode === "map" ? "bg-secondary text-on-secondary" : "text-on-surface-variant hover:text-white"}`}>Pick on Map</button>
                </div>
              </div>
              
              {pickMode === "map" && (
                <div className="mb-3">
                  <LocationPickerMap
                    label="Drop Pin for Pickup"
                    onSelect={(res: GeocodeResult) => setForm({ ...form, pickupAddress: res.address, pickupPincode: res.pincode || form.pickupPincode, pickupLat: res.lat, pickupLng: res.lng })}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                <div className="sm:col-span-2">
                  <Field label="Pickup Street Address">
                    <input
                      className={inputClass}
                      value={form.pickupAddress}
                      onChange={(e) => setForm({ ...form, pickupAddress: e.target.value })}
                      placeholder="Street address, building"
                      required
                    />
                  </Field>
                </div>
                <div>
                  <Field label="Pickup Pincode">
                    <input
                      className={inputClass}
                      value={form.pickupPincode}
                      onChange={(e) => setForm({ ...form, pickupPincode: e.target.value })}
                      placeholder="e.g. 110001"
                      required
                    />
                  </Field>
                </div>
              </div>

              <div className="flex items-center justify-between mb-1 pt-4 border-t border-outline-variant/40">
                <span className="text-sm font-medium text-slate-300">Drop Destination</span>
                <div className="flex bg-surface-container rounded-md p-1 border border-outline-variant">
                  <button type="button" onClick={() => setDropMode("type")} className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${dropMode === "type" ? "bg-secondary text-on-secondary" : "text-on-surface-variant hover:text-white"}`}>Type Manually</button>
                  <button type="button" onClick={() => setDropMode("map")} className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${dropMode === "map" ? "bg-secondary text-on-secondary" : "text-on-surface-variant hover:text-white"}`}>Pick on Map</button>
                </div>
              </div>

              {dropMode === "map" && (
                <div className="mb-3">
                  <LocationPickerMap
                    label="Drop Pin for Destination"
                    onSelect={(res: GeocodeResult) => setForm({ ...form, dropAddress: res.address, dropPincode: res.pincode || form.dropPincode, dropLat: res.lat, dropLng: res.lng })}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <Field label="Destination Street Address">
                    <input
                      className={inputClass}
                      value={form.dropAddress}
                      onChange={(e) => setForm({ ...form, dropAddress: e.target.value })}
                      placeholder="Destination address"
                      required
                    />
                  </Field>
                </div>
                <div>
                  <Field label="Drop Pincode">
                    <input
                      className={inputClass}
                      value={form.dropPincode}
                      onChange={(e) => setForm({ ...form, dropPincode: e.target.value })}
                      placeholder="e.g. 110021"
                      required
                    />
                  </Field>
                </div>
              </div>
            </div>
          </Card>

          {/* 2. Package Dimensions & Weight */}
          <Card>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-outline-variant/60">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-on-secondary text-[11px] font-bold">
                  2
                </span>
                <h2 className="text-xs font-bold uppercase tracking-wider text-on-surface">Dimensions & Metrics</h2>
              </div>
              <span className="text-[11px] text-on-surface-variant font-mono">Formula: (L×B×H)/5000</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Field label="Length (cm)">
                <input
                  type="number"
                  step="0.5"
                  className={inputClass}
                  value={form.lengthCm}
                  onChange={(e) => setForm({ ...form, lengthCm: Number(e.target.value) })}
                  required
                />
              </Field>
              <Field label="Breadth (cm)">
                <input
                  type="number"
                  step="0.5"
                  className={inputClass}
                  value={form.breadthCm}
                  onChange={(e) => setForm({ ...form, breadthCm: Number(e.target.value) })}
                  required
                />
              </Field>
              <Field label="Height (cm)">
                <input
                  type="number"
                  step="0.5"
                  className={inputClass}
                  value={form.heightCm}
                  onChange={(e) => setForm({ ...form, heightCm: Number(e.target.value) })}
                  required
                />
              </Field>
              <Field label="Actual Wt (kg)">
                <input
                  type="number"
                  step="0.1"
                  className={inputClass}
                  value={form.actualWeightKg}
                  onChange={(e) => setForm({ ...form, actualWeightKg: Number(e.target.value) })}
                  required
                />
              </Field>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg border border-outline-variant bg-surface-container-low p-2 text-xs">
              <div className="flex justify-between items-center text-on-surface-variant">
                <span>Volumetric Wt:</span>
                <span className="font-mono font-bold text-on-surface">{liveVolumetric} kg</span>
              </div>
              <div className="flex justify-between items-center text-on-surface-variant border-l border-outline-variant pl-3">
                <span className="text-secondary font-semibold">Billable Wt:</span>
                <span className="font-mono font-bold text-secondary">{liveChargeable} kg</span>
              </div>
            </div>
          </Card>

          {/* 3. Tariff & Payment Method */}
          <Card>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-outline-variant/60">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-on-secondary text-[11px] font-bold">
                3
              </span>
              <h2 className="text-xs font-bold uppercase tracking-wider text-on-surface">Order Segment & Schedule</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Order Type">
                <select
                  className={inputClass}
                  value={form.orderType}
                  onChange={(e) => setForm({ ...form, orderType: e.target.value })}
                >
                  <option value="B2C">B2C (Retail)</option>
                  <option value="B2B">B2B (Commercial)</option>
                </select>
              </Field>

              <Field label="Payment Mode">
                <select
                  className={inputClass}
                  value={form.paymentType}
                  onChange={(e) => setForm({ ...form, paymentType: e.target.value })}
                >
                  <option value="COD">Cash on Delivery (COD)</option>
                  <option value="PREPAID">Prepaid (Zero Surcharge)</option>
                </select>
              </Field>

              <Field label="Scheduled Date">
                <input
                  type="datetime-local"
                  className={inputClass}
                  value={form.scheduledDate}
                  onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
                  required
                />
              </Field>
            </div>

            <div className="mt-5 pt-3 border-t border-outline-variant flex items-center justify-between">
              <span className="text-[11px] text-on-surface-variant">Live tariff lookup enabled</span>
              <Button type="button" onClick={() => void calculateQuote()} disabled={loadingQuote}>
                {loadingQuote ? "Estimating…" : "Calculate Guaranteed Quote"}
              </Button>
            </div>
          </Card>
        </div>

        {/* Live Receipt Preview Column (5 Cols) */}
        <div className="lg:col-span-5 lg:sticky lg:top-20">
          <Card className="border-secondary/30 shadow-card">
            <div className="flex items-center justify-between border-b border-outline-variant pb-3 mb-4">
              <div>
                <h3 className="font-sans font-bold text-sm text-on-surface">Guaranteed Rate Breakdown</h3>
                <p className="text-[11px] text-on-surface-variant">Locked in upon order confirmation</p>
              </div>
              <span className="rounded-full bg-secondary/10 border border-secondary/20 px-2 py-0.5 text-[10px] font-bold text-secondary">
                {quote ? "Active Estimate" : "Pending Inputs"}
              </span>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-error-container bg-error-container/40 p-2.5 text-xs text-error font-medium">
                {error}
              </div>
            )}

            {quote ? (
              <div className="space-y-4">
                {/* Zone Classification */}
                <div className="rounded-lg border border-outline-variant bg-surface-container-low p-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block mb-1">
                    Route Classification
                  </span>
                  <div className="flex items-center justify-between text-xs font-bold text-on-surface">
                    <span>{quote.pickupZone.name}</span>
                    <span className="rounded bg-secondary-container text-on-secondary-container px-2 py-0.5 text-[10px]">
                      {quote.zoneType}
                    </span>
                    <span>{quote.dropZone.name}</span>
                  </div>
                </div>

                {/* Line Item Breakdown */}
                <div className="space-y-2 text-xs text-on-surface-variant">
                  <div className="flex justify-between py-1 border-b border-outline-variant/40">
                    <span>Chargeable Weight</span>
                    <span className="font-mono font-bold text-on-surface">{quote.chargeableWeight} kg</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-outline-variant/40">
                    <span>Base Freight Tariff</span>
                    <span className="font-mono text-on-surface">₹{Number(quote.baseFee).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-outline-variant/40">
                    <span>Weight Fee (@ ₹{quote.ratePerKg}/kg)</span>
                    <span className="font-mono text-on-surface">₹{Number(quote.weightCharge).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-outline-variant/40">
                    <span>Subtotal</span>
                    <span className="font-mono font-bold text-on-surface">₹{Number(quote.subtotal).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-outline-variant/40">
                    <span>COD Surcharge {form.paymentType === "PREPAID" ? "(Waived)" : ""}</span>
                    <span className={`font-mono ${form.paymentType === "COD" ? "font-bold text-on-surface" : "text-on-surface-variant"}`}>
                      ₹{Number(quote.codSurcharge).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Grand Total */}
                <div className="rounded-lg border border-secondary/30 bg-surface-container p-3.5 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-on-surface block">Total Freight Fee</span>
                    <span className="text-[10px] text-on-surface-variant">All taxes & fees included</span>
                  </div>
                  <span className="font-sans text-2xl font-extrabold text-secondary">
                    ₹{Number(quote.total).toFixed(2)}
                  </span>
                </div>

                <Button
                  type="button"
                  onClick={() => void confirmOrder()}
                  disabled={bookingOrder}
                  className="w-full py-2.5 text-xs"
                >
                  {bookingOrder ? "Booking Shipment…" : "Confirm & Dispatch Shipment"}
                </Button>
              </div>
            ) : (
              <div className="py-10 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-3xl text-outline mb-2">calculate</span>
                <p className="text-xs font-medium text-on-surface">No quote calculated yet</p>
                <p className="mt-1 text-[11px] text-on-surface-variant max-w-xs mx-auto">
                  Provide package dimensions and click "Calculate Guaranteed Quote" to verify freight costs.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </Shell>
  );
}
