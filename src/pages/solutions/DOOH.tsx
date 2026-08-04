import { Link } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  Dumbbell,
  Sparkles,
  Heart,
  ShoppingCart,
  Utensils,
  Building2,
  Play,
  Zap,
  Image as ImageIcon,
  ArrowDown,
} from "lucide-react";
import doohVideo from "@/assets/doohmediakit.mp4.asset.json";

const flowSteps = [
  { n: 1, title: "Screen Owner Lists Display", desc: "Venue registers screen specs, location, operating hours, and audience footfall" },
  { n: 2, title: "Retailer Books Timeslot", desc: "Select daypart, duration, creative format, and target locations" },
  { n: 3, title: "Creative Goes Live", desc: "Video or static content displayed during booked timeslot on venue screen" },
  { n: 4, title: "Performance Report", desc: "Proof of play, estimated impressions, and campaign summary delivered" },
];

const venues = [
  { icon: Dumbbell, title: "Gyms & Fitness", desc: "High-attention audiences during 45–90 min sessions. Premium demographics, health-conscious consumers." },
  { icon: Sparkles, title: "Salons & Barbershops", desc: "Captive audience in waiting and service areas. 20–60 min avg. dwell time per visit." },
  { icon: Heart, title: "Clinics & Medical", desc: "Waiting room screens reaching health-aware, decision-making adults." },
  { icon: ShoppingCart, title: "Retail & Groceries", desc: "Point-of-purchase screens influencing buying decisions in real time." },
  { icon: Utensils, title: "Cafes & Restaurants", desc: "Screens during meal times — high recall, relaxed attention state." },
  { icon: Building2, title: "Offices & Co-working", desc: "Professional audience in break rooms, lobbies, and common areas." },
];

const creatives = [
  { icon: Play, title: "Video Ads (15–30 sec)", desc: "Full-motion video for maximum impact. Supports MP4 up to 1080p. Loops during booked timeslot." },
  { icon: Zap, title: "Animated HTML5", desc: "Animated display ads with dynamic content. Weather triggers, time-based creative, live offers." },
  { icon: ImageIcon, title: "Static Display", desc: "High-resolution static images. JPEG/PNG up to 4K. Ideal for brand awareness and simple messaging." },
];

const specs = [
  ["Standard HD", "1920×1080", "16:9", "MP4, JPG, PNG", "15 or 30 sec"],
  ["Vertical Display", "1080×1920", "9:16", "MP4, JPG, PNG", "15 or 30 sec"],
  ["Large Format", "3840×2160", "16:9", "MP4, JPG", "30 sec"],
];

export default function SolutionsDOOH() {
  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <Navigation />

      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="inline-block px-3 py-1 rounded-full bg-green-500/15 text-green-400 text-xs font-semibold border border-green-500/30">
              Digital Retail Advertising
            </span>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">Dynamic Digital Screens inside Retail Stores.</h1>
            <p className="text-zinc-400 text-lg">
              TrioTag's DOOH network connects DOOH media owners to Global Brands as well as MSME businesses across the Philippines.Launch Retal media campaiagns in Print, Video, Animated, and Aduio creatives — all managed through TrioTag's SSP platform.
            </p>


          </div>
          <div className="bg-[#0c0c0c] border-4 border-green-500/30 rounded-2xl p-3 overflow-hidden">
            <video
              src={doohVideo.url}
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

      <section className="bg-[#0c0c0c] py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-6 grid lg:grid-cols-2 gap-12 items-start">
          <div className="bg-black border border-green-500/40 rounded-2xl p-8 space-y-5">
            <div className="text-xs font-semibold tracking-widest text-green-500 uppercase">Supply-Side Platform</div>
            <h2 className="text-3xl md:text-4xl font-bold">One platform. Hundreds of screens. Full control.</h2>
            <p className="text-zinc-400 leading-relaxed">
              TrioTag acts as the SSP layer between venue owners with digital screens and brands looking for premium digital placements. Retailer venues register their screens on our platform — advertisers book timeslots, upload creatives, and track performance — all from a single dashboard. Programmatic DOOH made accessible for the Philippine market.
            </p>
          </div>
          <div className="space-y-3">
            {flowSteps.map((s, i) => (
              <div key={s.n}>
                <div className="bg-black border border-white/10 rounded-2xl p-5 flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-green-500 text-black font-bold flex items-center justify-center shrink-0">{s.n}</div>
                  <div>
                    <h4 className="font-semibold">{s.title}</h4>
                    <p className="text-sm text-zinc-400 mt-1">{s.desc}</p>
                  </div>
                </div>
                {i < flowSteps.length - 1 && <div className="flex justify-center py-1"><ArrowDown className="w-5 h-5 text-green-500" /></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Where TrioTag DOOH Screens Run</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {venues.map((v) => (
              <div key={v.title} className="bg-[#0c0c0c] border border-white/10 rounded-2xl p-6 hover:border-green-500/40 transition">
                <v.icon className="w-8 h-8 text-green-500 mb-4" />
                <h3 className="font-bold text-lg mb-2">{v.title}</h3>
                <p className="text-sm text-zinc-400">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28 bg-[#0c0c0c]">
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Creative Formats</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {creatives.map((c) => (
              <div key={c.title} className="bg-black border border-white/10 rounded-2xl p-6">
                <c.icon className="w-8 h-8 text-green-500 mb-4" />
                <h3 className="font-bold text-lg mb-2">{c.title}</h3>
                <p className="text-sm text-zinc-400">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center">DOOH Specifications</h2>
          <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-green-500/10 border-b border-green-500/30">
                <tr>
                  {["Screen Type", "Resolution", "Aspect Ratio", "Creative Format", "Loop Duration"].map((h) => (
                    <th key={h} className="text-left p-4 text-green-400 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {specs.map((row, i) => (
                  <tr key={i} className="border-b border-white/5 last:border-0">
                    {row.map((c, j) => <td key={j} className="p-4 text-zinc-300">{c}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28 bg-gradient-to-br from-green-900/40 to-black">
        <div className="container mx-auto px-4 md:px-6 text-center max-w-3xl">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Put your brand on screen in venues that matter</h2>
          <p className="text-zinc-400 text-lg mb-8">Browse DOOH screen inventory across our publisher network or get a custom media plan for your next campaign.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button asChild size="lg"><Link to="/advertiser/explore">Browse DOOH Screens</Link></Button>
            <Button asChild size="lg" variant="outline"><Link to="/contact">Talk to Our Team</Link></Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
