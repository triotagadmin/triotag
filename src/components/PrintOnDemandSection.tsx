import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Printer, Palette, Truck, Zap, Globe, Shield } from "lucide-react";

const features = [
  {
    icon: Palette,
    title: "Centralized Operations",
    description: "Manage all campaigns, clients, and locations in one system.",
  },
  {
    icon: Printer,
    title: "New Revenue Opportunities",
    description: "Expand your services from printing to full campaign execution.",
  },
  {
    icon: Globe,
    title: "Multi-Location Control",
    description: "Launch campaigns across multiple branches without manual coordination.",
  },
  {
    icon: Zap,
    title: "Verified Campaign Deployment",
    description: "Ensure placements are active with QR tracking, geo-tagging, and verification tools.",
  },
];

export const PrintOnDemandSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 },
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="relative py-12 md:py-24 overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />

      {/* Glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-48 md:w-96 h-48 md:h-96 bg-primary/20 rounded-full blur-[128px] animate-pulse" />
      <div
        className="absolute bottom-1/4 right-1/4 w-40 md:w-80 h-40 md:h-80 bg-accent/20 rounded-full blur-[100px] animate-pulse"
        style={{ animationDelay: "1s" }}
      />

      <div
        className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px] animate-pulse"
        style={{ animationDelay: "0.5s" }}
      />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--primary) / 0.1) 1px, transparent 1px),
                           linear-gradient(90deg, hsl(var(--primary) / 0.1) 1px, transparent 1px)`,
          backgroundSize: "50px 50px",
        }}
      />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div
          className={`text-center mb-8 md:mb-16 transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <h2 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-display font-bold mb-4 md:mb-6">
            Built to Help Print Companies Scale Faster
            <br />
          </h2>

          <p className="text-sm max-w-3xl mx-auto leading-relaxed px-2 text-white md:text-base">
            TrioTag helps printing companies go beyond production by giving them the tools to manage client campaigns,
            book real-world ad spaces, coordinate multi-location deployments, and track campaign performance using QR
            and analytics. You’re not just printing anymore — you’re executing full-scale advertising campaigns.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 mb-10 md:mb-16">
          {features.map((feature, index) => (
            <Card
              key={feature.title}
              className={`group relative overflow-hidden border-primary/20 bg-background/50 backdrop-blur-sm 
                hover:border-primary/50 transition-all duration-500 hover:shadow-[0_0_30px_hsl(var(--primary)/0.3)]
                ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              {/* Card glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <CardContent className="p-3 md:p-6 relative">
                <div className="flex flex-col md:flex-row items-start gap-2 md:gap-4">
                  <div className="p-2 md:p-3 rounded-lg bg-primary/10 border border-primary/20 group-hover:bg-primary/20 group-hover:border-primary/40 transition-all duration-300 group-hover:shadow-[0_0_20px_hsl(var(--primary)/0.4)]">
                    <feature.icon className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold mb-1 md:mb-2 transition-colors text-primary md:text-base">
                      {feature.title}
                    </h3>
                    <p className="text-xs leading-relaxed text-white md:text-base">{feature.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Process visualization */}
        <div
          className={`relative mb-10 md:mb-16 transition-all duration-1000 delay-500 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <div className="grid grid-cols-4 md:flex md:flex-row items-center justify-center gap-2 md:gap-8">
            {["Design", "Print", "Ship", "Activate"].map((step, index) => (
              <div key={step} className="flex flex-col items-center">
                <div className="relative group">
                  <div
                    className="absolute inset-0 bg-primary/30 rounded-full blur-xl group-hover:blur-2xl transition-all animate-pulse"
                    style={{ animationDelay: `${index * 0.3}s` }}
                  />

                  <div className="relative w-14 h-14 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/50 flex items-center justify-center group-hover:border-primary group-hover:shadow-[0_0_30px_hsl(var(--primary)/0.5)] transition-all duration-300">
                    <span className="text-lg md:text-2xl font-bold text-primary">{index + 1}</span>
                  </div>
                </div>
                <p className="mt-2 text-xs md:text-sm font-medium text-foreground whitespace-nowrap">{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div
          className={`text-center transition-all duration-1000 delay-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <Link to="/explore">
            <Button
              size="lg"
              className="group relative overflow-hidden bg-primary hover:bg-primary/90 text-primary-foreground px-6 md:px-8 py-4 md:py-6 text-sm md:text-lg font-semibold min-h-[44px] shadow-[0_0_30px_hsl(var(--primary)/0.4)] hover:shadow-[0_0_50px_hsl(var(--primary)/0.6)] transition-all duration-300"
            >
              <span className="relative z-10 flex items-center gap-2">
                <Printer className="h-5 w-5" />
                Explore Print-Ready Ad Spaces
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </Button>
          </Link>
          <p className="mt-4 text-sm text-muted-foreground">No minimum orders • Global shipping • Quality guaranteed</p>
        </div>
      </div>
    </section>
  );
};
