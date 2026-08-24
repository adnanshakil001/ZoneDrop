import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import { Button, Card, Field, inputClass, Shell, StatusBadge } from "../components/ui";

type History = {
  id: string;
  status: string;
  note: string | null;
  createdAt: string;
  changedBy: { name: string; role: string };
};

type Order = {
  id: string;
  status: string;
  pickupAddress: string;
  dropAddress: string;
  pickupPincode: string;
  dropPincode: string;
  lengthCm: number;
  breadthCm: number;
  heightCm: number;
  actualWeight: number;
  volumetricWeight: number;
  chargeableWeight: number;
  orderType: string;
  paymentType: string;
  calculatedCharge: string;
  quoteSnapshot: Record<string, unknown>;
  scheduledDate: string;
  assignedAgent?: { name: string; email: string } | null;
  statusHistory: History[];
};

const agentNextStates: Record<string, { next: string; label: string; icon: string }[]> = {
  ASSIGNED: [{ next: "PICKED_UP", label: "Mark Picked Up", icon: "inventory_2" }],
  PICKED_UP: [{ next: "IN_TRANSIT", label: "Send In Transit", icon: "local_shipping" }],
  IN_TRANSIT: [{ next: "OUT_FOR_DELIVERY", label: "Out for Delivery", icon: "moped" }],
  OUT_FOR_DELIVERY: [
    { next: "DELIVERED", label: "Complete Delivery", icon: "check_circle" },
    { next: "FAILED", label: "Mark as Failed", icon: "cancel" },
  ],
};

const allMilestones = [
  { status: "CREATED", label: "Order Created", icon: "description" },
  { status: "PICKED_UP", label: "Picked Up", icon: "inventory_2" },
  { status: "IN_TRANSIT", label: "In Transit", icon: "local_shipping" },
  { status: "OUT_FOR_DELIVERY", label: "Out for Delivery", icon: "moped" },
  { status: "DELIVERED", label: "Delivered", icon: "task_alt" },
];

export function OrderDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [reason, setReason] = useState("Customer not available at delivery address");
  const [newDate, setNewDate] = useState(new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 16));

  async function loadOrder() {
    if (!id) return;
    try {
      const data = await api<Order>(`/api/orders/${id}`);
      setOrder(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load shipment details");
    }
  }

  useEffect(() => {
    void loadOrder();
    const interval = setInterval(() => {
      void loadOrder();
    }, 5000);
    return () => clearInterval(interval);
  }, [id]);

  async function updateStatus(status: string, noteText?: string) {
    setActionLoading(true);
    try {
      await api(`/api/orders/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, note: noteText || reason }),
      });
      await loadOrder();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Status update failed");
    } finally {
      setActionLoading(false);
    }
  }

  async function submitReschedule() {
    setActionLoading(true);
    try {
      await api(`/api/orders/${id}/reschedule`, {
        method: "POST",
        body: JSON.stringify({ newDate: new Date(newDate).toISOString(), reason }),
      });
      await loadOrder();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reschedule failed");
    } finally {
      setActionLoading(false);
    }
  }

  if (!order) {
    return (
      <Shell title="Loading Shipment…">
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-3xl text-secondary animate-spin">progress_activity</span>
            <p className="text-xs text-on-surface-variant">{error || "Retrieving live tracking telemetry…"}</p>
          </div>
        </div>
      </Shell>
    );
  }

  const currentStep =
    order.status === "DELIVERED"
      ? 5
      : order.status === "OUT_FOR_DELIVERY"
        ? 4
        : order.status === "IN_TRANSIT"
          ? 3
          : order.status === "PICKED_UP"
            ? 2
            : ["ASSIGNED", "CREATED"].includes(order.status)
              ? 1
              : 0;

  return (
    <Shell
      title={`Shipment #${order.id.slice(0, 8)}`}
      subtitle={`Created on ${new Date(order.scheduledDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
      action={
        <Link to={user?.role === "AGENT" ? "/agent" : user?.role === "ADMIN" ? "/admin" : "/app"}>
          <Button variant="secondary" size="sm">
            ← Back to Dashboard
          </Button>
        </Link>
      }
    >
      {/* Top Tracking Summary Bar */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-outline-variant/60">
          <div className="flex items-center gap-3">
            <StatusBadge status={order.status} />
            <span className="text-xs text-on-surface-variant">
              Mode: <strong className="text-on-surface">{order.paymentType}</strong>
            </span>
            <span className="text-xs text-on-surface-variant">
              Type: <strong className="text-on-surface">{order.orderType}</strong>
            </span>
            {order.assignedAgent && (
              <span className="text-xs text-on-surface-variant">
                Courier: <strong className="text-secondary">{order.assignedAgent.name}</strong>
              </span>
            )}
          </div>

          <div className="text-right">
            <span className="text-xs text-on-surface-variant mr-2">Total Freight:</span>
            <span className="font-sans text-xl font-bold text-on-surface">
              ₹{Number(order.calculatedCharge).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Milestone Steps Bar */}
        <div className="grid grid-cols-5 gap-2 text-center">
          {allMilestones.map((m, idx) => {
            const isCompleted = currentStep > idx;
            const isCurrent = currentStep === idx + 1;
            const isFailed = order.status === "FAILED" && idx >= currentStep;

            return (
              <div key={m.status} className="flex flex-col items-center">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm transition-all mb-1.5 ${
                    isCurrent
                      ? "border-secondary bg-secondary-container text-on-secondary-container shadow-sm font-bold"
                      : isCompleted
                        ? "border-secondary/40 bg-secondary/10 text-secondary"
                        : isFailed
                          ? "border-error/40 bg-error-container text-error"
                          : "border-outline-variant bg-surface-container-low text-outline"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {isCompleted ? "check" : m.icon}
                  </span>
                </div>
                <span
                  className={`text-[11px] ${
                    isCurrent ? "font-bold text-secondary" : isCompleted ? "text-on-surface font-medium" : "text-outline"
                  }`}
                >
                  {m.label}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
        {/* Left Column: Route Specs & Controls (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Route Card */}
          <Card>
            <h3 className="font-bold text-xs uppercase tracking-wider text-on-surface-variant mb-3 pb-2 border-b border-outline-variant/60">
              Route & Package Specifications
            </h3>

            <div className="space-y-3">
              <div className="rounded-lg border border-outline-variant bg-surface-container-low p-3.5 space-y-3">
                <div className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-on-secondary text-[10px] font-bold mt-0.5">
                    A
                  </span>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">
                      Pickup Location
                    </span>
                    <p className="text-xs font-semibold text-on-surface">{order.pickupAddress}</p>
                    <span className="text-[11px] font-mono text-on-surface-variant">Pincode: {order.pickupPincode}</span>
                  </div>
                </div>

                <div className="border-t border-outline-variant/50 pt-3 flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-tertiary text-on-tertiary text-[10px] font-bold mt-0.5">
                    B
                  </span>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">
                      Destination Location
                    </span>
                    <p className="text-xs font-semibold text-on-surface">{order.dropAddress}</p>
                    <span className="text-[11px] font-mono text-on-surface-variant">Pincode: {order.dropPincode}</span>
                  </div>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-lg border border-outline-variant bg-surface-container-low p-2">
                  <span className="text-[10px] text-on-surface-variant block uppercase font-bold">Dimensions</span>
                  <span className="font-mono font-bold text-on-surface">
                    {order.lengthCm}×{order.breadthCm}×{order.heightCm} cm
                  </span>
                </div>
                <div className="rounded-lg border border-outline-variant bg-surface-container-low p-2">
                  <span className="text-[10px] text-on-surface-variant block uppercase font-bold">Actual Weight</span>
                  <span className="font-mono font-bold text-on-surface">{order.actualWeight} kg</span>
                </div>
                <div className="rounded-lg border border-secondary/30 bg-surface-container p-2">
                  <span className="text-[10px] text-secondary block uppercase font-bold">Billable Weight</span>
                  <span className="font-mono font-bold text-secondary">{order.chargeableWeight} kg</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Delivery Agent Control Bar */}
          {user?.role === "AGENT" && (
            <Card className="border-secondary/30 bg-surface-container-low">
              <h3 className="font-bold text-xs uppercase tracking-wider text-secondary mb-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">local_shipping</span>
                Courier Action Station
              </h3>
              <p className="text-xs text-on-surface-variant mb-4">Advance the order status along the delivery route:</p>

              {agentNextStates[order.status] ? (
                <div className="flex flex-wrap gap-2.5">
                  {agentNextStates[order.status].map((action) => (
                    <Button
                      key={action.next}
                      type="button"
                      variant={action.next === "FAILED" ? "danger" : "primary"}
                      onClick={() => void updateStatus(action.next)}
                      disabled={actionLoading}
                    >
                      <span className="material-symbols-outlined text-sm">{action.icon}</span>
                      <span>{action.label}</span>
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-outline">No further courier transitions available for this status.</p>
              )}
            </Card>
          )}

          {/* Admin Override Controls */}
          {user?.role === "ADMIN" && (
            <Card className="border-outline-variant bg-surface-container-low">
              <h3 className="font-bold text-xs uppercase tracking-wider text-on-surface mb-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                Admin Status Override
              </h3>
              <div className="space-y-3">
                <Field label="Override Reason / Audit Note">
                  <input
                    className={inputClass}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Document administrative override reason"
                  />
                </Field>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "ASSIGNED",
                    "PICKED_UP",
                    "IN_TRANSIT",
                    "OUT_FOR_DELIVERY",
                    "DELIVERED",
                    "FAILED",
                    "UNASSIGNED",
                  ].map((s) => (
                    <button
                      key={s}
                      onClick={() => void updateStatus(s, reason)}
                      disabled={actionLoading}
                      className="rounded border border-outline-variant bg-surface-container-lowest px-2 py-1 text-[11px] font-semibold text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                    >
                      Force {s}
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Customer Self-Service Reschedule Form (visible exclusively on FAILED) */}
          {user?.role === "CUSTOMER" && order.status === "FAILED" && (
            <Card className="border-error/40 bg-error-container/20">
              <div className="flex items-center gap-2 text-error font-bold text-xs mb-1.5">
                <span className="material-symbols-outlined text-base">warning</span>
                Delivery Attempt Failed — Reschedule Available
              </div>
              <p className="text-xs text-on-surface-variant mb-3">
                The courier could not complete this delivery. Select a new delivery date and instructions to re-dispatch automatically:
              </p>

              <div className="space-y-3">
                <Field label="New Delivery Date & Time">
                  <input
                    type="datetime-local"
                    className={inputClass}
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    required
                  />
                </Field>

                <Field label="Special Delivery Instructions / Reason">
                  <input
                    className={inputClass}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. Leave with building security guard"
                  />
                </Field>

                <Button
                  type="button"
                  onClick={() => void submitReschedule()}
                  disabled={actionLoading}
                  className="w-full"
                >
                  {actionLoading ? "Scheduling Re-Dispatch…" : "Confirm Reschedule & Re-Dispatch"}
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Immutable Audit Timeline Stepper (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          <Card>
            <div className="flex items-center justify-between border-b border-outline-variant/60 pb-3 mb-4">
              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-on-surface">Tracking Status</h3>
                <p className="text-[11px] text-on-surface-variant">Immutable audit trail</p>
              </div>
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                Live Feed
              </span>
            </div>

            <div className="relative border-l-2 border-[#0058be] ml-3 mt-2 space-y-5">
              {order.statusHistory.map((item, index) => {
                const isLatest = index === order.statusHistory.length - 1;
                return (
                  <div key={item.id} className="relative pl-5">
                    {/* Node Dot */}
                    <div
                      className={`absolute -left-[9px] top-0.5 w-4 h-4 rounded-full border-2 border-surface flex items-center justify-center ${
                        isLatest ? "bg-secondary" : "bg-outline"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[10px] text-on-secondary font-bold">
                        check
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={item.status} />
                        <span className="text-[10px] text-on-surface-variant font-mono">
                          {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>

                      <p className="text-xs text-on-surface font-semibold mt-1">
                        Updated by {item.changedBy.name}{" "}
                        <span className="text-on-surface-variant font-normal">({item.changedBy.role})</span>
                      </p>

                      {item.note && (
                        <p className="mt-1 rounded bg-surface-container-low border border-outline-variant/60 p-2 text-xs text-on-surface-variant">
                          {item.note}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </Shell>
  );
}
