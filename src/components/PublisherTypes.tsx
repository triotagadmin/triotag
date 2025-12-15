import { Building2, Users, Globe } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

export const PublisherTypes = () => {
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

  const publisherTypes = [
    {
      icon: Building2,
      title: "Venue Publishers",
      description:
        "Physical locations like cafés, restaurants, bars, and retail spaces hosting small-format ads.",
      features: ["Prime locations", "Verified spaces", "High foot traffic"],
    },
    {
      icon: Users,
      title: "Agent Publishers",
      description:
        "Freelance agents including guerrilla marketers, influencers, models, and artists.",
      features: ["Flexible placement", "Wide coverage", "Creative campaigns"],
    },
    {
      icon: Globe,
      title: "Digital Publishers",
      description:
        "Websites, apps, and social media accounts accepting micro-ad creatives.",
      features: ["Instant deployment", "Trackable metrics", "Global reach"],
    },
  ];

  return (
    <section ref={sectionRef} className="py-24 px-6 bg-background">
      <div className="container mx-auto">
        <div
          className={`text-center mb-16 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Publisher <span className="text-primary neon-text-glow">Types</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Three ways to monetize your space or audience
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {publisherTypes.map((type, index) => (
            <Card
              key={type.title}
              className={`border border-border bg-card hover:border-primary/50 transition-all duration-500 animate-scale-hover ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <CardHeader>
                <div className="w-16 h-16 border border-primary/30 bg-primary/5 flex items-center justify-center mb-4">
                  <type.icon className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl text-foreground">
                  {type.title}
                </CardTitle>
                <CardDescription className="text-base text-muted-foreground">
                  {type.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {type.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center text-sm text-muted-foreground"
                    >
                      <span className="w-1.5 h-1.5 bg-primary mr-2"></span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <div
          className={`text-center mt-12 transition-all duration-700 delay-300 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <Link to="/auth">
            <Button size="lg" variant="outline" className="text-lg px-8 py-6">
              Sell Ad Space
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
