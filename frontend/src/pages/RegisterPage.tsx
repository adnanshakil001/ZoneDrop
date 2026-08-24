import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { Button, Field, Logo, inputClass } from "../components/ui";

export function RegisterPage() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form);
      nav("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex w-full min-h-screen font-sans bg-surface text-on-surface">
      {/* Left Side: Hero Area */}
      <section className="hidden lg:flex lg:w-1/2 relative bg-primary-container overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-tr from-primary-container via-primary-container/90 to-transparent" />

        <div className="relative z-10 p-container-padding flex flex-col justify-between w-full h-full text-on-primary-container">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[32px] text-secondary-fixed">local_shipping</span>
            <span className="text-2xl font-black tracking-tight text-white">ZoneDrop</span>
          </div>

          <div className="max-w-lg mb-12">
            <span className="inline-block px-2.5 py-1 rounded-full bg-secondary/20 border border-secondary/30 text-secondary-fixed text-xs font-semibold uppercase tracking-wider mb-4">
              Customer Onboarding
            </span>
            <h2 className="text-4xl font-extrabold text-white tracking-tight leading-tight mb-4">
              Fast, Transparent <br />
              Parcel Logistics.
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Book intra-zone and inter-zone parcel deliveries with real-time volumetric rate calculation and verified audit trails.
            </p>
          </div>

          <div className="text-xs text-slate-400">
            © 2026 ZoneDrop Logistics Intelligence. All rights reserved.
          </div>
        </div>
      </section>

      {/* Right Side: Registration Form */}
      <section className="w-full lg:w-1/2 flex items-center justify-center p-container-padding bg-surface">
        <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-modal border border-outline-variant p-8 relative overflow-hidden">
          <div className="relative z-10">
            <div className="text-center mb-6">
              <div className="flex justify-center mb-2">
                <Logo size="md" />
              </div>
              <h2 className="text-xl font-bold text-on-surface">Create Account</h2>
              <p className="text-xs text-on-surface-variant mt-1">
                Register as a customer to book and track shipments.
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-3.5">
              <Field label="Full Name">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
                    person
                  </span>
                  <input
                    className={`${inputClass} pl-9`}
                    placeholder="Alex Morgan"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
              </Field>

              <Field label="Email Address">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
                    mail
                  </span>
                  <input
                    className={`${inputClass} pl-9`}
                    type="email"
                    placeholder="alex@company.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
              </Field>

              <Field label="Phone Number (Optional)">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
                    call
                  </span>
                  <input
                    className={`${inputClass} pl-9`}
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
              </Field>

              <Field label="Password">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
                    lock
                  </span>
                  <input
                    className={`${inputClass} pl-9`}
                    type="password"
                    placeholder="Minimum 6 characters"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                  />
                </div>
              </Field>

              {error && (
                <div className="rounded-lg border border-error-container bg-error-container/40 p-2.5 text-xs text-error font-medium flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">error</span>
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" className="w-full py-2.5 text-xs mt-2" disabled={loading}>
                {loading ? "Registering…" : "Complete Registration"}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-outline-variant text-center">
              <p className="text-xs text-on-surface-variant">
                Already registered?{" "}
                <Link className="font-semibold text-secondary hover:underline" to="/login">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
