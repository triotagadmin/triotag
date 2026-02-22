import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Lightbulb, Settings, Zap, Rocket, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";

const coreServices = [
  {
    title: "Location Bundling",
    description: "Combine multiple ad placements across strategic locations for maximum reach and efficiency.",
    icon: MapPin,
  },
  {
    title: "Creative Development",
    description: "From concept to execution, we craft visuals and content that captivate your audience.",
    icon: Lightbulb,
  },
  {
    title: "Campaign Management",
    description: "We handle your campaigns end-to-end, optimizing for performance and ROI.",
    icon: Settings,
  },
];

const packages = [
  {
    title: "Quick Ad Sprint",
    description: "Test a small campaign fast—perfect for first-time advertisers.",
    icon: Zap,
    features: [
      { label: "Location Bundling", detail: "Select a bundle of 5–10 prime micro-locations" },
      { label: "Creative Development", detail: "1 sticker ad design with 1 revision" },
      { label: "Campaign Management", detail: "Placement in chosen locations + basic performance report" },
    ],
    cta: "Start a Sprint →",
    link: "/services/quick-ad-sprint",
  },
  {
    title: "Full Campaign Build",
    description: "End-to-end campaign for maximum reach and impact.",
    icon: Rocket,
    features: [
      { label: "Location Bundling", detail: "20+ curated high-traffic locations" },
      { label: "Creative Development", detail: "Multiple ad designs with 2 rounds of revisions" },
      { label: "Campaign Management", detail: "Full placement, tracking via QR codes/digital links, analytics reporting; 30-day post-campaign support for optimization" },
    ],
    cta: "Start a Campaign →",
    link: "/services/full-campaign-build",
  },
  {
    title: "Ongoing Ad Retainer",
    description: "Continuous campaigns for brands that want a persistent presence.",
    icon: RefreshCw,
    features: [
      { label: "Location Bundling", detail: "Monthly rotation across top-performing micro-locations" },
      { label: "Creative Development", detail: "Regular creative refreshes (3–4 per month)" },
      { label: "Campaign Management", detail: "Ongoing placement, detailed performance tracking, and quarterly strategy reviews; Priority support and flexible campaign adjustments" },
    ],
    cta: "Start A Retainer →",
    link: "/services/ongoing-ad-retainer",
  },
];

const Services = () => {
  return (
    <div className="min-h-screen">
      <Navigation />

      {/* Hero */}
      <section className="py-12 md:py-20 bg-background">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-lg md:text-4xl font-bold mb-3 md:mb-4">Our Services</h1>
          <p className="text-muted-foreground text-[9px] md:text-base max-w-2xl mx-auto">
            Everything you need to launch, manage, and scale high-impact micro-advertising campaigns.
          </p>
        </div>
      </section>

      {/* Core Services */}
      <section className="py-10 md:py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-[12px] md:text-2xl font-bold text-center mb-6 md:mb-10">Core Services</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
            {coreServices.map((service) => (
              <Card key={service.title} className="text-center p-3 md:p-6 hover:shadow-[0_0_20px_hsl(var(--primary)/0.3)] transition-all duration-300">
                <CardContent className="p-0 flex flex-col items-center gap-2 md:gap-4">
                  <div className="w-10 h-10 md:w-16 md:h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <service.icon className="w-5 h-5 md:w-8 md:h-8 text-primary" />
                  </div>
                  <h3 className="text-[10px] md:text-lg font-bold">{service.title}</h3>
                  <div className="w-8 md:w-12 h-[2px] bg-primary mx-auto" />
                  <p className="text-muted-foreground text-[8px] md:text-sm">{service.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Packages */}
      <section className="py-10 md:py-16 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-[12px] md:text-2xl font-bold text-center mb-6 md:mb-10">Tiny Sticky Ads Packages</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
            {packages.map((pkg) => (
              <Card key={pkg.title} className="flex flex-col p-3 md:p-6 hover:shadow-[0_0_20px_hsl(var(--primary)/0.3)] transition-all duration-300">
                <CardContent className="p-0 flex flex-col flex-1 gap-2 md:gap-4">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <pkg.icon className="w-4 h-4 md:w-6 md:h-6 text-primary" />
                    </div>
                    <h3 className="text-[10px] md:text-lg font-bold">{pkg.title}</h3>
                  </div>
                  <p className="text-muted-foreground text-[8px] md:text-sm">{pkg.description}</p>
                  <div className="space-y-2 md:space-y-3 flex-1">
                    {pkg.features.map((f) => (
                      <div key={f.label}>
                        <p className="text-[8px] md:text-xs font-semibold text-primary">{f.label}</p>
                        <p className="text-[8px] md:text-xs text-muted-foreground">{f.detail}</p>
                      </div>
                    ))}
                  </div>
                  <Link to={pkg.link}>
                    <Button size="sm" className="w-full text-[9px] md:text-sm h-6 md:h-9 mt-2">
                      {pkg.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Services;
