import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  Image as ImageIcon,
  Monitor,
  Volume2,
  Play,
  Shield,
  DollarSign,
  MapPin,
  Target,
  Zap,
  BarChart3,
  Layers,
} from "lucide-react";

const Brands = () => {
  const navigate = useNavigate();

  const goAdvertiserSignup = () => {
    localStorage.setItem("intended_role", "advertiser");
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
              For Brands & Advertisers
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Reach shoppers where they{" "}
              <span className="text-green-500">already are</span>
            </h1>
            <p className="text-lg text-white/70 mb-8 max-w-xl">
              TrioTag is your one-stop platform for hyper-local OOH, DOOH, and
              AOOH campaigns across the Philippines. Browse, book, and launch
              in days.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" variant="cyber" onClick={goAdvertiserSignup}>
                Launch a Campaign
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/advertiser/explore")}>
                Browse Inventory
              </Button>
            </div>
          </div>
          <div className="bg-[#0c0c0c] border border-white/10 rounded-3xl p-8">
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Target, label: "Hyper-local targeting" },
                { icon: Zap, label: "Live in days" },
                { icon: BarChart3, label: "Real-time reports" },
                { icon: Layers, label: "4 ad formats" },
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
              Why brands choose TrioTag
            </h2>
            <p className="text-white/70">
              Skip the agencies. Skip the middlemen. Go direct to the spaces that matter.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: DollarSign, title: "No agency fees", desc: "Direct booking means more budget reaches actual ad spend." },
              { icon: MapPin, title: "Hyper-local", desc: "Filter by city, barangay, format, and venue type." },
              { icon: BarChart3, title: "Transparent performance", desc: "Track impressions, plays, and engagement live." },
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

      {/* Formats overview */}
      <section className="container mx-auto px-4 md:px-6 py-20 md:py-28">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Four formats. One platform.
          </h2>
          <p className="text-white/70">
            Mix and match formats to build the perfect omnichannel campaign.
          </p>
        </div>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { icon: ImageIcon, title: "OOH Print", desc: "Stickers, posters, table tents." },
            { icon: Monitor, title: "DOOH Screens", desc: "TVs and LED displays in-venue." },
            { icon: Volume2, title: "AOOH Audio", desc: "In-store audio spots." },
            { icon: Play, title: "Social Video", desc: "Short-form social-ready creative." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-[#0c0c0c] border border-white/10 rounded-2xl p-6">
              <Icon className="h-8 w-8 text-green-500 mb-4" />
              <h3 className="font-semibold mb-2">{title}</h3>
              <p className="text-white/70 text-sm">{desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <Button size="lg" variant="cyber" onClick={goAdvertiserSignup}>
            Start a Campaign
          </Button>
        </div>
      </section>

      {/* Section 5: Social Proof */}
      <section className="bg-[#0c0c0c] py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-12">
            Brands already growing with TrioTag
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            {[
              ["500+", "Active Ad Spaces Available"],
              ["18+", "Publisher Venue Partners"],
              ["4", "Ad Formats (OOH, DOOH, AOOH, Social Video)"],
              ["₱5K", "Minimum Campaign Budget"],
            ].map(([n, l]) => (
              <div key={l}>
                <div className="text-4xl md:text-5xl font-bold text-green-500 mb-2">{n}</div>
                <div className="text-sm text-white/70">{l}</div>
              </div>
            ))}
          </div>
          <p className="max-w-2xl mx-auto text-white/70 mb-8">
            From sari-sari stores to gyms, salons, supermarkets, and digital
            screens — TrioTag gives you access to a growing network of verified
            retail media spaces across the Philippines.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {["OOH Print", "DOOH Screens", "AOOH Audio", "Social Video", "Media Truck"].map((b) => (
              <span
                key={b}
                className="bg-black border border-white/10 rounded-full px-4 py-2 text-sm text-white/80"
              >
                {b}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Section 6: Advertiser Sign-Up CTA */}
      <section className="bg-black py-20 md:py-28">
        <div className="border border-green-500/20 rounded-3xl mx-4 md:mx-12 p-8 md:p-12 bg-[#070707]">
          <div className="grid lg:grid-cols-2 gap-10">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-green-500/15 text-green-400 text-xs font-semibold mb-5">
                Start Advertising with TrioTag
              </span>
              <h2 className="text-3xl md:text-5xl font-bold leading-tight mb-5">
                Reach your audience where they live, shop, and scroll
              </h2>
              <p className="text-white/70 mb-8">
                TrioTag gives brands direct access to hyper-local OOH, DOOH,
                AOOH, and Social Video inventory — all from one platform. No
                agencies. No middlemen. Browse available spaces, build your
                campaign, and go live in days.
              </p>

              <div className="space-y-4 mb-8">
                {[
                  ["1", "Create your account", "Sign up free as a brand advertiser. No credit card required."],
                  ["2", "Browse inventory", "Explore available ad spaces filtered by location, format, and venue type."],
                  ["3", "Launch your campaign", "Book, pay, and go live. Track performance from your advertiser dashboard."],
                ].map(([n, t, d]) => (
                  <div key={n} className="flex gap-4">
                    <div className="h-9 w-9 shrink-0 rounded-full bg-green-500 text-black font-bold flex items-center justify-center">
                      {n}
                    </div>
                    <div>
                      <div className="font-semibold">{t}</div>
                      <div className="text-sm text-white/70">{d}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { icon: ImageIcon, title: "OOH Print", price: "From ₱5K" },
                  { icon: Monitor, title: "DOOH Screen", price: "From ₱8K" },
                  { icon: Volume2, title: "AOOH Audio", price: "From ₱5K" },
                  { icon: Play, title: "Social Video", price: "From ₱10K" },
                ].map(({ icon: Icon, title, price }) => (
                  <div
                    key={title}
                    className="bg-[#0c0c0c] border border-white/10 rounded-xl p-3"
                  >
                    <Icon className="h-5 w-5 text-green-500 mb-2" />
                    <div className="text-sm font-medium">{title}</div>
                    <div className="text-xs text-white/60">{price}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: sign-up card */}
            <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl p-8 self-start">
              <h3 className="text-2xl font-bold mb-2">Create Your Free Advertiser Account</h3>
              <p className="text-white/70 text-sm mb-6">
                Access the full TrioTag inventory marketplace and start building
                your first campaign.
              </p>
              <Button size="lg" variant="cyber" className="w-full" onClick={goAdvertiserSignup}>
                Sign Up as an Advertiser
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
                onClick={() => navigate("/advertiser/explore")}
              >
                Explore Inventory First
              </Button>

              <div className="flex justify-center gap-6 mt-6 text-xs text-white/70">
                <div className="flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-green-500" /> Free to sign up
                </div>
                <div className="flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4 text-green-500" /> No agency fees
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-green-500" /> Hyper-local targeting
                </div>
              </div>

              <p className="text-center text-xs text-white/50 mt-5">
                Already have an account?{" "}
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

export default Brands;
