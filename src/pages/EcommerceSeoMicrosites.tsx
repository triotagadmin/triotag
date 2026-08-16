import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  ArrowRight,
  ArrowLeft,
  Search,
  BarChart3,
  Globe,
  Zap,
  CheckCircle2,
  TrendingUp,
  Users,
  Sparkles,
  Award,
  ShoppingCart,
  ShoppingBag,
  Store,
  Package,
  LineChart,
  Layers,
  FileSearch,
  Rocket,
  ShieldCheck,
  Loader2,
  Quote,
  Gauge,
  Braces,
} from "lucide-react";

const PAGE_URL = "https://triotag.com/services/ecommerce-seo";
const PAGE_TITLE = "eCommerce SEO Microsites | Triotag";
const PAGE_DESCRIPTION =
  "Generate more organic traffic and online sales with professionally built eCommerce SEO Microsites. We create high-ranking product-focused websites that attract customers from Google Search.";

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
    ld.id = "ecommerce-seo-jsonld";
    ld.textContent = JSON.stringify([
      {
        "@context": "https://schema.org",
        "@type": "Service",
        name: "eCommerce SEO Microsites",
        serviceType: "eCommerce SEO Microsites",
        url: PAGE_URL,
        description: PAGE_DESCRIPTION,
        areaServed: "PH",
        provider: { "@type": "Organization", name: "Triotag", url: "https://triotag.com" },
        offers: [
          {
            "@type": "Offer",
            name: "Starter",
            price: "49888",
            priceCurrency: "PHP",
            description: "15 SEO Microsites per month",
          },
          {
            "@type": "Offer",
            name: "Growth",
            price: "89888",
            priceCurrency: "PHP",
            description: "50 SEO Microsites per month",
          },
          {
            "@type": "Offer",
            name: "Enterprise",
            price: "189888",
            priceCurrency: "PHP",
            description: "100 SEO Microsites per month",
          },
        ],
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://triotag.com/" },
          { "@type": "ListItem", position: 2, name: "Services", item: "https://triotag.com/services" },
          { "@type": "ListItem", position: 3, name: "eCommerce SEO Microsites", item: PAGE_URL },
        ],
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ]);
    document.head.appendChild(ld);

    return () => {
      document.title = prevTitle;
      if (prevCanonical && canonical) canonical.href = prevCanonical;
      document.getElementById("ecommerce-seo-jsonld")?.remove();
    };
  }, []);
};

/* ============================== BREADCRUMBS ============================== */
const Breadcrumbs = () => (
  <nav aria-label="Breadcrumb" className="bg-[#0c0c0c] border-b border-white/5">
    <ol className="container mx-auto px-4 md:px-6 py-3 flex items-center gap-2 text-xs text-zinc-500">
      <li>
        <Link to="/" className="hover:text-green-500">
          Home
        </Link>
      </li>
      <li aria-hidden>/</li>
      <li>
        <Link to="/services" className="hover:text-green-500">
          Services
        </Link>
      </li>
      <li aria-hidden>/</li>
      <li className="text-zinc-300">eCommerce SEO Microsites</li>
    </ol>
  </nav>
);

/* ============================ ANALYTICS PANEL ============================ */
const analyticsStats = [
  { icon: Users, label: "Organic Visitors", value: "184,920", delta: "+212%" },
  { icon: ShoppingBag, label: "Monthly Orders", value: "3,486", delta: "+147%" },
  { icon: LineChart, label: "Revenue", value: "₱6.4M", delta: "+189%" },
  { icon: TrendingUp, label: "Conversion Rate", value: "4.7%", delta: "+1.9pts" },
];

const keywordRankings = [
  { kw: "buy running shoes online", pos: 1 },
  { kw: "organic skincare set ph", pos: 2 },
  { kw: "wireless earbuds sale", pos: 3 },
  { kw: "home coffee brewer kit", pos: 4 },
];

const StorefrontPreview = () => (
  <div className="relative w-full max-w-md mx-auto">
    {/* Floating store preview */}
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-5 shadow-2xl animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
        <span className="ml-3 text-[10px] font-mono text-zinc-500 truncate">microsite.com/best-running-shoes</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[Package, ShoppingBag, Store].map((I, i) => (
          <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-2">
            <div className="h-12 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
              <I className="w-5 h-5 text-green-400" />
            </div>
            <div className="h-1.5 w-3/4 rounded bg-white/15" />
            <div className="h-1.5 w-1/2 rounded bg-green-500/40" />
          </div>
        ))}
      </div>
    </div>

    {/* Floating SEO analytics dashboard */}
    <div className="mt-5 rounded-2xl border border-green-500/20 bg-[#0f0f0f]/90 backdrop-blur-sm p-5 shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-mono uppercase tracking-widest text-green-400">SEO Analytics</span>
        <BarChart3 className="w-4 h-4 text-green-500" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {analyticsStats.map((s) => (
          <div key={s.label} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-zinc-500">
              <s.icon className="w-3 h-3 text-green-500" />
              {s.label}
            </div>
            <div className="text-lg font-extrabold text-white mt-1">{s.value}</div>
            <div className="text-[11px] font-semibold text-green-400">{s.delta}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-3">
        <div className="text-[10px] uppercase tracking-wide text-zinc-500 mb-2 flex items-center gap-1.5">
          <Search className="w-3 h-3 text-green-500" /> Keyword Rankings
        </div>
        <ul className="space-y-1.5">
          {keywordRankings.map((k) => (
            <li key={k.kw} className="flex items-center justify-between text-xs">
              <span className="text-zinc-400 truncate pr-2">{k.kw}</span>
              <span className="shrink-0 px-1.5 py-0.5 rounded bg-green-500/15 text-green-400 font-mono font-bold">
                #{k.pos}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </div>
);

/* ================================= HERO ================================= */
const Hero = ({ onBook }: { onBook: () => void }) => (
  <section className="relative bg-[#0c0c0c] text-white overflow-hidden">
    <div className="absolute inset-0 bg-grid-dark opacity-30 pointer-events-none" />
    <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-green-500/10 rounded-full blur-[120px]" />
    <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-green-600/10 rounded-full blur-[100px]" />

    <div className="container mx-auto px-4 md:px-6 py-20 md:py-28 relative">
      <div className="grid lg:grid-cols-2 gap-14 items-center">
        <div className="space-y-6 text-center lg:text-left">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] font-display">
            More Rankings. <span className="text-green-500">More Sales. More Customers.</span>
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
            SEO tools built inside your Microsite, designed to rank product keywords and generate consistent organic
            sales.
          </p>
          <div className="flex flex-col sm:flex-row items-center lg:justify-start justify-center gap-3 pt-2">
            <Button size="lg" onClick={onBook} className="bg-green-600 hover:bg-green-500 text-white px-8">
              Book our SEO services <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <a href="#pricing">
              <Button
                size="lg"
                variant="outline"
                className="border-green-500 text-green-500 hover:bg-green-500/10 px-8"
              >
                See Packages
              </Button>
            </a>
          </div>
        </div>
        <StorefrontPreview />
      </div>
    </div>
  </section>
);

/* ============================== BENEFITS ============================== */
const benefits = [
  {
    icon: Search,
    title: "Rank Product Keywords",
    description:
      "Every microsite targets a tight cluster of buyer-intent product keywords, with schema, internal linking, and on-page structure engineered to win page-one positions.",
  },
  {
    icon: TrendingUp,
    title: "Increase Organic Traffic",
    description:
      "Instead of one site fighting for everything, dozens of focused microsites capture long-tail searches and compound your organic sessions month after month.",
  },
  {
    icon: ShoppingCart,
    title: "Sell More Products",
    description:
      "Each microsite is a conversion-first product page: fast, mobile-optimized, review-rich, and wired directly to your checkout or marketplace listing.",
  },
  {
    icon: Rocket,
    title: "Scale Your eCommerce Brand",
    description:
      "Add new SKUs, categories, and cities every month. Your microsite network grows into a durable organic acquisition channel you own outright.",
  },
];

const Benefits = () => (
  <section className="bg-white py-20 md:py-28 text-zinc-900">
    <div className="container mx-auto px-4 md:px-6">
      <div className="text-center max-w-3xl mx-auto mb-14">
        <h2 className="text-3xl md:text-5xl font-extrabold mb-4">
          Built to Rank. <span className="text-green-600">Built to Sell.</span>
        </h2>
        <p className="text-zinc-500 text-base md:text-lg">
          Product-focused microsites that turn Google Search into your most reliable sales channel.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {benefits.map((b) => (
          <div
            key={b.title}
            className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-6 space-y-4 hover:shadow-lg transition-shadow"
          >
            <div className="w-12 h-12 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center">
              <b.icon className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-extrabold text-zinc-900">{b.title}</h3>
            <p className="text-sm text-zinc-500 leading-relaxed">{b.description}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ============================= SERVICES GRID ============================= */
const services = [
  {
    icon: Layers,
    title: "Microsite Builds",
    tagline: "Product · Category · Location",
    description:
      "We design and publish conversion-ready microsites for each of your priority products and categories — fully indexed, schema-marked, and Core Web Vitals clean from day one.",
    bullets: [
      "Keyword-to-microsite mapping",
      "Product schema & rich-result markup",
      "Core Web Vitals optimized templates",
      "Mobile-first conversion layouts",
      "Direct checkout / marketplace linking",
    ],
  },
  {
    icon: FileSearch,
    title: "Technical eCommerce SEO",
    tagline: "Crawl · Index · Authority",
    description:
      "Behind every microsite is a technical foundation: clean crawl paths, canonical hygiene, structured data, and authority links that push product pages up the SERP.",
    bullets: [
      "Crawl & index audits per microsite",
      "Canonical, hreflang & duplicate control",
      "Internal link architecture",
      "Authority link building & digital PR",
      "Google Search Console monitoring",
    ],
  },
  {
    icon: Sparkles,
    title: "Content & AI Search",
    tagline: "Buyer Intent · AEO · Reviews",
    description:
      "Product copy, comparison content, and FAQ hubs written for shoppers and for AI answer engines, so your store is the cited recommendation in ChatGPT, Gemini, and Perplexity.",
    bullets: [
      "Buyer-intent product copywriting",
      "Comparison & buying-guide content",
      "FAQ hubs optimized for AI answers",
      "Review & UGC schema integration",
      "Monthly content refresh cycles",
    ],
  },
];

const ServicesGrid = () => (
  <section className="bg-zinc-50 py-20 md:py-28 text-zinc-900">
    <div className="container mx-auto px-4 md:px-6">
      <div className="text-center max-w-3xl mx-auto mb-14">
        <h2 className="text-3xl md:text-5xl font-extrabold mb-4">
          Three Layers. <span className="text-green-600">One Organic Engine.</span>
        </h2>
        <p className="text-zinc-500 text-base md:text-lg">
          Microsite builds, technical SEO, and buyer-intent content — managed end-to-end by Triotag.
        </p>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {services.map((s) => {
          const I = s.icon;
          return (
            <div
              key={s.title}
              className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden hover:shadow-lg transition-shadow p-6 space-y-5"
            >
              <div className="w-12 h-12 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center">
                <I className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-zinc-900">{s.title}</h3>
                <p className="text-sm font-semibold text-green-600 mt-1">{s.tagline}</p>
              </div>
              <p className="text-sm text-zinc-500 leading-relaxed">{s.description}</p>
              <ul className="space-y-2">
                {s.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm text-zinc-700">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  </section>
);

/* ========================= AI SEO ENGINE ========================= */

const aiFeatures = [
  {
    icon: Sparkles,
    title: "AI Content Generation",
    tagline: "Copy · Outlines · FAQs",
    description:
      "AI writes product copy, meta titles and descriptions, and FAQ content tuned for both real shoppers and AI search engines — then keeps it fresh as your catalog changes.",
    bullets: [
      "SEO title & meta description generation",
      "Auto-generated FAQ blocks",
      "Outline & H1/H2 structure generation",
      "Rewrite, expand & shorten tools",
    ],
  },
  {
    icon: Gauge,
    title: "Live AI SEO Scoring",
    tagline: "Real-Time · 0-100 Score",
    description:
      "Every microsite page is scored in real time against title, meta, headings, keyword placement, readability, and internal linking — with actionable fixes surfaced instantly.",
    bullets: [
      "Real-time 0-100 SEO score",
      "Keyword density & placement checks",
      "Readability & structure analysis",
      "Actionable fix recommendations",
    ],
  },
  {
    icon: Search,
    title: "AI Keyword & Competitor Research",
    tagline: "Intent · Gaps · Trends",
    description:
      "AI surfaces primary, secondary, and long-tail keywords, classifies search intent, and maps content gaps against the competitors currently ranking above you.",
    bullets: [
      "Primary & long-tail keyword discovery",
      "Search intent classification",
      "Competitor content gap analysis",
      "Trending topic surfacing",
    ],
  },
  {
    icon: Braces,
    title: "Automated Schema & Rich Results",
    tagline: "Structured Data · Auto-Generated",
    description:
      "Product, FAQ, Review, and Article schema is generated automatically for every microsite, so your pages qualify for rich results without anyone hand-writing markup.",
    bullets: [
      "Auto-generated Product/FAQ/Review schema",
      "Rich snippet eligibility checks",
      "Breadcrumb & Organization markup",
      "Validated structured data on every page",
    ],
  },
];

const AiSeoEngine = () => (
  <section className="bg-white py-20 md:py-28 text-zinc-900">
    <div className="container mx-auto px-4 md:px-6">
      <div className="text-center max-w-3xl mx-auto mb-14">
        <h2 className="text-3xl md:text-5xl font-extrabold mb-4">
          Built On An <span className="text-green-600">AI SEO Engine</span>
        </h2>
        <p className="text-zinc-500 text-base md:text-lg">
          Every microsite is optimized continuously by AI — scored, rewritten, and re-marked up as search shifts, not
          just built once and left behind.
        </p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {aiFeatures.map((s) => {
          const I = s.icon;
          return (
            <div
              key={s.title}
              className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden hover:shadow-lg transition-shadow p-6 space-y-5"
            >
              <div className="w-12 h-12 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center">
                <I className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-zinc-900">{s.title}</h3>
                <p className="text-sm font-semibold text-green-600 mt-1">{s.tagline}</p>
              </div>
              <p className="text-sm text-zinc-500 leading-relaxed">{s.description}</p>
              <ul className="space-y-2">
                {s.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm text-zinc-700">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  </section>
);

/* ========================= HOW MICROSITES WORK ========================= */
const microsteFlow = [
  { icon: Search, label: "Buyer searches a product keyword" },
  { icon: Globe, label: "Your microsite ranks on page one" },
  { icon: Zap, label: "Fast, conversion-first product page", isCenter: true },
  { icon: ShoppingCart, label: "Shopper adds to cart" },
  { icon: TrendingUp, label: "Consistent organic revenue" },
];

const networkFeatures = [
  {
    icon: Package,
    title: "One Microsite Per Product Cluster",
    description: "Focused pages beat bloated catalogs — each site owns a single tight keyword theme.",
  },
  {
    icon: Users,
    title: "Buyer-Intent Traffic Only",
    description: "We target transactional queries, not vanity terms, so visitors arrive ready to purchase.",
  },
  {
    icon: BarChart3,
    title: "Live Ranking Dashboards",
    description: "Track positions, organic visitors, orders, and revenue per microsite in real time.",
  },
  {
    icon: ShieldCheck,
    title: "White-Hat & Durable",
    description: "No spam tactics. Clean technical builds and real content that survive core updates.",
  },
];

const trustBadges = [
  { icon: Search, label: "Product Keyword Focus" },
  { icon: CheckCircle2, label: "Conversion-Ready Builds" },
  { icon: ShieldCheck, label: "Transparent Reporting" },
  { icon: TrendingUp, label: "Compounding Organic Growth" },
];

const HowItWorks = () => (
  <section className="relative bg-[#0c0c0c] text-white overflow-hidden border-t border-white/5">
    <div className="absolute inset-0 bg-grid-dark opacity-20 pointer-events-none" />
    <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-green-500/10 rounded-full blur-[130px] pointer-events-none" />
    <div className="container mx-auto px-4 md:px-6 py-20 md:py-28 relative">
      <div className="grid lg:grid-cols-2 gap-14 items-center mb-24">
        <div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-[1.1] font-display mb-4">
            Own page one. <span className="text-green-500">For every product you sell.</span>
          </h2>
          <span className="inline-block text-xs font-semibold tracking-wider uppercase text-green-400 mb-4">
            The Microsite Network Model
          </span>
          <p className="text-zinc-400 leading-relaxed mb-10 max-w-xl">
            A single store page can only rank for so much. We build a network of focused microsites — each engineered
            around one product keyword cluster — so your brand occupies more of the search results and captures demand
            your competitors miss.
          </p>
          <div className="space-y-7">
            {benefits.slice(0, 3).map((f) => (
              <div key={f.title} className="flex gap-4">
                <div className="shrink-0 w-11 h-11 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                  <f.icon className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1">{f.title}</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
          <div className="text-[10px] font-mono uppercase tracking-widest text-green-400">Live SERP Snapshot</div>
          {keywordRankings.map((k) => (
            <div key={k.kw} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-zinc-200 truncate pr-3">{k.kw}</span>
                <span className="shrink-0 text-xs font-mono font-bold text-green-400 bg-green-500/15 px-2 py-0.5 rounded">
                  #{k.pos}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-green-500 transition-all"
                  style={{ width: `${100 - (k.pos - 1) * 15}%` }}
                />
              </div>
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3 pt-2">
            {analyticsStats.slice(0, 2).map((s) => (
              <div key={s.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <div className="text-[10px] uppercase tracking-wide text-zinc-500">{s.label}</div>
                <div className="text-lg font-extrabold text-white">{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 md:p-10 mb-16">
        <p className="text-center text-xs font-semibold tracking-widest uppercase text-green-400 mb-8">
          From Search Query to Sale
        </p>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {microsteFlow.map((step, i) => (
            <div key={step.label} className="flex items-center gap-6">
              <div className="flex flex-col items-center text-center gap-3 w-28">
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center border ${
                    step.isCenter
                      ? "bg-green-500 border-green-400 shadow-[0_0_25px_rgba(34,197,94,0.5)]"
                      : "bg-white/5 border-white/10"
                  }`}
                >
                  <step.icon className={`w-6 h-6 ${step.isCenter ? "text-black" : "text-green-500"}`} />
                </div>
                <span className={`text-xs leading-tight ${step.isCenter ? "text-white font-bold" : "text-zinc-400"}`}>
                  {step.label}
                </span>
              </div>
              {i < microsteFlow.length - 1 && <ArrowRight className="hidden md:block w-4 h-4 text-zinc-600 shrink-0" />}
            </div>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
        {networkFeatures.map((f) => (
          <div
            key={f.title}
            className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] hover:border-green-500/30 transition-colors"
          >
            <div className="w-11 h-11 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center justify-center mb-4">
              <f.icon className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="font-bold text-white mb-2">{f.title}</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">{f.description}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row items-center justify-between gap-8 pt-10 border-t border-white/10">
        <div className="text-center lg:text-left">
          <h3 className="text-2xl font-extrabold">
            Rank more products. <span className="text-green-500">Sell more online.</span>
          </h3>
          <p className="text-zinc-400 mt-2 max-w-md">
            Build an organic sales channel you own — no ad spend required to keep it running.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
          {trustBadges.map((b) => (
            <div key={b.label} className="flex items-center gap-2 text-sm text-zinc-400">
              <b.icon className="w-4 h-4 text-green-500 shrink-0" />
              {b.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

/* ============================= PRICING ============================= */
const packages = [
  {
    name: "Starter",
    price: "₱49,888",
    period: "\n",
    volume: "15 SEO Microsites",
    description: "For growing online stores publishing their first product-keyword microsite network.",
    features: [
      "15 SEO microsites per month",
      "Keyword-to-product mapping",
      "Product schema & rich results",
      "Core Web Vitals optimized builds",
      "Monthly ranking & traffic report",
    ],
    cta: "Get Started",
    highlight: false,
  },
  {
    name: "Growth",
    price: "₱89,888",
    period: "\n",
    volume: "50 SEO Microsites",
    description: "For eCommerce brands scaling category coverage and organic order volume.",
    features: [
      "50 SEO microsites per month",
      "Full technical SEO audit + fixes",
      "Buying-guide & comparison content",
      "Authority link building",
      "AEO optimization for AI answers",
      "Bi-weekly reporting & strategy calls",
    ],
    cta: "Book a Call",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "₱189,888",
    period: "\n",
    volume: "100 SEO Microsites",
    description: "Category-domination scale for multi-SKU retailers and marketplace sellers.",
    features: [
      "100 SEO microsites per month",
      "Multi-brand & multi-city coverage",
      "Advanced entity & AEO optimization",
      "Digital PR & premium link placements",
      "Dedicated SEO strategist",
      "Weekly reporting & live dashboard",
    ],
    cta: "Talk to Sales",
    highlight: false,
  },
];

const Pricing = () => (
  <section id="pricing" className="bg-white py-20 md:py-28 text-zinc-900">
    <div className="container mx-auto px-4 md:px-6">
      <div className="text-center max-w-3xl mx-auto mb-14">
        <h2 className="text-3xl md:text-5xl font-extrabold mb-4">
          Microsite Packages, <span className="text-green-600">Transparent Pricing</span>
        </h2>
        <p className="text-zinc-500 text-base md:text-lg">
          Flat monthly fees based on microsite volume. Hosting, content, and technical SEO included — no hidden
          commissions.
        </p>
      </div>
      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {packages.map((pkg) => (
          <div
            key={pkg.name}
            className={`rounded-2xl border p-8 space-y-6 ${
              pkg.highlight
                ? "border-green-500 bg-white shadow-lg shadow-green-500/10 ring-1 ring-green-500"
                : "border-zinc-200 bg-white"
            }`}
          >
            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-zinc-900">{pkg.name}</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-zinc-900">{pkg.price}</span>
                <span className="text-sm text-zinc-500 whitespace-pre-line">{pkg.period}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 border border-green-100 text-xs font-semibold text-green-700">
                <Layers className="w-3.5 h-3.5" /> {pkg.volume}
              </div>
              <p className="text-sm text-zinc-500 leading-relaxed">{pkg.description}</p>
            </div>
            <ul className="space-y-3">
              {pkg.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-zinc-700">
                  <CheckCircle2
                    className={`w-4 h-4 mt-0.5 shrink-0 ${pkg.highlight ? "text-green-600" : "text-zinc-400"}`}
                  />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link to="/contact" className="block">
              <Button
                className={`w-full ${
                  pkg.highlight
                    ? "bg-green-600 hover:bg-green-500 text-white"
                    : "bg-zinc-900 hover:bg-zinc-800 text-white"
                }`}
              >
                {pkg.cta}
              </Button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ============================= CASE STUDIES ============================= */
const caseStudies = [
  {
    metric: "+312%",
    label: "Organic Revenue",
    title: "Footwear Retailer — 60 Microsites",
    desc: "Mapped 60 buyer-intent product keywords to dedicated microsites with product schema and review markup. Organic revenue tripled in 5 months without any additional ad spend.",
    tags: ["Microsites", "Product Schema", "Rich Results"],
  },
  {
    metric: "+186%",
    label: "Organic Traffic",
    title: "Beauty Brand — Category Clusters",
    desc: "Built category and comparison microsites around 40 long-tail skincare queries, fixed Core Web Vitals, and launched buying guides. Organic sessions nearly tripled within 6 months.",
    tags: ["Technical SEO", "Content", "Core Web Vitals"],
  },
  {
    metric: "4.7%",
    label: "Conversion Rate",
    title: "Home Goods Store — Conversion Rebuild",
    desc: "Rebuilt 25 product microsites with faster mobile templates, trust signals, and one-tap checkout links. Conversion rate rose from 1.8% to 4.7% on the same traffic.",
    tags: ["CRO", "Mobile", "Checkout"],
  },
];

const CaseStudies = () => (
  <section className="bg-zinc-50 py-20 md:py-28 text-zinc-900">
    <div className="container mx-auto px-4 md:px-6">
      <div className="text-center max-w-3xl mx-auto mb-14">
        <h2 className="text-3xl md:text-5xl font-extrabold mb-4">
          Results That <span className="text-green-600">Speak</span>
        </h2>
        <p className="text-zinc-500 text-base md:text-lg">
          Recent eCommerce wins across rankings, organic traffic, and online sales.
        </p>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {caseStudies.map((cs) => (
          <div
            key={cs.title}
            className="bg-white rounded-2xl border border-zinc-100 p-8 space-y-5 hover:shadow-lg transition-shadow"
          >
            <div className="space-y-1">
              <div className="text-4xl font-extrabold text-green-600">{cs.metric}</div>
              <div className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">{cs.label}</div>
            </div>
            <h3 className="text-lg font-bold text-zinc-900">{cs.title}</h3>
            <p className="text-sm text-zinc-500 leading-relaxed">{cs.desc}</p>
            <div className="flex flex-wrap gap-2 pt-1">
              {cs.tags.map((t) => (
                <span
                  key={t}
                  className="px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium border border-green-100"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ============================= TESTIMONIALS ============================= */
const testimonials = [
  {
    quote:
      "We went from invisible to page one for our best-selling SKUs. The microsites now bring in more orders than our paid campaigns ever did.",
    name: "Marielle Santos",
    role: "Founder, Luxe Skincare PH",
  },
  {
    quote:
      "Triotag's microsite network gave us organic coverage across 80 product keywords. Monthly orders more than doubled in one quarter.",
    name: "Dan Villanueva",
    role: "eCommerce Head, UrbanFit Gear",
  },
  {
    quote:
      "Clear reporting, real rankings, real revenue. It's the first SEO engagement where I could actually trace sales back to the work.",
    name: "Karla Reyes",
    role: "Marketing Director, HomeNest",
  },
];

const Testimonials = () => (
  <section className="bg-white py-20 md:py-28 text-zinc-900">
    <div className="container mx-auto px-4 md:px-6">
      <div className="text-center max-w-3xl mx-auto mb-14">
        <h2 className="text-3xl md:text-5xl font-extrabold mb-4">
          What eCommerce <span className="text-green-600">Brands Say</span>
        </h2>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {testimonials.map((t) => (
          <figure
            key={t.name}
            className="rounded-2xl border border-zinc-100 bg-zinc-50 p-8 space-y-5 hover:shadow-lg transition-shadow"
          >
            <Quote className="w-7 h-7 text-green-600" />
            <blockquote className="text-sm text-zinc-700 leading-relaxed">“{t.quote}”</blockquote>
            <figcaption>
              <div className="font-bold text-zinc-900 text-sm">{t.name}</div>
              <div className="text-xs text-zinc-500">{t.role}</div>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  </section>
);

/* ================================= FAQ ================================= */
const faqs = [
  {
    q: "What exactly is an eCommerce SEO microsite?",
    a: "A microsite is a focused, standalone web page or small site built around one product keyword cluster. It carries conversion-first design, product schema, and buyer-intent content, and links directly to your checkout or marketplace listing.",
  },
  {
    q: "How is this different from optimizing my existing store?",
    a: "We still fix your core store's technical SEO, but a single catalog can only rank for a limited set of terms. Microsites let you cover many more long-tail, high-intent queries in parallel, so your brand occupies more of the search results.",
  },
  {
    q: "How long before I see rankings and sales?",
    a: "Most clients see first-page movement on long-tail product keywords within 6 to 10 weeks, with meaningful organic order volume building from month three onward as the microsite network compounds.",
  },
  {
    q: "Do you write the product content?",
    a: "Yes. Every package includes buyer-intent product copy, comparison content, and FAQ sections written for shoppers and for AI answer engines like ChatGPT, Gemini, and Perplexity.",
  },
  {
    q: "Is hosting included in the monthly fee?",
    a: "Yes. Hosting, maintenance, performance monitoring, and Core Web Vitals upkeep for every microsite are included in your monthly package.",
  },
  {
    q: "Can I use this with Shopify, WooCommerce, or Lazada and Shopee?",
    a: "Absolutely. Microsites are platform-agnostic. We route traffic to whichever storefront, product page, or marketplace listing converts best for you.",
  },
];

const FAQ = () => (
  <section className="bg-zinc-50 py-20 md:py-28 text-zinc-900">
    <div className="container mx-auto px-4 md:px-6 max-w-3xl">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-5xl font-extrabold mb-4">
          Frequently Asked <span className="text-green-600">Questions</span>
        </h2>
      </div>
      <Accordion type="single" collapsible className="space-y-3">
        {faqs.map((f, i) => (
          <AccordionItem key={f.q} value={`item-${i}`} className="rounded-2xl border border-zinc-200 bg-white px-5">
            <AccordionTrigger className="text-left font-bold text-zinc-900 hover:no-underline">{f.q}</AccordionTrigger>
            <AccordionContent className="text-sm text-zinc-500 leading-relaxed">{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  </section>
);

/* ============================= WHY US ============================= */
const whyItems = [
  { icon: Search, label: "Buyer-Intent Keyword Focus" },
  { icon: BarChart3, label: "Data-Driven Decisions" },
  { icon: Globe, label: "Local & National Coverage" },
  { icon: Zap, label: "Fast Microsite Turnaround" },
  { icon: Users, label: "Dedicated SEO Strategist" },
  { icon: Award, label: "Proven Track Record" },
];

const WhyUs = () => (
  <section className="bg-[#0c0c0c] py-20 md:py-28 text-white">
    <div className="container mx-auto px-4 md:px-6">
      <div className="text-center max-w-3xl mx-auto mb-14">
        <h2 className="text-3xl md:text-5xl font-extrabold mb-4">
          Why Brands Choose <span className="text-green-500">Triotag</span>
        </h2>
        <p className="text-zinc-400 text-base md:text-lg">
          We combine retail commerce expertise with technical SEO precision and organic search authority.
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
        {whyItems.map((it) => {
          const I = it.icon;
          return (
            <div
              key={it.label}
              className="text-center space-y-3 p-6 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
            >
              <div className="w-12 h-12 mx-auto rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                <I className="w-5 h-5 text-green-400" />
              </div>
              <div className="text-sm font-semibold text-zinc-200 leading-tight">{it.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  </section>
);

/* ============================= FINAL CTA ============================= */
const FinalCTA = ({ onBook }: { onBook: () => void }) => (
  <section className="bg-zinc-50 py-20 md:py-28 text-zinc-900">
    <div className="container mx-auto px-4 md:px-6">
      <div className="max-w-3xl mx-auto text-center space-y-6">
        <h2 className="text-3xl md:text-5xl font-extrabold">
          Ready to Own the <span className="text-green-600">Search Results?</span>
        </h2>
        <p className="text-zinc-500 text-base md:text-lg max-w-xl mx-auto">
          Book a free 30-minute SEO audit. We'll review your product keywords, rankings, and organic sales potential —
          then map the microsite network to get you there.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button size="lg" onClick={onBook} className="bg-green-600 hover:bg-green-500 text-white px-8">
            Get a Free SEO Audit <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  </section>
);

/* ============================= BOOKING WIZARD ============================= */
const SERVICE_OPTIONS = ["eCommerce SEO Microsites", "Technical eCommerce SEO", "Content & AI Search (AEO)"];

const BUDGET_OPTIONS = ["Under ₱50,000", "₱50,000 – ₱100,000", "₱100,000 – ₱200,000", "₱200,000+"];

interface BookingForm {
  companyName: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  servicesInterested: string[];
  monthlyBudget: string;
  targetAreas: string;
  preferredStartDate: string;
  additionalNotes: string;
}

const emptyForm: BookingForm = {
  companyName: "",
  contactPerson: "",
  contactEmail: "",
  contactPhone: "",
  website: "",
  servicesInterested: [],
  monthlyBudget: "",
  targetAreas: "",
  preferredStartDate: "",
  additionalNotes: "",
};

const BookingWizard = ({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<BookingForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof BookingForm>(k: K, v: BookingForm[K]) => setForm((f) => ({ ...f, [k]: v }));

  const toggleService = (s: string) =>
    setForm((f) => ({
      ...f,
      servicesInterested: f.servicesInterested.includes(s)
        ? f.servicesInterested.filter((x) => x !== s)
        : [...f.servicesInterested, s],
    }));

  const reset = () => {
    setStep(1);
    setForm(emptyForm);
    setSubmitting(false);
    setSubmitted(false);
    setError(null);
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail);

  const canNext = () => {
    if (step === 1)
      return form.companyName.trim() && form.contactPerson.trim() && emailValid && form.contactPhone.trim();
    if (step === 2) return form.servicesInterested.length > 0;
    if (step === 3) return true;
    return true;
  };

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("send-google-ads-booking", { body: form });
      if (fnError) throw fnError;
      if (data && (data as any).success === false) {
        throw new Error((data as any).error || "Submission failed");
      }
      setSubmitted(true);
      toast({ title: "Request sent", description: "We'll be in touch within 1 business day." });
    } catch (e: any) {
      setError(e?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const progress = (step / 4) * 100;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl bg-[#0c0c0c] border-white/10 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">{submitted ? "Audit Request Sent" : "Get a Free SEO Audit"}</DialogTitle>
          <DialogDescription className="text-zinc-400">
            {submitted ? "Thanks — we'll be in touch within 1 business day." : `Step ${step} of 4`}
          </DialogDescription>
        </DialogHeader>

        {!submitted && <Progress value={progress} className="h-1.5 bg-white/10 [&>div]:bg-green-500" />}

        {submitted ? (
          <div className="py-8 text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-zinc-300">
              Your audit request has been sent to our team. We'll reach out to{" "}
              <span className="text-green-400 font-semibold">{form.contactEmail}</span> within 1 business day.
            </p>
            <Button onClick={() => handleOpenChange(false)} className="bg-green-600 hover:bg-green-500 text-white">
              Close
            </Button>
          </div>
        ) : (
          <div className="space-y-5 py-2">
            {step === 1 && (
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="companyName" className="text-zinc-300">
                    Company Name *
                  </Label>
                  <Input
                    id="companyName"
                    value={form.companyName}
                    onChange={(e) => update("companyName", e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="contactPerson" className="text-zinc-300">
                    Contact Person *
                  </Label>
                  <Input
                    id="contactPerson"
                    value={form.contactPerson}
                    onChange={(e) => update("contactPerson", e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="contactEmail" className="text-zinc-300">
                    Contact Email *
                  </Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={form.contactEmail}
                    onChange={(e) => update("contactEmail", e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                  {form.contactEmail && !emailValid && (
                    <span className="text-xs text-red-400">Enter a valid email address</span>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="contactPhone" className="text-zinc-300">
                    Contact Phone *
                  </Label>
                  <Input
                    id="contactPhone"
                    value={form.contactPhone}
                    onChange={(e) => update("contactPhone", e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="website" className="text-zinc-300">
                    Store URL (optional)
                  </Label>
                  <Input
                    id="website"
                    value={form.website}
                    onChange={(e) => update("website", e.target.value)}
                    placeholder="https://"
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <p className="text-sm text-zinc-400">Select all services you're interested in (at least one).</p>
                {SERVICE_OPTIONS.map((s) => (
                  <label
                    key={s}
                    className="flex items-center gap-3 p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:border-green-500/30 cursor-pointer"
                  >
                    <Checkbox checked={form.servicesInterested.includes(s)} onCheckedChange={() => toggleService(s)} />
                    <span className="text-white font-medium">{s}</span>
                  </label>
                ))}
              </div>
            )}

            {step === 3 && (
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label className="text-zinc-300">Monthly Budget</Label>
                  <Select value={form.monthlyBudget} onValueChange={(v) => update("monthlyBudget", v)}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Select a budget range" />
                    </SelectTrigger>
                    <SelectContent>
                      {BUDGET_OPTIONS.map((b) => (
                        <SelectItem key={b} value={b}>
                          {b}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="targetAreas" className="text-zinc-300">
                    Target Products / Keywords
                  </Label>
                  <Input
                    id="targetAreas"
                    value={form.targetAreas}
                    onChange={(e) => update("targetAreas", e.target.value)}
                    placeholder="e.g. running shoes, skincare sets, coffee makers"
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="startDate" className="text-zinc-300">
                    Preferred Start Date
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={form.preferredStartDate}
                    onChange={(e) => update("preferredStartDate", e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes" className="text-zinc-300">
                    Additional Notes
                  </Label>
                  <Textarea
                    id="notes"
                    value={form.additionalNotes}
                    onChange={(e) => update("additionalNotes", e.target.value)}
                    rows={4}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4 text-sm">
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
                  <h4 className="font-bold text-green-400 uppercase text-xs tracking-wider">Company & Contact</h4>
                  <div className="grid grid-cols-2 gap-2 text-zinc-300">
                    <div>
                      <span className="text-zinc-500">Company:</span> {form.companyName}
                    </div>
                    <div>
                      <span className="text-zinc-500">Contact:</span> {form.contactPerson}
                    </div>
                    <div>
                      <span className="text-zinc-500">Email:</span> {form.contactEmail}
                    </div>
                    <div>
                      <span className="text-zinc-500">Phone:</span> {form.contactPhone}
                    </div>
                    <div className="col-span-2">
                      <span className="text-zinc-500">Store URL:</span> {form.website || "—"}
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
                  <h4 className="font-bold text-green-400 uppercase text-xs tracking-wider">Services</h4>
                  <ul className="list-disc list-inside text-zinc-300 space-y-1">
                    {form.servicesInterested.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
                  <h4 className="font-bold text-green-400 uppercase text-xs tracking-wider">Program Details</h4>
                  <div className="text-zinc-300 space-y-1">
                    <div>
                      <span className="text-zinc-500">Budget:</span> {form.monthlyBudget || "—"}
                    </div>
                    <div>
                      <span className="text-zinc-500">Target Products / Keywords:</span> {form.targetAreas || "—"}
                    </div>
                    <div>
                      <span className="text-zinc-500">Preferred Start:</span> {form.preferredStartDate || "—"}
                    </div>
                  </div>
                </div>
                {form.additionalNotes && (
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
                    <h4 className="font-bold text-green-400 uppercase text-xs tracking-wider">Notes</h4>
                    <p className="text-zinc-300 whitespace-pre-wrap">{form.additionalNotes}</p>
                  </div>
                )}
                {error && (
                  <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
                    {error}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between pt-4 border-t border-white/10">
              <Button
                variant="outline"
                onClick={() => (step === 1 ? handleOpenChange(false) : setStep(step - 1))}
                disabled={submitting}
                className="border-white/20 text-white hover:bg-white/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {step === 1 ? "Cancel" : "Back"}
              </Button>
              {step < 4 ? (
                <Button
                  onClick={() => setStep(step + 1)}
                  disabled={!canNext()}
                  className="bg-green-600 hover:bg-green-500 text-white"
                >
                  Next <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={submit} disabled={submitting} className="bg-green-600 hover:bg-green-500 text-white">
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting…
                    </>
                  ) : (
                    "Submit Audit Request"
                  )}
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

/* ============================= PAGE ============================= */
const EcommerceSeoMicrosites = () => {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const openBooking = () => setIsBookingOpen(true);
  usePageMetadata();

  return (
    <div className="min-h-screen bg-[#0c0c0c]">
      <Navigation />
      <Breadcrumbs />
      <Hero onBook={openBooking} />
      <HowItWorks />
      <Benefits />
      <ServicesGrid />
      <AiSeoEngine />
      <Pricing />
      <CaseStudies />
      <Testimonials />
      <FAQ />
      <WhyUs />
      <FinalCTA onBook={openBooking} />
      <Footer />
      <BookingWizard open={isBookingOpen} onOpenChange={setIsBookingOpen} />
    </div>
  );
};

export default EcommerceSeoMicrosites;
