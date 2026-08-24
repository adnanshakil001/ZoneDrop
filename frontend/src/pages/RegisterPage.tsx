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
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-lg flex items-center justify-center backdrop-blur-md">
              <span className="material-symbols-outlined text-[24px] text-white">local_shipping</span>
            </div>
            <h1 className="font-display-md text-2xl font-bold text-white tracking-tight">ZoneDrop</h1>
          </div>

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
