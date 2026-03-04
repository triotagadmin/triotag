import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Sticker, BookOpen, MapPin, Eye } from "lucide-react";

const materials = [
  {
    icon: Sticker,
    title: "A4 Vinyl Stickers",
    description: "Premium 8.3\" × 11.7\" vinyl stickers designed for concrete, glass, and wood surfaces — weather-resistant and built to last.",
  },
  {
    icon: BookOpen,
    title: "Table Tents",
    description: "Sturdy 4\" × 6\" card-stock table tents with gloss UV coating, perfect for restaurants, cafés, and reception desks.",
  },
  {
    icon: MapPin,
    title: "Strategic Placement",
    description: "Every material is designed for high-traffic commercial spaces such as tabletops, countertops, windows, and entryways.",
  },
  {
    icon: Eye,
    title: "Maximum Visibility",
    description: "Compact formats that catch eyes without overwhelming the space, delivering repeated impressions to a captive audience.",
  },
];

export const MicroAdMaterials = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="relative py-12 md:py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-accent/5 to-background" />

      <div className="container mx-auto px-4 relative z-10">
        <div className={`text-center mb-8 md:mb-16 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <h2 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-display font-bold mb-4 md:mb-6">
            Micro Ad Materials
          </h2>
          <p className="text-sm md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-2">
            Get your brand in front of your target audience with our micro ad materials. We use simple yet effective materials that fit seamlessly into high-traffic commercial spaces.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {materials.map((mat, index) => (
            <Card
              key={mat.title}
              className={`group relative overflow-hidden border-primary/20 bg-background/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-500 hover:shadow-[0_0_30px_hsl(var(--primary)/0.3)] ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardContent className="p-3 md:p-6 relative">
                <div className="p-2 md:p-3 rounded-lg bg-primary/10 border border-primary/20 group-hover:bg-primary/20 group-hover:border-primary/40 transition-all duration-300 group-hover:shadow-[0_0_20px_hsl(var(--primary)/0.4)] w-fit mb-3">
                  <mat.icon className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </div>
                <h3 className="text-sm md:text-lg font-semibold text-foreground mb-1 md:mb-2 group-hover:text-primary transition-colors">
                  {mat.title}
                </h3>
                <p className="text-muted-foreground text-xs md:text-sm leading-relaxed">
                  {mat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
