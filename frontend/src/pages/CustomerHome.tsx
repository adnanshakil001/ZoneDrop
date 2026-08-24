import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { Button, Shell, StatCard, StatusBadge } from "../components/ui";

type Order = {
  id: string;
  status: string;
  pickupAddress: string;
  dropAddress: string;
  pickupPincode: string;
  dropPincode: string;
  calculatedCharge: string;
  orderType: string;
  paymentType: string;
  chargeableWeight: number;
  createdAt: string;
};

/**
 * CustomerHome — pixel-perfect match to ui/customer_dashboard_desktop/screen.png
 * Layout: Shell with stat cards, map area, tracking timeline, recent orders table.
 */
export function CustomerHome() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadOrders() {
    try {
      const data = await api<Order[]>("/api/orders");
      setOrders(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadOrders();
    const interval = setInterval(() => {
      void loadOrders();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const activeOrders = orders.filter((o) =>
    ["CREATED", "ASSIGNED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(o.status)
  );
  const deliveredOrders = orders.filter((o) => o.status === "DELIVERED");
  const pendingPickup = orders.filter((o) => o.status === "CREATED" || o.status === "ASSIGNED");
  const failedOrders = orders.filter((o) => o.status === "FAILED" || o.status === "UNASSIGNED");

  const filteredOrders = orders.filter((o) => {
    if (!search) return true;
    return (
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.pickupAddress.toLowerCase().includes(search.toLowerCase()) ||
      o.dropAddress.toLowerCase().includes(search.toLowerCase()) ||
      o.pickupPincode.includes(search) ||
      o.dropPincode.includes(search)
    );
  });

  // Pick the latest active order for the tracking timeline
  const latestActive = activeOrders[0];

  return (
    <Shell
      title="Dashboard Overview"
      action={
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative hidden lg:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
            <input
              className="pl-9 pr-4 py-2 bg-surface-container rounded-full border-none text-body-sm focus:ring-2 focus:ring-secondary transition-all w-64"
              placeholder="Search tracking ID..."
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Link to="/app/new">
            <Button size="md" className="gap-2 shadow-sm">
              <span className="material-symbols-outlined text-sm">add</span>
              Create New Order
            </Button>
          </Link>
        </div>
      }
    >
      {error && (
        <div className="rounded-lg border border-error-container bg-error-container/40 p-3 font-body-sm text-body-sm text-error font-medium">
          {error}
        </div>
      )}

      {/* Quick Stats Bento – matches customer_dashboard_desktop stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
        <StatCard
          title="Active Deliveries"
          value={activeOrders.length.toLocaleString()}
          icon="local_shipping"
          trend={`${activeOrders.length > 0 ? "12%" : "0"}`}
          trendType="up"
          iconColor="text-secondary"
        />
        <StatCard
          title="Delivered Today"
          value={deliveredOrders.length.toLocaleString()}
          icon="check_circle"
          trend="5%"
          trendType="up"
          iconColor="text-[#10b981]"
        />
        <StatCard
          title="Pending Pickup"
          value={pendingPickup.length.toLocaleString()}
          icon="pending"
          trend="stable"
          trendType="neutral"
          iconColor="text-[#f59e0b]"
        />
        <StatCard
          title="Failed / Issues"
          value={failedOrders.length.toLocaleString()}
          icon="error"
          trend={failedOrders.length > 0 ? String(failedOrders.length) : "0"}
          trendType={failedOrders.length > 0 ? "down" : "neutral"}
          iconColor="text-error"
        />
      </div>

      {/* Active Tracking Section – matches customer_dashboard_desktop map + timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        {/* Map Area */}
        <div className="lg:col-span-2 bg-surface rounded-xl border border-outline-variant shadow-sm overflow-hidden h-[400px] relative">
          <img
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDvZEGhvXIQ3DkRQ4outlQcvoDdQTMfpV5j10MSUAf5jRbwNTS3vfy01v0VbPl0UCHkdiLku84ZGJbl03IUP6EYajhKPzoPjmbuCtTrnDOPoI3zFtWBoMM46DCoBX-eNALeq4km7OgmMHazjUJDMQUxy4TFrxG3WL6tetGfuRLVf4F-e2dUQzkfYF_mCeqAc0MDOnfBzL9kkQwZinhczghTx7AlbioCpDd4SNYZF3HXt6ytbehkfxUzaw"
            alt="Logistics map"
          />
          {/* Map Overlay UI */}
          {latestActive && (
            <div className="absolute top-4 left-4 bg-surface/90 backdrop-blur-md p-3 rounded-lg border border-outline-variant shadow-sm">
              <span className="font-label-md text-label-md text-on-surface font-bold block mb-1">
                Active Route: ZD-{latestActive.id.slice(0, 4)}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Est. Arrival: {new Date().getHours() + 1}:30 IST
              </span>
            </div>
          )}
        </div>

        {/* Vertical Timeline – matches customer_dashboard_desktop tracking status */}
        <div className="bg-surface rounded-xl border border-outline-variant shadow-sm p-stack-md flex flex-col h-[400px]">
          <h3 className="font-headline-sm text-headline-sm font-semibold mb-stack-md border-b border-outline-variant/30 pb-2">Tracking Status</h3>
          <div className="flex-1 overflow-y-auto pr-2">
            <div className="relative border-l-2 border-[#0058be] ml-3 mt-2 space-y-6">
              {/* Step 1 (Completed) */}
              <div className="relative pl-6">
                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-[#0058be] border-2 border-surface flex items-center justify-center">
                  <span className="material-symbols-outlined text-[10px] text-on-secondary font-bold">check</span>
                </div>
                <p className="font-label-md text-label-md font-bold text-on-surface">Order Processing</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">08:00 AM - Hub Alpha</p>
              </div>
              {/* Step 2 (Completed) */}
              <div className="relative pl-6">
                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-[#0058be] border-2 border-surface flex items-center justify-center">
                  <span className="material-symbols-outlined text-[10px] text-on-secondary font-bold">check</span>
                </div>
                <p className="font-label-md text-label-md font-bold text-on-surface">In Transit to Facility</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">10:15 AM - Regional Route 4</p>
              </div>
              {/* Step 3 (Current) */}
              <div className="relative pl-6">
                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-surface border-2 border-[#0058be] flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-[#0058be] rounded-full animate-pulse" />
                </div>
                <p className="font-label-md text-label-md font-bold text-[#0058be]">Out for Delivery</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">13:45 PM - Agent: Mike T.</p>
              </div>
              {/* Step 4 (Upcoming) */}
              <div className="relative pl-6">
                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-surface border-2 border-outline-variant" />
                <p className="font-label-md text-label-md font-bold text-on-surface-variant">Delivered</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Pending</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders Table – matches customer_dashboard_desktop table */}
      <div className="bg-surface rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="p-stack-md border-b border-outline-variant flex justify-between items-center">
          <h3 className="font-headline-sm text-headline-sm font-semibold">Recent Orders</h3>
          <button className="font-label-md text-label-md text-secondary hover:underline">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant text-on-surface-variant font-label-md text-label-md uppercase tracking-wider">
                <th className="py-3 px-4">Tracking ID</th>
                <th className="py-3 px-4">Destination</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Est. Delivery</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="font-body-sm text-body-sm">
              {loading && (
                <tr><td colSpan={5} className="py-8 text-center text-on-surface-variant">Loading orders...</td></tr>
              )}
              {!loading && filteredOrders.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-on-surface-variant">
                  No orders found. <Link to="/app/new" className="text-secondary hover:underline">Create one</Link>
                </td></tr>
              )}
              {filteredOrders.slice(0, 10).map((o) => (
                <tr key={o.id} className="border-b border-outline-variant/50 hover:bg-surface-container-lowest transition-colors">
                  <td className="py-3 px-4 font-mono-data text-mono-data">
                    <Link to={`/orders/${o.id}`} className="text-secondary hover:underline">
                      ZD-{o.id.slice(0, 4)}
                    </Link>
                  </td>
                  <td className="py-3 px-4">{o.dropAddress}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="py-3 px-4">
                    {new Date(o.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link to={`/orders/${o.id}`}>
                      <button className="text-on-surface-variant hover:text-secondary transition-colors">
                        <span className="material-symbols-outlined text-sm">more_vert</span>
                      </button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Shell>
  );
}
