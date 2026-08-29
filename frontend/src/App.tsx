import { Navigate, Route, Routes } from "react-router-dom";
import { AuthenticateWithRedirectCallback } from "@clerk/clerk-react";
import { homePath, useAuth } from "./auth";
import { AdminPage } from "./pages/AdminPage";
import { AgentPage } from "./pages/AgentPage";
import { CustomerHome } from "./pages/CustomerHome";
import { LoginPage } from "./pages/LoginPage";
import { NewOrderPage } from "./pages/NewOrderPage";
import { OrderDetailPage } from "./pages/OrderDetailPage";
import { RegisterPage } from "./pages/RegisterPage";
import { LandingPage } from "./pages/LandingPage";

function Guard({ roles, children }: { roles: Array<"CUSTOMER" | "AGENT" | "ADMIN">; children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-10 text-slate-400">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to={homePath(user.role)} replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/sso-callback" element={<AuthenticateWithRedirectCallback signInForceRedirectUrl="/app" signUpForceRedirectUrl="/app" />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/app"
        element={
          <Guard roles={["CUSTOMER"]}>
            <CustomerHome />
          </Guard>
        }
      />
      <Route
        path="/app/new"
        element={
          <Guard roles={["CUSTOMER"]}>
            <NewOrderPage />
          </Guard>
        }
      />
      <Route
        path="/orders/new"
        element={
          <Guard roles={["CUSTOMER"]}>
            <NewOrderPage />
          </Guard>
        }
      />
      <Route
        path="/orders/:id"
        element={
          <Guard roles={["CUSTOMER", "AGENT", "ADMIN"]}>
            <OrderDetailPage />
          </Guard>
        }
      />
      <Route
        path="/agent"
        element={
          <Guard roles={["AGENT"]}>
            <AgentPage />
          </Guard>
        }
      />
      <Route
        path="/admin"
        element={
          <Guard roles={["ADMIN"]}>
            <AdminPage />
          </Guard>
        }
      />
      <Route path="/" element={<LandingPage />} />
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-10 text-slate-400">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={homePath(user.role)} replace />;
}
