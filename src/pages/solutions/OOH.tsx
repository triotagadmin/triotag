import { Link } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  ScanLine,
  Image as ImageIcon,
  Square,
  FileText,
  MapPin,
  DollarSign,
  Eye,
  ShieldCheck,
  BarChart2,
  RefreshCw,
  ArrowDown,
} from "lucide-react";
import stickersBg from "@/assets/ooh-stickers.jpg";
import postersBg from "@/assets/ooh-posters.jpg";
import tableTentsBg from "@/assets/ooh-tabletents.jpg";
import flyersBg from "@/assets/ooh-flyers.jpg";

const formatCards = [
  { icon: ScanLine, title: "Stickers", desc: "High-visibility adhesive placements on counters, walls, and windows", bg: stickersBg },
  { icon: ImageIcon, title: "Posters", desc: "A3/A4 printed posters in high-dwell areas", bg: postersBg },
  { icon: Square, title: "Table Tents", desc: "Countertop placements at F&B venues and cafes", bg: tableTentsBg },
  { icon: FileText, title: "Flyers & Takeaways", desc: "Printed collateral distributed at point of purchase", bg: flyersBg },
];

const flowSteps = [
  {
    n: 1,
    title: "Retailers list spaces",
    desc: "Venues upload their available surfaces: walls, windows, counters, tables",
  },
  {
    n: 2,
    title: "Spaces go live on marketplace",
    desc: "Advertisers browse inventory filtered by location, venue type, footfall",
  },
  { n: 3, title: "Advertiser books & pays", desc: "Campaign confirmed, payment processed, print materials deployed" },
  { n: 4, title: "Proof of run", desc: "Photo documentation and post-campaign reporting delivered" },
];

const whyCards = [
  {
    icon: MapPin,
    title: "Hyper-Local Precision",
    desc: "Choose exact venues, streets, and barangays. Your ad appears only where your target customers shop and spend time.",
  },
  {
    icon: DollarSign,
    title: "Affordable Entry Point",
    desc: "OOH campaigns start from ₱5,000. Accessible for SMEs and national brands alike — no minimum fleet required.",
  },
  {
    icon: Eye,
    title: "High Dwell Time",
    desc: "Placed inside venues where customers spend 5–30 minutes. Not a passing glance — sustained brand exposure at point of purchase.",
  },
  {
    icon: ShieldCheck,
    title: "Verified Retailer Network",
    desc: "Every retailer venue is reviewed and approved by the TrioTag team. Brand-safe, quality environments only.",
  },
  {
    icon: BarChart2,
    title: "Campaign Reporting",
    desc: "Photo proof of placement, impression estimates, and post-campaign summary reports included with every booking.",
  },
  {
    icon: RefreshCw,
    title: "Flexible Duration",
    desc: "Run for 7 days, 30 days, or 90 days. Scale up or pause anytime based on campaign performance.",
  },
];

const specs = [
  ["Sticker", "100 pieces", "All venue types", "7 days", "Custom quote"],
  ["Poster", "100 pieces", "F&B, Retail, Gyms", "14 days", "Custom quote"],
  ["Table Tent", "100 pieces", "Cafes, Restaurants", "30 days", "Custom quote"],
  ["Window Cling", "10 pieces", "Retail, Salons", "14 days", "Custom quote"],
  ["Flyer Distribution", "500 pieces", "Events, Stores", "Per event", "Custom quote"],
];

export default function SolutionsOOH() {
  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <Navigation />

      {/* Hero */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="inline-block px-3 py-1 rounded-full bg-green-500/15 text-green-400 text-xs font-semibold border border-green-500/30">
              Retail Advertising
            </span>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              Register your retail business today.
            </h1>
            <p className="text-zinc-400 text-lg leading-relaxed">
              TrioTag is an SSP (Supply-Side Platform) for retail advertising — we connect retail advertising inventory
              with brands and companies.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/advertiser/explore">Register OOH Inventory</Link>
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10">
              {[
                ["180+", "Retailer Partners"],
                ["100M+", "OOH Assets"],
                ["5000+", "Active Placements"],
              ].map(([n, l]) => (
                <div key={l}>
                  <div className="text-2xl md:text-3xl font-bold text-green-500">{n}</div>
                  <div className="text-xs text-zinc-400 mt-1">{l}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {formatCards.map((c) => (
              <div
                key={c.title}
                className="relative overflow-hidden border border-white/10 rounded-2xl p-6 min-h-[180px] bg-cover bg-center"
                style={{ backgroundImage: `url(${c.bg})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/70 to-black/40" />
                <div className="relative">
                  <c.icon className="w-8 h-8 text-green-500 mb-4" />
                  <h3 className="font-bold text-lg mb-2 text-white">{c.title}</h3>
                  <p className="text-sm text-zinc-300">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SSP */}
      <section className="bg-[#0c0c0c] py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-6 grid lg:grid-cols-2 gap-12 items-start">
          <div className="bg-black border border-green-500/40 rounded-2xl p-8 space-y-5">
            <div className="text-xs font-semibold tracking-widest text-green-500 uppercase">Supply-Side Platform</div>
            <h2 className="text-3xl md:text-4xl font-bold">We connect ad spaces to advertisers — programmatically</h2>
            <p className="text-zinc-400 leading-relaxed">
              TrioTag operates as an SSP for out-of-home media. Retailer venues list their physical ad spaces on the
              TrioTag platform. Advertisers browse, book, and activate campaigns across our verified network — all
              managed through one dashboard. No cold calls. No manual negotiations. Just efficient, targeted OOH.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <span className="px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
                18+ Retailer Partners
              </span>
              <span className="px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
                Real-time booking
              </span>
            </div>
          </div>
          <div className="space-y-3">
            {flowSteps.map((s, i) => (
              <div key={s.n}>
                <div className="bg-black border border-white/10 rounded-2xl p-5 flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-green-500 text-black font-bold flex items-center justify-center shrink-0">
                    {s.n}
                  </div>
                  <div>
                    <h4 className="font-semibold">{s.title}</h4>
                    <p className="text-sm text-zinc-400 mt-1">{s.desc}</p>
                  </div>
                </div>
                {i < flowSteps.length - 1 && (
                  <div className="flex justify-center py-1">
                    <ArrowDown className="w-5 h-5 text-green-500" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why */}
      <section className="py-20 md:py-28 bg-black">
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Why OOH with TrioTag</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {whyCards.map((c) => (
              <div
                key={c.title}
                className="bg-[#0c0c0c] border border-white/10 rounded-2xl p-6 hover:border-green-500/40 transition"
              >
                <c.icon className="w-8 h-8 text-green-500 mb-4" />
                <h3 className="font-bold text-lg mb-2">{c.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* CTA */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-green-900/40 to-black">
        <div className="container mx-auto px-4 md:px-6 text-center max-w-3xl">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Ready to get your brand into the right spaces?</h2>
          <p className="text-zinc-400 text-lg mb-8">
            Browse available OOH inventory across our publisher network or talk to our team for a custom campaign plan.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button asChild size="lg">
              <Link to="/advertiser/explore">Register OOH Inventory</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/contact">Get a Custom Quote</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
