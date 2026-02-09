import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Printer, Palette, Truck, Zap, Globe, Shield } from "lucide-react";

const features = [
  {
    icon: Palette,
    title: "Design Integration",
    description: "Seamlessly design your ad materials with our intuitive mockup builder"
  },
  {
    icon: Printer,
    title: "Premium Printing",
    description: "High-quality prints powered by Prodigi's global print network"
  },
  {
    icon: Globe,
    title: "Global Fulfillment",
    description: "Ship to 170+ countries with local production facilities"
  },
  {
    icon: Truck,
    title: "Fast Delivery",
    description: "Express shipping options with real-time tracking"
  },
  {
    icon: Shield,
    title: "Quality Guaranteed",
    description: "Every print meets our strict quality standards"
  },
  {
    icon: Zap,
    title: "Instant Activation",
    description: "From design to print in minutes, not days"
  }
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
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section 
      ref={sectionRef}
      className="relative py-24 overflow-hidden"
    >
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
      
      {/* Glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '0.5s' }} />

      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--primary) / 0.1) 1px, transparent 1px),
                           linear-gradient(90deg, hsl(var(--primary) / 0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div 
          className={`text-center mb-16 transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 mb-6 animate-pulse-glow">
            <Printer className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Powered by Prodigi</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6">
            <span className="text-foreground">Print on Demand</span>
            <br />
            <span className="text-primary neon-text-glow">API Integration</span>
          </h2>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Transform your digital ad designs into high-quality printed materials. 
            Our seamless Prodigi integration handles everything from printing to global delivery.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {features.map((feature, index) => (
            <Card 
              key={feature.title}
              className={`group relative overflow-hidden border-primary/20 bg-background/50 backdrop-blur-sm 
                hover:border-primary/50 transition-all duration-500 hover:shadow-[0_0_30px_hsl(var(--primary)/0.3)]
                ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              {/* Card glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <CardContent className="p-6 relative">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 group-hover:bg-primary/20 group-hover:border-primary/40 transition-all duration-300 group-hover:shadow-[0_0_20px_hsl(var(--primary)/0.4)]">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Process visualization */}
        <div 
          className={`relative mb-16 transition-all duration-1000 delay-500 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
            {['Design', 'Print', 'Ship', 'Activate'].map((step, index) => (
              <div key={step} className="flex items-center gap-4 md:gap-8">
                <div className="relative group">
                  <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl group-hover:blur-2xl transition-all animate-pulse" style={{ animationDelay: `${index * 0.3}s` }} />
                  <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/50 flex items-center justify-center group-hover:border-primary group-hover:shadow-[0_0_30px_hsl(var(--primary)/0.5)] transition-all duration-300">
                    <span className="text-2xl font-bold text-primary">{index + 1}</span>
                  </div>
                  <p className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-sm font-medium text-foreground whitespace-nowrap">
                    {step}
                  </p>
                </div>
                {index < 3 && (
                  <div className="hidden md:block w-16 h-0.5 bg-gradient-to-r from-primary/50 to-primary/20 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary to-transparent animate-[shimmer_2s_infinite]" style={{ animationDelay: `${index * 0.5}s` }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div 
          className={`text-center transition-all duration-1000 delay-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <Link to="/explore">
            <Button 
              size="lg" 
              className="group relative overflow-hidden bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg font-semibold shadow-[0_0_30px_hsl(var(--primary)/0.4)] hover:shadow-[0_0_50px_hsl(var(--primary)/0.6)] transition-all duration-300"
            >
              <span className="relative z-10 flex items-center gap-2">
                <Printer className="h-5 w-5" />
                Explore Print-Ready Listings
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </Button>
          </Link>
          <p className="mt-4 text-sm text-muted-foreground">
            No minimum orders • Global shipping • Quality guaranteed
          </p>
        </div>
      </div>
    </section>
  );
};
