import { Link } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  Volume2,
  ShoppingCart,
  Target,
  Clock,
  BarChart2,
  DollarSign,
  ShoppingBag,
  Utensils,
  Dumbbell,
  Building2,
  Star,
  ArrowDown,
} from "lucide-react";

const why = [
  { icon: ShoppingCart, title: "Point of Purchase Impact", desc: "Audio ads play inside the store while shoppers browse. The buying decision happens right there — your message reaches them at the critical moment." },
  { icon: Target, title: "Hyperlocal Targeting", desc: "Select specific stores, venue types, locations, and even dayparts. Morning commuters vs. weekend shoppers — AOOH lets you target both differently." },
  { icon: Volume2, title: "No Visual Competition", desc: "Unlike OOH and DOOH, audio doesn't compete with shelves, screens, or phones. A well-crafted 15-second spot cuts through visual noise entirely." },
  { icon: Clock, title: "Daypart Scheduling", desc: "Schedule your ad to play during peak shopping hours — lunch rush, after-work, weekend mornings. Maximize relevance by time of day." },
  { icon: BarChart2, title: "Measurable Performance", desc: "Track total plays, estimated reach per venue, and campaign duration. Post-campaign reports included with every booking." },
  { icon: DollarSign, title: "Cost-Efficient Reach", desc: "Reach hundreds of in-store shoppers per day at a fraction of TV or digital radio costs. Ideal for FMCG, retail, and consumer brands." },
];

const flowSteps = [
  { n: 1, title: "Venue connects audio system", desc: "Store registers their speaker setup, location, operating hours, and daily foot traffic" },
  { n: 2, title: "Retailer selects venues & daypart", desc: "Choose stores by location, venue type, and time of day" },
  { n: 3, title: "Audio ad goes live", desc: "15 or 30-second spot plays at scheduled intervals during operating hours" },
  { n: 4, title: "Proof of play & report", desc: "Play count, estimated reach, and campaign summary delivered post-campaign" },
];

const specs = [
  ["Standard Spot", "15 seconds", "MP3, WAV", "5MB", "Required"],
  ["Extended Spot", "30 seconds", "MP3, WAV", "10MB", "Required"],
  ["Jingle + VO", "15–30 sec", "MP3, WAV", "10MB", "Optional"],
];

const bestFor = [
  { icon: ShoppingBag, title: "FMCG Brands", desc: "Supermarket and convenience store audio is ideal for snack, beverage, personal care, and household product campaigns." },
  { icon: Utensils, title: "Food & Beverage", desc: "Drive trial and upsell inside F&B venues. Announce new flavors, promos, or meal deals at the point of order." },
  { icon: Dumbbell, title: "Health & Wellness", desc: "Reach gym-goers and health-conscious consumers inside fitness centers with supplement, wellness, and lifestyle brands." },
  { icon: ShoppingCart, title: "Retail & Promo", desc: "Announce flash sales, loyalty programs, and new arrivals inside retail stores right when customers are browsing." },
  { icon: Building2, title: "Real Estate & Finance", desc: "Waiting rooms and co-working spaces are ideal for financial services and property brand awareness." },
  { icon: Star, title: "Events & Entertainment", desc: "Promote upcoming events to a captive in-venue audience in the days leading up to your event." },
];

export default function SolutionsAOOH() {
  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <Navigation />

      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="inline-block px-3 py-1 rounded-full bg-green-500/15 text-green-400 text-xs font-semibold border border-green-500/30">
              Audio Retail Advertising
            </span>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">We provide programmatic OOH for audio ads.</h1>
            <p className="text-zinc-400 text-lg">
              TrioTag's AOOH network is equipped with audio proof of play technology, we also provide audio publisher partnerships with retail media owners &nbsp;— managed through TrioTag's SSP platform.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg"><Link to="/advertiser/explore">Register AOOH Inventory</Link></Button>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10">
              {[["Point-of-Purchase", "Placement"], ["15–30 sec", "Ad format"], ["Hyper-local", "Targeting"]].map(([n, l]) => (
                <div key={l}>
                  <div className="text-xl md:text-2xl font-bold text-green-500">{n}</div>
                  <div className="text-xs text-zinc-400 mt-1">{l}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-[#0c0c0c] border border-green-500/30 rounded-2xl p-10 text-center relative overflow-hidden">
            <div className="relative h-56 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full animate-pulse-glow" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="90" fill="none" stroke="#22c55e" strokeWidth="1" className="opacity-10" />
                <circle cx="100" cy="100" r="65" fill="none" stroke="#22c55e" strokeWidth="1" className="opacity-20" />
                <circle cx="100" cy="100" r="40" fill="none" stroke="#22c55e" strokeWidth="1" className="opacity-30" />
              </svg>
              <Volume2 className="w-16 h-16 text-green-500 relative z-10" />
            </div>
            <p className="text-zinc-300 mt-6 mb-4">Audio ads playing in-store right now</p>
            <div className="flex flex-wrap justify-center gap-2">
              {["Supermarket", "Gym", "Convenience Store"].map((p) => (
                <span key={p} className="px-3 py-1 rounded-full bg-black border border-white/10 text-xs text-zinc-300">{p}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#0c0c0c] py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="text-2xl md:text-4xl font-bold text-center mb-12 max-w-3xl mx-auto">
            The only ad format that speaks to customers exactly when and where they buy
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {why.map((c) => (
              <div key={c.title} className="bg-black border border-white/10 rounded-2xl p-6 hover:border-green-500/40 transition">
                <c.icon className="w-8 h-8 text-green-500 mb-4" />
                <h3 className="font-bold text-lg mb-2">{c.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-6 grid lg:grid-cols-2 gap-12 items-start">
          <div className="bg-[#0c0c0c] border border-green-500/40 rounded-2xl p-8 space-y-5">
            <div className="text-xs font-semibold tracking-widest text-green-500 uppercase">Supply-Side Platform</div>
            <h2 className="text-3xl md:text-4xl font-bold">We manage the network. You manage the message.</h2>
            <p className="text-zinc-400 leading-relaxed">
              Venue owners connect their in-store audio systems to TrioTag's AOOH network. Advertisers select venues, upload their audio creative, set their schedule, and go live — all through the TrioTag dashboard. No direct vendor negotiations, no manual scheduling.
            </p>
          </div>
          <div className="space-y-3">
            {flowSteps.map((s, i) => (
              <div key={s.n}>
                <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl p-5 flex gap-4 items-start">
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

      <section className="py-20 md:py-28 bg-[#0c0c0c]">
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center">AOOH Creative Specs</h2>
          <div className="bg-black border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-green-500/10 border-b border-green-500/30">
                <tr>
                  {["Format", "Duration", "File Type", "Max File Size", "Voice-Over"].map((h) => (
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
          <p className="text-xs text-zinc-500 mt-4">*TrioTag can connect you with voice-over and audio production partners if you need help creating your spot.</p>
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Which brands benefit most from AOOH?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bestFor.map((c) => (
              <div key={c.title} className="bg-[#0c0c0c] border border-white/10 rounded-2xl p-6 hover:border-green-500/40 transition">
                <c.icon className="w-8 h-8 text-green-500 mb-4" />
                <h3 className="font-bold text-lg mb-2">{c.title}</h3>
                <p className="text-sm text-zinc-400">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28 bg-gradient-to-br from-green-900/40 to-black">
        <div className="container mx-auto px-4 md:px-6 text-center max-w-3xl">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Be the voice inside the store</h2>
          <p className="text-zinc-400 text-lg mb-8">Connect with in-store shoppers through TrioTag's AOOH network. Book venues, upload your audio, and go live in days.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button asChild size="lg"><Link to="/advertiser/explore">Browse AOOH Venues</Link></Button>
            <Button asChild size="lg" variant="outline"><Link to="/contact">Get a Quote</Link></Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
