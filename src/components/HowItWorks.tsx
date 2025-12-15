import { MapPin, Calendar, Camera, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useRef, useState } from "react";

const steps = [
  {
    icon: MapPin,
    title: "Register as Advertiser",
    description: "Browse venues, agents, and digital publishers worldwide",
  },
  {
    icon: Calendar,
    title: "Book Publisher",
    description: "Select your ad slots and schedule your campaign",
  },
  {
    icon: Camera,
    title: "Verify & Approve",
    description: "Send campaign details and approve campaign",
  },
  {
    icon: TrendingUp,
    title: "Track Results",
    description: "Real-time analytics and proof of placement",
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
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 bg-card border-y border-border">
      <div className="container mx-auto px-6">
        <div
          className={`text-center mb-16 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            How It <span className="text-primary neon-text-glow">Works</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Four simple steps to start advertising
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card
                key={index}
                className={`border border-border hover:border-primary/50 bg-background transition-all duration-500 animate-scale-hover ${
                  isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <CardContent className="pt-8 text-center space-y-4">
                  <div className="w-16 h-16 mx-auto border border-primary/30 flex items-center justify-center relative">
                    <Icon className="w-8 h-8 text-primary" />
                    <div className="absolute inset-0 bg-primary/5"></div>
                  </div>
                  <div className="text-sm font-mono text-primary">
                    0{index + 1}
                  </div>
                  <h3 className="text-xl font-bold text-foreground">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
