import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  Users,
  DollarSign,
  Scaling,
  Layers,
  Cpu,
  Server,
  LineChart,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
  Rocket,
  Target,
  EyeOff,
  Home,
  Newspaper,
  Store,
  Building2,
  Search,
  Plug,
  PlayCircle,
  RefreshCw,
  ArrowRight,
  PhoneCall,
  ClipboardList,
  Utensils,
  Dumbbell,
  CheckCircle2,
  Shield,
  Clock,
  Wallet,
  LayoutGrid,
  Sparkles,
  Megaphone,
  ShieldCheck,
  Gauge,
  MonitorPlay,
} from "lucide-react";


const CANONICAL = "https://triotag.com/industries/sspsource";

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

const Brands = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const prevTitle = document.title;
    document.title = "Outsourced Supply-Side Ad Operations for Publishers | TrioTag";
    setMeta(
      'meta[name="description"]',
      "content",
      "Outsourced publisher AdOps teams that monetize your advertising inventory — ad serving, programmatic monetization, retail media, reporting, and revenue optimization.",
    );
    setMeta(
      'meta[name="keywords"]',
      "content",
      "Supply-Side Ad Operations, Publisher AdOps Services, Advertising Inventory Monetization, Programmatic Monetization Services, Outsourced Publisher Operations",
    );
    setMeta('link[rel="canonical"]', "href", CANONICAL);
    setMeta('meta[property="og:title"]', "content", "Outsourced Supply-Side Ad Operations for Publishers | TrioTag");
    setMeta('meta[property="og:url"]', "content", CANONICAL);
    setMeta('meta[property="og:type"]', "content", "website");
    setMeta(
      'meta[property="og:description"]',
      "content",
      "Scale your publisher ad business with TrioTag's outsourced supply-side AdOps team — inventory management, programmatic monetization, ad serving, and revenue optimization.",
    );
    return () => {
      document.title = prevTitle;
    };
  }, []);

  const bookCall = () => navigate("/contact");
  const registerInventory = () => navigate("/list-space");
  const goPublisherSignup = () => {
    localStorage.setItem("intended_role", "venue");
    navigate("/auth");
  };

  const tier1Cards = [
    {
      icon: Layers,
      title: "Ad Inventory Management",
      items: [
        "Inventory setup and organization",
        "Placement creation and management",
        "Ad unit implementation",
        "Inventory packaging and forecasting",
      ],
    },
    {
      icon: Cpu,
      title: "Programmatic Monetization",
      items: [
        "SSP onboarding and management",
        "Header bidding operations",
        "PMP and Deal ID management",
        "Demand partner integrations",
        "Yield optimization",
      ],
    },
  ];

  const publisherAdOps = [
    "Ad Inventory Management & Yield Optimization",
    "SSP Integration & Header Bidding Setup",
    "PMP (Private Marketplace) & Deal ID Management",
    "Demand Partner Management",
    "Fill Rate & eCPM Optimization",
    "Ad Serving Operations (trafficking campaigns sold on your own inventory)",
  ];

  const advertiserAdOps = [
    "Campaign Trafficking & Ad Operations",
    "Programmatic Media Buying Operations (DSP management, bid strategy, pacing)",
    "Creative Trafficking & Ad Tagging (versioning, tag implementation, QA)",
    "Brand Safety & Verification Operations",
    "Campaign Performance Monitoring & Optimization",
  ];

  const tier3Cards = [
    {
      icon: Server,
      title: "Ad Serving Operations",
      items: [
        "Ad server setup and administration",
        "Campaign trafficking for sold inventory",
        "Creative quality assurance",
        "Delivery monitoring and troubleshooting",
        "Tag implementation and management",
      ],
    },
    {
      icon: ShoppingBag,
      title: "Retail Media Network Operations",
      items: [
        "Sponsored inventory management",
        "Advertiser onboarding support",
        "Retail media campaign fulfillment",
        "Onsite and in-store media operations",
        "Revenue and performance reporting",
      ],
    },
  ];

  const tier4Points = [
    { icon: Plug, title: "Demand Partner Integrations", desc: "Connect your retail inventory to SSPs, DSPs, and direct demand partners with clean, tested integrations." },
    { icon: Gauge, title: "Header Bidding & Auction Setup", desc: "Wrapper configuration, timeout tuning, and bidder management to compete every impression properly." },
    { icon: Handshake, title: "PMP & Deal Activation", desc: "Package retail inventory into Deal IDs and private marketplaces that buyers can actually transact on." },
  ];

  const tier5Cards = [
    {
      icon: LineChart,
      title: "Publisher Revenue Analytics",
      items: [
        "Revenue reporting dashboards",
        "Fill rate and eCPM analysis",
        "Inventory performance monitoring",
        "Demand partner reporting",
        "Optimization recommendations",
      ],
    },
    {
      icon: MonitorPlay,
      title: "Advertiser Campaign Reporting",
      items: [
        "Delivery, pacing, and spend reporting",
        "Placement-level performance breakdowns",
        "Creative and tag QA verification reporting",
        "Brand safety and viewability results",
        "Optimization actions and next-cycle recommendations",
      ],
    },
  ];


  const benefits = [
    { icon: TrendingDown, title: "Reduce Operational Costs", desc: "Access experienced AdOps professionals without the cost of building and maintaining an internal team." },
    { icon: TrendingUp, title: "Maximize Revenue", desc: "Continuously optimize inventory performance, fill rates, and monetization opportunities." },
    { icon: Scaling, title: "Scale On Demand", desc: "Expand operational support as your inventory and advertising partnerships grow." },
    { icon: Target, title: "Focus on Sales and Growth", desc: "Allow your team to concentrate on acquiring advertisers and strategic partnerships while we manage operations." },
    { icon: EyeOff, title: "White-Label Support", desc: "Our team can work entirely behind your brand as your dedicated publisher AdOps department." },
  ];

  const clients = [
    { icon: Home, title: "Real Estate Managers", desc: "Own or manage a building? Maximize your profit and turn blank walls into ad space. Register by booking our outsourced agents to survey your real estate property." },
    
    { icon: Building2, title: "Property and Venue Networks", desc: "Manage DOOH, in-store media, and physical advertising inventory through centralized operations." },
    { icon: Newspaper, title: "Publishers & Media Owners", desc: "Monetize digital and physical inventory with expert supply-side operations and yield management." },
  ];

  const steps = [
    { icon: Search, title: "Discovery", desc: "We evaluate your inventory, monetization strategy, and operational requirements." },
    { icon: Plug, title: "Integration", desc: "Our specialists integrate ad servers, SSPs, and reporting systems." },
    { icon: PlayCircle, title: "Operations & Optimization", desc: "We manage inventory, monitor delivery, optimize revenue, and maintain operational performance." },
    { icon: RefreshCw, title: "Continuous Growth", desc: "Receive ongoing reporting, strategic recommendations, and scalable operational support." },
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
              animation: "adops-grid-pan 24s linear infinite",
            }}
          />
          <div className="absolute -top-32 -left-24 h-[28rem] w-[28rem] rounded-full bg-green-500/20 blur-[120px] animate-pulse" />
          <div className="absolute -bottom-40 -right-24 h-[32rem] w-[32rem] rounded-full bg-emerald-400/10 blur-[140px]" />
          {[
            { t: "12%", l: "18%" },
            { t: "30%", l: "78%" },
            { t: "62%", l: "12%" },
            { t: "75%", l: "65%" },
            { t: "45%", l: "48%" },
          ].map((p, i) => (
            <span
              key={i}
              className="absolute h-1.5 w-1.5 rounded-full bg-green-400/70 shadow-[0_0_12px_2px_rgba(34,197,94,0.7)]"
              style={{
                top: p.t,
                left: p.l,
                animation: `adops-float ${6 + i}s ease-in-out infinite`,
                animationDelay: `${i * 0.6}s`,
              }}
            />
          ))}
        </div>

        <div className="container mx-auto px-4 md:px-6 py-24 md:py-32 relative">
          <div className="max-w-4xl">
            <span className="inline-block px-3 py-1 rounded-full bg-green-500/15 border border-green-500/30 text-green-400 text-xs font-semibold mb-6 animate-fade-in">
              Outsource your Ad Operations and scale your business
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.05] mb-6 animate-fade-in">
              We Provide Outsourced Advertising Operations Teams to{" "}
              <span className="text-green-500">Monetize Your Ad Spaces.</span>
            </h1>
            <p className="text-lg md:text-xl text-white/70 mb-10 max-w-3xl">
              Scale your advertising business without building an in-house AdOps department. Our
              dedicated specialists manage your advertising inventory, ad serving operations,
              programmatic monetization, reporting, and optimization so your team can focus on
              sales and business growth.
            </p>


            <div className="flex flex-wrap gap-3">
              {[
                { icon: Users, label: "Dedicated AdOps Teams" },
                { icon: DollarSign, label: "Revenue Optimization" },
                { icon: Scaling, label: "Flexible Scaling" },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm text-sm"
                >
                  <Icon className="h-4 w-4 text-green-400" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Your Remote Publisher Ad Operations Team */}
      <section className="py-20 md:py-28 border-t border-white/5">
        <div className="container mx-auto px-4 md:px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
              Your Retail Media{" "}
              <span className="text-green-500">Supply-Side Ad Operations Team</span>
            </h2>
            <p className="text-white/70 text-lg mb-5">
              We become an extension of your organization by providing experienced AdOps
              professionals who manage and optimize your advertising inventory, programmatic
              demand, and monetization operations.
            </p>
            <p className="text-white/70 text-lg">
              Whether you need support for ad serving or a fully managed publisher monetization
              agent, we deliver the expertise needed to operate and scale your advertising business.
            </p>
          </div>

          {/* Dashboard mockup */}
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-br from-green-500/20 to-emerald-400/0 blur-2xl rounded-3xl" />
            <div className="relative bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 shadow-2xl">
              <div className="flex items-center gap-2 mb-5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
                <span className="ml-3 text-xs text-white/40">inventory / yield-monitor</span>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label: "Fill Rate", value: "94%" },
                  { label: "eCPM", value: "$3.42" },
                  { label: "Revenue", value: "$128K" },
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
                    <linearGradient id="adopsLine" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="rgb(34,197,94)" stopOpacity="0.5" />
                      <stop offset="100%" stopColor="rgb(34,197,94)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0,60 L20,52 L40,55 L60,40 L80,45 L100,28 L120,32 L140,18 L160,22 L180,12 L200,16 L200,80 L0,80 Z"
                    fill="url(#adopsLine)"
                  />
                  <path
                    d="M0,60 L20,52 L40,55 L60,40 L80,45 L100,28 L120,32 L140,18 L160,22 L180,12 L200,16"
                    fill="none"
                    stroke="rgb(34,197,94)"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
              <div className="space-y-2">
                {[
                  ["SSP Yield · Header Bidding", "+18%"],
                  ["PMP Deal · Retailer A", "Active"],
                  ["Inventory · DOOH Network", "Pacing well"],
                ].map(([t, s]) => (
                  <div key={t} className="flex items-center justify-between text-xs bg-black/40 border border-white/10 rounded-lg px-3 py-2">
                    <span className="text-white/70">{t}</span>
                    <span className="text-green-400">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Services */}
      <section className="py-20 md:py-28 border-t border-white/5">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-2xl mb-14">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Our Services</h2>
            <p className="text-white/60 text-lg">
              End-to-end supply-side AdOps capabilities delivered by specialists who monetize your
              inventory as part of your team.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map(({ icon: Icon, title, items }) => (
              <div
                key={title}
                className="group relative bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-green-500/50 hover:shadow-[0_0_30px_-5px_rgba(34,197,94,0.35)]"
              >
                <div className="h-11 w-11 rounded-xl bg-green-500/15 border border-green-500/30 flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5 text-green-400" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{title}</h3>
                <ul className="space-y-2">
                  {items.map((it) => (
                    <li key={it} className="text-sm text-white/65 flex gap-2">
                      <span className="mt-1.5 h-1 w-1 rounded-full bg-green-400 shrink-0" />
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Outsource */}
      <section className="py-20 md:py-28 border-t border-white/5 bg-gradient-to-b from-transparent via-green-500/[0.03] to-transparent">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-2xl mb-14">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Why Outsource Your <span className="text-green-500">Supply-Side Ad Operations?</span>
            </h2>
            <p className="text-white/60 text-lg">
              Five reasons publishers and media owners trust an outsourced AdOps partner.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {benefits.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="group bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-green-500/50 hover:shadow-[0_0_30px_-5px_rgba(34,197,94,0.35)]"
              >
                <Icon className="h-7 w-7 text-green-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">{title}</h3>
                <p className="text-sm text-white/65">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who We Work With */}
      <section className="py-20 md:py-28 border-t border-white/5">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-2xl mb-14">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Who We Work With</h2>
            <p className="text-white/60 text-lg">
              Trusted by inventory owners across the supply-side advertising ecosystem.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {clients.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="group bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-green-500/50 hover:shadow-[0_0_30px_-5px_rgba(34,197,94,0.35)]"
              >
                <div className="h-11 w-11 rounded-xl bg-green-500/15 border border-green-500/30 flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{title}</h3>
                <p className="text-sm text-white/65">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 md:py-28 border-t border-white/5">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-2xl mb-14">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">How It Works</h2>
            <p className="text-white/60 text-lg">
              From discovery to continuous growth — a clear path to monetization excellence.
            </p>
          </div>

          {/* Desktop timeline */}
          <div className="hidden lg:block relative">
            <div className="absolute top-7 left-[6%] right-[6%] h-px bg-gradient-to-r from-transparent via-green-500/40 to-transparent">
              <div
                className="h-full w-1/3 bg-gradient-to-r from-transparent via-green-400 to-transparent"
                style={{ animation: "adops-flow 4s linear infinite" }}
              />
            </div>
            <div className="grid grid-cols-4 gap-6 relative">
              {steps.map(({ icon: Icon, title, desc }, i) => (
                <div key={title} className="text-center">
                  <div className="mx-auto h-14 w-14 rounded-full bg-black border-2 border-green-500/60 flex items-center justify-center mb-5 relative z-10 shadow-[0_0_20px_-5px_rgba(34,197,94,0.6)]">
                    <Icon className="h-6 w-6 text-green-400" />
                  </div>
                  <div className="text-xs text-green-400 font-semibold mb-2">STEP {i + 1}</div>
                  <h3 className="text-lg font-semibold mb-2">{title}</h3>
                  <p className="text-sm text-white/65">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile stacked */}
          <div className="lg:hidden space-y-4">
            {steps.map(({ icon: Icon, title, desc }, i) => (
              <div key={title} className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 flex gap-4">
                <div className="h-12 w-12 shrink-0 rounded-full bg-green-500/15 border border-green-500/40 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <div className="text-xs text-green-400 font-semibold mb-1">STEP {i + 1}</div>
                  <h3 className="text-lg font-semibold mb-1">{title}</h3>
                  <p className="text-sm text-white/65">{desc}</p>
                </div>
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
          {[...Array(8)].map((_, i) => (
            <span
              key={i}
              className="absolute h-1 w-1 rounded-full bg-green-300/70 shadow-[0_0_10px_2px_rgba(34,197,94,0.7)]"
              style={{
                top: `${10 + i * 9}%`,
                left: `${(i * 13) % 100}%`,
                animation: `adops-float ${5 + (i % 4)}s ease-in-out infinite`,
                animationDelay: `${i * 0.4}s`,
              }}
            />
          ))}
        </div>

        <div className="container mx-auto px-4 md:px-6 relative">
          <div className="max-w-3xl mx-auto text-center bg-[#0a0a0a]/80 backdrop-blur-sm border border-green-500/30 rounded-3xl p-10 md:p-14 shadow-[0_0_60px_-10px_rgba(34,197,94,0.4)]">
            <h2 className="text-3xl md:text-5xl font-bold mb-5 leading-tight">
              Build Your AdOps Team{" "}
              <span className="text-green-500">with our Outsourced Agents</span>
            </h2>
            <p className="text-white/70 mb-8 text-lg">
              We provide the people, expertise, and processes needed to monetize and scale your
              advertising inventory.
            </p>

            <div className="border-t border-white/10 pt-8 mb-8">
              <h3 className="text-xl md:text-2xl font-semibold mb-3">
                Ready to Monetize Your Ad Spaces More Efficiently?
              </h3>
              <p className="text-white/65 max-w-2xl mx-auto">
                Partner with TrioTag, an outsourced supply-side AdOps agency that delivers reliable
                inventory management, revenue optimization, and operational excellence.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ================== Retailer Sections ================== */}

      {/* Retailer Hero */}
      <section className="container mx-auto px-4 md:px-6 py-20 md:py-28 border-t border-white/5">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-green-500/15 text-green-400 text-xs font-semibold mb-5">
              For Venues & Retailers
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Turn your space into{" "}
              <span className="text-green-500">passive income</span>
            </h2>
            <p className="text-lg text-white/70 mb-8 max-w-xl">
              TrioTag connects your venue with brands that want to reach real
              shoppers. List your ad space for free, approve every booking, and
              get paid monthly.
            </p>
          </div>
          <div className="bg-[#0c0c0c] border border-white/10 rounded-3xl p-8">
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Wallet, label: "Monthly payouts" },
                { icon: Users, label: "Verified brands" },
                { icon: Shield, label: "You approve ads" },
                { icon: TrendingUp, label: "Grow over time" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="bg-black border border-white/10 rounded-xl p-4">
                  <Icon className="h-6 w-6 text-green-500 mb-2" />
                  <div className="text-sm text-white/80">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why TrioTag */}
      <section className="bg-[#0c0c0c] py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why retailers list with TrioTag
            </h2>
            <p className="text-white/70">
              We do the work of finding advertisers. You keep control of your space.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Wallet, title: "Free to list", desc: "No setup cost, no monthly fees. You only earn — never owe." },
              { icon: Shield, title: "Full control", desc: "Approve or reject every brand booking before any ad goes live." },
              { icon: Sparkles, title: "Set & forget", desc: "Brands find you, book online, and pay directly. We handle ops." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-black border border-white/10 rounded-2xl p-6">
                <Icon className="h-8 w-8 text-green-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">{title}</h3>
                <p className="text-white/70 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works (retailers) */}
      <section className="container mx-auto px-4 md:px-6 py-20 md:py-28">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How it works</h2>
          <p className="text-white/70">From listing to first payout with any payment platform, from e-wallets to bank accounts. No account linking needed, cashout your earnings fast and secure!</p>
        </div>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            ["01", "Create your account", "Sign up free as a publisher."],
            ["02", "Add your space", "Photos, location, and ad formats."],
            ["03", "Approve bookings", "Brands request, you accept."],
            ["04", "Get paid monthly", "GCash or bank transfer."],
          ].map(([num, title, desc]) => (
            <div key={num} className="bg-[#0c0c0c] border border-white/10 rounded-2xl p-6">
              <div className="text-green-500 font-bold text-2xl mb-3">{num}</div>
              <h3 className="font-semibold mb-2">{title}</h3>
              <p className="text-white/70 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Formats */}
      <section className="bg-[#0c0c0c] py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Any space, any format</h2>
            <p className="text-white/70">
              Window stickers, posters, table tents, in-store screens, audio spots — list whatever you have.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: LayoutGrid, title: "Print (OOH)", desc: "Stickers, posters, table tents." },
              { icon: TrendingUp, title: "Screens (DOOH)", desc: "TVs, tablets, LED displays." },
              { icon: Users, title: "Audio (AOOH)", desc: "In-store sound systems." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-black border border-white/10 rounded-2xl p-6">
                <Icon className="h-8 w-8 text-green-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">{title}</h3>
                <p className="text-white/70 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Retailer Sign-Up CTA */}
      <section className="bg-black py-20 md:py-28">
        <div className="border border-green-500/20 rounded-3xl mx-4 md:mx-12 p-8 md:p-12 bg-[#070707]">
          <div className="grid lg:grid-cols-2 gap-10">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-green-500/15 text-green-400 text-xs font-semibold mb-5">
                Join the TrioTag Retailer Network
              </span>
              <h2 className="text-3xl md:text-5xl font-bold leading-tight mb-5">
                Start earning from your space today!
              </h2>
              <p className="text-white/70 mb-6">
                List your venue on TrioTag's retailer marketplace in under 10
                minutes. Brands will find your space, book it, and pay you
                directly. No sales calls. No chasing payments. Just passive
                income directly paid to your account.
              </p>

              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mt-4">
                <div className="text-xs uppercase tracking-wider text-green-400 font-semibold mb-3">
                  Estimated monthly earnings
                </div>
                <div className="space-y-2">
                  {[
                    { icon: Utensils, label: "Cafe / Restaurant", amt: "₱13,500 – ₱19,000 / month" },
                    { icon: Dumbbell, label: "Gym / Fitness", amt: "₱19,000 – ₱25,000 / month" },
                    { icon: Store, label: "Retail", amt: "₱18,000 – ₱30,000 / month" },
                  ].map(({ icon: Icon, label, amt }) => (
                    <div key={label} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-white/80">
                        <Icon className="h-4 w-4 text-green-500" />
                        {label}
                      </div>
                      <span className="text-white font-medium">{amt}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-white/50 mt-3">
                  *Earnings vary based on location, foot traffic, and format type
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 mt-6">
                {[
                  "Free to list — no upfront cost",
                  "You approve every ad booking",
                  "Monthly GCash or bank payouts",
                  "Dedicated retailer support team",
                  "Real-time earnings dashboard",
                  "Pause or remove listings anytime",
                ].map((c) => (
                  <div key={c} className="flex items-start gap-2 text-sm text-white/80">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    {c}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl p-8 self-start">
              <h3 className="text-2xl font-bold mb-2">List Your Space Today</h3>
              <p className="text-white/70 text-sm mb-6">
                Create your free retailer account and submit your first space in minutes.
              </p>
              <Button size="lg" variant="cyber" className="w-full whitespace-pre-line" onClick={() => navigate("/advertiser/explore")}>
                List your Ad Space{"\n"}
              </Button>


              <div className="flex items-center gap-3 my-5 text-white/40 text-xs">
                <div className="flex-1 h-px bg-white/10" />
                or
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <Button
                size="lg"
                variant="outline"
                className="w-full"
                onClick={() => navigate("/contact")}
              >
                Talk to an Agent
              </Button>

              <div className="flex justify-center gap-6 mt-6 text-xs text-white/70">
                <div className="flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-green-500" /> Free to join
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-green-500" /> Approved in 48hrs
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-green-500" /> No commitment
                </div>
              </div>

              <p className="text-center text-xs text-white/50 mt-5">
                Already a publisher?{" "}
                <button
                  onClick={() => navigate("/auth")}
                  className="text-green-400 hover:underline"
                >
                  Log in here
                </button>
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      <style>{`
        @keyframes adops-grid-pan {
          0% { background-position: 0 0, 0 0; }
          100% { background-position: 56px 56px, 56px 56px; }
        }
        @keyframes adops-float {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.7; }
          50% { transform: translateY(-18px) translateX(8px); opacity: 1; }
        }
        @keyframes adops-flow {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  );
};

export default Brands;
