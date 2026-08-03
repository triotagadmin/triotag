import { useEffect, useRef, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";
import earthTexture from "@/assets/earth-texture.jpg";
import {
  Cpu,
  Monitor,
  Search,
  Megaphone,
  Boxes,
  BarChart3,
  Store,
  FileText,
  Sparkles,
  ShoppingBag,
  HeartPulse,
  Utensils,
  Shirt,
  Smartphone,
  Plane,
  Hotel,
  Car,
  Sofa,
  Factory,
  Building2,
  Briefcase,
  Globe2,
  Network,
  Database,
  LineChart,
} from "lucide-react";

/* ============================ CONSTANTS ============================ */
const PAGE_TITLE = "eCommerce Ops | Triotag";
const PAGE_DESCRIPTION =
  "Discover how Triotag develops commerce technology, retail media infrastructure, search commerce platforms, and digital advertising solutions supporting modern eCommerce across Southeast Asia.";
const PAGE_URL = "https://tinystickyads.com/ecommerce";

/* ============================ HEAD METADATA ============================ */
const setMeta = (selector: string, attr: string, key: string, content: string) => {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
};

const usePageMetadata = () => {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = PAGE_TITLE;

    setMeta('meta[name="description"]', "name", "description", PAGE_DESCRIPTION);
    setMeta('meta[property="og:title"]', "property", "og:title", PAGE_TITLE);
    setMeta('meta[property="og:description"]', "property", "og:description", PAGE_DESCRIPTION);
    setMeta('meta[property="og:type"]', "property", "og:type", "website");
    setMeta('meta[property="og:url"]', "property", "og:url", PAGE_URL);
    setMeta('meta[name="twitter:card"]', "name", "twitter:card", "summary_large_image");
    setMeta('meta[name="twitter:title"]', "name", "twitter:title", PAGE_TITLE);
    setMeta('meta[name="twitter:description"]', "name", "twitter:description", PAGE_DESCRIPTION);

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    const prevCanonical = canonical.href;
    canonical.href = PAGE_URL;

    const ld = document.createElement("script");
    ld.type = "application/ld+json";
    ld.id = "ecommerce-ops-jsonld";
    ld.textContent = JSON.stringify([
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Triotag",
        url: "https://tinystickyads.com",
        description:
          "Triotag develops commerce technology, retail media infrastructure, search commerce platforms, and digital advertising systems across Southeast Asia.",
        areaServed: ["PH", "Southeast Asia"],
        knowsAbout: [
          "Commerce Technology",
          "Retail Media",
          "Search Commerce",
          "Digital Advertising",
          "Commerce Intelligence",
        ],
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://tinystickyads.com/" },
          { "@type": "ListItem", position: 2, name: "Industries", item: "https://tinystickyads.com/industries/retaildsp" },
          { "@type": "ListItem", position: 3, name: "eCommerce Operations", item: PAGE_URL },
        ],
      },
    ]);
    document.head.appendChild(ld);

    return () => {
      document.title = prevTitle;
      if (prevCanonical && canonical) canonical.href = prevCanonical;
      document.getElementById("ecommerce-ops-jsonld")?.remove();
    };
  }, []);
};

/* ============================ SCROLL REVEAL ============================ */
const Reveal = ({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: React.ElementType;
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${
        shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      } ${className}`}
    >
      {children}
    </Tag>
  );
};

/* ============================ DATA ============================ */
const CAPABILITIES = [
  { icon: Cpu, label: "Commerce Technology", desc: "Platforms and internal systems that run online commerce operations." },
  { icon: Monitor, label: "Retail Media", desc: "Advertising surfaces across physical and digital retail environments." },
  { icon: Search, label: "Search Commerce", desc: "Structured discovery systems for organic product visibility." },
  { icon: Megaphone, label: "Digital Advertising", desc: "Ad technology measured against commerce outcomes." },
  { icon: Boxes, label: "Product Information", desc: "Catalog structure, attributes, and syndication pipelines." },
  { icon: BarChart3, label: "Analytics", desc: "Measurement models for demand, conversion, and media." },
  { icon: Store, label: "Marketplace Enablement", desc: "Integrations and operations across marketplace channels." },
  { icon: FileText, label: "SEO Publishing", desc: "Editorial and microsite networks built for search durability." },
  { icon: Sparkles, label: "AI Commerce", desc: "Applied models for catalog, content, and merchandising work." },
];

const SEGMENTS = [
  {
    icon: Cpu,
    title: "Commerce Infrastructure",
    body:
      "Triotag develops proprietary digital platforms that support online commerce operations, digital catalogs, product management, order workflows, and the business infrastructure required to operate at scale.",
  },
  {
    icon: Search,
    title: "Search Commerce",
    body:
      "We build SEO publishing networks and structured search experiences that improve product discoverability and compound long-term organic visibility across search engines and AI answer surfaces.",
  },
  {
    icon: Monitor,
    title: "Retail Media",
    body:
      "Triotag participates in retail media through advertising infrastructure that connects brands with physical and digital retail environments, from in-store placements to networked screens.",
  },
  {
    icon: Megaphone,
    title: "Digital Advertising",
    body:
      "Our advertising technologies are integrated with commerce outcomes — inventory, margin, and sell-through — rather than optimizing solely toward impressions or clicks.",
  },
  {
    icon: FileText,
    title: "Commerce Content",
    body:
      "Structured product information, editorial publishing, buying guides, and content ecosystems form the layer that makes catalogs legible to customers, search engines, and machines.",
  },
  {
    icon: LineChart,
    title: "Commerce Intelligence",
    body:
      "Analytics, reporting, customer insights, and business intelligence that support commercial decision making across channels, categories, and markets.",
  },
];

const ECOSYSTEM_NODES = [
  { label: "Commerce Websites", desc: "Storefronts and transactional properties." },
  { label: "SEO Platforms", desc: "Publishing systems built for organic discovery." },
  { label: "Retail Media", desc: "In-store and networked advertising surfaces." },
  { label: "Advertising Technology", desc: "Delivery, targeting, and attribution systems." },
  { label: "Analytics", desc: "Measurement across media and commerce." },
  { label: "AI Operations", desc: "Applied models across catalog and content." },
  { label: "Product Information", desc: "Structured attributes and syndication." },
  { label: "Marketplace Integrations", desc: "Channel connections and operations." },
  { label: "Business Intelligence", desc: "Reporting for commercial decisions." },
];

const INDUSTRIES = [
  { icon: ShoppingBag, label: "Consumer Goods" },
  { icon: HeartPulse, label: "Health & Wellness" },
  { icon: Utensils, label: "Food & Beverage" },
  { icon: Shirt, label: "Fashion" },
  { icon: Smartphone, label: "Electronics" },
  { icon: Plane, label: "Tourism" },
  { icon: Hotel, label: "Hospitality" },
  { icon: Car, label: "Automotive" },
  { icon: Sofa, label: "Home & Living" },
  { icon: Factory, label: "Manufacturing" },
  { icon: Building2, label: "Retail Chains" },
  { icon: Briefcase, label: "B2B Commerce" },
];

const APPROACH = [
  "Technology",
  "Search",
  "Advertising",
  "Retail Media",
  "Product Data",
  "Analytics",
  "Customer Experience",
];

const ROADMAP = [
  { title: "Retail Media Expansion", desc: "Extending advertising surfaces across additional retail environments and formats." },
  { title: "AI Commerce Technologies", desc: "Applied models for catalog structuring, merchandising, and commerce content." },
  { title: "Commerce Analytics", desc: "Unified measurement across media exposure and commercial performance." },
  { title: "Search Commerce Infrastructure", desc: "Publishing systems engineered for durable organic and AI-surface discovery." },
  { title: "Industry Marketplaces", desc: "Category-specific commerce networks for suppliers, distributors, and merchants." },
  { title: "Cross-border Commerce", desc: "Operational infrastructure for regional trade across Southeast Asia." },
  { title: "Advertising Technology", desc: "Delivery and attribution systems aligned to commerce outcomes." },
  { title: "Digital Infrastructure", desc: "Scalable platform foundations supporting long-term commerce operations." },
];

/* ============================ SECTIONS ============================ */

const Hero = () => (
  <header className="relative overflow-hidden bg-[#05070d]">
    {/* Abstract commerce network background */}
    <div aria-hidden="true" className="absolute inset-0">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(34,197,94,0.16),transparent_60%),radial-gradient(ellipse_at_bottom_right,rgba(59,130,246,0.14),transparent_55%)]" />
      <svg className="absolute inset-0 h-full w-full opacity-[0.35]" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="hero-line" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        {Array.from({ length: 14 }).map((_, i) => (
          <line
            key={i}
            x1={(i * 97) % 1200}
            y1={(i * 53) % 600}
            x2={((i + 5) * 143) % 1200}
            y2={((i + 3) * 89) % 600}
            stroke="url(#hero-line)"
            strokeWidth="1"
          />
        ))}
        {Array.from({ length: 26 }).map((_, i) => (
          <circle key={i} cx={(i * 173) % 1200} cy={(i * 111) % 600} r={i % 4 === 0 ? 4 : 2} fill="#22c55e" opacity="0.5">
            <animate attributeName="opacity" values="0.15;0.7;0.15" dur={`${3 + (i % 5)}s`} repeatCount="indefinite" />
          </circle>
        ))}
        {/* Retail media screens / product cards */}
        {[
          [120, 380],
          [980, 130],
          [820, 430],
        ].map(([x, y], i) => (
          <g key={i} opacity="0.35">
            <rect x={x} y={y} width="120" height="72" rx="8" fill="none" stroke="#3b82f6" strokeWidth="1.2" />
            <rect x={x + 10} y={y + 12} width="52" height="8" rx="4" fill="#22c55e" opacity="0.6" />
            <rect x={x + 10} y={y + 28} width="90" height="6" rx="3" fill="#94a3b8" opacity="0.5" />
            <rect x={x + 10} y={y + 42} width="70" height="6" rx="3" fill="#94a3b8" opacity="0.35" />
          </g>
        ))}
      </svg>
    </div>

    <div className="relative container mx-auto px-4 md:px-6 py-24 md:py-36">
      <nav aria-label="Breadcrumb" className="mb-8">
        <ol className="flex items-center gap-2 text-xs text-zinc-400">
          <li><Link to="/" className="hover:text-green-400">Home</Link></li>
          <li aria-hidden="true">/</li>
          <li>Industries</li>
          <li aria-hidden="true">/</li>
          <li className="text-zinc-200">eCommerce Operations</li>
        </ol>
      </nav>

      <div className="max-w-3xl">
        <Reveal>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white leading-[1.08]">
            Powering Digital Commerce Across Southeast Asia
          </h1>
        </Reveal>
        <Reveal delay={120}>
          <p className="mt-8 text-lg text-zinc-300 leading-relaxed">
            Triotag develops and operates digital commerce infrastructure that enables brands, retailers,
            manufacturers, distributors, and merchants to participate more effectively in the modern eCommerce
            ecosystem.
          </p>
        </Reveal>
        <Reveal delay={220}>
          <p className="mt-5 text-lg text-zinc-400 leading-relaxed">
            Our eCommerce division focuses on building technology platforms, advertising infrastructure, search
            ecosystems, and commerce operations that improve how products are discovered, marketed, distributed,
            and measured across digital sales channels.
          </p>
        </Reveal>
      </div>
    </div>
  </header>
);

const RoleSection = () => (
  <section aria-labelledby="role-heading" className="bg-[#0a0d14] border-t border-white/5">
    <div className="container mx-auto px-4 md:px-6 py-20 md:py-28">
      <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-start">
        <div>
          <Reveal>
            <p className="text-xs uppercase tracking-[0.2em] text-green-500 font-semibold">Our Role in the eCommerce Industry</p>
            <h2 id="role-heading" className="mt-4 text-3xl md:text-4xl font-bold text-white tracking-tight">
              Building Infrastructure for Modern Commerce
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <p className="mt-6 text-zinc-400 leading-relaxed">
              Triotag is not a traditional marketing agency. The company is structured as a commerce technology
              organization that designs, builds, and operates the systems underneath online retail — platforms,
              advertising infrastructure, search ecosystems, product data, and analytics.
            </p>
            <p className="mt-4 text-zinc-400 leading-relaxed">
              That distinction shapes how the work is delivered. Instead of campaign services sold in cycles, the
              output is durable infrastructure: publishing networks, retail media surfaces, catalog systems, and
              measurement models that continue to operate and compound over time.
            </p>
            <p className="mt-4 text-zinc-400 leading-relaxed">
              Each capability is built to interoperate. Search visibility informs media planning, product data feeds
              advertising systems, and analytics closes the loop back to commerce operations.
            </p>
          </Reveal>
        </div>

        <Reveal delay={150}>
          <ul className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {CAPABILITIES.map((c) => (
              <li key={c.label}>
                <div className="group relative h-full rounded-xl border border-white/10 bg-white/[0.02] p-4 overflow-hidden transition-all duration-300 hover:border-green-500/40 hover:bg-white/[0.05] hover:shadow-[0_12px_40px_-16px_rgba(34,197,94,0.5)]">
                  <c.icon className="w-5 h-5 text-green-500" aria-hidden="true" />
                  <h3 className="mt-3 text-sm font-semibold text-zinc-100 leading-snug">{c.label}</h3>
                  <p className="mt-2 text-[11px] leading-relaxed text-zinc-400 max-h-0 opacity-0 transition-all duration-300 group-hover:max-h-24 group-hover:opacity-100">
                    {c.desc}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </div>
  </section>
);

const SegmentsSection = () => (
  <section aria-labelledby="segments-heading" className="bg-[#05070d] border-t border-white/5">
    <div className="container mx-auto px-4 md:px-6 py-20 md:py-28">
      <Reveal>
        <p className="text-xs uppercase tracking-[0.2em] text-green-500 font-semibold">Business Segments</p>
        <h2 id="segments-heading" className="mt-4 text-3xl md:text-4xl font-bold text-white tracking-tight max-w-2xl">
          Six operating areas across the commerce stack
        </h2>
      </Reveal>

      <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {SEGMENTS.map((s, i) => (
          <Reveal key={s.title} delay={i * 70}>
            <article className="group h-full rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.01] p-7 transition-all duration-300 hover:-translate-y-2 hover:border-green-500/40 hover:shadow-[0_24px_60px_-24px_rgba(34,197,94,0.45)]">
              <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400">
                <s.icon className="w-5 h-5" aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-lg font-semibold text-white">{s.title}</h3>
              <p className="mt-3 text-sm text-zinc-400 leading-relaxed">{s.body}</p>
            </article>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);

const EcosystemSection = () => {
  const [active, setActive] = useState<number | null>(null);
  const radius = 210;

  return (
    <section aria-labelledby="ecosystem-heading" className="bg-[#0a0d14] border-t border-white/5">
      <div className="container mx-auto px-4 md:px-6 py-20 md:py-28">
        <Reveal>
          <p className="text-xs uppercase tracking-[0.2em] text-green-500 font-semibold">Technology Ecosystem</p>
          <h2 id="ecosystem-heading" className="mt-4 text-3xl md:text-4xl font-bold text-white tracking-tight max-w-2xl">
            One connected platform layer
          </h2>
        </Reveal>

        <Reveal delay={120}>
          <div className="mt-16 relative mx-auto w-full max-w-[620px] aspect-square">
            <svg className="absolute inset-0 w-full h-full" viewBox="-300 -300 600 600" aria-hidden="true">
              <defs>
                <radialGradient id="core-glow">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                </radialGradient>
              </defs>
              <circle cx="0" cy="0" r="150" fill="url(#core-glow)" />
              <circle cx="0" cy="0" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeDasharray="4 6" />
              {ECOSYSTEM_NODES.map((_, i) => {
                const a = (i / ECOSYSTEM_NODES.length) * Math.PI * 2 - Math.PI / 2;
                const x = Math.cos(a) * radius;
                const y = Math.sin(a) * radius;
                return (
                  <line
                    key={i}
                    x1="0"
                    y1="0"
                    x2={x}
                    y2={y}
                    stroke={active === i ? "#22c55e" : "rgba(148,163,184,0.28)"}
                    strokeWidth={active === i ? 2 : 1}
                    strokeDasharray="6 8"
                  >
                    <animate attributeName="stroke-dashoffset" values="28;0" dur="2.4s" repeatCount="indefinite" />
                  </line>
                );
              })}
            </svg>

            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border border-green-500/40 bg-[#05070d] flex flex-col items-center justify-center text-center shadow-[0_0_60px_-10px_rgba(34,197,94,0.6)]">
              <Network className="w-6 h-6 text-green-400" aria-hidden="true" />
              <span className="mt-2 text-sm font-bold text-white">Triotag</span>
              <span className="text-[10px] text-zinc-400">Commerce Core</span>
            </div>

            {ECOSYSTEM_NODES.map((n, i) => {
              const a = (i / ECOSYSTEM_NODES.length) * Math.PI * 2 - Math.PI / 2;
              const x = 50 + (Math.cos(a) * radius * 100) / 600;
              const y = 50 + (Math.sin(a) * radius * 100) / 600;
              return (
                <button
                  key={n.label}
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                  className="absolute -translate-x-1/2 -translate-y-1/2 w-28 md:w-32 rounded-lg border border-white/10 bg-[#0e131c] px-2 py-2 text-center transition-all duration-300 hover:border-green-500/50 hover:shadow-[0_10px_30px_-12px_rgba(34,197,94,0.6)] outline-none focus-visible:border-green-500"
                  style={{ left: `${x}%`, top: `${y}%` }}
                >
                  <span className="block text-[11px] font-semibold text-zinc-100 leading-tight">{n.label}</span>
                  <span
                    className={`block text-[10px] text-zinc-400 leading-tight transition-all duration-300 ${
                      active === i ? "max-h-16 opacity-100 mt-1" : "max-h-0 opacity-0 overflow-hidden"
                    }`}
                  >
                    {n.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
};

const IndustriesSection = () => (
  <section aria-labelledby="industries-heading" className="bg-[#05070d] border-t border-white/5">
    <div className="container mx-auto px-4 md:px-6 py-20 md:py-28">
      <Reveal>
        <p className="text-xs uppercase tracking-[0.2em] text-green-500 font-semibold">Industries We Support</p>
        <h2 id="industries-heading" className="mt-4 text-3xl md:text-4xl font-bold text-white tracking-tight max-w-2xl">
          Categories operating on commerce infrastructure
        </h2>
      </Reveal>

      <div className="mt-14 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {INDUSTRIES.map((it, i) => (
          <Reveal key={it.label} delay={(i % 4) * 60}>
            <div className="group relative h-full overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-green-500/35 hover:bg-white/[0.05]">
              <svg className="absolute -right-6 -bottom-6 w-28 h-28 opacity-[0.07] transition-opacity duration-300 group-hover:opacity-20" viewBox="0 0 100 100" aria-hidden="true">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#22c55e" strokeWidth="1.5" />
                <circle cx="50" cy="50" r="26" fill="none" stroke="#3b82f6" strokeWidth="1.5" />
                <rect x="36" y="36" width="28" height="28" rx="6" fill="none" stroke="#22c55e" strokeWidth="1.5" />
              </svg>
              <it.icon className="w-6 h-6 text-green-500" aria-hidden="true" />
              <h3 className="relative mt-4 text-sm font-semibold text-zinc-100">{it.label}</h3>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);

const ApproachSection = () => {
  const r = 34;
  return (
    <section aria-labelledby="approach-heading" className="bg-[#0a0d14] border-t border-white/5">
      <div className="container mx-auto px-4 md:px-6 py-20 md:py-28 text-center">
        <Reveal>
          <p className="text-xs uppercase tracking-[0.2em] text-green-500 font-semibold">Our Approach</p>
          <h2 id="approach-heading" className="mt-4 text-3xl md:text-5xl font-bold text-white tracking-tight">
            An Integrated Commerce Ecosystem
          </h2>
          <p className="mt-6 mx-auto max-w-2xl text-zinc-400 leading-relaxed">
            Modern commerce performance is rarely the result of a single discipline. It emerges from the integration
            of technology, search, advertising, retail media, product data, analytics, and customer experience
            operating as one system.
          </p>
        </Reveal>

        <Reveal delay={120}>
          <div className="relative mt-16 mx-auto w-full max-w-[520px] aspect-square">
            <svg className="absolute inset-0 w-full h-full animate-[spin_60s_linear_infinite]" viewBox="0 0 100 100" aria-hidden="true">
              <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(34,197,94,0.25)" strokeDasharray="2 3" />
              <circle cx="50" cy="50" r={r - 12} fill="none" stroke="rgba(59,130,246,0.2)" strokeDasharray="1 4" />
            </svg>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
              <Globe2 className="w-8 h-8 text-green-400 mx-auto" aria-hidden="true" />
              <p className="mt-2 text-sm font-semibold text-white">Commerce<br />Ecosystem</p>
            </div>
            {APPROACH.map((label, i) => {
              const a = (i / APPROACH.length) * Math.PI * 2 - Math.PI / 2;
              return (
                <div
                  key={label}
                  className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-[#0e131c] px-3 py-1.5 text-[11px] font-medium text-zinc-200 transition-colors duration-300 hover:border-green-500/50 hover:text-green-400"
                  style={{ left: `${50 + Math.cos(a) * r}%`, top: `${50 + Math.sin(a) * r}%` }}
                >
                  {label}
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
};

const RoadmapSection = () => (
  <section aria-labelledby="roadmap-heading" className="bg-[#05070d] border-t border-white/5">
    <div className="container mx-auto px-4 md:px-6 py-20 md:py-28">
      <Reveal>
        <p className="text-xs uppercase tracking-[0.2em] text-green-500 font-semibold">Strategic Focus</p>
        <h2 id="roadmap-heading" className="mt-4 text-3xl md:text-4xl font-bold text-white tracking-tight max-w-2xl">
          Areas of continued investment
        </h2>
      </Reveal>

      <ol className="mt-14 relative border-l border-white/10 pl-6 md:pl-10 space-y-8">
        {ROADMAP.map((m, i) => (
          <Reveal key={m.title} delay={i * 60} as="li" className="relative">
            <span
              aria-hidden="true"
              className="absolute -left-[31px] md:-left-[47px] top-1.5 w-3 h-3 rounded-full bg-green-500 shadow-[0_0_0_4px_rgba(34,197,94,0.15)]"
            />
            <h3 className="text-base md:text-lg font-semibold text-white">{m.title}</h3>
            <p className="mt-2 text-sm text-zinc-400 leading-relaxed max-w-2xl">{m.desc}</p>
          </Reveal>
        ))}
      </ol>
    </div>
  </section>
);

const LookingAheadSection = () => (
  <section aria-labelledby="ahead-heading" className="relative overflow-hidden bg-[#0a0d14] border-t border-white/5">
    <div className="container mx-auto px-4 md:px-6 py-20 md:py-28">
      <div className="grid lg:grid-cols-2 gap-14 items-center">
        <div>
          <Reveal>
            <p className="text-xs uppercase tracking-[0.2em] text-green-500 font-semibold">Looking Ahead</p>
            <h2 id="ahead-heading" className="mt-4 text-3xl md:text-4xl font-bold text-white tracking-tight">
              Building the Future of Digital Commerce
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <p className="mt-6 text-zinc-400 leading-relaxed">
              Triotag continues to invest in scalable commerce technologies, retail media infrastructure, search
              commerce platforms, and data-driven digital ecosystems. These investments are directed toward
              sustainable, long-horizon growth across the Philippine and wider Southeast Asian digital economy.
            </p>
            <p className="mt-4 text-zinc-400 leading-relaxed">
              The objective is structural: infrastructure that remains useful as channels, formats, and technologies
              change, and that supports the organizations building on top of it.
            </p>
          </Reveal>
        </div>

        <Reveal delay={150}>
          <div className="relative mx-auto w-full max-w-md aspect-square flex items-center justify-center">
            <style>{`@keyframes tt-globe-spin{from{background-position:0 center}to{background-position:-200% center}}`}</style>
            {/* Ambient glow */}
            <div
              aria-hidden="true"
              className="absolute inset-0 rounded-full blur-3xl opacity-40"
              style={{ background: "radial-gradient(circle at 50% 50%, rgba(34,197,94,0.35), transparent 65%)" }}
            />
            {/* Globe */}
            <div
              role="img"
              aria-label="Rotating globe representing global commerce infrastructure"
              className="relative w-[85%] aspect-square rounded-full overflow-hidden"
              style={{
                backgroundImage: `url(${earthTexture})`,
                backgroundSize: "200% 100%",
                backgroundRepeat: "repeat-x",
                animation: "tt-globe-spin 40s linear infinite",
                boxShadow:
                  "inset 18px 0 38px 10px rgba(0,0,0,0.75), inset -10px 0 26px rgba(0,0,0,0.45), 0 0 60px rgba(34,197,94,0.25)",
              }}
            >
              {/* Sphere shading + specular highlight */}
              <div
                aria-hidden="true"
                className="absolute inset-0 rounded-full"
                style={{
                  background:
                    "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.28), rgba(255,255,255,0.05) 28%, rgba(0,0,0,0.15) 55%, rgba(0,0,0,0.75) 100%)",
                }}
              />
            </div>
            {/* Atmosphere rim */}
            <div
              aria-hidden="true"
              className="absolute w-[85%] aspect-square rounded-full pointer-events-none"
              style={{ boxShadow: "0 0 0 1px rgba(96,165,250,0.35), 0 0 40px 6px rgba(59,130,246,0.25) inset" }}
            />
          </div>
        </Reveal>

      </div>
    </div>
  </section>
);

const DataStrip = () => (
  <section aria-label="Commerce operations overview" className="bg-[#05070d] border-t border-white/5">
    <div className="container mx-auto px-4 md:px-6 py-16">
      <div className="grid md:grid-cols-3 gap-5">
        {[
          { icon: Database, title: "Product Data Systems", desc: "Structured catalogs, attributes, and syndication pipelines across channels." },
          { icon: Monitor, title: "Retail Media Surfaces", desc: "Networked screens and in-store placements measured against commerce outcomes." },
          { icon: BarChart3, title: "Commerce Analytics", desc: "Unified reporting across discovery, media exposure, and conversion." },
        ].map((c, i) => (
          <Reveal key={c.title} delay={i * 80}>
            <div className="h-full rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <c.icon className="w-5 h-5 text-green-500" aria-hidden="true" />
              <h3 className="mt-4 text-sm font-semibold text-white">{c.title}</h3>
              <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{c.desc}</p>
              <svg className="mt-5 w-full h-14" viewBox="0 0 200 50" aria-hidden="true">
                {[8, 24, 16, 34, 28, 42, 36, 46].map((h, k) => (
                  <rect key={k} x={k * 25 + 4} y={50 - h} width="14" height={h} rx="3" fill="#22c55e" opacity={0.25 + k * 0.08} />
                ))}
              </svg>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);

/* ============================ PAGE ============================ */
const EcommerceOperations = () => {
  usePageMetadata();

  return (
    <div className="min-h-screen bg-[#05070d]">
      <Navigation />
      <main>
        <Hero />
        <RoleSection />
        <SegmentsSection />
        <EcosystemSection />
        <IndustriesSection />
        <ApproachSection />
        <DataStrip />
        <RoadmapSection />
        <LookingAheadSection />
      </main>
      <Footer />
    </div>
  );
};

export default EcommerceOperations;
