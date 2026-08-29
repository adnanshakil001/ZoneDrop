import { Link } from "react-router-dom";

export function LandingPage() {
  return (
    <main className="bg-background text-on-surface font-body-md antialiased selection:bg-secondary-container selection:text-on-secondary-container min-h-screen flex flex-col overflow-x-hidden">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-container-padding h-16 w-full max-w-full bg-surface/90 backdrop-blur-md shadow-sm border-b border-outline-variant/30">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary filled">local_shipping</span>
          <span className="font-headline-lg text-headline-lg font-black text-secondary tracking-tight">ZoneDrop</span>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <a className="font-label-md text-label-md text-on-surface-variant font-medium hover:text-secondary transition-colors" href="#features">Features</a>
          <a className="font-label-md text-label-md text-on-surface-variant font-medium hover:text-secondary transition-colors" href="#how-it-works">How It Works</a>
          <a className="font-label-md text-label-md text-on-surface-variant font-medium hover:text-secondary transition-colors" href="#solutions">Solutions</a>
          <a className="font-label-md text-label-md text-on-surface-variant font-medium hover:text-secondary transition-colors" href="#pricing">Pricing</a>
          <a className="font-label-md text-label-md text-on-surface-variant font-medium hover:text-secondary transition-colors" href="#about">About</a>
        </nav>
        <div className="flex items-center gap-4">
          <Link to="/login" className="hidden md:block font-label-md text-label-md text-on-surface-variant hover:text-secondary transition-colors">
            Log in
          </Link>
          <Link to="/login">
            <button className="bg-secondary text-on-secondary font-label-md text-label-md px-4 py-2 rounded-lg hover:bg-secondary-container hover:text-on-secondary-container transition-colors shadow-sm">
              Get Started
            </button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden bg-grid-pattern flex-grow">
        {/* Abstract gradient blob behind hero */}
        <div className="absolute top-0 right-0 -z-10 w-[800px] h-[800px] bg-secondary-fixed-dim/20 rounded-full blur-[120px] transform translate-x-1/3 -translate-y-1/4"></div>
        <div className="absolute bottom-0 left-0 -z-10 w-[600px] h-[600px] bg-tertiary-fixed-dim/10 rounded-full blur-[100px] transform -translate-x-1/4 translate-y-1/4"></div>
        
        <div className="max-w-7xl mx-auto px-container-padding text-center relative z-10">
          <h1 className="font-display-lg text-display-lg max-w-4xl mx-auto mb-6 text-on-surface tracking-tight">
            Your last mile, <br />
            <span className="text-secondary">delivered smarter.</span>
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto mb-10">
            ZoneDrop’s logistics intelligence engine optimizes routing, automates dispatch, and cuts delivery times in half. Built for enterprise fleets that demand precision.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <Link to="/login">
              <button className="bg-secondary text-on-secondary font-label-md text-label-md px-6 py-3 rounded-lg hover:bg-secondary-container hover:text-on-secondary-container transition-all hover:shadow-[0_4px_20px_rgba(0,88,190,0.3)] w-full sm:w-auto">
                Start Free Trial
              </button>
            </Link>
            <button className="border border-outline font-label-md text-label-md px-6 py-3 rounded-lg text-on-surface bg-surface-container-lowest hover:bg-surface-variant transition-colors w-full sm:w-auto flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[18px]">play_circle</span>
              Watch Demo
            </button>
          </div>

          {/* Dashboard Visualization (Glassmorphism/High-end UI) */}
          <div className="relative mx-auto max-w-5xl rounded-xl border border-surface-variant bg-surface-container-lowest/80 backdrop-blur-md shadow-[0_12px_48px_rgba(11,18,33,0.12)] p-2">
            <div className="flex items-center justify-between px-4 py-2 border-b border-surface-variant mb-4">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-error-container"></div>
                <div className="w-3 h-3 rounded-full bg-surface-variant"></div>
                <div className="w-3 h-3 rounded-full bg-surface-container-high"></div>
              </div>
              <div className="font-mono-data text-mono-data text-on-surface-variant text-xs tracking-widest uppercase">
                live_fleet_overview.exe
              </div>
            </div>
            
            <img 
              className="w-full rounded-lg object-cover shadow-sm border border-surface-variant/50 h-[500px]" 
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop"
              alt="Dashboard Preview"
            />

            {/* Floating UI element over image */}
            <div className="absolute -right-6 top-1/4 bg-surface-container-lowest p-4 rounded-lg shadow-lg border border-surface-variant animate-[bounce_4s_infinite]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
                  <span className="material-symbols-outlined filled">bolt</span>
                </div>
                <div className="text-left">
                  <div className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Efficiency</div>
                  <div className="font-headline-sm text-headline-sm text-secondary font-bold">+24.8%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Platform Capabilities Section */}
      <section id="features" className="w-full py-24 px-container-padding bg-surface-container-low">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-4">
            Core Platform Capabilities
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl mx-auto mb-16">
            Built for high-performance logistics operations requiring precision and speed.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            {/* Feature 1 */}
            <div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm border border-outline-variant/30 hover:shadow-card transition-shadow">
              <div className="w-10 h-10 rounded bg-secondary-container text-secondary flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-[20px]">calculate</span>
              </div>
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-3">Smart Pricing</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                Automatically calculate delivery charges dynamically using advanced weight metrics and intelligent zone mapping.
              </p>
            </div>
            {/* Feature 2 */}
            <div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm border border-outline-variant/30 hover:shadow-card transition-shadow">
              <div className="w-10 h-10 rounded bg-secondary-container text-secondary flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-[20px]">person_search</span>
              </div>
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-3">Intelligent Assignment</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                Utilize real-time location data for nearest available agent identification to minimize idle time and maximize efficiency.
              </p>
            </div>
            {/* Feature 3 */}
            <div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm border border-outline-variant/30 hover:shadow-card transition-shadow">
              <div className="w-10 h-10 rounded bg-secondary-container text-secondary flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-[20px]">map</span>
              </div>
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-3">Real-Time Tracking</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                Provide complete operational visibility with sub-second latency from initial package pickup to final doorstep delivery.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="w-full py-24 px-container-padding bg-surface-container-lowest">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-4">
            How It Works
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl mx-auto mb-20">
            A seamless four-step process to optimize your delivery workflow.
          </p>
          
          <div className="relative">
            {/* Connecting Line (hidden on mobile, shown on md+) */}
            <div className="hidden md:block absolute top-6 left-[10%] right-[10%] h-[1px] bg-outline-variant/40 -z-10"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-4 relative z-10">
              {/* Step 1 */}
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-secondary text-on-secondary font-headline-sm text-headline-sm flex items-center justify-center mb-6 shadow-sm border-[4px] border-surface-container-lowest">
                  1
                </div>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-2">Create Order</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant max-w-[200px]">
                  Input delivery details via API or dashboard.
                </p>
              </div>
              
              {/* Step 2 */}
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-secondary text-on-secondary font-headline-sm text-headline-sm flex items-center justify-center mb-6 shadow-sm border-[4px] border-surface-container-lowest">
                  2
                </div>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-2">Get Smart Pricing</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant max-w-[200px]">
                  Instant cost calculation based on variables.
                </p>
              </div>
              
              {/* Step 3 */}
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-secondary text-on-secondary font-headline-sm text-headline-sm flex items-center justify-center mb-6 shadow-sm border-[4px] border-surface-container-lowest">
                  3
                </div>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-2">Assign & Track</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant max-w-[200px]">
                  Automated routing and real-time monitoring.
                </p>
              </div>
              
              {/* Step 4 */}
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-secondary text-on-secondary font-headline-sm text-headline-sm flex items-center justify-center mb-6 shadow-sm border-[4px] border-surface-container-lowest">
                  4
                </div>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-2">Deliver</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant max-w-[200px]">
                  Successful completion with proof of delivery.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section id="solutions" className="w-full py-24 px-container-padding bg-surface-container-low">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-4">Tailored Solutions</h2>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl mx-auto">Built to adapt to any logistics scale, from local delivery networks to global supply chains.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-surface-container-lowest p-10 rounded-3xl border border-outline-variant/30 flex flex-col justify-between hover:shadow-card transition-shadow">
              <div>
                <div className="w-12 h-12 rounded-full bg-secondary-container text-secondary flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-[24px]">local_shipping</span>
                </div>
                <h3 className="font-headline-md text-headline-md font-bold text-on-surface mb-4">For Local Hubs</h3>
                <p className="font-body-md text-body-md text-on-surface-variant mb-6">Automate your driver assignments and streamline intra-zone deliveries with smart pin-code mapping.</p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3 text-on-surface"><span className="material-symbols-outlined text-secondary text-[20px]">check_circle</span> Automated Dispatch</li>
                  <li className="flex items-center gap-3 text-on-surface"><span className="material-symbols-outlined text-secondary text-[20px]">check_circle</span> Zone-Based Pricing</li>
                </ul>
              </div>
              <button className="text-secondary font-label-md font-bold text-left hover:underline">Explore Local Solutions →</button>
            </div>
            <div className="bg-[#0b1120] text-white p-10 rounded-3xl shadow-lg flex flex-col justify-between hover:shadow-card transition-shadow relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/20 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center mb-6 backdrop-blur-sm">
                  <span className="material-symbols-outlined text-[24px]">domain</span>
                </div>
                <h3 className="font-headline-md text-headline-md font-bold mb-4">For Enterprise Fleets</h3>
                <p className="font-body-md text-body-md text-white/80 mb-6">Full API access, advanced volumetric rate engine, and comprehensive analytics for high-volume operations.</p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3 text-white"><span className="material-symbols-outlined text-secondary text-[20px]">check_circle</span> Volumetric Rate Engine</li>
                  <li className="flex items-center gap-3 text-white"><span className="material-symbols-outlined text-secondary text-[20px]">check_circle</span> Immutable Audit Logs</li>
                </ul>
              </div>
              <button className="text-secondary font-label-md font-bold text-left hover:underline relative z-10">Explore Enterprise Solutions →</button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="w-full py-24 px-container-padding bg-surface-container-lowest">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-4">Transparent Pricing</h2>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl mx-auto mb-16">No hidden fees. Scale your infrastructure as your delivery volume grows.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left items-center">
            <div className="bg-surface-container-low rounded-3xl p-8 border border-outline-variant/30">
              <h3 className="font-headline-sm font-bold text-on-surface mb-2">Starter</h3>
              <div className="text-4xl font-black text-on-surface mb-6">Free</div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-sm text-on-surface-variant"><span className="material-symbols-outlined text-secondary text-[18px]">done</span> Up to 500 orders/mo</li>
                <li className="flex items-center gap-3 text-sm text-on-surface-variant"><span className="material-symbols-outlined text-secondary text-[18px]">done</span> Basic tracking</li>
                <li className="flex items-center gap-3 text-sm text-on-surface-variant"><span className="material-symbols-outlined text-secondary text-[18px]">done</span> Community Support</li>
              </ul>
              <button className="w-full py-3 rounded-lg border border-outline text-on-surface font-bold hover:bg-surface-variant transition-colors">Start Free</button>
            </div>
            
            <div className="bg-surface-container-lowest rounded-3xl p-8 border-2 border-secondary shadow-lg relative transform scale-100 md:scale-105 z-10">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-secondary text-on-secondary px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Most Popular</div>
              <h3 className="font-headline-sm font-bold text-on-surface mb-2 mt-2">Professional</h3>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-4xl font-black text-on-surface">$49</span>
                <span className="text-sm font-normal text-on-surface-variant">/mo</span>
              </div>
              <p className="text-sm text-on-surface-variant mb-6">Everything in Starter, plus:</p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-sm text-on-surface-variant"><span className="material-symbols-outlined text-secondary text-[18px]">done</span> Unlimited orders</li>
                <li className="flex items-center gap-3 text-sm text-on-surface-variant"><span className="material-symbols-outlined text-secondary text-[18px]">done</span> Smart dispatching</li>
                <li className="flex items-center gap-3 text-sm text-on-surface-variant"><span className="material-symbols-outlined text-secondary text-[18px]">done</span> Email notifications</li>
              </ul>
              <button className="w-full py-3 rounded-lg bg-secondary text-on-secondary font-bold hover:bg-secondary-container transition-colors">Get Professional</button>
            </div>

            <div className="bg-surface-container-low rounded-3xl p-8 border border-outline-variant/30">
              <h3 className="font-headline-sm font-bold text-on-surface mb-2">Enterprise</h3>
              <div className="text-4xl font-black text-on-surface mb-6">Custom</div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-sm text-on-surface-variant"><span className="material-symbols-outlined text-secondary text-[18px]">done</span> Dedicated support</li>
                <li className="flex items-center gap-3 text-sm text-on-surface-variant"><span className="material-symbols-outlined text-secondary text-[18px]">done</span> Custom integrations</li>
                <li className="flex items-center gap-3 text-sm text-on-surface-variant"><span className="material-symbols-outlined text-secondary text-[18px]">done</span> SLA guarantee</li>
              </ul>
              <button className="w-full py-3 rounded-lg border border-outline text-on-surface font-bold hover:bg-surface-variant transition-colors">Contact Sales</button>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="w-full py-24 px-container-padding bg-secondary text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="md:w-1/2">
            <h2 className="font-headline-lg text-headline-lg font-bold mb-6">Powering the future of delivery.</h2>
            <p className="font-body-lg text-body-lg text-white/90 mb-8">
              ZoneDrop was founded on a simple principle: logistics software shouldn't be the bottleneck. Our intelligence engine handles millions of complex rate calculations and routing decisions daily, allowing logistics companies to focus on what matters—moving goods fast.
            </p>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <div className="text-4xl font-black mb-2">10M+</div>
                <div className="text-sm font-bold tracking-wider uppercase text-white/70">Parcels Delivered</div>
              </div>
              <div>
                <div className="text-4xl font-black mb-2">99.9%</div>
                <div className="text-sm font-bold tracking-wider uppercase text-white/70">System Uptime</div>
              </div>
            </div>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <div className="w-64 h-64 bg-white/10 rounded-full flex items-center justify-center p-12 shadow-[0_0_80px_rgba(255,255,255,0.1)] backdrop-blur-md border border-white/20">
              <span className="material-symbols-outlined text-[100px] text-white">public</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-12 px-container-padding flex flex-col md:flex-row justify-between items-start md:items-center gap-gutter bg-surface-container-highest border-t border-outline-variant/30">
        <div>
          <span className="font-headline-sm text-headline-sm font-black text-secondary tracking-tight">ZoneDrop</span>
          <p className="font-body-sm text-body-sm mt-2 text-on-surface-variant">© 2026 ZoneDrop Logistics Intelligence. All rights reserved.</p>
        </div>
        <nav className="flex flex-wrap gap-6">
          <a className="font-body-sm text-body-sm text-on-surface-variant opacity-80 hover:opacity-100 hover:text-secondary transition-all" href="#">Features</a>
          <a className="font-body-sm text-body-sm text-on-surface-variant opacity-80 hover:opacity-100 hover:text-secondary transition-all" href="#">Pricing</a>
          <a className="font-body-sm text-body-sm text-on-surface-variant opacity-80 hover:opacity-100 hover:text-secondary transition-all" href="#">Security</a>
          <a className="font-body-sm text-body-sm text-on-surface-variant opacity-80 hover:opacity-100 hover:text-secondary transition-all" href="#">Terms of Service</a>
          <a className="font-body-sm text-body-sm text-on-surface-variant opacity-80 hover:opacity-100 hover:text-secondary transition-all" href="#">Privacy Policy</a>
        </nav>
      </footer>
    </main>
  );
}
