import { Building2 } from "lucide-react";
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

  return (
    <section ref={sectionRef} className="py-12 md:py-24 px-4 md:px-6 bg-background">
      <div className="container mx-auto">
        <div
          className={`text-center mb-8 md:mb-16 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 md:mb-4 text-foreground">
            Publisher <span className="text-primary neon-text-glow">Types</span>
          </h2>
          <p className="text-sm md:text-xl text-muted-foreground max-w-2xl mx-auto px-2">
            Monetize your venue space with targeted advertising
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <Card
            className={`border border-border bg-card hover:border-primary/50 transition-all duration-500 animate-scale-hover ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            <CardHeader className="pb-2 md:pb-4">
              <div className="w-12 h-12 md:w-16 md:h-16 border border-primary/30 bg-primary/5 flex items-center justify-center mb-2 md:mb-4">
                <Building2 className="w-6 h-6 md:w-8 md:h-8 text-primary" />
              </div>
              <CardTitle className="text-lg md:text-2xl text-foreground">
                Venue Publishers
              </CardTitle>
              <CardDescription className="text-xs md:text-base text-muted-foreground">
                Physical locations like cafés, restaurants, bars, and retail spaces hosting small-format ads.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 md:space-y-2">
                {["Prime locations", "Verified spaces", "High foot traffic"].map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center text-xs md:text-sm text-muted-foreground"
                  >
                    <span className="w-1 h-1 md:w-1.5 md:h-1.5 bg-primary mr-2"></span>
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div
          className={`text-center mt-8 md:mt-12 transition-all duration-700 delay-300 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <Link to="/auth" className="block sm:inline-block">
            <Button size="lg" variant="outline" className="w-full sm:w-auto text-base md:text-lg px-6 md:px-8 py-5 md:py-6">
              Sell Ad Space
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};