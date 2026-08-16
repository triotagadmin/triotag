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
  CheckCircle2,
  RefreshCcw,
  Hammer,
  MapPin,
  Package,
  Layers,
  FileText,
  ShoppingCart,
  Wrench,
  Rocket,
  Loader2,
  Repeat,
  Compass,
  Code2,
  Gauge,
  LineChart,
} from "lucide-react";

const PAGE_URL = "https://triotag.com/services/ecommerce-seo";
const PAGE_TITLE = "SEO Microsite Development & Management | TRIOTAG";
const PAGE_DESCRIPTION =
  "TRIOTAG builds SEO microsites as a one-time development project, then keeps them optimized, updated, and expanding with an ongoing monthly SEO microsite management service.";

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

/* ================================= FAQ DATA ================================= */
const faqs = [
  {
    q: "What is an SEO microsite?",
    a: "An SEO microsite is a focused site or set of pages built around a specific product, category, location, service, or search intent. Instead of forcing every topic onto one page, a microsite gives each demand cluster a dedicated, well-structured, technically sound search experience.",
  },
  {
    q: "Is development a one-time fee?",
    a: "Yes. SEO Microsite Development is a project-based engagement charged once. It covers strategy, information architecture, design, development, technical SEO configuration, deployment, and launch.",
  },
  {
    q: "Is SEO Microsite Management a monthly service?",
    a: "Yes. Management is a recurring monthly service covering ongoing SEO optimization, content publishing, new pages, technical and indexation monitoring, metadata and schema upkeep, and reporting.",
  },
  {
    q: "Do I need Development before Management?",
    a: "Not necessarily. Development is required if you do not yet have a microsite infrastructure. If you already have one live, we can start with Management after a technical review.",
  },
  {
    q: "Can TRIOTAG manage a microsite we did not build?",
    a: "Yes. We begin with an audit of your existing structure, technical setup, and content, then move it onto our monthly management workflow.",
  },
  {
    q: "Can you create new microsites or pages during management?",
    a: "Yes. Expansion is a core part of management — we identify new search opportunities and build keyword-targeted pages and additional microsite sections over time.",
  },
  {
    q: "Do you guarantee Google rankings?",
    a: "No. SEO results depend on competition, search demand, website quality, content, authority, technical factors, and other variables outside any agency's control. Rankings cannot be guaranteed. We commit to sound strategy, correct technical execution, and continuous optimization.",
  },
  {
    q: "How long does development take?",
    a: "Timelines depend on scope — the number of pages, integrations, and content requirements. A focused microsite build is typically faster than a large multi-section infrastructure. We confirm the schedule during planning.",
  },
  {
    q: "What happens after the microsite launches?",
    a: "Search does not stand still. After launch you can continue with monthly management so the microsite keeps getting optimized, updated, monitored, and expanded, or you can operate it yourself.",
  },
  {
    q: "Can this be used for eCommerce businesses?",
    a: "Yes. Commerce SEO microsites are one of the most common use cases, supporting product, category, and buying-intent discovery that feeds your store or marketplace listings.",
  },
];

const usePageMetadata = () => {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = PAGE_TITLE;

    setMeta('meta[name="description"]', "name", "description", PAGE_DESCRIPTION);
    setMeta('meta[property="og:title"]', "property", "og:title", PAGE_TITLE);
    setMeta('meta[property="og:description"]', "property", "og:description", PAGE_DESCRIPTION);
    setMeta('meta[property="og:type"]', "property", "og:type", "website");
    setMeta('meta[property="og:url"]', "property", "og:url", PAGE_URL);
    setMeta('meta[property="og:site_name"]', "property", "og:site_name", "TRIOTAG");
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
        name: "SEO Microsite Development",
        serviceType: "SEO microsite web development project",
        url: PAGE_URL,
        description:
          "A one-time web development project to design, build, configure, and launch an SEO-ready microsite infrastructure.",
        areaServed: "PH",
        provider: { "@type": "Organization", name: "TRIOTAG", url: "https://triotag.com" },
        offers: {
          "@type": "Offer",
          name: "One-Time Project",
          description: "Custom project pricing",
          url: PAGE_URL,
        },
      },
      {
        "@context": "https://schema.org",
        "@type": "Service",
        name: "SEO Microsite Management",
        serviceType: "Monthly SEO microsite management service",
        url: PAGE_URL,
        description:
          "An ongoing monthly service for maintaining, optimizing, publishing, and expanding an SEO microsite after launch.",
        areaServed: "PH",
        provider: { "@type": "Organization", name: "TRIOTAG", url: "https://triotag.com" },
        offers: {
          "@type": "Offer",
          name: "Monthly Service",
          description: "Custom monthly pricing",
          url: PAGE_URL,
        },
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://triotag.com/" },
          { "@type": "ListItem", position: 2, name: "Services", item: "https://triotag.com/services" },
          { "@type": "ListItem", position: 3, name: "SEO Microsite Development & Management", item: PAGE_URL },
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
      <li className="text-zinc-300">SEO Microsite Development &amp; Management</li>
    </ol>
  </nav>
);

/* ================================= HERO ================================= */
const Hero = ({ onBook }: { onBook: () => void }) => (
  <section className="relative bg-[#0c0c0c] text-white overflow-hidden">
    <div className="absolute inset-0 bg-grid-dark opacity-30 pointer-events-none" />
    <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-green-500/10 rounded-full blur-[120px]" />
    <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-green-600/10 rounded-full blur-[100px]" />

    <div className="container mx-auto px-4 md:px-6 py-20 md:py-28 relative">
      <div className="grid lg:grid-cols-2 gap-14 items-center">
        <div className="space-y-7 text-center lg:text-left">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] font-display">
            SEO Microsites Built to Rank. <span className="text-green-500">Managed to Grow.</span>
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
            Build a scalable SEO microsite infrastructure for your business, then keep it optimized, updated, and
            expanding with ongoing management.
          </p>

          <div className="grid sm:grid-cols-2 gap-4 max-w-xl mx-auto lg:mx-0 text-left">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-green-400">
                <Hammer className="w-3.5 h-3.5" /> One-Time Development
              </div>
              <p className="mt-2 text-sm text-zinc-300 font-semibold">Build your SEO microsite.</p>
            </div>
            <div className="rounded-2xl border border-green-500/25 bg-green-500/[0.06] p-5">
              <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-green-400">
                <RefreshCcw className="w-3.5 h-3.5" /> Monthly Management
              </div>
              <p className="mt-2 text-sm text-zinc-300 font-semibold">Operate and grow your SEO presence.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center lg:justify-start justify-center gap-3 pt-1">
            <Button size="lg" onClick={onBook} className="bg-green-600 hover:bg-green-500 text-white px-8 w-full sm:w-auto">
              Start Your SEO Project <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={onBook}
              className="border-white/20 text-white hover:bg-white/10 w-full sm:w-auto"
            >
              Talk to Us About Management
            </Button>
          </div>
        </div>

        <BuildManageVisual />
      </div>
    </div>
  </section>
);

const BuildManageVisual = () => (
  <div className="relative w-full max-w-md mx-auto">
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-5 shadow-2xl">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
        <span className="ml-3 text-[10px] font-mono text-zinc-500 truncate">microsite.yourbrand.com</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[Package, Layers, MapPin].map((I, i) => (
          <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-2">
            <div className="h-12 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
              <I className="w-5 h-5 text-green-400" aria-hidden />
            </div>
            <div className="h-1.5 w-3/4 rounded bg-white/15" />
            <div className="h-1.5 w-1/2 rounded bg-green-500/40" />
          </div>
        ))}
      </div>
    </div>

    <div className="mt-5 rounded-2xl border border-green-500/20 bg-[#0f0f0f]/90 backdrop-blur-sm p-5 shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-mono uppercase tracking-widest text-green-400">Build → Launch → Manage → Grow</span>
        <BarChart3 className="w-4 h-4 text-green-500" aria-hidden />
      </div>
      <ul className="space-y-3">
        {[
          { icon: Compass, label: "Strategy & architecture", tag: "Development" },
          { icon: Code2, label: "Build & technical SEO setup", tag: "Development" },
          { icon: Rocket, label: "Deployment & launch", tag: "Development" },
          { icon: FileText, label: "Content publishing & new pages", tag: "Management" },
          { icon: Gauge, label: "Monitoring, reporting, expansion", tag: "Management" },
        ].map((row) => (
          <li key={row.label} className="flex items-center justify-between gap-3 text-xs">
            <span className="flex items-center gap-2 text-zinc-300">
              <row.icon className="w-3.5 h-3.5 text-green-500 shrink-0" aria-hidden />
              {row.label}
            </span>
            <span
              className={`shrink-0 px-1.5 py-0.5 rounded font-mono text-[10px] ${
                row.tag === "Development" ? "bg-white/10 text-zinc-300" : "bg-green-500/15 text-green-400"
              }`}
            >
              {row.tag}
            </span>
          </li>
        ))}
      </ul>
    </div>
  </div>
);

/* =========================== SERVICE MODEL =========================== */
const developmentFeatures = [
  "SEO microsite strategy",
  "Information architecture",
  "Responsive web development",
  "SEO-friendly page structure",
  "Technical SEO configuration",
  "On-page SEO foundations",
  "Metadata configuration",
  "Schema markup",
  "Sitemap and indexing setup",
  "Search engine integration",
  "Analytics integration",
  "Performance optimization",
  "Initial microsite/page setup",
  "Deployment and launch",
];

const managementFeatures = [
  "Ongoing SEO optimization",
  "Content publishing",
  "New SEO landing pages",
  "Microsite expansion",
  "Keyword-targeted page development",
  "Internal linking optimization",
  "Technical SEO monitoring",
  "Indexation monitoring",
  "Search Console monitoring",
  "Metadata optimization",
  "Schema maintenance",
  "Content updates",
  "Performance monitoring",
  "SEO reporting",
  "Continuous optimization",
];

const ServiceModel = ({ onBook }: { onBook: () => void }) => (
  <section id="services" className="bg-white py-20 md:py-28 text-zinc-900">
    <div className="container mx-auto px-4 md:px-6">
      <div className="text-center max-w-3xl mx-auto mb-14">
        <h2 className="text-3xl md:text-5xl font-extrabold mb-4">
          Build Your SEO Microsite Infrastructure. <br className="hidden md:block" />
          <span className="text-green-600">Then Let Us Manage and Grow It.</span>
        </h2>
        <p className="text-zinc-500 text-base md:text-lg">
          Two distinct services. Development creates the infrastructure. Management operates, optimizes, and expands it.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 max-w-6xl mx-auto items-start">
        {/* CARD 1 — DEVELOPMENT */}
        <article className="rounded-3xl border border-zinc-200 bg-white p-8 md:p-10 space-y-6 shadow-sm">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 text-white text-[11px] font-bold uppercase tracking-widest">
              <Hammer className="w-3.5 h-3.5" /> One-Time Project
            </span>
            <h3 className="text-2xl md:text-3xl font-extrabold text-zinc-900">SEO Microsite Development</h3>
            <p className="text-zinc-500 leading-relaxed">
              We design and develop the SEO microsite infrastructure your business needs to target search demand, create
              scalable landing pages, and establish a strong technical SEO foundation.
            </p>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="text-xs uppercase tracking-widest text-zinc-500 font-bold">One-Time Project</div>
              <div className="text-2xl font-extrabold text-zinc-900 mt-1">Custom project pricing</div>
              <p className="text-xs text-zinc-500 mt-1">
                Charged once as a project — this is not a monthly subscription.
              </p>
            </div>
          </div>
          <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
            {developmentFeatures.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-zinc-700">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-zinc-400" aria-hidden />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <Button onClick={onBook} className="w-full bg-zinc-900 hover:bg-zinc-800 text-white">
            Build My SEO Microsite <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </article>

        {/* CARD 2 — MANAGEMENT */}
        <article className="rounded-3xl border border-green-500 ring-1 ring-green-500 bg-white p-8 md:p-10 space-y-6 shadow-lg shadow-green-500/10">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-600 text-white text-[11px] font-bold uppercase tracking-widest">
              <RefreshCcw className="w-3.5 h-3.5" /> Monthly Service
            </span>
            <h3 className="text-2xl md:text-3xl font-extrabold text-zinc-900">SEO Microsite Management</h3>
            <p className="text-zinc-500 leading-relaxed">
              Keep your SEO microsite active, optimized, updated, and expanding with continuous SEO and content
              management.
            </p>
            <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
              <div className="text-xs uppercase tracking-widest text-green-700 font-bold">Monthly Service</div>
              <div className="text-2xl font-extrabold text-zinc-900 mt-1">Custom monthly pricing</div>
              <p className="text-xs text-zinc-500 mt-1">Billed monthly and recurring — this is not a one-time package.</p>
            </div>
          </div>
          <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
            {managementFeatures.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-zinc-700">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-green-600" aria-hidden />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <Button onClick={onBook} className="w-full bg-green-600 hover:bg-green-500 text-white">
            Start SEO Management <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </article>
      </div>
    </div>
  </section>
);

/* ============================ PRICING MODELS ============================ */
const Pricing = () => (
  <section id="pricing" className="bg-zinc-50 py-20 md:py-28 text-zinc-900">
    <div className="container mx-auto px-4 md:px-6">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h2 className="text-3xl md:text-5xl font-extrabold mb-4">
          Two Service Models, <span className="text-green-600">Not Pricing Tiers</span>
        </h2>
        <p className="text-zinc-500 text-base md:text-lg">
          Pricing follows scope, not arbitrary quantities. We quote the development project and the monthly management
          service separately.
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center space-y-2">
          <div className="text-xs font-bold uppercase tracking-widest text-zinc-500">One-Time Project</div>
          <h3 className="text-xl font-extrabold">SEO Microsite Development</h3>
          <div className="text-3xl font-extrabold text-zinc-900 pt-2">Custom Quote</div>
          <p className="text-sm text-zinc-500">Custom project pricing based on scope, structure, and integrations.</p>
        </div>
        <div className="rounded-2xl border border-green-500 bg-white p-8 text-center space-y-2 ring-1 ring-green-500">
          <div className="text-xs font-bold uppercase tracking-widest text-green-700">Monthly Service</div>
          <h3 className="text-xl font-extrabold">SEO Microsite Management</h3>
          <div className="text-3xl font-extrabold text-zinc-900 pt-2">Custom Quote</div>
          <p className="text-sm text-zinc-500">Custom monthly pricing based on optimization and expansion workload.</p>
        </div>
      </div>
    </div>
  </section>
);

/* ============================== HOW IT WORKS ============================== */
const steps = [
  {
    n: "01",
    title: "Plan",
    icon: Compass,
    desc: "We identify your business, search opportunities, target audiences, site structure, and SEO requirements.",
    optional: false,
  },
  {
    n: "02",
    title: "Build",
    icon: Code2,
    desc: "We design and develop the SEO microsite infrastructure and configure the technical SEO foundation.",
    optional: false,
  },
  {
    n: "03",
    title: "Manage & Grow",
    icon: Repeat,
    desc: "After launch, our monthly management service keeps the microsite optimized, updated, and expanding.",
    optional: true,
  },
];

const HowItWorks = () => (
  <section className="bg-[#0c0c0c] py-20 md:py-28 text-white">
    <div className="container mx-auto px-4 md:px-6">
      <div className="text-center max-w-3xl mx-auto mb-14">
        <h2 className="text-3xl md:text-5xl font-extrabold mb-4">
          How It <span className="text-green-500">Works</span>
        </h2>
        <p className="text-zinc-400 text-base md:text-lg">Build → Launch → Manage → Grow.</p>
      </div>
      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {steps.map((s) => (
          <div
            key={s.n}
            className={`rounded-2xl border p-8 space-y-4 ${
              s.optional ? "border-green-500/40 bg-green-500/[0.06]" : "border-white/10 bg-white/[0.02]"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`font-mono text-3xl font-extrabold ${s.optional ? "text-green-400" : "text-zinc-600"}`}>
                {s.n}
              </span>
              <s.icon className="w-5 h-5 text-green-500" aria-hidden />
            </div>
            <h3 className="text-xl font-extrabold">{s.title}</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">{s.desc}</p>
            {s.optional && (
              <span className="inline-flex px-2.5 py-1 rounded-full bg-green-500/15 text-green-400 text-[11px] font-bold uppercase tracking-widest">
                Optional — recommended for ongoing growth
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ======================= DEVELOPMENT VS MANAGEMENT ======================= */
const Comparison = () => (
  <section className="bg-white py-20 md:py-28 text-zinc-900">
    <div className="container mx-auto px-4 md:px-6">
      <div className="text-center max-w-3xl mx-auto mb-14">
        <h2 className="text-3xl md:text-5xl font-extrabold mb-4">
          Build Once. <span className="text-green-600">Grow Continuously.</span>
        </h2>
      </div>
      <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-8 space-y-5">
          <div className="space-y-2">
            <span className="inline-flex px-2.5 py-1 rounded-full bg-zinc-900 text-white text-[11px] font-bold uppercase tracking-widest">
              One-Time
            </span>
            <h3 className="text-xl font-extrabold">SEO Microsite Development</h3>
            <p className="text-sm text-zinc-500">
              <span className="font-semibold text-zinc-700">Purpose:</span> Build the infrastructure.
            </p>
          </div>
          <ul className="space-y-2">
            {["Strategy", "Design", "Development", "Technical SEO", "Initial configuration", "Deployment", "Launch"].map(
              (i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-zinc-700">
                  <CheckCircle2 className="w-4 h-4 text-zinc-400 shrink-0" aria-hidden /> {i}
                </li>
              ),
            )}
          </ul>
        </div>
        <div className="rounded-2xl border border-green-500 bg-white p-8 space-y-5 ring-1 ring-green-500">
          <div className="space-y-2">
            <span className="inline-flex px-2.5 py-1 rounded-full bg-green-600 text-white text-[11px] font-bold uppercase tracking-widest">
              Monthly
            </span>
            <h3 className="text-xl font-extrabold">SEO Microsite Management</h3>
            <p className="text-sm text-zinc-500">
              <span className="font-semibold text-zinc-700">Purpose:</span> Operate and grow the infrastructure.
            </p>
          </div>
          <ul className="space-y-2">
            {[
              "SEO optimization",
              "Content",
              "New pages",
              "Technical monitoring",
              "Indexation",
              "Internal linking",
              "Performance",
              "Reporting",
              "Continuous growth",
            ].map((i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-zinc-700">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" aria-hidden /> {i}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  </section>
);

/* ============================ WHY SEO MICROSITES ============================ */
const intents = [
  "Products",
  "Categories",
  "Locations",
  "Services",
  "Brands",
  "Topics",
  "Customer intent",
  "Commercial search queries",
];

const WhyMicrosites = () => (
  <section className="bg-zinc-50 py-20 md:py-28 text-zinc-900">
    <div className="container mx-auto px-4 md:px-6 max-w-5xl">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h2 className="text-3xl md:text-5xl font-extrabold mb-4">
          Turn Search Demand Into <span className="text-green-600">Scalable Digital Assets.</span>
        </h2>
        <p className="text-zinc-500 text-base md:text-lg">
          SEO microsites let you build focused search experiences around the things your customers actually search for.
          The value comes from creating a structured, scalable SEO ecosystem — not simply building one more website page.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        {intents.map((i) => (
          <span
            key={i}
            className="px-4 py-2 rounded-full border border-zinc-200 bg-white text-sm font-semibold text-zinc-700"
          >
            {i}
          </span>
        ))}
      </div>
      <p className="text-center text-xs text-zinc-400 mt-8 max-w-2xl mx-auto">
        Outcomes vary. SEO performance depends on competition, demand, content, authority, and technical factors — we do
        not promise guaranteed rankings.
      </p>
    </div>
  </section>
);

/* ============================== WHAT WE BUILD ============================== */
const buildTypes = [
  { icon: Package, title: "Product Microsites", desc: "Focused experiences around specific products." },
  { icon: Layers, title: "Category Microsites", desc: "Search-focused category and collection pages." },
  { icon: MapPin, title: "Location Microsites", desc: "Location-specific landing experiences." },
  { icon: Wrench, title: "Service Microsites", desc: "Focused pages targeting specific services and search intent." },
  { icon: FileText, title: "Content Microsites", desc: "Structured editorial/content experiences." },
  {
    icon: ShoppingCart,
    title: "Commerce SEO Microsites",
    desc: "SEO-focused experiences supporting eCommerce discovery and conversion.",
  },
];

const WhatWeBuild = () => (
  <section className="bg-[#0c0c0c] py-20 md:py-28 text-white">
    <div className="container mx-auto px-4 md:px-6">
      <div className="text-center max-w-3xl mx-auto mb-14">
        <h2 className="text-3xl md:text-5xl font-extrabold mb-4">
          What We <span className="text-green-500">Build</span>
        </h2>
        <p className="text-zinc-400 text-base md:text-lg">
          Microsite structures designed around real search behavior.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
        {buildTypes.map((b) => (
          <div key={b.title} className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-3 glass-hover transition-all">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
              <b.icon className="w-5 h-5 text-green-400" aria-hidden />
            </div>
            <h3 className="text-lg font-extrabold">{b.title}</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">{b.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* =========================== ONGOING MANAGEMENT =========================== */
const managementWork = [
  { icon: Search, label: "Identifying new search opportunities" },
  { icon: FileText, label: "Creating new pages" },
  { icon: Gauge, label: "Optimizing existing pages" },
  { icon: RefreshCcw, label: "Updating content" },
  { icon: Globe, label: "Improving internal linking" },
  { icon: BarChart3, label: "Monitoring indexation" },
  { icon: Wrench, label: "Monitoring technical SEO" },
  { icon: LineChart, label: "Reviewing Search Console data" },
  { icon: Code2, label: "Improving metadata" },
  { icon: Layers, label: "Expanding topical coverage" },
  { icon: Compass, label: "Analyzing performance" },
  { icon: CheckCircle2, label: "Producing reports" },
];

const OngoingManagement = () => (
  <section className="bg-white py-20 md:py-28 text-zinc-900">
    <div className="container mx-auto px-4 md:px-6">
      <div className="text-center max-w-3xl mx-auto mb-14">
        <span className="inline-flex px-3 py-1 rounded-full bg-green-600 text-white text-[11px] font-bold uppercase tracking-widest mb-4">
          Monthly Service
        </span>
        <h2 className="text-3xl md:text-5xl font-extrabold mb-4">
          Your Microsite Should Keep <span className="text-green-600">Growing After Launch.</span>
        </h2>
        <p className="text-zinc-500 text-base md:text-lg">
          SEO is not finished when the website goes live. Monthly management is a real operating service — continuous
          optimization and expansion, not maintenance.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
        {managementWork.map((m) => (
          <div key={m.label} className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <m.icon className="w-4 h-4 text-green-600 shrink-0" aria-hidden />
            <span className="text-sm font-semibold text-zinc-700">{m.label}</span>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ================================= FAQ ================================= */
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

/* ================================ FINAL CTA ================================ */
const FinalCTA = ({ onBook }: { onBook: () => void }) => (
  <section className="relative bg-[#0c0c0c] py-20 md:py-28 text-white overflow-hidden">
    <div className="absolute inset-0 bg-grid-dark opacity-20 pointer-events-none" />
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-green-500/10 rounded-full blur-[140px]" />
    <div className="container mx-auto px-4 md:px-6 relative">
      <div className="max-w-3xl mx-auto text-center space-y-6">
        <h2 className="text-3xl md:text-5xl font-extrabold">
          Build Your SEO Microsite. <span className="text-green-500">Then Keep Growing It.</span>
        </h2>
        <p className="text-zinc-400 text-base md:text-lg leading-relaxed">
          Whether you need the initial microsite development or an ongoing partner to manage and expand it, TRIOTAG can
          build the infrastructure and help turn it into a continuously growing SEO asset.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button size="lg" onClick={onBook} className="bg-green-600 hover:bg-green-500 text-white px-8 w-full sm:w-auto">
            Start a Development Project <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={onBook}
            className="border-white/20 text-white hover:bg-white/10 w-full sm:w-auto"
          >
            Ask About Monthly Management
          </Button>
        </div>
      </div>
    </div>
  </section>
);

/* ============================= BOOKING WIZARD ============================= */
const SERVICE_OPTIONS = [
  "SEO Microsite Development (one-time project)",
  "SEO Microsite Management (monthly service)",
  "Both — Development then Management",
];

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
          <DialogTitle className="text-white">{submitted ? "Request Sent" : "Start Your SEO Microsite Project"}</DialogTitle>
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
              Your request has been sent to our team. We'll reach out to{" "}
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
                    Website URL (optional)
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
                <p className="text-sm text-zinc-400">Select the service you're interested in (at least one).</p>
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
                  <Label className="text-zinc-300">Estimated Budget</Label>
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
                    Target Topics / Keywords
                  </Label>
                  <Input
                    id="targetAreas"
                    value={form.targetAreas}
                    onChange={(e) => update("targetAreas", e.target.value)}
                    placeholder="e.g. product categories, service areas, locations"
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
                  <h4 className="font-bold text-green-400 uppercase text-xs tracking-wider">Company &amp; Contact</h4>
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
                      <span className="text-zinc-500">Website:</span> {form.website || "—"}
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
                  <h4 className="font-bold text-green-400 uppercase text-xs tracking-wider">Project Details</h4>
                  <div className="text-zinc-300 space-y-1">
                    <div>
                      <span className="text-zinc-500">Budget:</span> {form.monthlyBudget || "—"}
                    </div>
                    <div>
                      <span className="text-zinc-500">Target Topics / Keywords:</span> {form.targetAreas || "—"}
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
                    "Submit Request"
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
      <ServiceModel onBook={openBooking} />
      <Pricing />
      <HowItWorks />
      <Comparison />
      <WhyMicrosites />
      <WhatWeBuild />
      <OngoingManagement />
      <FAQ />
      <FinalCTA onBook={openBooking} />
      <Footer />
      <BookingWizard open={isBookingOpen} onOpenChange={setIsBookingOpen} />
    </div>
  );
};

export default EcommerceSeoMicrosites;
