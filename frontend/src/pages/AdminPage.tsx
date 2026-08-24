import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { Button, Card, Field, inputClass, Shell, StatCard, StatusBadge } from "../components/ui";

type Zone = { id: string; name: string; code: string; pincodes?: { id: string; pincode: string; areaName: string | null }[] };
type Pincode = { id: string; pincode: string; areaName: string | null; zone: Zone };
type RateCard = {
  id: string;
  orderType: string;
  zoneType: string;
  baseFee: string;
  ratePerKg: string;
};
type Cod = { orderType: string; surchargeFlat: string; surchargePercent: string };
type Order = {
  id: string;
  status: string;
  pickupAddress: string;
  dropAddress: string;
  pickupPincode: string;
  dropPincode: string;
  calculatedCharge: string;
  pickupZone: Zone;
  assignedAgent?: { name: string } | null;
};
type Agent = {
  id: string;
  name: string;
  email: string;
  agentProfile: { currentZoneId: string | null; isAvailable: boolean; currentZone?: Zone | null } | null;
};
type Customer = { id: string; name: string; email: string };

export function AdminPage() {
  const [tab, setTab] = useState<"orders" | "zones" | "rates" | "agents">("orders");
  const [alert, setAlert] = useState<{ count: number; message: string | null } | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [zones, setZones] = useState<Zone[]>([]);
  const [pincodes, setPincodes] = useState<Pincode[]>([]);
  const [cards, setCards] = useState<RateCard[]>([]);
  const [cod, setCod] = useState<Cod[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [assignState, setAssignState] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Forms
  const [zoneForm, setZoneForm] = useState({ name: "", code: "" });
  const [pinForm, setPinForm] = useState({ pincode: "", areaName: "", zoneId: "" });
  const [cardForm, setCardForm] = useState({
    orderType: "B2C",
    zoneType: "INTRA",
    baseFee: 50,
    ratePerKg: 20,
  });
  const [agentForm, setAgentForm] = useState({
    name: "",
    email: "",
    password: "password123",
    currentZoneId: "",
  });

  async function loadData() {
    try {
      const [alertData, ordersData, zonesData, pinsData, cardsData, codData, agentsData, customersData] =
        await Promise.all([
          api<{ count: number; message: string | null }>("/api/orders/unassigned-alert"),
          api<Order[]>(`/api/orders${statusFilter ? `?status=${statusFilter}` : ""}`),
          api<Zone[]>("/api/zones"),
          api<Pincode[]>("/api/pincodes"),
          api<RateCard[]>("/api/rate-cards"),
          api<Cod[]>("/api/cod-config"),
          api<Agent[]>("/api/users/agents"),
          api<Customer[]>("/api/users/customers"),
        ]);

      setAlert(alertData);
      setOrders(ordersData);
      setZones(zonesData);
      setPincodes(pinsData);
      setCards(cardsData);
      setCod(codData);
      setAgents(agentsData);
      setCustomers(customersData);
      if (zonesData.length > 0 && !pinForm.zoneId) {
        setPinForm((p) => ({ ...p, zoneId: zonesData[0].id }));
        setAgentForm((a) => ({ ...a, currentZoneId: zonesData[0].id }));
      }
    } catch {
      // Retain previous
    }
  }

  useEffect(() => {
    void loadData();
    const interval = setInterval(() => {
      void loadData();
    }, 5000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  async function handleAddZone(e: FormEvent) {
    e.preventDefault();
    await api("/api/zones", { method: "POST", body: JSON.stringify(zoneForm) });
    setZoneForm({ name: "", code: "" });
    await loadData();
  }

  async function handleAddPin(e: FormEvent) {
    e.preventDefault();
    await api("/api/pincodes", { method: "POST", body: JSON.stringify(pinForm) });
    setPinForm({ pincode: "", areaName: "", zoneId: zones[0]?.id || "" });
    await loadData();
  }

  async function handleAddCard(e: FormEvent) {
    e.preventDefault();
    await api("/api/rate-cards", {
      method: "POST",
      body: JSON.stringify({ ...cardForm, baseFee: Number(cardForm.baseFee), ratePerKg: Number(cardForm.ratePerKg) }),
    });
    await loadData();
  }

  async function handleSaveCod(c: Cod) {
    await api(`/api/cod-config/${c.orderType}`, {
      method: "PUT",
      body: JSON.stringify({
        surchargeFlat: Number(c.surchargeFlat),
        surchargePercent: Number(c.surchargePercent),
      }),
    });
    await loadData();
  }

  async function handleCreateAgent(e: FormEvent) {
    e.preventDefault();
    await api("/api/users/agents", { method: "POST", body: JSON.stringify(agentForm) });
    setAgentForm({ name: "", email: "", password: "password123", currentZoneId: zones[0]?.id || "" });
    await loadData();
  }

  async function handleAssign(orderId: string, isAuto: boolean) {
    setActionLoading(orderId);
    try {
      if (isAuto) {
        await api(`/api/orders/${orderId}/auto-assign`, { method: "POST" });
      } else {
        const agentId = assignState[orderId];
        if (!agentId) return;
        await api(`/api/orders/${orderId}/assign`, { method: "POST", body: JSON.stringify({ agentId }) });
      }
      await loadData();
    } finally {
      setActionLoading(null);
    }
  }

  const unassignedOrders = orders.filter((o) => o.status === "UNASSIGNED" || o.status === "CREATED");
  const onlineAgents = agents.filter((a) => a.agentProfile?.isAvailable);

  const activeDeliveries = orders.filter((o) => ["ASSIGNED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(o.status));
  const deliveredToday = orders.filter((o) => o.status === "DELIVERED");
  const failedDeliveries = orders.filter((o) => o.status === "FAILED");
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.calculatedCharge || 0), 0);

  return (
    <Shell
      title="Admin Operations Center"
    >
      {/* Unassigned Dispatch Alert */}
      {alert && alert.count > 0 && (
        <div className="rounded-xl border border-error/40 bg-error-container/30 p-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-error text-on-error">
              <span className="material-symbols-outlined text-[18px]">warning</span>
            </span>
            <div>
              <h3 className="font-label-md text-label-md font-bold text-on-surface">Unassigned Orders in Queue</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">{alert.message}</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="danger"
            onClick={() => {
              setTab("orders");
              setStatusFilter("UNASSIGNED");
            }}
          >
            Dispatch Pending ({alert.count})
          </Button>
        </div>
      )}

      {/* Stats – matches admin_dashboard 5-column design */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-gutter">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-card flex flex-col gap-2">
          <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Total Orders</span>
          <span className="font-headline-lg text-headline-lg text-on-surface">{orders.length.toLocaleString()}</span>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-card flex flex-col gap-2">
          <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Active Deliveries</span>
          <span className="font-headline-lg text-headline-lg text-secondary">{activeDeliveries.length}</span>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-card flex flex-col gap-2">
          <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Delivered Today</span>
          <span className="font-headline-lg text-headline-lg text-[#10B981]">{deliveredToday.length}</span>
        </div>
        <div className="bg-surface-container-lowest border border-error-container rounded-xl p-4 shadow-card flex flex-col gap-2 bg-error-container/10">
          <span className="font-label-md text-label-md text-error uppercase tracking-wider">Failed Deliveries</span>
          <span className="font-headline-lg text-headline-lg text-error">{failedDeliveries.length}</span>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-card flex flex-col gap-2 col-span-2 md:col-span-1">
          <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Revenue</span>
          <span className="font-headline-lg text-headline-lg text-on-surface font-mono-data">₹{totalRevenue.toLocaleString()}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-1 border-b border-outline-variant pb-3">
        {[
          { id: "orders", label: "Master Dispatch Table", icon: "dashboard", count: orders.length },
          { id: "zones", label: "Zones & Pincodes", icon: "map", count: zones.length },
          { id: "rates", label: "Dynamic Tariffs & COD", icon: "payments", count: cards.length },
          { id: "agents", label: "Courier Roster", icon: "group", count: agents.length },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
              tab === t.id
                ? "bg-secondary text-on-secondary shadow-sm"
                : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">{t.icon}</span>
            <span>{t.label}</span>
            <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${tab === t.id ? "bg-white/20 text-white" : "bg-surface-container-high text-on-surface-variant"}`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tab 1: Dispatch Table */}
      {tab === "orders" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-on-surface-variant">Filter by Status:</span>
              <select
                className={`${inputClass} !py-1 !w-44 !text-xs`}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses ({orders.length})</option>
                {["UNASSIGNED", "CREATED", "ASSIGNED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED", "FAILED"].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <span className="text-xs text-on-surface-variant">Showing {orders.length} total orders</span>
          </div>

          <div className="space-y-3">
            {orders.map((o) => {
              const eligibleAgents = agents.filter(
                (a) => a.agentProfile?.currentZoneId === o.pickupZone.id && a.agentProfile.isAvailable
              );

              return (
                <Card key={o.id} className="hover:border-secondary transition-all">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2.5">
                        <Link to={`/orders/${o.id}`} className="font-mono text-xs font-bold text-secondary hover:underline">
                          #{o.id.slice(0, 8)}
                        </Link>
                        <span className="text-xs text-on-surface-variant">
                          Zone: <strong className="text-on-surface">{o.pickupZone.name}</strong>
                        </span>
                        <span className="text-xs text-on-surface-variant">
                          Assigned: <strong className="text-secondary">{o.assignedAgent?.name ?? "None (Unassigned)"}</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-medium text-on-surface">
                        <span>{o.pickupAddress} ({o.pickupPincode})</span>
                        <span className="text-outline">→</span>
                        <span>{o.dropAddress} ({o.dropPincode})</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-outline-variant/40 justify-between lg:justify-end">
                      <div className="text-right mr-2 hidden sm:block">
                        <span className="text-xs font-bold text-on-surface">
                          ₹{Number(o.calculatedCharge).toFixed(2)}
                        </span>
                      </div>

                      <StatusBadge status={o.status} />

                      {["UNASSIGNED", "CREATED", "RESCHEDULED"].includes(o.status) && (
                        <div className="flex items-center gap-1.5 w-full sm:w-auto">
                          <select
                            className={`${inputClass} !py-1 !text-xs !w-40`}
                            value={assignState[o.id] ?? ""}
                            onChange={(e) => setAssignState({ ...assignState, [o.id]: e.target.value })}
                          >
                            <option value="">Select Courier ({eligibleAgents.length})</option>
                            {eligibleAgents.map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.name}
                              </option>
                            ))}
                          </select>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => void handleAssign(o.id, false)}
                            disabled={!assignState[o.id] || actionLoading === o.id}
                          >
                            Assign
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => void handleAssign(o.id, true)}
                            disabled={actionLoading === o.id}
                          >
                            Auto
                          </Button>
                        </div>
                      )}

                      <Link to={`/orders/${o.id}`}>
                        <Button variant="ghost" size="sm">
                          Inspect →
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Zones & Postal Mappings */}
      {tab === "zones" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
          <div className="lg:col-span-5 space-y-5">
            <Card>
              <h2 className="text-xs font-bold uppercase tracking-wider text-on-surface mb-3 pb-2 border-b border-outline-variant/60">
                Add Delivery Zone
              </h2>
              <form onSubmit={handleAddZone} className="space-y-3">
                <Field label="Zone Name">
                  <input
                    className={inputClass}
                    placeholder="e.g. West District Hub"
                    value={zoneForm.name}
                    onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })}
                    required
                  />
                </Field>
                <Field label="Zone Identifier Code">
                  <input
                    className={inputClass}
                    placeholder="e.g. DEL_WEST"
                    value={zoneForm.code}
                    onChange={(e) => setZoneForm({ ...zoneForm, code: e.target.value.toUpperCase() })}
                    required
                  />
                </Field>
                <Button type="submit" className="w-full">
                  + Create Zone
                </Button>
              </form>
            </Card>

            <Card>
              <h2 className="text-xs font-bold uppercase tracking-wider text-on-surface mb-3 pb-2 border-b border-outline-variant/60">
                Map Postal Code
              </h2>
              <form onSubmit={handleAddPin} className="space-y-3">
                <Field label="6-Digit Postal Code">
                  <input
                    className={inputClass}
                    placeholder="e.g. 110045"
                    value={pinForm.pincode}
                    onChange={(e) => setPinForm({ ...pinForm, pincode: e.target.value })}
                    required
                  />
                </Field>
                <Field label="Area Name (Optional)">
                  <input
                    className={inputClass}
                    placeholder="e.g. Janakpuri"
                    value={pinForm.areaName}
                    onChange={(e) => setPinForm({ ...pinForm, areaName: e.target.value })}
                  />
                </Field>
                <Field label="Target Delivery Zone">
                  <select
                    className={inputClass}
                    value={pinForm.zoneId}
                    onChange={(e) => setPinForm({ ...pinForm, zoneId: e.target.value })}
                    required
                  >
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name} ({z.code})
                      </option>
                    ))}
                  </select>
                </Field>
                <Button type="submit" className="w-full">
                  + Save Postal Mapping
                </Button>
              </form>
            </Card>
          </div>

          <div className="lg:col-span-7 space-y-5">
            <Card>
              <h3 className="font-bold text-xs uppercase tracking-wider text-on-surface mb-3 pb-2 border-b border-outline-variant/60">
                Configured Zones ({zones.length})
              </h3>
              <div className="space-y-2">
                {zones.map((z) => (
                  <div key={z.id} className="rounded-lg border border-outline-variant bg-surface-container-low p-3 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-xs text-on-surface block">{z.name}</span>
                      <span className="text-[11px] font-mono text-on-surface-variant">Code: {z.code}</span>
                    </div>
                    <span className="rounded bg-secondary/10 border border-secondary/20 px-2 py-0.5 text-[10px] font-bold text-secondary">
                      Active
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h3 className="font-bold text-xs uppercase tracking-wider text-on-surface mb-3 pb-2 border-b border-outline-variant/60">
                Postal Code Mapping Table ({pincodes.length})
              </h3>
              <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
                {pincodes.map((p) => (
                  <div key={p.id} className="rounded-lg border border-outline-variant bg-surface-container-low p-2 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono font-bold text-on-surface">{p.pincode}</span>
                      {p.areaName && <span className="ml-2 text-on-surface-variant">({p.areaName})</span>}
                    </div>
                    <span className="rounded bg-surface-container-lowest border border-outline-variant px-2 py-0.5 text-[10px] font-bold text-secondary">
                      {p.zone.name}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 3: Dynamic Rate Cards & COD Config */}
      {tab === "rates" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
          <div className="lg:col-span-5 space-y-5">
            <Card>
              <h2 className="text-xs font-bold uppercase tracking-wider text-on-surface mb-3 pb-2 border-b border-outline-variant/60">
                Add Dynamic Rate Card
              </h2>
              <form onSubmit={handleAddCard} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Order Type">
                    <select
                      className={inputClass}
                      value={cardForm.orderType}
                      onChange={(e) => setCardForm({ ...cardForm, orderType: e.target.value })}
                    >
                      <option>B2C</option>
                      <option>B2B</option>
                    </select>
                  </Field>
                  <Field label="Zone Movement">
                    <select
                      className={inputClass}
                      value={cardForm.zoneType}
                      onChange={(e) => setCardForm({ ...cardForm, zoneType: e.target.value })}
                    >
                      <option>INTRA</option>
                      <option>INTER</option>
                    </select>
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Base Fee (₹)">
                    <input
                      type="number"
                      className={inputClass}
                      value={cardForm.baseFee}
                      onChange={(e) => setCardForm({ ...cardForm, baseFee: Number(e.target.value) })}
                      required
                    />
                  </Field>
                  <Field label="Rate/kg (₹)">
                    <input
                      type="number"
                      className={inputClass}
                      value={cardForm.ratePerKg}
                      onChange={(e) => setCardForm({ ...cardForm, ratePerKg: Number(e.target.value) })}
                      required
                    />
                  </Field>
                </div>
                <Button type="submit" className="w-full">
                  + Add Tariff Card
                </Button>
              </form>
            </Card>

            <Card>
              <h2 className="text-xs font-bold uppercase tracking-wider text-on-surface mb-3 pb-2 border-b border-outline-variant/60">
                COD Surcharge Matrix
              </h2>
              <div className="space-y-3">
                {cod.map((c) => (
                  <div key={c.orderType} className="rounded-lg border border-outline-variant bg-surface-container-low p-3 space-y-2">
                    <span className="font-bold text-secondary text-xs uppercase block">
                      {c.orderType} Segment Surcharge
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <Field label="Flat Surcharge (₹)">
                        <input
                          className={inputClass}
                          value={c.surchargeFlat}
                          onChange={(e) =>
                            setCod(cod.map((x) => (x.orderType === c.orderType ? { ...x, surchargeFlat: e.target.value } : x)))
                          }
                        />
                      </Field>
                      <Field label="Percent (%)">
                        <input
                          className={inputClass}
                          value={c.surchargePercent}
                          onChange={(e) =>
                            setCod(cod.map((x) => (x.orderType === c.orderType ? { ...x, surchargePercent: e.target.value } : x)))
                          }
                        />
                      </Field>
                    </div>
                    <Button type="button" size="sm" onClick={() => void handleSaveCod(c)}>
                      Save {c.orderType} Config
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="lg:col-span-7">
            <Card>
              <h3 className="font-bold text-xs uppercase tracking-wider text-on-surface mb-3 pb-2 border-b border-outline-variant/60">
                Active Dynamic Rate Cards ({cards.length})
              </h3>
              <div className="space-y-2">
                {cards.map((c) => (
                  <div key={c.id} className="rounded-lg border border-outline-variant bg-surface-container-low p-3.5 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="rounded bg-surface-container-lowest border border-outline-variant px-2 py-0.5 text-xs font-bold text-on-surface">
                          {c.orderType}
                        </span>
                        <span className="rounded bg-secondary-container text-on-secondary-container px-2 py-0.5 text-xs font-bold">
                          {c.zoneType}
                        </span>
                      </div>
                      <span className="text-xs text-on-surface-variant">
                        Formula: Base ₹{Number(c.baseFee).toFixed(2)} + (Chargeable Wt × ₹{Number(c.ratePerKg).toFixed(2)}/kg)
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-mono font-bold text-base text-secondary">
                        ₹{Number(c.baseFee).toFixed(2)}
                      </span>
                      <span className="text-[10px] text-on-surface-variant block">+ ₹{Number(c.ratePerKg).toFixed(2)}/kg</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 4: Courier Fleet Roster */}
      {tab === "agents" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
          <div className="lg:col-span-5">
            <Card>
              <h2 className="text-xs font-bold uppercase tracking-wider text-on-surface mb-3 pb-2 border-b border-outline-variant/60">
                Onboard Delivery Agent
              </h2>
              <form onSubmit={handleCreateAgent} className="space-y-3">
                <Field label="Agent Full Name">
                  <input
                    className={inputClass}
                    placeholder="e.g. Vikram Singh"
                    value={agentForm.name}
                    onChange={(e) => setAgentForm({ ...agentForm, name: e.target.value })}
                    required
                  />
                </Field>
                <Field label="Email Address">
                  <input
                    className={inputClass}
                    type="email"
                    placeholder="e.g. vikram@lastmile.com"
                    value={agentForm.email}
                    onChange={(e) => setAgentForm({ ...agentForm, email: e.target.value })}
                    required
                  />
                </Field>
                <Field label="Operating Zone">
                  <select
                    className={inputClass}
                    value={agentForm.currentZoneId}
                    onChange={(e) => setAgentForm({ ...agentForm, currentZoneId: e.target.value })}
                    required
                  >
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name} ({z.code})
                      </option>
                    ))}
                  </select>
                </Field>
                <Button type="submit" className="w-full">
                  + Onboard Courier
                </Button>
              </form>
            </Card>
          </div>

          <div className="lg:col-span-7">
            <Card>
              <h3 className="font-bold text-xs uppercase tracking-wider text-on-surface mb-3 pb-2 border-b border-outline-variant/60">
                Courier Fleet Roster ({agents.length})
              </h3>
              <div className="space-y-2">
                {agents.map((a) => {
                  const agentZone = zones.find((z) => z.id === a.agentProfile?.currentZoneId);
                  const isAvailable = a.agentProfile?.isAvailable ?? false;

                  return (
                    <div key={a.id} className="rounded-lg border border-outline-variant bg-surface-container-low p-3 flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-on-surface">{a.name}</span>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${isAvailable ? "bg-success/20 text-success border border-success/30" : "bg-outline/20 text-outline"}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${isAvailable ? "bg-success" : "bg-outline"}`} />
                            {isAvailable ? "Online" : "Offline"}
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant font-mono">{a.email}</p>
                        <p className="text-[11px] text-on-surface-variant">
                          Zone: <strong className="text-secondary">{agentZone?.name ?? "Unassigned"}</strong>
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] text-on-surface-variant block">Status</span>
                        <span className="text-xs font-bold text-secondary">Ready for Dispatch</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      )}
    </Shell>
  );
}
