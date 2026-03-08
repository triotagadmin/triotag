import { ShoppingBag, Calendar, Coffee, Users, Music, Cpu } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useRef, useState } from "react";

const advertiserTypes = [
  {
    title: "Products & Retail",
    description:
      "Promote consumer products in high-traffic ad spaces to increase brand visibility and audience engagement. Our platform enables advertisers to select strategic ad space locations and deploy campaign materials across multiple sites through a centralized dashboard.",
    icon: ShoppingBag,
  },
  {
    title: "Services",
    description:
      "Showcase local or online services such as fitness classes, workshops, or professional offerings with detailed analytics. Track which ad spaces display your campaigns, measure reach, and optimize your promotional strategy based on performance data.",
    icon: Users,
  },
  {
    title: "Events & Experiences",
    description:
      "Promote concerts, pop-ups, festivals, or community events through our ad space marketplace. Choose from curated locations and ensure your campaign reaches audiences where they’re most engaged.",
    icon: Calendar,
  },
  {
    title: "Food & Beverage",
    description:
      "Promote new food items and packaged drinks across your franchise locations using our centralized campaign distribution system. Select specific branches, upload your marketing creatives, and generate print-ready advertising materials that can be deployed to each franchise location directly from the platform.",
    icon: Coffee,
  },
  {
    title: "Entertainment & Media",
    description:
      "Build buzz for films, music releases, podcasts, or YouTube channels through our curated ad space marketplace. Select high-visibility locations and deploy your campaign to reach audiences who are most likely to engage with your content.",
    icon: Music,
  },
  {
    title: "Tech & Gadgets",
    description:
      "Use our OOH logistics platform to showcase apps, electronics, or tech services. Select ad spaces, upload marketing materials, and let the platform manage print production, packaging, and distribution while providing analytics on campaign deployment.",
    icon: Cpu,
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
      {
        threshold: 0.1,
      },
    );
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    return () => observer.disconnect();
  }, []);
  return (
    <section ref={sectionRef} className="py-12 md:py-24 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <div
          className={`max-w-3xl mx-auto text-center mb-8 md:mb-16 space-y-2 md:space-y-4 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
            Real-World Brand Visibility
          </h2>
          <p className="text-sm md:text-xl px-2 text-muted-foreground">
            Tiny Sticky Ads is a retail media advertising network that helps businesses and organizers distribute
            campaigns for products, services, and events across curated commercial ad space locations. We help brands
            reach the right audience through strategic out-of-home placements.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 mb-8 md:mb-12">
          {advertiserTypes.map((type, index) => {
            const Icon = type.icon;
            return (
              <Card
                key={index}
                className={`border border-border bg-card hover:border-primary/50 transition-all duration-500 animate-scale-hover ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                style={{
                  transitionDelay: `${index * 80}ms`,
                }}
              >
                <CardHeader className="pb-2 md:pb-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 border border-primary/30 bg-primary/5 flex items-center justify-center mb-2 md:mb-4">
                    <Icon className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                  </div>
                  <CardTitle className="text-base md:text-xl text-foreground">{type.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-xs md:text-sm text-muted-foreground">
                    {type.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
