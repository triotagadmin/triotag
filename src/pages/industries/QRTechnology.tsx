import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  QrCode,
  ScanLine,
  Users,
  MapPin,
  Smartphone,
  Activity,
  ShieldCheck,
  BarChart3,
  Printer,
  Link2,
  Store,
  Sparkles,
  Megaphone,
  ArrowRight,
} from "lucide-react";

const CANONICAL = "https://triotag.com/industries/qr-technology";

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

const QRTechnology = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const prev = document.title;
    document.title = "QR Technology for Measurable OOH | TrioTag";
    setMeta(
      'meta[name="description"]',
      "content",
      "TrioTag QR technology turns every physical placement into a measurable channel — unique QR codes, real-time scan tracking, city and device breakdowns, and a live scan log.",
    );
    setMeta('link[rel="canonical"]', "href", CANONICAL);
    setMeta('meta[property="og:title"]', "content", "QR Technology for Measurable OOH | TrioTag");
    setMeta('meta[property="og:url"]', "content", CANONICAL);
    setMeta('meta[property="og:type"]', "content", "website");
    setMeta(
      'meta[property="og:description"]',
      "content",
      "Attach a unique QR code to every table tent, poster and sticker — then track scans, unique visitors, cities and devices in real time.",
    );
    return () => { document.title = prev; };
  }, []);

  const getStarted = () => navigate("/auth");
  const explore = () => navigate("/advertiser/explore");

  const features = [
    {
      icon: QrCode,
      title: "Unique Code Per Placement",
      desc: "Every table tent, poster, sticker or shelf tag can carry its own QR code — linking a specific physical placement to a digital action.",
    },
    {
      icon: ScanLine,
      title: "Real-Time Scan Tracking",
      desc: "Total scans update live as people scan in the field. No waiting for end-of-flight reports.",
    },
    {
      icon: Users,
      title: "Unique vs. Total Scans",
      desc: "Scans are deduplicated so you can separate genuine reach from repeat scans by the same device.",
    },
    {
      icon: MapPin,
      title: "Geographic Breakdown",
      desc: "See which cities your scans come from and which locations are actually driving engagement.",
    },
    {
      icon: Smartphone,
      title: "Device-Type Breakdown",
      desc: "Mobile, desktop and tablet splits show how audiences reach your landing experience.",
    },
    {
      icon: Activity,
      title: "Live Scan Log",
      desc: "A running feed of recent scans with device and location context — proof of activity, in the moment.",
    },
  ];

  const steps = [
    { icon: Printer, title: "Print", desc: "Your creative ships to the placement with a unique QR code embedded in the artwork." },
    { icon: Store, title: "Place", desc: "The material goes live in a vetted retail location, venue or on-vehicle surface." },
    { icon: Link2, title: "Scan", desc: "A shopper scans and is routed to your destination — the scan is recorded instantly." },
    { icon: BarChart3, title: "Measure", desc: "Track scans, unique reach, cities and devices from your analytics dashboard." },
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
          <div className="grid lg:grid-cols-[1.4fr_1fr] gap-12 items-center">
            <div className="max-w-4xl">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.05] mb-6">
                QR technology that makes physical ads{" "}
                <span className="text-green-500">measurable.</span>
              </h1>
              <p className="text-lg md:text-xl text-white/70 mb-10 max-w-3xl">
                Every TrioTag placement can carry a unique QR code — turning table tents, posters
                and stickers into a trackable, attributable channel with real-time scan analytics.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button size="lg" variant="cyber" onClick={getStarted}>
                  <QrCode className="h-4 w-4" /> Account Registration
                </Button>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="absolute -inset-6 bg-green-500/20 blur-[80px] rounded-full" />
              <div className="relative mx-auto h-56 w-56 rounded-3xl border border-green-500/30 bg-[#0a0a0a] flex items-center justify-center shadow-[0_0_60px_-10px_rgba(34,197,94,0.5)]">
                <QrCode className="h-28 w-28 text-green-400" />
                <div className="absolute inset-x-6 h-px bg-green-400/80 shadow-[0_0_12px_rgba(34,197,94,0.9)] animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bridge section */}
      <section className="py-20 md:py-28 border-t border-white/5">
        <div className="container mx-auto px-4 md:px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
              Closing the{" "}
              <span className="text-green-500">physical-to-digital gap.</span>
            </h2>
            <p className="text-white/70 text-lg mb-5">
              The historic weak point of out-of-home advertising is proof. You know the poster is
              up, but not what it did. A unique QR code on each placement fixes that.
            </p>
            <p className="text-white/70 text-lg">
              Every scan is logged with device type, location and timestamp — so an offline
              placement reports like a digital one.
            </p>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-br from-green-500/20 to-emerald-400/0 blur-2xl rounded-3xl" />
            <div className="relative bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 shadow-2xl">
              <div className="flex items-center gap-2 mb-5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
                <span className="ml-3 text-xs text-white/40">qr / tracker</span>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label: "Total Scans", value: "12,940" },
                  { label: "Unique Scans", value: "9,116" },
                  { label: "Cities", value: "18" },
                ].map((s) => (
                  <div key={s.label} className="bg-black/60 border border-white/10 rounded-xl p-3">
                    <div className="text-xs text-white/50">{s.label}</div>
                    <div className="text-lg font-bold text-green-400">{s.value}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {[
                  { icon: Smartphone, t: "Mobile", s: "82%" },
                  { icon: MapPin, t: "Top city · Metro Manila", s: "41%" },
                  { icon: Activity, t: "Last scan · 12s ago", s: "Live" },
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
              What the QR tracker <span className="text-green-500">actually measures.</span>
            </h2>
            <p className="text-white/60 text-lg">
              Built into the TrioTag dashboard — no third-party tooling required.
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
            <h2 className="text-3xl md:text-5xl font-bold mb-4">From print to proof</h2>
            <p className="text-white/60 text-lg">Four steps from artwork to attributable results.</p>
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
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Who uses QR tracking</h2>
            <p className="text-white/60 text-lg">
              Verified accounts get the analytics dashboard for their own QR codes.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Sparkles, t: "Consumer Brands", d: "Attribute product launches and promos to specific in-store placements." },
              { icon: Megaphone, t: "Agencies", d: "Report real scan numbers to clients instead of estimated impressions." },
              { icon: Store, t: "Retailers", d: "Prove the value of your footprint with scan data per location." },
              { icon: ShieldCheck, t: "Print Partners", d: "Ship materials with codes already provisioned and ready to track." },
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
              Make your next placement{" "}
              <span className="text-green-500">trackable.</span>
            </h2>
            <p className="text-white/70 mb-8 text-lg">
              Get a verified account and start measuring every scan across your physical media.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button size="lg" variant="cyber" onClick={getStarted} className="text-base">
                Account Registration <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={explore} className="text-base">
                Explore Inventory
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default QRTechnology;
