import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  ArrowRight,
  ArrowLeft,
  Search,
  Target,
  BarChart3,
  Globe,
  Megaphone,
  Zap,
  CheckCircle2,
  TrendingUp,
  Users,
  Sparkles,
  Eye,
  MousePointerClick,
  Award,
  MapPin,
  Radar,
  ShieldCheck,
  Smartphone,
  SlidersHorizontal,
  Loader2,
} from "lucide-react";

/* ================================= HERO ================================= */
const Hero = ({ onBook }: { onBook: () => void }) => (
  <section className="relative bg-[#0c0c0c] text-white overflow-hidden">
    <div className="absolute inset-0 bg-grid-dark opacity-30 pointer-events-none" />
    <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-green-500/10 rounded-full blur-[120px]" />
    <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-green-600/10 rounded-full blur-[100px]" />

    <div className="container mx-auto px-4 md:px-6 py-20 md:py-32 relative">
      <div className="max-w-4xl mx-auto text-center space-y-6">
        <span className="inline-block px-3 py-1 text-xs font-semibold tracking-wider uppercase text-green-400 bg-green-500/10 border border-green-500/30 rounded-full">
          Paid Search & Organic Growth
        </span>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] font-display">
          Google Ads, SEO & AEO —{" "}
          <span className="text-green-500">Full-Funnel Growth</span>
        </h1>
        <p className="text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          Triotag runs high-performance Google Search and Display campaigns paired with
          technical SEO and AI-search optimization (AEO) to put your brand in front of
          buyers at every stage of the funnel.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link to="/contact">
            <Button size="lg" className="bg-green-600 hover:bg-green-500 text-white px-8">
              Book a Free Audit <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <a href="#pricing">
            <Button size="lg" variant="outline" className="border-green-500 text-green-500 hover:bg-green-500/10 px-8">
              See Packages
            </Button>
          </a>
        </div>
      </div>
    </div>
  </section>
);

/* ============================= SERVICES GRID ============================= */
const services = [
  {
    icon: Megaphone,
    title: "Google Ads Management",
    tagline: "Search · PMax · Display · YouTube",
    description:
      "We build, manage, and optimize paid search and performance max campaigns that drive qualified traffic and conversions. From keyword research to negative-list hygiene and bid strategy, your ad spend works harder.",
    bullets: [
      "Search & Performance Max campaign setup",
      "Conversion tracking & attribution modeling",
      "A/B tested ad copy & landing-page alignment",
      "Budget pacing & ROAS/CPA optimization",
      "Monthly reporting with actionable insights",
    ],
  },
  {
    icon: Search,
    title: "Technical SEO",
    tagline: "On-Page · Off-Page · Technical",
    description:
      "Comprehensive SEO that covers site architecture, Core Web Vitals, schema markup, content clusters, and authority link building. We align your pages with what search engines—and users—actually want.",
    bullets: [
      "Site audits & Core Web Vitals fixes",
      "Keyword mapping & content gap analysis",
      "Schema markup & structured data implementation",
      "Backlink outreach & digital PR",
      "Local SEO & Google Business Profile optimization",
    ],
  },
  {
    icon: Sparkles,
    title: "AEO — AI Engine Optimization",
    tagline: "ChatGPT · Perplexity · Gemini · Copilot",
    description:
      "Optimize your brand visibility inside generative AI answers. AEO ensures your content is cited by ChatGPT, Perplexity, Gemini, and Copilot when users ask questions in your category.",
    bullets: [
      "Entity optimization & knowledge-graph alignment",
      "FAQ & long-tail question content strategy",
      "Cited-source authority building",
      "Brand mention monitoring across AI platforms",
      "Conversational search schema & markup",
    ],
  },
];

const ServicesGrid = () => (
  <section className="bg-white py-20 md:py-28 text-zinc-900">
    <div className="container mx-auto px-4 md:px-6">
      <div className="text-center max-w-3xl mx-auto mb-14">
        <h2 className="text-3xl md:text-5xl font-extrabold mb-4">
          Three Engines. <span className="text-green-600">One Growth Stack.</span>
        </h2>
        <p className="text-zinc-500 text-base md:text-lg">
          Paid media, organic search, and AI-search visibility — managed end-to-end by Triotag.
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

/* ============================= PRICING ============================= */
const packages = [
  {
    name: "Starter",
    price: "₱25,000",
    period: "/month",
    description: "Ideal for small businesses launching their first paid-search or SEO initiative.",
    features: [
      "1 Google Ads campaign (Search or PMax)",
      "Basic keyword research & negative-list setup",
      "On-page SEO for up to 5 pages",
      "Monthly performance report",
      "Email support",
    ],
    cta: "Get Started",
    highlight: false,
  },
  {
    name: "Growth",
    price: "₱55,000",
    period: "/month",
    description: "For brands ready to scale with multi-campaign ads and full SEO coverage.",
    features: [
      "Up to 3 Google Ads campaigns",
      "Conversion tracking & remarketing setup",
      "Full technical SEO audit + fixes",
      "Content gap analysis & blog strategy",
      "AEO baseline optimization",
      "Bi-weekly reporting & strategy calls",
    ],
    cta: "Book a Call",
    highlight: true,
  },
  {
    name: "Domination",
    price: "₱120,000",
    period: "/month",
    description: "Enterprise-grade execution across ads, SEO, and AI-search visibility.",
    features: [
      "Unlimited Google Ads campaigns",
      "YouTube & Display creative management",
      "Full SEO + local SEO + digital PR",
      "Advanced AEO & entity optimization",
      "Dedicated account strategist",
      "Weekly reporting & real-time dashboard",
    ],
    cta: "Talk to Sales",
    highlight: false,
  },
];

const Pricing = () => (
  <section id="pricing" className="bg-zinc-50 py-20 md:py-28 text-zinc-900">
    <div className="container mx-auto px-4 md:px-6">
      <div className="text-center max-w-3xl mx-auto mb-14">
        <h2 className="text-3xl md:text-5xl font-extrabold mb-4">
          Simple, Transparent <span className="text-green-600">Pricing</span>
        </h2>
        <p className="text-zinc-500 text-base md:text-lg">
          Ad spend is separate and billed directly to your Google Ads account. Our fees are flat — no hidden commissions.
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
                <span className="text-sm text-zinc-500">{pkg.period}</span>
              </div>
              <p className="text-sm text-zinc-500 leading-relaxed">{pkg.description}</p>
            </div>
            <ul className="space-y-3">
              {pkg.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-zinc-700">
                  <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${pkg.highlight ? "text-green-600" : "text-zinc-400"}`} />
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
    label: "ROAS Increase",
    title: "FMCG Brand — Search & PMax",
    desc: "Restructured campaign architecture for a national snack brand, shifting from broad match to intent-based keyword tiers with Performance Max feed optimization. ROAS climbed from 2.4x to 9.9x in 90 days.",
    tags: ["Google Ads", "PMax", "Feed Optimization"],
  },
  {
    metric: "+186%",
    label: "Organic Traffic",
    title: "Retail Chain — Technical SEO",
    desc: "Audited 200+ location pages, fixed Core Web Vitals, implemented LocalBusiness schema, and launched a content cluster around seasonal shopping. Organic sessions doubled within 6 months.",
    tags: ["SEO", "Local SEO", "Schema"],
  },
  {
    metric: "Top-3",
    label: "AI Citations",
    title: "SaaS Startup — AEO Program",
    desc: "Built an entity-first content model and FAQ hub optimized for conversational search. Within 4 months the brand was cited in ChatGPT and Perplexity responses for 12 high-value category queries.",
    tags: ["AEO", "Entity SEO", "Content Strategy"],
  },
];

const CaseStudies = () => (
  <section className="bg-white py-20 md:py-28 text-zinc-900">
    <div className="container mx-auto px-4 md:px-6">
      <div className="text-center max-w-3xl mx-auto mb-14">
        <h2 className="text-3xl md:text-5xl font-extrabold mb-4">
          Results That <span className="text-green-600">Speak</span>
        </h2>
        <p className="text-zinc-500 text-base md:text-lg">
          Recent client wins across paid search, organic growth, and AI-search visibility.
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
              <div className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">
                {cs.label}
              </div>
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

/* ============================= WHY US ============================= */
const whyItems = [
  { icon: Target, label: "Intent-First Targeting" },
  { icon: BarChart3, label: "Data-Driven Decisions" },
  { icon: Globe, label: "Local & National Scale" },
  { icon: Zap, label: "Fast Campaign Turnaround" },
  { icon: Users, label: "Dedicated Strategist" },
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
          We combine retail media expertise with paid-search precision and organic search authority.
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
const FinalCTA = () => (
  <section className="bg-zinc-50 py-20 md:py-28 text-zinc-900">
    <div className="container mx-auto px-4 md:px-6">
      <div className="max-w-3xl mx-auto text-center space-y-6">
        <h2 className="text-3xl md:text-5xl font-extrabold">
          Ready to Own the <span className="text-green-600">Search Results?</span>
        </h2>
        <p className="text-zinc-500 text-base md:text-lg max-w-xl mx-auto">
          Book a free 30-minute audit. We’ll review your current Google Ads, SEO, and AI-search presence — then build a roadmap tailored to your goals.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link to="/contact">
            <Button size="lg" className="bg-green-600 hover:bg-green-500 text-white px-8">
              Book Your Free Audit <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Link to="/services">
            <Button size="lg" variant="outline" className="border-zinc-300 text-zinc-700 hover:bg-zinc-100 px-8">
              Explore All Services
            </Button>
          </Link>
        </div>
      </div>
    </div>
  </section>
);

/* ============================= PAGE ============================= */
const GoogleAdsServices = () => (
  <div className="min-h-screen bg-[#0c0c0c]">
    <Navigation />
    <Hero />
    <ServicesGrid />
    <Pricing />
    <CaseStudies />
    <WhyUs />
    <FinalCTA />
    <Footer />
  </div>
);

export default GoogleAdsServices;
