import { Link } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  Truck,
  Eye,
  MapPin,
  Zap,
  CheckCircle2,
  Volume2,
  Monitor,
  Megaphone,
  Star,
  Users,
  Globe,
  DollarSign,
  Play,
} from "lucide-react";
import truckFeaturesVideo from "@/assets/truck-features.mp4.asset.json";
import superTruckVideo from "@/assets/supertruckmediakit.mp4.asset.json";

const features = [
  {
    n: 1,
    title: "Route-based deployment",
    desc: "Planned visibility across target districts and high-footfall roads.",
  },
  { n: 2, title: "Digital LED display", desc: "Supports video, animated, and static brand creatives." },
  { n: 3, title: "Campaign documentation", desc: "Photo/video proof and post-campaign reporting support." },
  {
    n: 4,
    title: "Retail-area focus",
    desc: "Useful for supermarket, mall, convenience store, and event-area promotions.",
  },
];

const routePills = [
  "Supermarkets & groceries",
  "Malls & food courts",
  "Convenience store clusters",
  "CBD & commuter corridors",
  "Schools / campus districts",
  "Transport terminals",
  "Events & weekend destinations",
  "Wet markets & community areas",
];

const truckFeatures = [
  { title: "Visibility", desc: "High-visibility experiential media truck designed to optimize brand exposure." },
  { title: "Livestreaming", desc: "Integrated livestream technology for real-time brand experience activations." },
  { title: "Marketing", desc: "Supported by an experienced digital commerce marketing and live selling team." },
  {
    title: "Targeting",
    desc: "Programmatic adtech to reach hyperlocal audiences near the activation site. Target consumers based on location, product interest, and buying behavior.",
  },
  {
    title: "Engagement",
    desc: "Event concepts that engage audiences, turning brand interaction into user-generated content.",
  },
];

const useCases = [
  {
    title: "Beverage Launch: 3-Day Retail Burst",
    best: "Best for drink, snack, personal care, or household categories",
    grid: [
      ["Objective", "Create awareness for a new flavor and support retail-area visibility"],
      ["Target Routes", "Malls, supermarkets, food parks, convenience-store clusters, commuter corridors"],
      ["Creative", "10–15 second LED video loop with product packshot, short tagline, and QR promo"],
      ["Deliverables", "Route plan, deployment confirmation, photo/video proof, and post-campaign summary"],
    ],
    tags: ["Brand Awareness", "Promo Engagement", "Product Showcase"],
  },
  {
    title: "Clothing Store: 7-Day Product Launch",
    best: "Best for fashion, apparel, and lifestyle brands",
    grid: [
      ["Objective", "Drive foot traffic to store locations and create buzz for a new collection"],
      ["Target Routes", "Malls, fashion districts, university belts, lifestyle hubs"],
      ["Creative", "Bold lifestyle video content featuring the new collection with store location tags"],
      ["Deliverables", "Route plan, geo-tagged proof photos, social media content clips, post-report"],
    ],
    tags: ["Product Launch", "Foot Traffic", "Collection Reveal"],
  },
  {
    title: "Livestream Show: 14-Day Marketing Campaign",
    best: "Best for entertainment, events, and digital-commerce brands",
    grid: [
      ["Objective", "Build audience for a recurring livestream show and grow online following"],
      ["Target Routes", "CBD corridors, transport hubs, event areas, entertainment districts"],
      ["Creative", "30-second video teaser with QR code linking to livestream channel"],
      [
        "Deliverables",
        "Short and long-form content, livestream content, event marketing, adtech services, digital assets, post-event reporting, optional e-commerce shop",
      ],
    ],
    tags: ["Livestream", "Content Marketing", "Brand Takeover"],
  },
];

const packages = [
  [
    "Launch Drive",
    "New product / flavor launch",
    "1 truck, 1–2 campaign days",
    "Route plan, LED ad loop, Proof photos",
  ],
  [
    "Retail Burst",
    "Store-area promotion",
    "1–2 trucks, 3–7 campaign days",
    "Priority routes, Daypart schedule, Post-report",
  ],
  [
    "City Domination",
    "High-visibility campaign",
    "Multi-truck, 2–4 weeks",
    "Multiple routes, Creative rotation, Proof video",
  ],
  [
    "FMCG Roadshow",
    "Activation + mobility",
    "Custom fleet, Custom schedule",
    "Route + on-ground, Optional add-ons, Documentation",
  ],
];

const newMedia = [
  {
    icon: Star,
    title: "Iconic Brand",
    desc: "Building a name that stands for premium experiences and unforgettable activations.",
  },
  {
    icon: Users,
    title: "Unforgettable Experiences",
    desc: "Crafting moments that leave a lasting impression and generate organic content.",
  },
  {
    icon: Globe,
    title: "National Brand Expansion",
    desc: "Bringing your brand to more cities, communities, and online audiences.",
  },
  {
    icon: DollarSign,
    title: "Profitable Partnership Model",
    desc: "Creating sustainable growth and value for brand partners and stakeholders.",
  },
];

export default function SolutionsMediaTruck() {
  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <Navigation />

      {/* Hero */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="text-xs font-semibold tracking-widest text-green-500 uppercase">
              Mobile Advertising Fleet
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              Mobile Retail Brand Trucks for City-Wide Brand Exposure
            </h1>
            <p className="text-zinc-400 text-lg">
              A flexible mobile media that combines moving routes, high-impact events, and livestream campaigns.
              TrioTag's media truck fleet brings your brand directly to where FMCG shoppers already move.
            </p>
            <div className="text-xs font-semibold tracking-widest text-green-500 uppercase">
              Retail Media. Real Results.
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/contact">Book a Truck Campaign</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#packages">View Packages</a>
              </Button>
            </div>
          </div>
          <div className="bg-[#0c0c0c] border border-green-500/30 rounded-2xl p-3 overflow-hidden">
            <video
              src={superTruckVideo.url}
              autoPlay
              loop
              muted
              playsInline
              controls
              className="w-full h-auto rounded-xl object-contain"
            />
          </div>
        </div>
      </section>

      {/* What TrioTag Offers */}
      <section className="bg-[#0c0c0c] py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-6 grid lg:grid-cols-2 gap-12 items-start">
          <div className="space-y-5">
            <div className="text-xs font-semibold tracking-widest text-green-500 uppercase">What TrioTag Offers</div>
            <h2 className="text-3xl md:text-4xl font-bold">Mobile LED billboard trucks for city-wide FMCG exposure</h2>
            <p className="text-zinc-400 leading-relaxed">
              A flexible out-of-home media format that combines moving routes, high-impact LED creative, and campaign
              documentation for brand teams.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {features.map((f) => (
              <div key={f.n} className="bg-black border border-white/10 rounded-2xl p-6">
                <div className="w-10 h-10 rounded-full bg-green-500 text-black font-bold flex items-center justify-center mb-4">
                  {f.n}
                </div>
                <h3 className="font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-zinc-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Route Planning */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-6 grid lg:grid-cols-2 gap-12 items-stretch">
          <div className="bg-[#0c0c0c] border border-green-500 rounded-2xl p-8 space-y-5">
            <div className="text-xs font-semibold tracking-widest text-green-500 uppercase">Route Planning</div>
            <h2 className="text-3xl md:text-4xl font-bold">Put the brand where FMCG shoppers already move.</h2>
            <p className="text-zinc-400">
              Route strategy can be built around retail proximity, commuter flow, event density, and target district
              coverage.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              {routePills.map((p) => (
                <span key={p} className="border border-white/20 rounded-full px-4 py-2 text-sm text-white">
                  {p}
                </span>
              ))}
            </div>
            <p className="text-xs text-zinc-500 pt-2">
              *Final route deployment is subject to traffic, local regulations, permits, and operational approval.
            </p>
          </div>
          <div
            className="bg-[#0a0a0a] border border-white/10 rounded-2xl min-h-[300px] flex items-center justify-center"
            style={{
              backgroundImage:
                "linear-gradient(rgba(34,197,94,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.08) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          >
            <div className="text-center p-8">
              <MapPin className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <p className="text-zinc-400 text-sm">Targeted city grid coverage</p>
            </div>
          </div>
        </div>
      </section>

      {/* Truck Features */}
      <section className="bg-[#0c0c0c] py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-6 grid lg:grid-cols-2 gap-12 items-start">
          <div className="space-y-4">
            {truckFeatures.map((f) => (
              <div key={f.title} className="flex gap-4 items-start bg-black border border-white/10 rounded-2xl p-5">
                <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold mb-1">{f.title}</h3>
                  <p className="text-sm text-zinc-400">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="relative border border-white/10 rounded-2xl overflow-hidden min-h-[420px] bg-black">
            <video
              src={truckFeaturesVideo.url}
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover brightness-125"
            />
          </div>
        </div>
      </section>

      {/* New Media Strategies */}
      <section className="py-20 md:py-28 bg-[#0c0c0c]">
        <div className="container mx-auto px-4 md:px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-5">
            <h2 className="text-3xl md:text-4xl font-bold text-green-500">New Media Strategies</h2>
            <div className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
              Livestream Event Brand Takeover
            </div>
            <div className="h-px bg-green-500/40" />
            <p className="text-xl font-bold text-green-400">Launch Your Brand on Video Streaming Platforms</p>
            <div className="grid grid-cols-2 gap-5 pt-4">
              {newMedia.map((m) => (
                <div key={m.title}>
                  <m.icon className="w-7 h-7 text-green-500 mb-3" />
                  <h3 className="font-bold mb-1">{m.title}</h3>
                  <p className="text-sm text-zinc-400">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-black/60 border border-white/10 rounded-2xl p-12 text-center">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Play className="w-10 h-10 text-black ml-1" />
            </div>
            <p className="text-xl font-bold">Live. Loud. Everywhere.</p>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <span className="inline-block px-3 py-1 rounded-full bg-green-500/15 text-green-400 text-xs font-semibold border border-green-500/30 mb-4">
              CUSTOM TRUCK
            </span>
            <h2 className="text-3xl md:text-4xl font-bold">Advertising Strategies</h2>
          </div>
          <div className="grid lg:grid-cols-3 gap-6">
            {useCases.map((u) => (
              <div key={u.title} className="bg-black border border-white/10 rounded-2xl p-6 space-y-4">
                <h3 className="font-bold text-lg">{u.title}</h3>
                <p className="text-xs text-green-400">{u.best}</p>
                <div className="grid grid-cols-2 gap-3">
                  {u.grid.map(([k, v]) => (
                    <div key={k} className="bg-[#0c0c0c] border border-white/10 rounded-lg p-3">
                      <div className="text-xs text-green-500 font-semibold mb-1">{k}</div>
                      <div className="text-xs text-zinc-400">{v}</div>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {u.tags.map((t) => (
                    <span
                      key={t}
                      className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-xs"
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

      {/* Packages */}
      <section id="packages" className="py-20 md:py-28 bg-[#0c0c0c]">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-10">
            <div className="text-xs font-semibold tracking-widest text-green-500 uppercase mb-3">
              Editable Rate Card Framework
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">FMCG Package Structure</h2>
            <p className="text-zinc-400 max-w-3xl mx-auto">
              Use this as the working rate card framework. All rates are custom-quoted based on confirmed pricing,
              inclusions, operating hours, route coverage, and fleet availability.
            </p>
          </div>
          <div className="bg-black border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-green-500/10 border-b border-green-500/30">
                <tr>
                  {["Package", "Best For", "Deployment", "Includes", "Rate"].map((h) => (
                    <th key={h} className="text-left p-4 text-green-400 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {packages.map((row, i) => (
                  <tr key={i} className="border-b border-white/5 last:border-0">
                    {row.map((c, j) => (
                      <td key={j} className="p-4 text-zinc-300">
                        {c}
                      </td>
                    ))}
                    <td className="p-4 text-green-400 font-semibold">Custom quote</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-zinc-500 mt-4">
            *Optional add-ons: route premium, extended operating hours, added truck units, on-ground capture, QR promo
            tracking, exclusive deployment window.
          </p>
        </div>
      </section>


      {/* CTA Contact */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-green-900/40 to-black">
        <div className="container mx-auto px-4 md:px-6 grid lg:grid-cols-2 gap-12 items-start">
          <div className="space-y-5">
            <div className="text-xs font-semibold tracking-widest text-green-500 uppercase">
              Mobile Advertising Fleet
            </div>
            <h2 className="text-3xl md:text-5xl font-bold">Let's map your next campaign.</h2>
            <p className="text-zinc-300">
              Share your campaign objective, target city, target retail areas, preferred duration, creative format, and
              estimated budget range. TrioTag will recommend a deployment plan and package quotation.
            </p>
            <div className="bg-black/60 border border-green-500/30 rounded-xl p-6">
              <div className="text-xs font-semibold text-green-500 mb-2">Next Step</div>
              <p className="text-sm text-zinc-300">
                Send your campaign brief and preferred launch date so we can prepare a custom route plan and quotation.
              </p>
            </div>
          </div>
          <div className="bg-black/60 border border-green-500/30 rounded-2xl p-8 space-y-4">
            <h3 className="text-2xl font-bold">Contact</h3>
            <div>
              <div className="text-xs text-zinc-400">Company</div>
              <div className="text-green-400 font-bold">TRIOTAG</div>
            </div>
            <div>
              <div className="text-xs text-zinc-400">Email</div>
              <div>ayelortiz108@gmail.com</div>
            </div>
            <div>
              <div className="text-xs text-zinc-400">Phone / Viber / WhatsApp</div>
              <div>+63 945 664 0894</div>
            </div>
            <div>
              <div className="text-xs text-zinc-400">Website</div>
              <div>www.TrioTag.com</div>
            </div>
            <div>
              <div className="text-xs text-zinc-400">Address</div>
              <div>BGC, Taguig City</div>
            </div>
            <div className="h-px bg-green-500/40 my-2" />
            <p className="text-green-400 font-semibold text-center">Brands on the move.</p>
            <Button asChild size="lg" className="w-full">
              <Link to="/contact">Book a Campaign</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
