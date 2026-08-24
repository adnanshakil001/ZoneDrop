import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import { Button, Card, Shell, StatCard, StatusBadge } from "../components/ui";

type Order = {
  id: string;
  status: string;
  pickupAddress: string;
  dropAddress: string;
  pickupPincode: string;
  dropPincode: string;
  orderType: string;
  paymentType: string;
  calculatedCharge: string;
  scheduledDate: string;
};

export function AgentPage() {
  const { user, refresh } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [toggling, setToggling] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function loadJobs() {
    try {
      const data = await api<Order[]>("/api/orders");
      setOrders(data);
    } catch {
      // Retain existing
    }
  }

  useEffect(() => {
    void loadJobs();
    const interval = setInterval(() => {
      void loadJobs();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  async function toggleAvailability() {
    setToggling(true);
    try {
      await api("/api/auth/me/availability", {
        method: "PATCH",
        body: JSON.stringify({ isAvailable: !user?.agentProfile?.isAvailable }),
      });
      await refresh();
    } finally {
      setToggling(false);
    }
  }

  async function quickTransition(orderId: string, nextStatus: string) {
    setActionLoading(orderId);
    try {
      await api(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus, note: `Courier transitioned to ${nextStatus}` }),
      });
      await loadJobs();
    } finally {
      setActionLoading(null);
    }
  }

  const isAvailable = user?.agentProfile?.isAvailable ?? true;
  const currentZone = user?.agentProfile?.currentZone?.name ?? "North Hub (Zone Alpha)";
  const maxCapacity = user?.agentProfile?.maxActiveOrders ?? 5;
  const activeOrders = orders.filter((o) =>
    ["ASSIGNED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(o.status)
  );

  return (
    <Shell
      title="Agent Run-Sheet"
      subtitle="Manage your active delivery queue, transition statuses, and toggle operating availability"
    >
      {/* Duty Status & Zone Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-gutter mb-8">
        <Card className="flex items-center justify-between p-stack-md">
          <div>
            <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant block">
              Duty Status
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className={`h-2.5 w-2.5 rounded-full ${isAvailable ? "bg-success animate-pulse" : "bg-outline"}`} />
              <span className="font-label-md text-label-md font-bold text-on-surface">
                {isAvailable ? "Online (Available)" : "Offline (Paused)"}
              </span>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            variant={isAvailable ? "secondary" : "primary"}
            onClick={() => void toggleAvailability()}
            disabled={toggling}
          >
            {isAvailable ? "Go Offline" : "Go Online"}
          </Button>
        </Card>

        <StatCard
          title="Assigned Zone"
          value={currentZone}
          icon="location_on"
          subtitle="Matching pickup orders auto-routed"
        />

        <StatCard
          title="Active Capacity"
          value={`${activeOrders.length} / ${maxCapacity}`}
          icon="inventory_2"
          subtitle="Orders currently in your run-sheet"
          trend={activeOrders.length >= maxCapacity ? "Full Capacity" : "Available"}
          trendType={activeOrders.length >= maxCapacity ? "down" : "up"}
        />
      </div>

      {/* Orders Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-headline-sm text-headline-sm font-bold uppercase tracking-wider text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">local_shipping</span>
            Assigned Delivery Run-Sheet ({orders.length})
          </h2>
          <span className="font-body-sm text-body-sm text-on-surface-variant">Syncs every 5s</span>
        </div>

        <div className="space-y-3">
          {orders.map((o) => {
            const nextAction =
              o.status === "ASSIGNED"
                ? { next: "PICKED_UP", label: "Mark Picked Up", icon: "inventory_2" }
                : o.status === "PICKED_UP"
                  ? { next: "IN_TRANSIT", label: "Send In Transit", icon: "local_shipping" }
                  : o.status === "IN_TRANSIT"
                    ? { next: "OUT_FOR_DELIVERY", label: "Out for Delivery", icon: "moped" }
                    : o.status === "OUT_FOR_DELIVERY"
                      ? { next: "DELIVERED", label: "Complete Delivery", icon: "check_circle" }
                      : null;

            return (
              <Card key={o.id} className="hover:border-secondary transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono-data text-mono-data text-secondary">#{o.id.slice(0, 8)}</span>
                      <span className="rounded bg-surface-container-low border border-outline-variant px-2 py-0.5 font-label-md text-label-md text-on-surface-variant">
                        {o.orderType}
                      </span>
                      <span className="rounded bg-surface-container-low border border-outline-variant px-2 py-0.5 font-label-md text-label-md text-on-surface-variant">
                        {o.paymentType}
                      </span>
                      <span className="font-label-md text-label-md text-on-surface-variant font-mono">
                        Scheduled: {new Date(o.scheduledDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 font-body-sm text-body-sm font-medium text-on-surface">
                      <div className="flex items-center gap-1.5">
                        <span className="flex h-2 w-2 rounded-full bg-secondary" />
                        <span className="truncate max-w-xs">{o.pickupAddress}</span>
                        <span className="font-mono text-[11px] text-on-surface-variant">({o.pickupPincode})</span>
                      </div>
                      <span className="hidden sm:inline text-outline">→</span>
                      <div className="flex items-center gap-1.5">
                        <span className="flex h-2 w-2 rounded-full bg-tertiary" />
                        <span className="truncate max-w-xs">{o.dropAddress}</span>
                        <span className="font-mono text-[11px] text-on-surface-variant">({o.dropPincode})</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-outline-variant/40 justify-between sm:justify-end">
                    <StatusBadge status={o.status} />

                    {nextAction && (
                      <Button
                        size="sm"
                        onClick={() => void quickTransition(o.id, nextAction.next)}
                        disabled={actionLoading === o.id}
                      >
                        <span className="material-symbols-outlined text-[16px]">{nextAction.icon}</span>
                        <span>{nextAction.label}</span>
                      </Button>
                    )}

                    <Link to={`/orders/${o.id}`}>
                      <Button variant="secondary" size="sm">
                        View Details →
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}

          {orders.length === 0 && (
            <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-low py-16 text-center">
              <span className="material-symbols-outlined text-4xl text-outline mb-2">moped</span>
              <h3 className="text-sm font-bold text-on-surface">No Deliveries in Queue</h3>
              <p className="mt-1 text-xs text-on-surface-variant max-w-xs mx-auto">
                Your delivery queue is clear. New orders placed in your assigned zone will automatically route to your run-sheet.
              </p>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
