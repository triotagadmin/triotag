import { Link } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  Play,
  Target,
  TrendingUp,
  DollarSign,
  Layers,
  ShieldCheck,
  Music2,
  Camera,
  Infinity as InfinityIcon,
  Ghost,
  X as XIcon,
} from "lucide-react";

type Platform = {
  name: string;
  icon: JSX.Element;
  cardClass?: string;
  textClass?: string;
  customName?: JSX.Element;
};

const PLATFORMS: Platform[] = [
  {
    name: "YouTube",
    icon: <Play className="w-6 h-6 fill-current" style={{ color: "#FF0000" }} />,
    textClass: "text-[#FF0000]",
  },
  {
    name: "TikTok",
    icon: <Music2 className="w-6 h-6 text-black" />,
    textClass: "text-black",
  },
  {
    name: "Instagram Reels",
    icon: <Camera className="w-6 h-6" style={{ color: "#E1306C" }} />,
    customName: (
      <span className="font-bold text-lg bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-600 bg-clip-text text-transparent">
        Instagram Reels
      </span>
    ),
  },
  {
    name: "Facebook Video",
    icon: <InfinityIcon className="w-6 h-6" style={{ color: "#1877F2" }} />,
    textClass: "text-[#1877F2]",
  },
  {
    name: "Snapchat",
    icon: <Ghost className="w-6 h-6 text-black" />,
    cardClass: "bg-[#FFFC00]",
    textClass: "text-black",
  },
  {
    name: "X (Twitter)",
    icon: <XIcon className="w-6 h-6 text-black" strokeWidth={3} />,
    textClass: "text-black",
  },
];

const PlatformGrid = () => (
  <div className="grid grid-cols-2 gap-4">
    {PLATFORMS.map((p) => (
      <div
        key={p.name}
        className={`flex items-center justify-center gap-3 rounded-2xl shadow-md p-8 h-28 ${p.cardClass ?? "bg-white"}`}
      >
        {p.icon}
        {p.customName ? (
          p.customName
        ) : (
          <span className={`font-bold text-lg ${p.textClass ?? "text-black"}`}>
            {p.name}
          </span>
        )}
      </div>
    ))}
  </div>
);

const FEATURES = [
  {
    icon: Play,
    title: "Massive Reach",
    desc: "Access over 10 billion monthly video views across YouTube, TikTok, Instagram Reels, and more through a single unified platform.",
  },
  {
    icon: Target,
    title: "Precision Targeting",
    desc: "Reach audiences by interest, demographics, behavior, location, and viewing patterns. No wasted impressions.",
  },
  {
    icon: TrendingUp,
    title: "Performance Driven",
    desc: "Every campaign is measured with real-time analytics — views, clicks, completions, and conversions all in one dashboard.",
  },
  {
    icon: DollarSign,
    title: "Flexible Budgets",
    desc: "Run campaigns from ₱5,000 to ₱5,000,000. TrioTag optimizes spend across platforms to maximize your ROI.",
  },
  {
    icon: Layers,
    title: "Omnichannel",
    desc: "Combine social video with your OOH, DOOH, or AOOH campaigns for full-funnel impact — online and offline together.",
  },
  {
    icon: ShieldCheck,
    title: "Brand Safety",
    desc: "All placements are pre-vetted for brand safety. Your ads appear next to quality content only.",
  },
];

const STEPS = [
  {
    n: 1,
    title: "Brief Your Campaign",
    desc: "Tell us your goals, audience, budget, and timeline. Our platform matches you to the best-fit video channels.",
  },
  {
    n: 2,
    title: "We Build & Launch",
    desc: "TrioTag creates your video ad strategy, handles platform setup, and launches across selected channels simultaneously.",
  },
  {
    n: 3,
    title: "Track & Optimise",
    desc: "Monitor real-time performance across all platforms from your TrioTag dashboard. We continuously optimise for results.",
  },
];

const Social = () => {
  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <Navigation />

      {/* Hero */}
      <section className="bg-black py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="inline-block px-3 py-1 rounded-full bg-green-500/15 border border-green-500/40 text-green-500 text-xs font-semibold uppercase tracking-wider">
              Social Video Ad Exchange
            </span>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              Connecting Brands to Premium Video Audiences
            </h1>
            <p className="text-zinc-400 text-lg max-w-xl">
              TrioTag's Social Video Ad Exchange connects advertisers to top-tier video platforms — from short-form to long-form, creator content to premium streaming. Reach the right audience at scale across the world's most-watched platforms.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/campaign-submit">Start a Campaign</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/advertiser/explore">View Inventory</Link>
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-white/10">
              <div>
                <div className="text-3xl md:text-4xl font-bold text-green-500">10B+</div>
                <div className="text-xs text-zinc-400 mt-1">Views/month</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-green-500">6</div>
                <div className="text-xs text-zinc-400 mt-1">Platform Partners</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-green-500">3X</div>
                <div className="text-xs text-zinc-400 mt-1">Avg. engagement vs. display</div>
              </div>
            </div>
          </div>
          <PlatformGrid />
        </div>
      </section>

      {/* Partners */}
      <section className="bg-[#0c0c0c] py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="text-green-500 text-sm font-semibold uppercase tracking-wider">
              Advertising Partners & Platforms
            </div>
            <div className="border-t border-green-500/40" />
            <p className="text-zinc-300 text-lg">
              From short-form video to long-form streaming, TrioTag connects you to a full ecosystem of video platforms. Our team brings the strategy, relationships, and execution expertise so you can move faster without managing dozens of platform conversations.
            </p>
            <div className="border-t border-green-500/40" />
            <Link
              to="/contact"
              className="inline-flex items-center justify-center px-6 h-11 rounded-full border border-white/70 text-white hover:bg-white hover:text-black transition-colors text-sm font-semibold"
            >
              Let's talk
            </Link>
          </div>
          <PlatformGrid />
        </div>
      </section>

      {/* Why */}
      <section className="bg-black py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mb-12">
            <h2 className="text-3xl md:text-5xl font-bold">
              Why Social Video with <span className="text-green-500">TrioTag</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="bg-[#0c0c0c] border border-white/10 rounded-2xl p-6 hover:border-green-500/40 transition-colors"
                >
                  <div className="w-11 h-11 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-green-500" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-[#0c0c0c] py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mb-14">
            <h2 className="text-3xl md:text-5xl font-bold">How it works</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 relative">
            {STEPS.map((s, i) => (
              <div key={s.n} className="relative">
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-6 left-[calc(50%+2rem)] right-[-2rem] border-t-2 border-dashed border-green-500/40" />
                )}
                <div className="w-12 h-12 rounded-full bg-green-500 text-black font-bold flex items-center justify-center mb-4 relative z-10">
                  {s.n}
                </div>
                <h3 className="text-xl font-bold mb-2">{s.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-green-900/40 to-black py-20 md:py-28 border-t border-white/10">
        <div className="container mx-auto px-4 md:px-6 text-center max-w-3xl">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Ready to reach millions of video viewers?
          </h2>
          <p className="text-zinc-300 text-lg mb-8">
            Join hundreds of brands already running social video campaigns through TrioTag.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button asChild size="lg">
              <Link to="/campaign-submit">Start Your Campaign</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/contact">Talk to Sales</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Social;
