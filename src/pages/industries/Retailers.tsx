import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  Store,
  Utensils,
  Dumbbell,
  CheckCircle2,
  Shield,
  Clock,
  DollarSign,
  TrendingUp,
  Wallet,
  Users,
  LayoutGrid,
  Sparkles,
} from "lucide-react";

const Retailers = () => {
  const navigate = useNavigate();

  const goPublisherSignup = () => {
    localStorage.setItem("intended_role", "venue");
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <Navigation />

      {/* Hero */}
      <section className="container mx-auto px-4 md:px-6 py-20 md:py-28">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-green-500/15 text-green-400 text-xs font-semibold mb-5">
              For Venues & Retailers
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Turn your space into{" "}
              <span className="text-green-500">passive income</span>
            </h1>
            <p className="text-lg text-white/70 mb-8 max-w-xl">
              TrioTag connects your venue with brands that want to reach real
              shoppers. List your ad space for free, approve every booking, and
              get paid monthly.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" variant="cyber" onClick={goPublisherSignup}>
                List My Space for Free
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/contact")}>
                Talk to Our Team
              </Button>
            </div>
          </div>
          <div className="bg-[#0c0c0c] border border-white/10 rounded-3xl p-8">
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Wallet, label: "Monthly payouts" },
                { icon: Users, label: "Verified brands" },
                { icon: Shield, label: "You approve ads" },
                { icon: TrendingUp, label: "Grow over time" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="bg-black border border-white/10 rounded-xl p-4">
                  <Icon className="h-6 w-6 text-green-500 mb-2" />
                  <div className="text-sm text-white/80">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why TrioTag */}
      <section className="bg-[#0c0c0c] py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why retailers list with TrioTag
            </h2>
            <p className="text-white/70">
              We do the work of finding advertisers. You keep control of your space.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Wallet,
                title: "Free to list",
                desc: "No setup cost, no monthly fees. You only earn — never owe.",
              },
              {
                icon: Shield,
                title: "Full control",
                desc: "Approve or reject every brand booking before any ad goes live.",
              },
              {
                icon: Sparkles,
                title: "Set & forget",
                desc: "Brands find you, book online, and pay directly. We handle ops.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-black border border-white/10 rounded-2xl p-6">
                <Icon className="h-8 w-8 text-green-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">{title}</h3>
                <p className="text-white/70 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container mx-auto px-4 md:px-6 py-20 md:py-28">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How it works</h2>
          <p className="text-white/70">From listing to first payout with any payment platform, from e-wallets to bank accounts.</p>
        </div>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            ["01", "Create your account", "Sign up free as a publisher."],
            ["02", "Add your space", "Photos, location, and ad formats."],
            ["03", "Approve bookings", "Brands request, you accept."],
            ["04", "Get paid monthly", "GCash or bank transfer."],
          ].map(([num, title, desc]) => (
            <div key={num} className="bg-[#0c0c0c] border border-white/10 rounded-2xl p-6">
              <div className="text-green-500 font-bold text-2xl mb-3">{num}</div>
              <h3 className="font-semibold mb-2">{title}</h3>
              <p className="text-white/70 text-sm">{desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <Button size="lg" variant="cyber" onClick={goPublisherSignup}>
            List My Space for Free
          </Button>
        </div>
      </section>

      {/* Formats */}
      <section className="bg-[#0c0c0c] py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Any space, any format</h2>
            <p className="text-white/70">
              Window stickers, posters, table tents, in-store screens, audio spots — list whatever you have.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: LayoutGrid, title: "Print (OOH)", desc: "Stickers, posters, table tents." },
              { icon: TrendingUp, title: "Screens (DOOH)", desc: "TVs, tablets, LED displays." },
              { icon: Users, title: "Audio (AOOH)", desc: "In-store sound systems." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-black border border-white/10 rounded-2xl p-6">
                <Icon className="h-8 w-8 text-green-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">{title}</h3>
                <p className="text-white/70 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Section 7: Retailer Sign-Up CTA */}
      <section className="bg-black py-20 md:py-28">
        <div className="border border-green-500/20 rounded-3xl mx-4 md:mx-12 p-8 md:p-12 bg-[#070707]">
          <div className="grid lg:grid-cols-2 gap-10">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-green-500/15 text-green-400 text-xs font-semibold mb-5">
                Join the TrioTag Retailer Network
              </span>
              <h2 className="text-3xl md:text-5xl font-bold leading-tight mb-5">
                Start earning from your space — for free
              </h2>
              <p className="text-white/70 mb-6">
                List your venue on TrioTag's retailer marketplace in under 10
                minutes. Brands and advertisers will find your space, book it,
                and pay you directly. No sales calls. No chasing payments. Just
                passive income from the surfaces you already have.
              </p>

              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mt-4">
                <div className="text-xs uppercase tracking-wider text-green-400 font-semibold mb-3">
                  Estimated monthly earnings
                </div>
                <div className="space-y-2">
                  {[
                    { icon: Utensils, label: "Cafe / Restaurant", amt: "₱1,500 – ₱4,000 / month" },
                    { icon: Dumbbell, label: "Gym / Fitness", amt: "₱2,000 – ₱5,000 / month" },
                    { icon: Store, label: "Retail", amt: "₱8,000 – ₱20,000 / month" },
                  ].map(({ icon: Icon, label, amt }) => (
                    <div key={label} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-white/80">
                        <Icon className="h-4 w-4 text-green-500" />
                        {label}
                      </div>
                      <span className="text-white font-medium">{amt}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-white/50 mt-3">
                  *Earnings vary based on location, foot traffic, and format type
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 mt-6">
                {[
                  "Free to list — no upfront cost",
                  "You approve every ad booking",
                  "Monthly GCash or bank payouts",
                  "Dedicated retailer support team",
                  "Real-time earnings dashboard",
                  "Pause or remove listings anytime",
                ].map((c) => (
                  <div key={c} className="flex items-start gap-2 text-sm text-white/80">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    {c}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: sign-up card */}
            <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl p-8 self-start">
              <h3 className="text-2xl font-bold mb-2">List Your Space Today</h3>
              <p className="text-white/70 text-sm mb-6">
                Create your free retailer account and submit your first space in minutes.
              </p>
              <Button size="lg" variant="cyber" className="w-full" onClick={goPublisherSignup}>
                Sign Up as a Retailer
              </Button>

              <div className="flex items-center gap-3 my-5 text-white/40 text-xs">
                <div className="flex-1 h-px bg-white/10" />
                or
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <Button
                size="lg"
                variant="outline"
                className="w-full"
                onClick={() => navigate("/contact")}
              >
                Talk to Our Team First
              </Button>

              <div className="flex justify-center gap-6 mt-6 text-xs text-white/70">
                <div className="flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-green-500" /> Free to join
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-green-500" /> Approved in 48hrs
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-green-500" /> No commitment
                </div>
              </div>

              <p className="text-center text-xs text-white/50 mt-5">
                Already a publisher?{" "}
                <button
                  onClick={() => navigate("/auth")}
                  className="text-green-400 hover:underline"
                >
                  Log in here
                </button>
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Retailers;
