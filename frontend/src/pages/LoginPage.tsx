import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { homePath, useAuth } from "../auth";

export function LoginPage() {
  const { user, loading: authLoading, login, signInWithGoogle, logout } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Auto-redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      nav(homePath(user.role), { replace: true });
    }
  }, [user, authLoading, nav]);

  async function handleLogin(eMail: string, pWord: string) {
    setError("");
    setLoading(true);
    try {
      const loggedInUser = await login(eMail, pWord);
      nav(homePath(loggedInUser.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await handleLogin(email, password);
  }

  async function handleGoogleLogin() {
    setError("");
    setLoading(true);
    try {
      await signInWithGoogle();
      if (user) {
        nav(homePath(user.role));
      } else {
        nav("/app");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Google sign-in failed";
      setError(msg);
      setLoading(false);
    }
  }

  async function handleLogout() {
    setError("");
    setLoading(true);
    try {
      await logout();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to log out");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex w-full min-h-screen bg-surface text-on-surface font-body-md">
      {/* Left Side: Hero Area */}
      <section className="hidden lg:flex lg:w-1/2 relative bg-[#0b1120] overflow-hidden">
        {/* Logistics Themed Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center mix-blend-luminosity opacity-40"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')",
          }}
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b1120] via-transparent to-transparent opacity-80" />

        <div className="relative z-10 p-12 flex flex-col justify-between w-full h-full">
          {/* Brand Anchor Top */}
          <Link to="/" className="flex items-center gap-3 w-fit hover:opacity-90 transition-opacity">
            <div className="bg-white/10 p-2 rounded-lg flex items-center justify-center backdrop-blur-md">
              <span className="material-symbols-outlined text-[24px] text-white">local_shipping</span>
            </div>
            <h1 className="font-display-md text-2xl font-bold text-white tracking-tight">ZoneDrop</h1>
          </Link>

          {/* Value Prop / Quote */}
          <div className="max-w-lg mb-8">
            <h2 className="text-[64px] leading-[1.1] font-extrabold text-white tracking-tight mb-6">
              Precision.<br />Delivered.
            </h2>
            <p className="text-lg text-white/80 leading-relaxed mb-8 font-medium">
              Logistics intelligence engineered for high-performance delivery ecosystems.
            </p>
            
            <div className="flex items-center gap-6 text-sm font-bold tracking-widest text-white/40 uppercase">
              <span>REAL-TIME TRACKING</span>
              <span>OPTIMIZATION ANALYTICS</span>
            </div>
          </div>
        </div>
      </section>

      {/* Right Side: Login Form Area */}
      <section className="w-full lg:w-1/2 flex items-center justify-center p-container-padding bg-surface">
        <div className="w-full max-w-md bg-surface-container-lowest rounded-xl shadow-[0_12px_48px_rgba(11,18,33,0.08)] p-10 relative overflow-hidden">
          <div className="relative z-10">
            {/* Mobile Logo (hidden on desktop) */}
            <div className="flex lg:hidden items-center justify-center gap-2 mb-stack-lg">
              <span className="material-symbols-outlined text-[32px] text-secondary">local_shipping</span>
              <span className="font-headline-md text-headline-md font-black text-secondary tracking-tight">ZoneDrop</span>
            </div>

            {/* Header */}
            <div className="text-center mb-10">
              <h2 className="font-headline-md text-headline-md font-bold text-on-surface mb-2">Welcome Back</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant px-4">
                Enter your credentials to access the logistics dashboard.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={onSubmit} className="space-y-stack-md">
              {/* Email Input */}
              <div className="space-y-stack-sm">
                <label className="block font-label-md text-label-md text-on-surface-variant" htmlFor="email">Email</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">mail</span>
                  <input
                    className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all"
                    id="email"
                    type="email"
                    placeholder="admin@zonedrop.logistics"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-stack-sm">
                <div className="flex justify-between items-center">
                  <label className="block font-label-md text-label-md text-on-surface-variant" htmlFor="password">Password</label>
                  <span className="font-label-md text-label-md text-secondary hover:text-secondary-container transition-colors cursor-pointer">
                    Forgot password?
                  </span>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">lock</span>
                  <input
                    className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all"
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Error with Action Buttons */}
              {error && (
                <div className="rounded-lg border border-error-container bg-error-container/40 p-3 font-body-sm text-body-sm text-error font-medium flex flex-col gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px]">error</span>
                    <span>{error}</span>
                  </div>
                  {(error.toLowerCase().includes("signed in") || error.toLowerCase().includes("already")) && (
                    <div className="flex items-center gap-3 pt-2 border-t border-error/20 mt-1">
                      <Link
                        to="/app"
                        className="text-xs font-bold text-secondary hover:underline flex items-center gap-1"
                      >
                        <span>Go to Dashboard</span>
                        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                      </Link>
                      <span className="text-outline-variant">•</span>
                      <button
                        type="button"
                        onClick={() => void handleLogout()}
                        className="text-xs font-bold text-error hover:underline cursor-pointer"
                      >
                        Sign Out & Try Again
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Login Button */}
              <button
                className="w-full py-3 px-4 bg-secondary text-on-secondary font-label-md text-label-md rounded-lg shadow-sm hover:bg-secondary-container focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 focus:ring-offset-surface-container-lowest transition-all active:scale-[0.98] cursor-pointer"
                type="submit"
                disabled={loading}
              >
                {loading ? "Authenticating…" : "Login"}
              </button>
            </form>

            {/* Divider */}
            <div className="mt-stack-lg mb-stack-md flex items-center justify-center">
              <div className="border-t border-outline-variant flex-grow" />
              <span className="px-4 font-body-sm text-body-sm text-on-surface-variant">or</span>
              <div className="border-t border-outline-variant flex-grow" />
            </div>

            {/* Social Login */}
            <button
              type="button"
              onClick={() => void handleGoogleLogin()}
              disabled={loading}
              className="w-full py-3 px-4 bg-surface-container-lowest border border-outline-variant text-on-surface font-label-md text-label-md rounded-lg shadow-sm hover:bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-outline-variant transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>

            {/* Register Link */}
            <p className="mt-stack-lg text-center font-body-sm text-body-sm text-on-surface-variant">
              Don&apos;t have an account?{" "}
              <Link className="font-label-md text-label-md text-secondary hover:text-secondary-container transition-colors" to="/register">
                Register
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
