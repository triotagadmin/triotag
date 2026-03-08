import { FileText, MapPin, Rocket, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useRef, useState } from "react";

const steps = [
  {
    icon: FileText,
    title: "Campaign Setup & Creative Upload",
    description:
      "Create your campaign for products, services, or events and upload your marketing assets. This ensures your creatives are ready for deployment across all selected ad spaces or franchise locations.",
  },
  {
    icon: MapPin,
    title: "Ad Space & Branch Selection",
    description:
      "Choose where your campaign will appear. Use our ad space marketplace to book high-traffic locations or select franchise branches for multi-location distribution.",
  },
  {
    icon: Rocket,
    title: "Campaign Deployment & Logistics",
    description:
      "Activate your campaign and let our OOH logistics platform handle printing, packaging, and distribution of physical materials. Your campaign is delivered to all ad spaces or branch locations efficiently.",
  },
  {
    icon: TrendingUp,
    title: "Analytics & Performance Monitoring",
    description:
      "Track your campaign in real time with our campaign analytics dashboard. Measure engagement, reach, and installation compliance to optimize your campaign and maximize ROI.",
  },
];

export const HowItWorks = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

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
    <section ref={sectionRef} className="py-12 md:py-24 bg-card border-y border-border">
      <div className="container mx-auto px-4 md:px-6">
        <div
          className={`text-center mb-8 md:mb-16 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 md:mb-4 text-foreground">
            Plan. Launch. Track. Succeed.
          </h2>
          <p className="text-sm md:text-xl text-muted-foreground">
            Launch campaigns across multiple locations with one platform
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card
                key={index}
                className={`border border-border hover:border-primary/50 bg-background transition-all duration-500 animate-scale-hover ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <CardContent className="pt-4 md:pt-8 text-center space-y-2 md:space-y-4 px-2 md:px-6">
                  <div className="w-10 h-10 md:w-16 md:h-16 mx-auto border border-primary/30 flex items-center justify-center relative">
                    <Icon className="w-5 h-5 md:w-8 md:h-8 text-primary" />
                    <div className="absolute inset-0 bg-primary/5"></div>
                  </div>
                  <div className="text-[10px] md:text-sm font-mono text-primary">0{index + 1}</div>
                  <h3 className="text-xs md:text-xl font-bold text-foreground leading-tight">{step.title}</h3>
                  <p className="text-muted-foreground text-[10px] md:text-sm leading-snug">{step.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
