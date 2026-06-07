import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { useState } from "react";
import {
  ArrowRight,
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Store,
  Megaphone,
  CheckCircle2,
  MapPin,
  Target,
  ShoppingCart,
  Award,
  LineChart,
  Layers,
  Crosshair,
  Calendar,
  ShieldCheck,
  Network,
  Tag,
  Monitor,
  Volume2,
  Music,
  Mic,
  Speaker,
  Image as ImageIcon,
  Square,
  ScanLine,
} from "lucide-react";

/* --------------------------------- HERO --------------------------------- */
import { useEffect } from "react";
import { fetchLandingTotals } from "@/lib/inventoryAggregation";
import mediaTruckBg from "@/assets/mediatruck-bg-clean.png.asset.json";

const Hero = () => {
  const [totals, setTotals] = useState<{
    approvedSpaces: number | null;
    activeVenues: number | null;
    activeCampaigns: number | null;
  }>({
    approvedSpaces: null,
    activeVenues: null,
    activeCampaigns: null,
  });
  useEffect(() => {
    fetchLandingTotals().then((t) => setTotals(t));
  }, []);
  const fmt = (v: number | null) => (v === null ? "—" : v.toLocaleString());

  return (
    <section className="relative bg-[#0c0c0c] text-white overflow-hidden">
      <div className="absolute inset-0 opacity-30">
        <img
          src="https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=1920&q=80"
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/40" />
      </div>
      <div className="absolute inset-0 bg-grid-dark opacity-40 pointer-events-none" />

      <div className="container mx-auto px-4 md:px-6 py-16 md:py-24 lg:py-32 relative grid lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <span className="inline-block px-3 py-1 text-xs font-semibold tracking-wider uppercase text-green-500 bg-green-500/10 border border-green-500/30 rounded-full">
            Retail Media Supply Platform
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1]">
            Retail Media SSP Platform for <span className="text-green-500">OOH</span>,{" "}
            <span className="text-green-500">DOOH</span>, and <span className="text-green-500">AOOH</span>
          </h1>
          <p className="text-lg text-zinc-400 max-w-xl leading-relaxed">
            Triotag is a Retail Media SSP platform built to help retailers, media owners, and location-based businesses
            monetize OOH, DOOH, and AOOH inventory.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/list-space">
              <Button variant="default" size="lg" className="w-full sm:w-auto">
                Become a Retail Media Partner <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/campaign-submit">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Request an Ad Campaign
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-8 border-t border-white/10">
            {[
              { stat: "3X", label: "Closer to purchase decisions" },
              { stat: "High", label: "Engagement in retail environments" },
              { stat: "New", label: "Revenue stream for retailers" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-2xl md:text-3xl font-extrabold text-green-500">{s.stat}</div>
                <div className="text-xs md:text-sm text-zinc-400 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard mockup */}
        <div className="relative">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="text-xs text-zinc-400 uppercase tracking-wider">Overview</div>
                <div className="text-lg font-bold text-white">Network Snapshot</div>
              </div>
              <span className="px-2 py-1 text-[10px] font-semibold rounded-full bg-green-500/20 text-green-400">
                LIVE
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { label: "Ad Spaces", value: fmt(totals.approvedSpaces), icon: BarChart3 },
                { label: "Active Campaigns", value: fmt(totals.activeCampaigns), icon: Target },
                { label: "Retail Partners", value: fmt(totals.activeVenues), icon: Store },
                { label: "Reach (Daily)", value: "—", icon: TrendingUp },
              ].map((m) => {
                const I = m.icon;
                return (
                  <div key={m.label} className="bg-black/40 border border-white/10 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <I className="w-3.5 h-3.5 text-green-500" />
                      <span className="text-[10px] text-zinc-400 uppercase">{m.label}</span>
                    </div>
                    <div className="text-lg font-bold text-white">{m.value}</div>
                  </div>
                );
              })}
            </div>
            {/* Mini chart — illustrative only */}
            <div className="bg-black/40 border border-white/10 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-zinc-400">Last 7 days</span>
                <span className="text-xs text-green-500 font-semibold">—</span>
              </div>
              <div className="flex items-end gap-1.5 h-20">
                {[40, 65, 50, 78, 60, 88, 95].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-gradient-to-t from-green-600 to-green-400 rounded-t opacity-60"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-green-500/20 rounded-full blur-2xl" />
          <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-green-600/20 rounded-full blur-2xl" />
        </div>
      </div>
    </section>
  );
};

/* ------------------------------- LOGO STRIP ------------------------------ */
const LogoStrip = () => (
  <section className="bg-white py-10 border-b border-zinc-100">
    <div className="container mx-auto px-4 md:px-6">
      <p className="text-center text-sm text-zinc-500 font-medium">Trusted by leading retailers and brands</p>
    </div>
  </section>
);

/* --------------------------- THREE CHANNELS ------------------------------ */
const ThreeChannels = () => {
  const channels = [
    {
      tag: "OOH",
      title: "Out-of-Home",
      desc: "Physical print placements in high-traffic retail spaces where shoppers actively decide what to buy.",
      img: "https://images.unsplash.com/photo-1601598851547-4302969d0614?auto=format&fit=crop&w=800&q=80",
      formats: [
        { icon: Tag, label: "Shelf signage" },
        { icon: Square, label: "Table tents" },
        { icon: ImageIcon, label: "Counter displays" },
        { icon: ScanLine, label: "Floor stickers" },
        { icon: MapPin, label: "Aisle signage" },
        { icon: Layers, label: "Entrance banners" },
      ],
    },
    {
      tag: "DOOH",
      title: "Digital Out-of-Home",
      desc: "Dynamic digital screens placed across retail and mall environments with programmatic delivery.",
      img: "https://images.unsplash.com/photo-1567521464027-f127ff144326?auto=format&fit=crop&w=800&q=80",
      formats: [
        { icon: Monitor, label: "In-store screens" },
        { icon: MapPin, label: "Mall directory screens" },
        { icon: Square, label: "Menu boards" },
        { icon: Layers, label: "Video walls" },
        { icon: ShoppingCart, label: "Checkout screens" },
        { icon: Network, label: "Mall directions" },
      ],
    },
    {
      tag: "AOOH",
      title: "Audio Out-of-Home",
      desc: "Sonic ad placements through in-store audio systems that engage shoppers throughout their journey.",
      img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
      formats: [
        { icon: Music, label: "Branded jingles" },
        { icon: Volume2, label: "Promotional spots" },
        { icon: Mic, label: "Sponsored announcements" },
        { icon: Speaker, label: "In-store audio ads" },
        { icon: Users, label: "Queue line audio" },
        { icon: Music, label: "Playlist sponsorships" },
      ],
    },
  ];

  return (
    <section className="bg-white py-20 md:py-28">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="text-3xl md:text-5xl font-extrabold text-zinc-900 mb-4">
            Three Retail Media Channels. <span className="text-green-600">One Platform.</span>
          </h2>
          <p className="text-zinc-500 text-base md:text-lg">
            Activate every shopper touchpoint across physical, digital, and audio retail media.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {channels.map((c) => (
            <div
              key={c.tag}
              className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="aspect-[16/10] overflow-hidden bg-zinc-100">
                <img src={c.img} alt={c.title} className="w-full h-full object-cover" loading="lazy" />
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <div className="text-2xl font-extrabold text-green-600">{c.tag}</div>
                  <div className="text-sm font-semibold text-zinc-700">{c.title}</div>
                  <div className="w-12 h-0.5 bg-green-600 mt-2" />
                </div>
                <p className="text-sm text-zinc-500 leading-relaxed">{c.desc}</p>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  {c.formats.map((f) => {
                    const I = f.icon;
                    return (
                      <div key={f.label} className="flex items-center gap-2 text-xs text-zinc-700">
                        <I className="w-3.5 h-3.5 text-green-600 shrink-0" />
                        <span>{f.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* -------------------------- WHY RETAIL MEDIA ----------------------------- */
const WhyRetailMedia = () => {
  const items = [
    { icon: ShoppingCart, label: "Close to Point of Purchase" },
    { icon: Crosshair, label: "High Intent Environment" },
    { icon: Target, label: "Influence Purchase Decisions" },
    { icon: Award, label: "Drive Sales & Loyalty" },
    { icon: LineChart, label: "Measurable Impact" },
  ];
  return (
    <section className="bg-white py-20 md:py-24 border-t border-zinc-100">
      <div className="container mx-auto px-4 md:px-6 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-zinc-900 mb-4">Why Retail Media?</h2>
          <p className="text-zinc-500 text-base md:text-lg leading-relaxed max-w-lg">
            Reach shoppers when they are most attentive and most likely to buy. Retail media closes the gap between
            awareness and conversion.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {items.map((it) => {
            const I = it.icon;
            return (
              <div key={it.label} className="text-center space-y-2">
                <div className="w-12 h-12 mx-auto rounded-xl bg-green-50 border border-green-100 flex items-center justify-center">
                  <I className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-xs font-semibold text-zinc-700 leading-tight">{it.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

/* --------------------------- VALUE PROPS --------------------------------- */
const ValueProps = () => {
  const Card = ({
    icon: Icon,
    title,
    desc,
    bullets,
    cta,
    to,
  }: {
    icon: any;
    title: string;
    desc: string;
    bullets: string[];
    cta: string;
    to: string;
  }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-8 space-y-5">
      <div className="w-12 h-12 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center">
        <Icon className="w-6 h-6 text-green-600" />
      </div>
      <h3 className="text-2xl font-extrabold text-green-600">{title}</h3>
      <p className="text-zinc-500 leading-relaxed">{desc}</p>
      <ul className="space-y-2">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2 text-sm text-zinc-700">
            <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
      <Link to={to}>
        <Button variant="default">
          {cta} <ArrowRight className="w-4 h-4" />
        </Button>
      </Link>
    </div>
  );

  return (
    <section className="bg-zinc-50 py-20 md:py-28">
      <div className="container mx-auto px-4 md:px-6 grid md:grid-cols-2 gap-6">
        <Card
          icon={Store}
          title="For Retailers"
          desc="Turn your physical, digital, and audio spaces into a managed media network."
          bullets={[
            "List and manage inventory",
            "Control pricing and approvals",
            "Access brand demand",
            "Grow non-product revenue",
            "Real-time reporting & insights",
          ]}
          cta="Learn More"
          to="/list-space"
        />
        <Card
          icon={Megaphone}
          title="For Brands & Companies"
          desc="Reach the right shoppers across thousands of curated retail touchpoints."
          bullets={[
            "Reach the right audience",
            "Multi-format campaign execution",
            "Geo-targeted and timely",
            "Measure engagement & impact",
            "Drive footfall and sales",
          ]}
          cta="Advertise Now"
          to="/campaign-submit"
        />
      </div>
    </section>
  );
};

/* --------------------- POPULAR FORMATS CAROUSEL -------------------------- */
const PopularFormats = () => {
  const groups = {
    OOH: [
      { label: "Table Tents", icon: Square },
      { label: "Shelf Signage", icon: Tag },
      { label: "Floor Stickers", icon: ScanLine },
      { label: "Counter Displays", icon: ImageIcon },
      { label: "Aisle Signage", icon: MapPin },
      { label: "Entrance Banners", icon: Layers },
    ],
    DOOH: [
      { label: "In-store Screens", icon: Monitor },
      { label: "Checkout Screens", icon: ShoppingCart },
      { label: "LED Displays", icon: Layers },
      { label: "Menu Boards", icon: Square },
      { label: "Video Walls", icon: Network },
      { label: "Mall Directories", icon: MapPin },
    ],
    AOOH: [
      { label: "Branded Jingles", icon: Music },
      { label: "Audio Announcements", icon: Mic },
      { label: "In-store Audio Ads", icon: Speaker },
      { label: "Queue Line Audio", icon: Volume2 },
      { label: "Playlist Sponsorships", icon: Music },
      { label: "Promotional Spots", icon: Volume2 },
    ],
  } as const;
  const [active, setActive] = useState<keyof typeof groups>("OOH");

  return (
    <section className="bg-white py-20 md:py-24 border-t border-zinc-100">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <h2 className="text-3xl md:text-4xl font-extrabold text-zinc-900">Popular Retail Media Formats</h2>
          <div className="flex gap-2">
            {(Object.keys(groups) as (keyof typeof groups)[]).map((g) => (
              <button
                key={g}
                onClick={() => setActive(g)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                  active === g ? "bg-green-600 text-white" : "bg-green-50 text-green-700 hover:bg-green-100"
                }`}
              >
                {g} Formats
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
          {groups[active].map((f) => {
            const I = f.icon;
            return (
              <div
                key={f.label}
                className="snap-start shrink-0 w-56 bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden"
              >
                <div className="aspect-[4/3] bg-gradient-to-br from-green-500/10 to-green-600/20 flex items-center justify-center">
                  <I className="w-16 h-16 text-green-600" />
                </div>
                <div className="p-4 text-center">
                  <div className="text-sm font-semibold text-zinc-800">{f.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

/* ------------------------ PLATFORM FEATURES ------------------------------ */
const PlatformFeatures = () => {
  const features = [
    { icon: Layers, title: "Unified Inventory", desc: "Access OOH, DOOH and AOOH inventory in one platform." },
    { icon: Crosshair, title: "Smart Targeting", desc: "Target by location, format, audience, and schedule." },
    { icon: Calendar, title: "Campaign Control", desc: "Plan, schedule and manage campaigns with ease." },
    { icon: ShieldCheck, title: "Proof & Reporting", desc: "Verify placements and measure real world impact." },
    { icon: Network, title: "Scalable Supply", desc: "From single stores to nationwide retail networks." },
  ];
  return (
    <section className="bg-white py-20 md:py-28 border-t border-zinc-100">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl md:text-5xl font-extrabold text-zinc-900 mb-4">
            The <span className="text-green-600">Triotag</span> Platform
          </h2>
          <p className="text-zinc-500 text-base md:text-lg">
            Everything you need to plan, deliver, and prove retail media campaigns.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {features.map((f) => {
            const I = f.icon;
            return (
              <div
                key={f.title}
                className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-6 hover:border-green-200 hover:shadow-md transition"
              >
                <div className="w-11 h-11 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center mb-4">
                  <I className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="font-bold text-zinc-900 text-base mb-2">{f.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

/* ------------------------------ CTA BANNER ------------------------------- */
const CTABanner = () => (
  <section className="bg-green-900 text-white py-20 md:py-24">
    <div className="container mx-auto px-4 md:px-6 text-center max-w-4xl space-y-6">
      <h2 className="text-3xl md:text-5xl font-extrabold leading-tight">
        Retail spaces are powerful media. Triotag makes them shoppable, measurable, and scalable.
      </h2>
      <p className="text-base md:text-lg text-green-100/80">
        Join the retail media revolution and unlock new opportunities today.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
        <Link to="/list-space">
          <Button variant="secondary" size="lg" className="w-full sm:w-auto">
            Partner With Triotag
          </Button>
        </Link>
        <Link to="/contact">
          <Button variant="outline" size="lg" className="w-full sm:w-auto">
            Request Media Kit
          </Button>
        </Link>
      </div>
    </div>
  </section>
);

/* ----------------------------- MEDIA TRUCK ------------------------------- */
const MediaTruckSection = () => (
  <section className="relative overflow-hidden">
    <div className="absolute inset-0">
      <img
        src={mediaTruckBg.url}
        alt="TrioTag mobile LED truck at city skyline"
        className="w-full h-full object-cover"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/30" />
    </div>
    <div className="container mx-auto px-4 md:px-6 relative py-20 md:py-32 grid lg:grid-cols-2 gap-12 items-center">
      <div className="space-y-6 text-white">
        <span className="inline-block px-3 py-1 rounded-full bg-green-500/15 text-green-400 text-xs font-semibold border border-green-500/30 tracking-widest uppercase">
          New · Mobile Truck Media Kit
        </span>
        <h2 className="text-4xl md:text-6xl font-extrabold leading-[1.05]">
          <span className="text-green-500">TRIOTAG</span> Mobile
          <br />
          Truck Media
        </h2>
        <p className="text-zinc-200 text-lg max-w-xl">
          Triangulate locations. Activate attention. Deploy high-impact Retail Media trucks across your target districts
          with route-based campaign planning and full proof-of-run reporting.
        </p>
        <ul className="grid sm:grid-cols-2 gap-2 text-sm text-zinc-200 max-w-xl">
          {["Route-based deployment", "Digital LED display", "Campaign documentation", "Retail-area focus"].map((f) => (
            <li key={f} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              {f}
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link to="/solutions/media-truck">
            <Button size="lg">
              Explore Media Truck <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link to="/contact">
            <Button
              size="lg"
              variant="outline"
              className="bg-black/40 backdrop-blur border-white/30 text-white hover:bg-black/60 hover:text-white"
            >
              Custom Brand Truck
            </Button>
          </Link>
        </div>
      </div>
    </div>
  </section>
);

/* --------------------------------- PAGE ---------------------------------- */
const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <Hero />
      <LogoStrip />
      <ThreeChannels />
      <WhyRetailMedia />
      <ValueProps />
      <PopularFormats />
      <PlatformFeatures />
      <MediaTruckSection />
      <CTABanner />
      <Footer />
    </div>
  );
};

export default Index;
