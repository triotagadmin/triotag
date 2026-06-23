import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  Users,
  Zap,
  Scaling,
  Megaphone,
  Cpu,
  LineChart,
  ShoppingBag,
  Code2,
  TrendingDown,
  Rocket,
  Target,
  EyeOff,
  Building2,
  Newspaper,
  Store,
  Briefcase,
  Search,
  Plug,
  PlayCircle,
  RefreshCw,
  ArrowRight,
  PhoneCall,
  MessageSquare,
} from "lucide-react";

const CANONICAL = "https://tinystickyads.com/industries/brands";

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
    document.title = "Outsourced Ad Operations & AdOps Services | TrioTag";
    setMeta(
      'meta[name="description"]',
      "content",
      "Scale your advertising business with TrioTag's outsourced AdOps team — campaign trafficking, programmatic, reporting, retail media, and white-label ad operations.",
    );
    setMeta(
      'meta[name="keywords"]',
      "content",
      "Outsourced Ad Operations, AdOps Services, Remote Ad Operations Team, Campaign Management Outsourcing, White-Label Ad Operations",
    );
    setMeta('link[rel="canonical"]', "href", CANONICAL);
    setMeta('meta[property="og:title"]', "content", "Outsourced Ad Operations & AdOps Services | TrioTag");
    setMeta('meta[property="og:url"]', "content", CANONICAL);
    setMeta('meta[property="og:type"]', "content", "website");
    setMeta(
      'meta[property="og:description"]',
      "content",
      "A dedicated remote AdOps team that handles trafficking, programmatic, reporting, and optimization — so your team can focus on growth.",
    );
    return () => {
      document.title = prevTitle;
    };
  }, []);

  const bookCall = () => navigate("/contact");
  const talkSpecialist = () => navigate("/contact");

  const services = [
    {
      icon: Megaphone,
      title: "Campaign Trafficking",
      items: [
        "Campaign setup and deployment",
        "Creative trafficking and QA",
        "Scheduling and pacing",
        "Inventory and placement management",
      ],
    },
    {
      icon: Cpu,
      title: "Programmatic Ad Operations",
      items: [
        "DSP campaign management",
        "Audience targeting implementation",
        "Deal ID and PMP activation",
        "Campaign monitoring and optimization",
      ],
    },
    {
      icon: LineChart,
      title: "Reporting & Analytics",
      items: [
        "Performance reporting",
        "Delivery monitoring",
        "KPI tracking",
        "Optimization recommendations",
        "Advertiser dashboards",
      ],
    },
    {
      icon: ShoppingBag,
      title: "Retail Media Ad Operations",
      items: [
        "Sponsored campaign execution",
        "Advertiser onboarding support",
        "Campaign fulfillment",
        "Inventory packaging",
        "Performance reporting",
      ],
    },
    {
      icon: Code2,
      title: "Technical Ad Operations",
      items: [
        "Pixel implementation and validation",
        "Impression and click tracker setup",
        "Tag management",
        "Creative troubleshooting",
        "Platform integrations and testing",
      ],
    },
  ];

  const benefits = [
    { icon: TrendingDown, title: "Reduce Operational Costs", desc: "Access experienced AdOps professionals without the expenses of recruiting, training, and maintaining an internal team." },
    { icon: Scaling, title: "Scale On Demand", desc: "Increase or decrease operational support according to campaign volume and business requirements." },
    { icon: Rocket, title: "Faster Campaign Launches", desc: "Get campaigns live quickly with streamlined execution and experienced operational processes." },
    { icon: Target, title: "Focus on Growth", desc: "Free your internal teams to concentrate on sales, strategy, and client relationships while we handle execution." },
    { icon: EyeOff, title: "White-Label Support", desc: "Our team can work behind your brand and operate as your dedicated AdOps department." },
  ];

  const clients = [
    { icon: Building2, title: "Advertising Agencies", desc: "Increase campaign delivery capacity without expanding headcount." },
    { icon: Newspaper, title: "Publishers & Media Owners", desc: "Improve campaign execution and maximize inventory performance." },
    { icon: Store, title: "Retail Media Networks", desc: "Launch and scale retail media operations with dedicated campaign support." },
    { icon: Briefcase, title: "Brands & Advertisers", desc: "Execute campaigns efficiently across multiple advertising channels." },
  ];

  const steps = [
    { icon: Search, title: "Discovery", desc: "We understand your workflows, platforms, and operational requirements." },
    { icon: Plug, title: "Team Integration", desc: "Our specialists integrate with your tools, communication channels, and processes." },
    { icon: PlayCircle, title: "Campaign Execution", desc: "We manage campaign setup, trafficking, monitoring, and optimization." },
    { icon: RefreshCw, title: "Continuous Support", desc: "Receive transparent reporting, operational support, and ongoing performance improvements." },
  ];

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <Navigation />

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Animated background */}
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
          {/* floating data points */}
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
              Outsourced Ad Operations
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.05] mb-6 animate-fade-in">
              We Handle Your Ad Operations,{" "}
              <span className="text-green-500">So Your Team Can Focus on Sales and Growth.</span>
            </h1>
            <p className="text-lg md:text-xl text-white/70 mb-10 max-w-3xl">
              Scale your advertising business without the cost and complexity of building an in-house
              AdOps department. Our dedicated specialists handle campaign execution, trafficking,
              reporting, and optimization — so your team can focus on growth and client relationships.
            </p>

            <div className="flex flex-wrap gap-3 mb-10">
              <Button size="lg" variant="cyber" onClick={bookCall}>
                <PhoneCall className="h-4 w-4" /> Book a Discovery Call
              </Button>
              <Button size="lg" variant="outline" onClick={talkSpecialist}>
                <MessageSquare className="h-4 w-4" /> Talk to an AdOps Specialist
              </Button>
            </div>

            <div className="flex flex-wrap gap-3">
              {[
                { icon: Users, label: "Dedicated Teams" },
                { icon: Zap, label: "Faster Execution" },
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

      {/* Your Remote Ad Operations Team */}
      <section className="py-20 md:py-28 border-t border-white/5">
        <div className="container mx-auto px-4 md:px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
              Your Remote <span className="text-green-500">Ad Operations Team</span>
            </h2>
            <p className="text-white/70 text-lg mb-5">
              We become an extension of your organization by providing experienced AdOps
              professionals who work within your processes, platforms, and communication channels.
            </p>
            <p className="text-white/70 text-lg">
              Whether you need support for daily campaign operations or a fully managed AdOps
              department, we deliver the expertise needed to execute campaigns efficiently and at scale.
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
                <span className="ml-3 text-xs text-white/40">campaigns / live-monitor</span>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label: "Active", value: "128" },
                  { label: "Impressions", value: "4.2M" },
                  { label: "CTR", value: "1.84%" },
                ].map((s) => (
                  <div key={s.label} className="bg-black/60 border border-white/10 rounded-xl p-3">
                    <div className="text-xs text-white/50">{s.label}</div>
                    <div className="text-lg font-bold text-green-400">{s.value}</div>
                  </div>
                ))}
              </div>
              {/* fake chart */}
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
                  ["Trafficking · Q4 Launch", "On track"],
                  ["DSP Optimization · Retail", "Pacing +12%"],
                  ["Creative QA · Brand A", "Approved"],
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
              End-to-end AdOps capabilities delivered by specialists who work as part of your team.
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
              Why Outsource Your <span className="text-green-500">Ad Operations?</span>
            </h2>
            <p className="text-white/60 text-lg">
              Five reasons leading teams trust an outsourced AdOps partner.
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
              Trusted by teams across the digital advertising ecosystem.
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
              From discovery to continuous optimization — a clear path to operational excellence.
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
              <span className="text-green-500">Without Hiring</span>
            </h2>
            <p className="text-white/70 mb-8 text-lg">
              Whether you need a single AdOps specialist or a fully managed department, we provide
              the people, expertise, and processes to keep your advertising operations running smoothly.
            </p>

            <div className="border-t border-white/10 pt-8 mb-8">
              <h3 className="text-xl md:text-2xl font-semibold mb-3">
                Ready to Scale Your Advertising Operations?
              </h3>
              <p className="text-white/65 max-w-2xl mx-auto">
                Partner with an outsourced AdOps team that delivers reliable campaign execution and
                operational excellence.
              </p>
            </div>

            <Button size="lg" variant="cyber" onClick={bookCall} className="text-base">
              Book a Discovery Call <ArrowRight className="h-4 w-4" />
            </Button>
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
