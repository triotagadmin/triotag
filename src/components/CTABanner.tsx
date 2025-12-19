import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
export const CTABanner = () => {
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
  return <section ref={sectionRef} className="py-12 md:py-24 bg-card border-y border-border relative overflow-hidden">
      {/* Background grid pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="w-full h-full" style={{
        backgroundImage: `
              linear-gradient(to right, hsl(110 100% 55% / 0.1) 1px, transparent 1px),
              linear-gradient(to bottom, hsl(110 100% 55% / 0.1) 1px, transparent 1px)
            `,
        backgroundSize: "40px 40px"
      }} />
      </div>

      <div className="container mx-auto px-4 md:px-6 text-center space-y-4 md:space-y-8 relative z-10">
        <h2 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold max-w-3xl mx-auto text-foreground transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          Start Advertising with{" "}
          <span className="text-primary neon-text-glow">micro ad space </span>!
        </h2>

        <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-8 transition-all duration-700 delay-200 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="text-center space-y-2 md:space-y-3 w-full sm:w-auto">
            <p className="text-xs md:text-sm text-muted-foreground uppercase tracking-wider">
              For Advertisers
            </p>
            <Link to="/publishers" className="block">
              <Button size="lg" className="w-full sm:w-auto text-base md:text-lg px-6 md:px-8 py-5 md:py-6 neon-glow hover:neon-glow-strong">
                Buy Ad Space
              </Button>
            </Link>
          </div>
          <div className="text-center space-y-2 md:space-y-3 w-full sm:w-auto">
            <p className="text-xs md:text-sm text-muted-foreground uppercase tracking-wider">
              For Venues
            </p>
            <Link to="/auth" className="block">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-base md:text-lg px-6 md:px-8 py-5 md:py-6">
                Sell Ad Space
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>;
};