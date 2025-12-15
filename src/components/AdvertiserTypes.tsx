import { Store, ShoppingBag, Calendar, Building, Users, Megaphone } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

const advertiserTypes = [
  {
    title: "Local Businesses",
    description: "Boost foot traffic and engagement with QR code stickers in your neighborhood.",
    icon: Store,
  },
  {
    title: "Retail & E-commerce",
    description: "Drive online conversions by connecting offline placements to digital campaigns.",
    icon: ShoppingBag,
  },
  {
    title: "Event Promotions",
    description: "Promote concerts, launches, or pop-ups through targeted sticker campaigns.",
    icon: Calendar,
  },
  {
    title: "Franchises & Chains",
    description: "Ensure consistent local reach across multiple locations worldwide.",
    icon: Building,
  },
  {
    title: "Service Providers",
    description: "Connect with local customers through strategic placement in high-traffic areas.",
    icon: Users,
  },
  {
    title: "Product Launches",
    description: "Generate buzz and awareness for new products with targeted campaigns.",
    icon: Megaphone,
  },
];

export const AdvertiserTypes = () => {
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
    <section ref={sectionRef} className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div
          className={`max-w-3xl mx-auto text-center mb-16 space-y-4 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            Advertise with{" "}
            <span className="text-primary neon-text-glow">Precision</span> &{" "}
            <span className="text-primary neon-text-glow">Impact</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Tiny Sticky Ads enables brands to leverage hyper-local micro
            advertising with cross-platform reach.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {advertiserTypes.map((type, index) => {
            const Icon = type.icon;
            return (
              <Card
                key={index}
                className={`border border-border bg-card hover:border-primary/50 transition-all duration-500 animate-scale-hover ${
                  isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${index * 80}ms` }}
              >
                <CardHeader>
                  <div className="w-12 h-12 border border-primary/30 bg-primary/5 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl text-foreground">
                    {type.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground">
                    {type.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div
          className={`text-center transition-all duration-700 delay-500 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <Link to="/auth">
            <Button size="lg" className="text-lg px-8 py-6 neon-glow hover:neon-glow-strong">
              Buy Ad Space
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
