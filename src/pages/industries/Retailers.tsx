import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Target,
  BarChart3,
  MapPin,
  Layers,
  Zap,
  ShieldCheck,
  Sparkles,
  MousePointerClick,
  LineChart,
  Wallet,
  Users,
  ArrowRight,
  PhoneCall,
  PlayCircle,
  Store,
  Radio,
  Monitor,
  Image as ImageIcon,
} from "lucide-react";

const CANONICAL = "https://tinystickyads.com/industries/retaildsp";

const setMeta = (selector: string, attr: string, value: string) => {
  let el = document.head.querySelector<HTMLMetaElement | HTMLLinkElement>(selector);
  if (!el) {
    if (selector.startsWith("link")) {
      el = document.createElement("link");
      (el as HTMLLinkElement).rel = "canonical";
    } else {
      el = document.createElement("meta");
      const m = selector.match(/\[(name|property)="([^"]+)"\]/);
      if (m) (el as HTMLMetaElement).setAttribute(m[1], m[2]);
    }
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
};

const Retailers = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const prev = document.title;
    document.title = "Retail Media DSP Dashboard | TrioTag";
    setMeta(
      'meta[name="description"]',
      "content",
      "Plan, buy, and measure retail media campaigns from a single Retail Media DSP dashboard. Reach real shoppers across print, screens, and audio in the physical world.",
    );
    setMeta('link[rel="canonical"]', "href", CANONICAL);
    setMeta('meta[property="og:title"]', "content", "Retail Media DSP Dashboard | TrioTag");
    setMeta('meta[property="og:url"]', "content", CANONICAL);
    setMeta('meta[property="og:type"]', "content", "website");
    setMeta(
      'meta[property="og:description"]',
      "content",
      "One dashboard to plan, activate and measure omnichannel retail media campaigns across TrioTag's network of stores, venues and screens.",
    );
    return () => { document.title = prev; };
  }, []);

  const startCampaign = () => navigate("/auth");
  const bookDemo = () => navigate("/contact");

  const features = [
    {
      icon: Target,
      title: "Audience Targeting",
      desc: "Reach shoppers by category, region, city, or specific retailer type. Layer demographics, foot-traffic and behavioral signals.",
    },
    {
      icon: MapPin,
      title: "Location Bundling",
      desc: "Bundle hundreds of retail locations into a single media plan — cafes, gyms, malls, convenience stores and more.",
    },
    {
      icon: Layers,
      title: "Omnichannel Formats",
      desc: "Activate Print (OOH), Screens (DOOH) and Audio (AOOH) side-by-side inside one campaign builder.",
    },
    {
      icon: LineChart,
      title: "Real-Time Reporting",
      desc: "Live plays, impressions, verified reach and QR-driven attribution — all measured back to your dashboard.",
    },
    {
      icon: Zap,
      title: "Instant Activation",
      desc: "Approve creative, pick your dates, pay, and go live. No IOs, no waiting for reps.",
    },
    {
      icon: ShieldCheck,
      title: "Brand Safety",
      desc: "Every retailer is vetted. Every placement is publisher-approved. Every play is logged and audit-ready.",
    },
  ];

  const steps = [
    { icon: MousePointerClick, title: "Plan", desc: "Search inventory, bundle locations, and build a media plan by objective." },
    { icon: ImageIcon, title: "Create", desc: "Upload creative or generate ads directly in the dashboard for print, screens and audio." },
    { icon: PlayCircle, title: "Activate", desc: "Schedule flights, pay online, and push campaigns live across the network." },
    { icon: BarChart3, title: "Measure", desc: "Track impressions, plays, QR scans, and revenue — optimized in real time." },
  ];

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <Navigation />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(34,197,94,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.6) 1px, transparent 1px)",
              backgroundSize: "56px 56px",
              maskImage: "radial-gradient(ellipse at center, black 40%, transparent 75%)",
              WebkitMaskImage: "radial-gradient(ellipse at center, black 40%, transparent 75%)",
            }}
          />
          <div className="absolute -top-32 -left-24 h-[28rem] w-[28rem] rounded-full bg-green-500/20 blur-[120px] animate-pulse" />
          <div className="absolute -bottom-40 -right-24 h-[32rem] w-[32rem] rounded-full bg-emerald-400/10 blur-[140px]" />
        </div>

        <div className="container mx-auto px-4 md:px-6 py-24 md:py-32 relative">
          <div className="max-w-4xl">
            <span className="inline-block px-3 py-1 rounded-full bg-green-500/15 border border-green-500/30 text-green-400 text-xs font-semibold mb-6">
              Retail Media DSP
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.05] mb-6">
              One dashboard to run your{" "}
              <span className="text-green-500">retail media campaigns.</span>
            </h1>
            <p className="text-lg md:text-xl text-white/70 mb-10 max-w-3xl">
              TrioTag's Retail Media DSP lets brands plan, activate and measure omnichannel
              campaigns across our network of retailers, venues and screens — Print, DOOH and
              AOOH — from a single self-serve dashboard.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" variant="cyber" onClick={startCampaign}>
                <LayoutDashboard className="h-4 w-4" /> Account Registration
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard preview */}
      <section className="py-20 md:py-28 border-t border-white/5">
        <div className="container mx-auto px-4 md:px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-green-500/15 text-green-400 text-xs font-semibold mb-5">
              Built for retail brands
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
              Buy retail media like{" "}
              <span className="text-green-500">you buy digital.</span>
            </h2>
            <p className="text-white/70 text-lg mb-5">
              Skip the sales calls and manual insertion orders. Search inventory, bundle
              retailers by category or location, upload creative, and go live in minutes.
            </p>
            <p className="text-white/70 text-lg">
              Every impression is logged. Every play is verified. Every peso is measured.
            </p>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-br from-green-500/20 to-emerald-400/0 blur-2xl rounded-3xl" />
            <div className="relative bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 shadow-2xl">
              <div className="flex items-center gap-2 mb-5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
                <span className="ml-3 text-xs text-white/40">dsp / campaign-live</span>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label: "Impressions", value: "1.24M" },
                  { label: "QR Scans", value: "8,412" },
                  { label: "Spend", value: "₱248K" },
                ].map((s) => (
                  <div key={s.label} className="bg-black/60 border border-white/10 rounded-xl p-3">
                    <div className="text-xs text-white/50">{s.label}</div>
                    <div className="text-lg font-bold text-green-400">{s.value}</div>
                  </div>
                ))}
              </div>
              <div className="h-32 rounded-xl border border-white/10 bg-black/40 p-4 mb-4 relative overflow-hidden">
                <svg viewBox="0 0 200 80" className="w-full h-full">
                  <defs>
                    <linearGradient id="dspLine" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="rgb(34,197,94)" stopOpacity="0.5" />
                      <stop offset="100%" stopColor="rgb(34,197,94)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0,65 L20,58 L40,60 L60,42 L80,48 L100,30 L120,34 L140,20 L160,24 L180,10 L200,14 L200,80 L0,80 Z" fill="url(#dspLine)" />
                  <path d="M0,65 L20,58 L40,60 L60,42 L80,48 L100,30 L120,34 L140,20 L160,24 L180,10 L200,14" fill="none" stroke="rgb(34,197,94)" strokeWidth="1.5" />
                </svg>
              </div>
              <div className="space-y-2">
                {[
                  { icon: Store, t: "Print · 42 cafes · Metro Manila", s: "Live" },
                  { icon: Monitor, t: "DOOH · 18 mall screens", s: "Pacing +12%" },
                  { icon: Radio, t: "AOOH · 24 gym audio zones", s: "Scheduled" },
                ].map(({ icon: Icon, t, s }) => (
                  <div key={t} className="flex items-center justify-between text-xs bg-black/40 border border-white/10 rounded-lg px-3 py-2">
                    <span className="text-white/70 flex items-center gap-2"><Icon className="h-3.5 w-3.5 text-green-400" />{t}</span>
                    <span className="text-green-400">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-20 md:py-28 border-t border-white/5">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-2xl mb-14">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Everything you need to run <span className="text-green-500">retail media at scale.</span>
            </h2>
            <p className="text-white/60 text-lg">
              A full-stack DSP purpose-built for physical world advertising.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="group relative bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-green-500/50 hover:shadow-[0_0_30px_-5px_rgba(34,197,94,0.35)]"
              >
                <div className="h-11 w-11 rounded-xl bg-green-500/15 border border-green-500/30 flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5 text-green-400" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{title}</h3>
                <p className="text-sm text-white/65">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="py-20 md:py-28 border-t border-white/5 bg-gradient-to-b from-transparent via-green-500/[0.03] to-transparent">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-2xl mb-14">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">From plan to proof in one flow</h2>
            <p className="text-white/60 text-lg">Four steps from brief to measurable retail media results.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {steps.map(({ icon: Icon, title, desc }, i) => (
              <div key={title} className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 hover:border-green-500/50 transition">
                <div className="h-11 w-11 rounded-xl bg-green-500/15 border border-green-500/30 flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5 text-green-400" />
                </div>
                <div className="text-xs text-green-400 font-semibold mb-2">STEP {i + 1}</div>
                <h3 className="text-lg font-semibold mb-2">{title}</h3>
                <p className="text-sm text-white/65">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who uses it */}
      <section className="py-20 md:py-28 border-t border-white/5">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-2xl mb-14">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Who runs on TrioTag DSP</h2>
            <p className="text-white/60 text-lg">Brands and agencies buying real-world attention.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Sparkles, t: "Consumer Brands", d: "FMCG, beauty, food and beverage teams launching product drops." },
              { icon: Users, t: "Agencies", d: "Manage multiple retail media budgets from one client-ready dashboard." },
              { icon: Wallet, t: "Retailers & Chains", d: "Run house ads and monetize your own footprint from one console." },
              { icon: Store, t: "Local Businesses", d: "Self-serve local campaigns starting from a single storefront." },
            ].map(({ icon: Icon, t, d }) => (
              <div key={t} className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 hover:border-green-500/50 transition">
                <div className="h-11 w-11 rounded-xl bg-green-500/15 border border-green-500/30 flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{t}</h3>
                <p className="text-sm text-white/65">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/15 via-emerald-500/5 to-transparent" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[36rem] w-[36rem] rounded-full bg-green-500/20 blur-[160px]" />
        </div>
        <div className="container mx-auto px-4 md:px-6 relative">
          <div className="max-w-3xl mx-auto text-center bg-[#0a0a0a]/80 backdrop-blur-sm border border-green-500/30 rounded-3xl p-10 md:p-14 shadow-[0_0_60px_-10px_rgba(34,197,94,0.4)]">
            <h2 className="text-3xl md:text-5xl font-bold mb-5 leading-tight">
              Launch your first retail media campaign{" "}
              <span className="text-green-500">today.</span>
            </h2>
            <p className="text-white/70 mb-8 text-lg">
              Get access to the TrioTag Retail Media DSP — plan, buy, and measure in one dashboard.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button size="lg" variant="cyber" onClick={startCampaign} className="text-base">
                Account Registration <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={bookDemo} className="text-base">
                Campaign Request
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Retailers;
