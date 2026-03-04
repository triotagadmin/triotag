import { ShoppingBag, Calendar, Building, Users, Music, Heart } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
const advertiserTypes = [{
  title: "Retail & E-commerce",
  description: "Drive online conversions by connecting offline placements to digital campaigns.",
  icon: ShoppingBag
}, {
  title: "Event Promotions",
  description: "Promote concerts, launches, or pop-ups through targeted sticker campaigns.",
  icon: Calendar
}, {
  title: "Franchises & Chains",
  description: "Ensure consistent local reach across multiple locations worldwide.",
  icon: Building
}, {
  title: "Service Providers",
  description: "Connect with local customers through strategic placement in high-traffic areas.",
  icon: Users
}, {
  title: "Artists, Creators & Entertainment Brands",
  description: "Build buzz for music drops, films, podcasts, YouTube channels, or indie creators using street-level visibility.",
  icon: Music
}, {
  title: "NGOs, Advocacy Groups & Public Campaigns",
  description: "Spread awareness for causes, voter education, health drives, or community initiatives at the grassroots level.",
  icon: Heart
}];
export const AdvertiserTypes = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
      }
    }, {
      threshold: 0.1
    });
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    return () => observer.disconnect();
  }, []);
  return <section ref={sectionRef} className="py-12 md:py-24 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className={`max-w-3xl mx-auto text-center mb-8 md:mb-16 space-y-2 md:space-y-4 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
            Advertise with Precision & Impact
          </h2>
          <p className="text-sm md:text-xl px-2 text-white">Tiny Sticky Ads is an advertising media management company that enables businesses to leverage hyper-local marketing through strategic micro-ad placements.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 mb-8 md:mb-12">
          {advertiserTypes.map((type, index) => {
          const Icon = type.icon;
          return <Card key={index} className={`border border-border bg-card hover:border-primary/50 transition-all duration-500 animate-scale-hover ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`} style={{
            transitionDelay: `${index * 80}ms`
          }}>
                <CardHeader className="pb-2 md:pb-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 border border-primary/30 bg-primary/5 flex items-center justify-center mb-2 md:mb-4">
                    <Icon className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                  </div>
                  <CardTitle className="text-base md:text-xl text-foreground">
                    {type.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-xs md:text-sm text-muted-foreground">
                    {type.description}
                  </CardDescription>
                </CardContent>
              </Card>;
        })}
        </div>

        
      </div>
    </section>;
};