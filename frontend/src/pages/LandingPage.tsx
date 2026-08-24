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
          <a className="font-label-md text-label-md text-on-surface-variant font-medium hover:text-secondary transition-colors" href="#">Features</a>
          <a className="font-label-md text-label-md text-on-surface-variant font-medium hover:text-secondary transition-colors" href="#">How It Works</a>
          <a className="font-label-md text-label-md text-on-surface-variant font-medium hover:text-secondary transition-colors" href="#">Solutions</a>
          <a className="font-label-md text-label-md text-on-surface-variant font-medium hover:text-secondary transition-colors" href="#">Pricing</a>
          <a className="font-label-md text-label-md text-on-surface-variant font-medium hover:text-secondary transition-colors" href="#">About</a>
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
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBjQv7B0eFeG9BS-HYj6OQI7DQmj1oULmPBn57sHrCG1tDXeuM5zmogOQbHOTWtj1__VF_fn1ioZ2D40IvULhUYi07fLFzfgY-UsQraw8ZVgTVciEDf3nyrwX7qnih5M0YtrtdLZI9rz9wFruDN0e99ByC4KHlOF7sVKvYLKu9FKnkjSWJiJGp6UbNISBEvnLGN-q0GqvhAlVkkiOFiXbifIwpWtXpd5OLiZwn0-3ZI-O0nUnpEjT4bMg"
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
      <section className="w-full py-24 px-container-padding bg-surface-container-low">
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
      <section className="w-full py-24 px-container-padding bg-surface-container-lowest">
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
                <div className="w-12 h-12 rounded-full bg-secondary-container text-secondary font-headline-sm text-headline-sm flex items-center justify-center mb-6 shadow-sm border-[4px] border-surface-container-lowest">
                  2
                </div>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-2">Get Smart Pricing</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant max-w-[200px]">
                  Instant cost calculation based on variables.
                </p>
              </div>
              
              {/* Step 3 */}
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-secondary-container text-secondary font-headline-sm text-headline-sm flex items-center justify-center mb-6 shadow-sm border-[4px] border-surface-container-lowest">
                  3
                </div>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-2">Assign & Track</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant max-w-[200px]">
                  Automated routing and real-time monitoring.
                </p>
              </div>
              
              {/* Step 4 */}
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-secondary-container text-secondary font-headline-sm text-headline-sm flex items-center justify-center mb-6 shadow-sm border-[4px] border-surface-container-lowest">
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
