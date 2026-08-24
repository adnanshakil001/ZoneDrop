import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth";

/* ─────────── Logo ─────────── */
export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const iconSize = size === "sm" ? "text-2xl" : size === "lg" ? "text-4xl" : "text-3xl";
  const titleSize = size === "sm" ? "text-lg" : size === "lg" ? "text-headline-lg" : "text-headline-sm";

  return (
    <div className="flex items-center gap-2">
      <span className={`material-symbols-outlined text-secondary filled ${iconSize}`}>local_shipping</span>
      <span className={`font-headline-sm font-bold text-secondary tracking-tight ${titleSize}`}>ZoneDrop</span>
    </div>
  );
}

/* ─────────── Shell (Dashboard Layout) ─────────── */
export function Shell({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const role = user?.role || "CUSTOMER";

  // Nav links matching the design system's NavigationDrawer
  const navLinks = [
    ...(role === "CUSTOMER"
      ? [
          { to: "/app", label: "Overview", icon: "dashboard" },
          { to: "/app/new", label: "Deliveries", icon: "package_2" },
        ]
      : []),
    ...(role === "AGENT"
      ? [
          { to: "/agent", label: "Overview", icon: "dashboard" },
        ]
      : []),
    ...(role === "ADMIN"
      ? [
          { to: "/admin", label: "Overview", icon: "dashboard" },
        ]
      : []),
  ];

  // Static decorative nav items matching designs
  const staticLinks = [
    { label: "Agents", icon: "person_pin_circle" },
    { label: "Analytics", icon: "monitoring" },
  ];

  return (
    <div className="min-h-screen bg-background text-on-surface flex font-body-md">
      {/* NavigationDrawer (Desktop) – matches customer_dashboard_desktop/code.html */}
      <nav className="bg-surface-container-low hidden md:flex flex-col border-r border-outline-variant h-screen w-64 fixed left-0 top-0 z-40">
        {/* Brand Header */}
        <div className="p-container-padding flex items-center gap-3">
          <span className="material-symbols-outlined text-secondary filled text-3xl">local_shipping</span>
          <span className="font-headline-sm text-headline-sm font-bold text-secondary">ZoneDrop</span>
        </div>

        {/* Profile Card */}
        <div className="px-container-padding py-stack-md flex items-center gap-3 mb-stack-md">
          <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-headline-sm overflow-hidden shrink-0">
            <span className="text-sm font-bold">{user?.name ? user.name.slice(0, 2).toUpperCase() : "ZD"}</span>
          </div>
          <div className="flex flex-col">
            <span className="font-label-md text-label-md text-secondary font-bold">{user?.name || "Operations Manager"}</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">{user?.role || "Zone Alpha-7"}</span>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-col gap-1 flex-1 overflow-y-auto px-2">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg mx-2 transition-colors duration-200 ease-in-out font-label-md text-label-md ${
                  isActive
                    ? "bg-secondary-container text-on-secondary-container"
                    : "text-on-surface-variant hover:bg-surface-variant"
                }`}
              >
                <span className="material-symbols-outlined">{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            );
          })}

          {/* Decorative static links from the design */}
          {role === "CUSTOMER" && staticLinks.map((link) => (
            <button
              key={link.label}
              className="flex items-center gap-3 px-4 py-3 rounded-lg mx-2 transition-colors duration-200 ease-in-out font-label-md text-label-md text-on-surface-variant hover:bg-surface-variant text-left"
            >
              <span className="material-symbols-outlined">{link.icon}</span>
              <span>{link.label}</span>
            </button>
          ))}

          {/* Settings at bottom */}
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg mx-2 transition-colors duration-200 ease-in-out font-label-md text-label-md text-on-surface-variant hover:bg-surface-variant mt-auto mb-stack-md text-left"
          >
            <span className="material-symbols-outlined">settings</span>
            <span>Sign Out</span>
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 ml-0 md:ml-64 overflow-y-auto bg-background min-h-screen">
        {/* TopAppBar – matches customer_dashboard_desktop/code.html */}
        <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur-sm border-b border-outline-variant/30 h-16 px-container-padding flex items-center justify-between">
          <h1 className="font-headline-md text-headline-md font-bold text-on-surface">{title}</h1>
          <div className="flex items-center gap-4">
            {action && <div>{action}</div>}
          </div>
        </header>

        {/* Content Body */}
        <div className="p-container-padding flex flex-col gap-container-padding">
          {children}
        </div>
      </main>
    </div>
  );
}

/* ─────────── Card ─────────── */
export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-md shadow-card ${className}`}
    >
      {children}
    </div>
  );
}

/* ─────────── StatCard – matches customer_dashboard_desktop/code.html ─────────── */
export function StatCard({
  title,
  value,
  icon,
  trend,
  trendType = "up",
  iconColor,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  trend?: string;
  trendType?: "up" | "down" | "neutral";
  iconColor?: string;
}) {
  const resolvedIconColor = iconColor || (
    trendType === "up" ? "text-secondary" :
    trendType === "down" ? "text-error" :
    "text-[#f59e0b]"
  );

  return (
    <div className="bg-surface p-stack-md rounded-xl border border-outline-variant shadow-sm hover:shadow-lg hover:shadow-[0_4px_20px_rgba(11,18,33,0.05)] transition-all">
      <div className="flex items-center justify-between mb-2">
        <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">{title}</span>
        {icon && <span className={`material-symbols-outlined ${resolvedIconColor}`}>{icon}</span>}
      </div>
      <div className="flex items-end gap-2">
        <span className="font-display-lg text-display-lg text-on-surface">{value}</span>
        {trend && (
          <span
            className={`font-label-md text-label-md mb-2 flex items-center ${
              trendType === "up" ? "text-[#10b981]" : trendType === "down" ? "text-error" : "text-on-surface-variant"
            }`}
          >
            {trendType === "up" && <span className="material-symbols-outlined text-sm">arrow_upward</span>}
            {trendType === "down" && <span className="material-symbols-outlined text-sm">arrow_upward</span>}
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}

/* ─────────── Field ─────────── */
export function Field({
  label,
  children,
  error,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div className="space-y-stack-sm">
      <label className="block font-label-md text-label-md text-on-surface-variant">{label}</label>
      {children}
      {error && <span className="mt-1 block text-xs font-medium text-error">{error}</span>}
    </div>
  );
}

/* ─────────── Input Class – matches login_desktop/code.html ─────────── */
export const inputClass =
  "w-full pl-10 pr-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all";

/* ─────────── Button – matches design system buttons ─────────── */
export function Button({
  children,
  variant = "primary",
  size = "md",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "px-3 py-1.5 text-label-md",
    md: "px-4 py-2 text-label-md",
    lg: "px-6 py-3 text-label-md",
  };

  const variantClasses = {
    primary:
      "bg-secondary text-on-secondary hover:bg-secondary-container hover:text-on-secondary-container shadow-sm active:scale-[0.98] transition-all",
    secondary:
      "border border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container-low active:scale-[0.98] transition-all",
    danger: "bg-error text-on-error hover:bg-[#93000a] active:scale-[0.98] transition-all",
    ghost: "text-on-surface-variant hover:bg-surface-variant transition-all",
  };

  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-lg cursor-pointer disabled:opacity-40 disabled:pointer-events-none font-label-md ${sizeClasses[size]} ${variantClasses[variant]} ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}

/* ─────────── StatusBadge – matches admin_dashboard/code.html badge styles ─────────── */
export function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { bg: string; text: string; border: string }> = {
    CREATED: { bg: "bg-surface-container", text: "text-on-surface", border: "border-outline-variant" },
    UNASSIGNED: { bg: "bg-[#f59e0b]/10", text: "text-[#D97706]", border: "border-[#f59e0b]/20" },
    ASSIGNED: { bg: "bg-secondary/10", text: "text-secondary", border: "border-secondary/20" },
    PICKED_UP: { bg: "bg-tertiary-fixed", text: "text-on-tertiary-fixed", border: "border-tertiary/30" },
    IN_TRANSIT: { bg: "bg-[#F59E0B]/10", text: "text-[#D97706]", border: "border-[#F59E0B]/20" },
    OUT_FOR_DELIVERY: { bg: "bg-secondary-container/10", text: "text-secondary", border: "border-secondary/20" },
    DELIVERED: { bg: "bg-[#10B981]/10", text: "text-[#059669]", border: "border-[#10B981]/20" },
    FAILED: { bg: "bg-error/10", text: "text-error", border: "border-error/20" },
    RESCHEDULED: { bg: "bg-[#f59e0b]/10", text: "text-[#D97706]", border: "border-[#f59e0b]/20" },
  };

  const c = configs[status] ?? { bg: "bg-surface-container", text: "text-on-surface", border: "border-outline-variant" };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${c.bg} ${c.text} ${c.border}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}
