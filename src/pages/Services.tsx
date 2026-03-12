import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Palette, Settings, CheckCircle2, FileText, Search, Layers, Paintbrush, Printer, Rocket, Flag, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

const coreServices = [
  {
    title: "Location Bundling",
    icon: MapPin,
    description: "Location Bundling allows advertisers to combine multiple ad placements across strategic ad spaces into one unified campaign. Instead of booking individual placements manually, advertisers deploy campaigns across curated ad space bundles designed for maximum exposure.",
    howItWorks: [
      "Ad spaces are grouped by location, audience type, or campaign goal",
      "Advertisers choose bundles instead of individual placements",
      "Campaigns scale efficiently across multiple ad spaces",
    ],
    bundles: ["Coffee Shop Network Bundle", "University District Bundle", "Business District Bundle", "Community Lifestyle Bundle"],
    benefits: ["Higher reach with fewer decisions", "Geographic targeting", "Audience clustering", "Simplified campaign deployment"],
  },
  {
    title: "Creative Development",
    icon: Palette,
    description: "Our team develops the visual advertising materials used in TrioTag campaigns. We design ad creatives optimized for small-format ad space placements such as table tents, stickers, and micro signage.",
    formats: ["Vinyl Stickers", "Table Tent Cards", "Acrylic Table Tents", "Coroplast Stands"],
    process: ["Campaign brief review", "Visual concept development", "Design optimization for small-format visibility", "Print-ready production files", "Final creative approval"],
    principles: ["High readability in small spaces", "Strong visual hierarchy", "Clear call-to-action", "Brand consistency"],
  },
  {
    title: "Campaign Management",
    icon: Settings,
    description: "Tiny Sticky Ads manages the entire campaign lifecycle, from planning to deployment. Our system coordinates advertisers, ad spaces, and placements to ensure smooth campaign execution.",
    includes: ["Ad space selection", "Placement coordination", "Creative approval workflow", "Deployment scheduling", "Campaign monitoring"],
    operations: ["Coordinating ad space placements", "Managing installation schedules", "Ensuring campaign compliance", "Monitoring active campaigns"],
  },
];

const roadmapSteps = [
  { num: "01", title: "Campaign Submission", description: "Advertiser submits campaign details through the campaign submission form.", details: ["Campaign name", "Contact information", "Campaign description", "Ad format preference", "Target locations"] },
  { num: "02", title: "Campaign Review", description: "Our team reviews the campaign brief to determine best ad spaces, best ad formats, and bundle recommendations. We may contact the advertiser for clarification." },
  { num: "03", title: "Location Bundling", description: "We curate a strategic placement bundle that includes selected ad spaces, placement quantities, and geographic targeting. Advertisers receive a proposed campaign plan." },
  { num: "04", title: "Creative Development", description: "Our design team prepares the advertising materials including ad layout design, format optimization, and advertiser approval. Final files are prepared for printing." },
  { num: "05", title: "Production & Deployment", description: "Ad materials are printed and deployed across selected ad spaces. Deployment includes installation coordination, placement verification, and coordination with ad space operators." },
  { num: "06", title: "Campaign Activation", description: "Once placements are installed, the campaign becomes active. Advertisers receive confirmation that their ads are live across the selected ad spaces." },
  { num: "07", title: "Campaign Completion", description: "At the end of the campaign, placements are removed or renewed. Advertisers can launch follow-up campaigns." },
];

const Services = () => {
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const observerCallback = (id: string) => (entries: IntersectionObserverEntry[]) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) setVisibleSections(prev => new Set(prev).add(id));
    });
  };

  return (
    <div className="min-h-screen">
      <Navigation />

      {/* Hero */}
      <section className="py-16 md:py-28 bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-1/4 left-1/4 w-48 md:w-96 h-48 md:h-96 bg-primary/10 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-40 md:w-80 h-40 md:h-80 bg-accent/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-2xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6">Tiny Sticky Ads<br />Advertising Services</h1>
          <p className="text-primary font-semibold text-sm md:text-lg mb-3">Physical micro-advertising placed inside real-world ad spaces like coffee shops, libraries, and retail environments.</p>
          <p className="text-muted-foreground text-xs md:text-base max-w-3xl mx-auto mb-8">
            Tiny Sticky Ads helps brands reach real people in real places through small but powerful physical ad placements. Our ad space network allows advertisers to deploy targeted campaigns across strategic locations.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4">
            <Link to="/campaign-submit">
              <Button size="lg" className="text-sm md:text-lg px-6 md:px-8 py-4 md:py-6 min-h-[44px] neon-glow hover:neon-glow-strong">
                Start Your Campaign
              </Button>
            </Link>
            <a href="#how-campaigns-work">
              <Button size="lg" variant="outline" className="text-sm md:text-lg px-6 md:px-8 py-4 md:py-6 min-h-[44px] border-primary/50 hover:border-primary">
                Learn How It Works
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Core Services */}
      <section className="py-12 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-xl md:text-3xl font-bold text-center mb-8 md:mb-14">Core Services</h2>
          <div className="space-y-8 md:space-y-12">
            {coreServices.map((service, idx) => (
              <Card key={service.title} className="p-5 md:p-8 hover:shadow-[0_0_20px_hsl(var(--primary)/0.2)] transition-all duration-300">
                <CardContent className="p-0">
                  <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
                    <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <service.icon className="w-5 h-5 md:w-7 md:h-7 text-primary" />
                    </div>
                    <h3 className="text-lg md:text-2xl font-bold">{service.title}</h3>
                  </div>
                  <p className="text-muted-foreground text-xs md:text-base mb-4 md:mb-6 leading-relaxed">{service.description}</p>

                  {service.howItWorks && (
                    <div className="mb-4">
                      <p className="text-xs md:text-sm font-semibold text-primary mb-2">How it works:</p>
                      <ul className="space-y-1.5">
                        {service.howItWorks.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs md:text-sm text-muted-foreground">
                            <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary shrink-0 mt-0.5" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {service.bundles && (
                    <div className="mb-4">
                      <p className="text-xs md:text-sm font-semibold text-primary mb-2">Example bundles:</p>
                      <div className="flex flex-wrap gap-2">
                        {service.bundles.map(b => (
                          <span key={b} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs md:text-sm font-medium">{b}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {service.benefits && (
                    <div>
                      <p className="text-xs md:text-sm font-semibold text-primary mb-2">Benefits:</p>
                      <ul className="grid grid-cols-2 gap-1.5">
                        {service.benefits.map((b, i) => (
                          <li key={i} className="flex items-center gap-1.5 text-xs md:text-sm text-muted-foreground">
                            <CheckCircle2 className="w-3 h-3 text-primary shrink-0" /> {b}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {service.formats && (
                    <div className="mb-4">
                      <p className="text-xs md:text-sm font-semibold text-primary mb-2">Supported formats:</p>
                      <div className="flex flex-wrap gap-2">
                        {service.formats.map(f => (
                          <span key={f} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs md:text-sm font-medium">{f}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {service.process && (
                    <div className="mb-4">
                      <p className="text-xs md:text-sm font-semibold text-primary mb-2">Creative process:</p>
                      <ol className="space-y-1.5">
                        {service.process.map((p, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs md:text-sm text-muted-foreground">
                            <span className="text-primary font-bold">{i + 1}</span> {p}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                  {service.principles && (
                    <div>
                      <p className="text-xs md:text-sm font-semibold text-primary mb-2">Design principles:</p>
                      <ul className="grid grid-cols-2 gap-1.5">
                        {service.principles.map((p, i) => (
                          <li key={i} className="flex items-center gap-1.5 text-xs md:text-sm text-muted-foreground">
                            <CheckCircle2 className="w-3 h-3 text-primary shrink-0" /> {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {service.includes && (
                    <div className="mb-4">
                      <p className="text-xs md:text-sm font-semibold text-primary mb-2">Campaign management includes:</p>
                      <ul className="space-y-1.5">
                        {service.includes.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs md:text-sm text-muted-foreground">
                            <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary shrink-0 mt-0.5" /> {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {service.operations && (
                    <div>
                      <p className="text-xs md:text-sm font-semibold text-primary mb-2">Operational responsibilities:</p>
                      <ul className="space-y-1.5">
                        {service.operations.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs md:text-sm text-muted-foreground">
                            <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary shrink-0 mt-0.5" /> {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Campaign Execution Roadmap */}
      <section id="how-campaigns-work" className="py-12 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-xl md:text-3xl font-bold text-center mb-8 md:mb-14">How Advertising Campaigns Work</h2>
          <div className="max-w-3xl mx-auto space-y-4 md:space-y-6">
            {roadmapSteps.map((step) => (
              <Card key={step.num} className="p-4 md:p-6 hover:border-primary/50 transition-all duration-300">
                <CardContent className="p-0">
                  <div className="flex items-start gap-3 md:gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
                      <span className="text-sm md:text-lg font-bold text-primary">{step.num}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm md:text-lg font-bold mb-1 md:mb-2">{step.title}</h3>
                      <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                      {step.details && (
                        <ul className="mt-2 space-y-1">
                          {step.details.map((d, i) => (
                            <li key={i} className="flex items-center gap-1.5 text-xs md:text-sm text-muted-foreground">
                              <ArrowRight className="w-3 h-3 text-primary shrink-0" /> {d}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-12 md:py-20 bg-muted/30 relative overflow-hidden">
        <div className="absolute top-1/3 right-1/4 w-48 md:w-80 h-48 md:h-80 bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-xl md:text-3xl font-bold mb-3 md:mb-4">Start Your Advertising Campaign</h2>
          <p className="text-xs md:text-base text-muted-foreground mb-6 md:mb-8 max-w-xl mx-auto">
            Ready to promote your brand across real-world ad spaces? Submit your campaign and our team will begin planning your placement strategy.
          </p>
          <Link to="/campaign-submit">
            <Button size="lg" className="text-sm md:text-lg px-8 py-6 min-h-[44px] neon-glow hover:neon-glow-strong">
              Submit Campaign
            </Button>
          </Link>
          <p className="mt-4 text-xs md:text-sm text-muted-foreground">
            Campaign planning typically begins within 24–48 hours after submission.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Services;
