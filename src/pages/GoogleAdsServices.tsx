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
          <Button
            size="lg"
            onClick={onBook}
            className="bg-green-600 hover:bg-green-500 text-white px-8"
          >
            Book a Free Consultation <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
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
const FinalCTA = ({ onBook }: { onBook: () => void }) => (
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
          <Button
            size="lg"
            onClick={onBook}
            className="bg-green-600 hover:bg-green-500 text-white px-8"
          >
            Book a Free Consultation <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
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

/* ========================= HYPERLOCAL TARGETING ========================= */
const hyperlocalFeatures = [
  {
    icon: MapPin,
    title: "Hyperlocal Targeting",
    description: "Target by country, region, city, neighborhood, or a custom radius around your exact location.",
  },
  {
    icon: Users,
    title: "Right Audience. Right Time.",
    description: "Ads are shown only when users from your selected areas are actively browsing participating websites and apps.",
  },
  {
    icon: Target,
    title: "Maximize Results",
    description: "Reduce wasted ad spend and drive better performance with precision geographic targeting.",
  },
];

const programmaticFlow = [
  { icon: Users, label: "User from your target area" },
  { icon: Globe, label: "Browsing websites or apps" },
  { icon: Zap, label: "DSP real-time bidding", isCenter: true },
  { icon: Megaphone, label: "Your ad is shown" },
  { icon: TrendingUp, label: "Better results, higher ROI" },
];

const programmaticFeatures = [
  {
    icon: Smartphone,
    title: "Cross-Device Reach",
    description: "Connect with audiences on desktop, mobile web, tablet, and in-app.",
  },
  {
    icon: Users,
    title: "Advanced Audience Segmentation",
    description: "Combine location with demographics, interests, behavior, device, and more.",
  },
  {
    icon: SlidersHorizontal,
    title: "Real-Time Optimization",
    description: "Continuous optimization of bids, placements, and creatives for maximum performance.",
  },
  {
    icon: ShieldCheck,
    title: "Brand Safe & Compliant",
    description: "Ads are served on premium, brand-safe inventory with fraud prevention and viewability controls.",
  },
];

const trustBadges = [
  { icon: MapPin, label: "Precise Location Targeting" },
  { icon: CheckCircle2, label: "Premium Digital Inventory" },
  { icon: ShieldCheck, label: "Transparent Reporting" },
  { icon: TrendingUp, label: "Performance You Can Trust" },
];

const HyperlocalTargeting = () => (
  <section className="relative bg-[#0c0c0c] text-white overflow-hidden border-t border-white/5">
    <div className="absolute inset-0 bg-grid-dark opacity-20 pointer-events-none" />
    <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-green-500/10 rounded-full blur-[130px] pointer-events-none" />
    <div className="container mx-auto px-4 md:px-6 py-20 md:py-28 relative">
      <div className="grid lg:grid-cols-2 gap-14 items-center mb-24">
        <div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-[1.1] font-display mb-4">
            Reach the right people.{" "}
            <span className="text-green-500">Only in the places that matter.</span>
          </h2>
          <span className="inline-block text-xs font-semibold tracking-wider uppercase text-green-400 mb-4">
            Hyperlocal Programmatic Advertising
          </span>
          <p className="text-zinc-400 leading-relaxed mb-10 max-w-xl">
            We deliver your ads only to users in your selected geographic areas, while
            they're actively browsing websites and apps — no wasted impressions outside
            the places your customers actually are.
          </p>
          <div className="space-y-7">
            {hyperlocalFeatures.map((f) => (
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
        <div className="relative aspect-square max-w-md mx-auto w-full">
          <div className="absolute inset-0 rounded-full border-2 border-green-500/40 animate-pulse" style={{ animationDuration: "3s" }} />
          <div className="absolute inset-[15%] rounded-full border border-green-500/20" />
          <div className="absolute inset-[35%] rounded-full bg-green-500/5 border border-green-500/20" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.6)]">
              <MapPin className="w-5 h-5 text-black" />
            </div>
          </div>
          {[
            { top: "20%", left: "30%" }, { top: "28%", left: "70%" },
            { top: "68%", left: "22%" }, { top: "72%", left: "76%" },
            { top: "50%", left: "12%" },
          ].map((pos, i) => (
            <div key={`in-${i}`} className="absolute w-6 h-6 rounded-full bg-green-500/80 flex items-center justify-center" style={pos}>
              <Users className="w-3 h-3 text-black" />
            </div>
          ))}
          {[
            { top: "6%", left: "8%" }, { top: "8%", left: "88%" }, { top: "90%", left: "85%" },
          ].map((pos, i) => (
            <div key={`out-${i}`} className="absolute w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center opacity-50" style={pos}>
              <Users className="w-2.5 h-2.5 text-zinc-400" />
            </div>
          ))}
          <span className="absolute top-[14%] left-1/2 -translate-x-1/2 text-[10px] font-mono tracking-widest uppercase text-green-400 bg-black/60 border border-green-500/30 px-2 py-1 rounded">
            Ad shown in target area
          </span>
          <span className="absolute -top-2 -right-4 text-[10px] font-mono tracking-widest uppercase text-zinc-500 bg-black/60 border border-white/10 px-2 py-1 rounded">
            Ad not shown outside area
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 md:p-10 mb-16">
        <p className="text-center text-xs font-semibold tracking-widest uppercase text-green-400 mb-8">
          Powered by Programmatic Technology
        </p>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {programmaticFlow.map((step, i) => (
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
              {i < programmaticFlow.length - 1 && (
                <ArrowRight className="hidden md:block w-4 h-4 text-zinc-600 shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
        {programmaticFeatures.map((f) => (
          <div key={f.title} className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] hover:border-green-500/30 transition-colors">
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
            Go hyperlocal. <span className="text-green-500">Grow locally.</span>
          </h3>
          <p className="text-zinc-400 mt-2 max-w-md">
            Reach more of your ideal customers, drive action, and grow your business with precision.
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

/* ============================= BOOKING WIZARD ============================= */
const SERVICE_OPTIONS = [
  "Google Ads Management",
  "Technical SEO",
  "AEO — AI Engine Optimization",
];

const BUDGET_OPTIONS = [
  "Under ₱50,000",
  "₱50,000 – ₱150,000",
  "₱150,000 – ₱300,000",
  "₱300,000+",
];

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

const BookingWizard = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<BookingForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof BookingForm>(k: K, v: BookingForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

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
      return (
        form.companyName.trim() &&
        form.contactPerson.trim() &&
        emailValid &&
        form.contactPhone.trim()
      );
    if (step === 2) return form.servicesInterested.length > 0;
    if (step === 3) return true;
    return true;
  };

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "send-google-ads-booking",
        { body: form },
      );
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
          <DialogTitle className="text-white">
            {submitted ? "Booking Request Sent" : "Book a Free Consultation"}
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            {submitted
              ? "Thanks — we'll be in touch within 1 business day."
              : `Step ${step} of 4`}
          </DialogDescription>
        </DialogHeader>

        {!submitted && (
          <Progress value={progress} className="h-1.5 bg-white/10 [&>div]:bg-green-500" />
        )}

        {submitted ? (
          <div className="py-8 text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-zinc-300">
              Your booking request has been sent to our team. We'll reach out to{" "}
              <span className="text-green-400 font-semibold">{form.contactEmail}</span> within
              1 business day.
            </p>
            <Button
              onClick={() => handleOpenChange(false)}
              className="bg-green-600 hover:bg-green-500 text-white"
            >
              Close
            </Button>
          </div>
        ) : (
          <div className="space-y-5 py-2">
            {step === 1 && (
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="companyName" className="text-zinc-300">Company Name *</Label>
                  <Input
                    id="companyName"
                    value={form.companyName}
                    onChange={(e) => update("companyName", e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="contactPerson" className="text-zinc-300">Contact Person *</Label>
                  <Input
                    id="contactPerson"
                    value={form.contactPerson}
                    onChange={(e) => update("contactPerson", e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="contactEmail" className="text-zinc-300">Contact Email *</Label>
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
                  <Label htmlFor="contactPhone" className="text-zinc-300">Contact Phone *</Label>
                  <Input
                    id="contactPhone"
                    value={form.contactPhone}
                    onChange={(e) => update("contactPhone", e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="website" className="text-zinc-300">Website (optional)</Label>
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
                    <Checkbox
                      checked={form.servicesInterested.includes(s)}
                      onCheckedChange={() => toggleService(s)}
                    />
                    <span className="text-white font-medium">{s}</span>
                  </label>
                ))}
              </div>
            )}

            {step === 3 && (
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label className="text-zinc-300">Monthly Budget</Label>
                  <Select
                    value={form.monthlyBudget}
                    onValueChange={(v) => update("monthlyBudget", v)}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Select a budget range" />
                    </SelectTrigger>
                    <SelectContent>
                      {BUDGET_OPTIONS.map((b) => (
                        <SelectItem key={b} value={b}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="targetAreas" className="text-zinc-300">Target Areas</Label>
                  <Input
                    id="targetAreas"
                    value={form.targetAreas}
                    onChange={(e) => update("targetAreas", e.target.value)}
                    placeholder="e.g. Metro Manila, Cebu City, or nationwide"
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="startDate" className="text-zinc-300">Preferred Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={form.preferredStartDate}
                    onChange={(e) => update("preferredStartDate", e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes" className="text-zinc-300">Additional Notes</Label>
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
                    <div><span className="text-zinc-500">Company:</span> {form.companyName}</div>
                    <div><span className="text-zinc-500">Contact:</span> {form.contactPerson}</div>
                    <div><span className="text-zinc-500">Email:</span> {form.contactEmail}</div>
                    <div><span className="text-zinc-500">Phone:</span> {form.contactPhone}</div>
                    <div className="col-span-2"><span className="text-zinc-500">Website:</span> {form.website || "—"}</div>
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
                  <h4 className="font-bold text-green-400 uppercase text-xs tracking-wider">Services</h4>
                  <ul className="list-disc list-inside text-zinc-300 space-y-1">
                    {form.servicesInterested.map((s) => <li key={s}>{s}</li>)}
                  </ul>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
                  <h4 className="font-bold text-green-400 uppercase text-xs tracking-wider">Campaign Details</h4>
                  <div className="text-zinc-300 space-y-1">
                    <div><span className="text-zinc-500">Budget:</span> {form.monthlyBudget || "—"}</div>
                    <div><span className="text-zinc-500">Target Areas:</span> {form.targetAreas || "—"}</div>
                    <div><span className="text-zinc-500">Preferred Start:</span> {form.preferredStartDate || "—"}</div>
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
                <Button
                  onClick={submit}
                  disabled={submitting}
                  className="bg-green-600 hover:bg-green-500 text-white"
                >
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting…</>
                  ) : (
                    "Submit Booking Request"
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
const GoogleAdsServices = () => {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const openBooking = () => setIsBookingOpen(true);

  return (
    <div className="min-h-screen bg-[#0c0c0c]">
      <Navigation />
      <Hero onBook={openBooking} />
      <HyperlocalTargeting />
      <ServicesGrid />
      <Pricing />
      <CaseStudies />
      <WhyUs />
      <FinalCTA onBook={openBooking} />
      <Footer />
      <BookingWizard open={isBookingOpen} onOpenChange={setIsBookingOpen} />
    </div>
  );
};

export default GoogleAdsServices;

