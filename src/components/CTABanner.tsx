import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Briefcase } from "lucide-react";

export const CTABanner = () => {
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
        threshold: 0.1
      }
    );
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    return () => observer.disconnect();
  }, []);
  return (
    <section ref={sectionRef} className="py-12 md:py-24 bg-card border-y border-border relative overflow-hidden">
      {/* Background grid pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(to right, hsl(110 100% 55% / 0.1) 1px, transparent 1px),
              linear-gradient(to bottom, hsl(110 100% 55% / 0.1) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px"
          }} />
        
      </div>

      <div className="container mx-auto px-4 md:px-6 text-center space-y-4 md:space-y-8 relative z-10">
        


        

        <h2
          className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold max-w-3xl mx-auto text-foreground transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          
          Job Openings
        </h2>

        <p
          className={`text-sm md:text-lg max-w-2xl mx-auto transition-all duration-700 delay-100 text-muted-foreground ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          
          We're expanding our team to help brands connect with curated ad spaces. Explore open roles and join a dynamic
          team shaping the future of brand advertising.
        </p>

        <div
          className={`flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-8 transition-all duration-700 delay-200 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          
          <Link to="/careers" className="block">
            <Button
              size="lg"
              className="w-full sm:w-auto text-sm md:text-lg px-6 md:px-10 py-4 md:py-6 min-h-[44px] neon-glow hover:neon-glow-strong">
              
              View Job Openings
            </Button>
          </Link>
        </div>
      </div>
    </section>);

};