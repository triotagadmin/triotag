import { Link } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  Printer,
  Monitor,
  Building2,
  Handshake,
  TrendingUp,
  ShieldCheck,
  Users,
  Wallet,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

const partnerTypes = [
  {
    icon: Printer,
    title: "Print Partners",
    desc: "Local print shops, large-format printers, and production houses. Receive fulfilment jobs for OOH campaigns booked through TrioTag — stickers, posters, table tents, window clings, and flyers.",
    bullets: ["Steady job flow from active campaigns", "Set your own pricing & turnaround", "Get paid per fulfilled order"],
  },
  {
    icon: Monitor,
    title: "Equipment & Screen Suppliers",
    desc: "Digital display vendors, LED screen manufacturers, audio equipment installers, and CMS providers. Power the DOOH and AOOH network with your hardware and integrations.",
    bullets: ["Distribute hardware to verified venues", "Co-branded deployments", "Long-term recurring revenue"],
  },
  {
    icon: Building2,
    title: "Media Owners",
    desc: "Operators of mall networks, retail chains, transit assets, gyms, salons, and high-footfall venues. Monetize your physical and digital ad inventory through TrioTag's SSP.",
    bullets: ["Unlock new ad revenue streams", "Programmatic & direct demand", "Full transparency & reporting"],
  },
];

const benefits = [
  { icon: TrendingUp, title: "New Revenue Streams", desc: "Tap into national brand budgets and SME campaigns flowing through TrioTag's retail media platform." },
  { icon: Users, title: "Verified Demand", desc: "We bring qualified retailers and brands to you — no cold calls, no manual prospecting." },
  { icon: ShieldCheck, title: "Brand-Safe Network", desc: "Every partner is vetted. Work alongside reputable retailers, agencies, and venue operators." },
  { icon: Wallet, title: "Transparent Payouts", desc: "Clear pricing, predictable settlement, and per-job or per-campaign tracking via your dashboard." },
  { icon: Handshake, title: "Long-Term Partnerships", desc: "We grow with you. Co-marketing, joint pitches, and category-exclusive deals available." },
  { icon: CheckCircle2, title: "Easy Onboarding", desc: "Sign up, get verified, and start receiving opportunities within days — no integration headaches." },
];

const steps = [
  { n: 1, title: "Apply", desc: "Tell us about your business, capacity, and service area." },
  { n: 2, title: "Get Verified", desc: "Our team reviews your application and onboards you to the partner network." },
  { n: 3, title: "Receive Opportunities", desc: "Print jobs, hardware deployments, or campaign bookings sent to your dashboard." },
  { n: 4, title: "Deliver & Get Paid", desc: "Fulfil the work, submit proof, and get paid through TrioTag." },
];

export default function MediaPartners() {
  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <Navigation />

      {/* Hero */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-black via-black to-green-950/30">
        <div className="container mx-auto px-4 md:px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="inline-block px-3 py-1 rounded-full bg-green-500/15 text-green-400 text-xs font-semibold border border-green-500/30">
              Media Partners Program
            </span>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              Power the Philippines' Retail Media Network
            </h1>
            <p className="text-zinc-400 text-lg leading-relaxed">
              TrioTag partners with printers, equipment suppliers, and media owners to deliver retail advertising
              across thousands of venues. Join the network and turn your capacity into recurring revenue.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/contact">Apply as a Partner <ArrowRight className="w-4 h-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#partner-types">See Partner Types</a>
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10">
              {[["18+", "Active Venues"], ["3", "Partner Tracks"], ["100%", "Verified"]].map(([n, l]) => (
                <div key={l}>
                  <div className="text-2xl md:text-3xl font-bold text-green-500">{n}</div>
                  <div className="text-xs text-zinc-400 mt-1">{l}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {partnerTypes.slice(0, 4).map((c) => (
              <div key={c.title} className="bg-[#0c0c0c] border border-white/10 rounded-2xl p-6">
                <c.icon className="w-8 h-8 text-green-500 mb-4" />
                <h3 className="font-bold text-lg mb-2">{c.title}</h3>
                <p className="text-sm text-zinc-400 line-clamp-3">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Types */}
      <section id="partner-types" className="py-20 md:py-28 bg-[#0c0c0c]">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Who We Partner With</h2>
            <p className="text-zinc-400 text-lg">
              Three partner tracks. One platform connecting supply, fulfilment, and demand.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {partnerTypes.map((p) => (
              <div key={p.title} className="bg-black border border-white/10 rounded-2xl p-8 hover:border-green-500/40 transition space-y-5">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                  <p.icon className="w-6 h-6 text-green-500" />
                </div>
                <h3 className="text-2xl font-bold text-green-400">{p.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{p.desc}</p>
                <ul className="space-y-2 pt-2">
                  {p.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm text-zinc-300">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 md:py-28 bg-black">
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Why Partner with TrioTag</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((b) => (
              <div key={b.title} className="bg-[#0c0c0c] border border-white/10 rounded-2xl p-6 hover:border-green-500/40 transition">
                <b.icon className="w-8 h-8 text-green-500 mb-4" />
                <h3 className="font-bold text-lg mb-2">{b.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 md:py-28 bg-[#0c0c0c]">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">How Partnership Works</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {steps.map((s) => (
              <div key={s.n} className="bg-black border border-white/10 rounded-2xl p-6 flex gap-4">
                <div className="w-10 h-10 shrink-0 rounded-full bg-green-500 text-black font-bold flex items-center justify-center">
                  {s.n}
                </div>
                <div>
                  <h4 className="font-semibold mb-1">{s.title}</h4>
                  <p className="text-sm text-zinc-400">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-green-900/40 to-black">
        <div className="container mx-auto px-4 md:px-6 text-center max-w-3xl">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Ready to join the network?</h2>
          <p className="text-zinc-400 text-lg mb-8">
            Whether you print, supply, or own media — let's build the country's most connected retail media network together.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button asChild size="lg">
              <Link to="/contact">Apply as a Partner</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="mailto:tinystickyads@gmail.com">Email Our Team</a>
            </Button>
          </div>
          <p className="text-xs text-zinc-500 mt-6">
            tinystickyads@gmail.com · +63 945 664 0894
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
