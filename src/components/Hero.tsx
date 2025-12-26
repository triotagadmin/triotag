import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import heroBackground from "@/assets/hero-background.gif";
export const Hero = () => {
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    setIsVisible(true);
  }, []);
  return <section className="relative min-h-[70vh] md:min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* GIF Background */}
      <div className="absolute inset-0">
        <img alt="Hero background" className="w-full h-full object-cover" src="/lovable-uploads/3d27b193-56c3-487b-88f4-4277c4f12752.jpg" />
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className={`max-w-4xl mx-auto text-center space-y-4 md:space-y-8 transition-all duration-1000 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight text-foreground leading-tight">
            <span className="text-primary neon-text-glow animate-text-glow">Tiny Sticky Ads     </span>
          </h1>

          <p style={{
          fontFamily: "'Rajdhani', sans-serif",
          textShadow: '2px 2px 0 #000, 4px 4px 0 rgba(0,0,0,0.8), 6px 6px 0 rgba(0,0,0,0.6), 8px 8px 15px rgba(0,0,0,0.9), 0 0 30px rgba(0,0,0,0.5)',
          transform: 'perspective(600px) rotateX(8deg)',
          animation: 'float3d 4s ease-in-out infinite',
          letterSpacing: '0.15em'
        }} className="text-base text-center bg-transparent text-destructive-foreground font-light">Advertise your products, services, events, announcements, launches,
and special offers across our AI-powered micro advertising network. ​
​
          <br />
            ​
          </p>

          <div className={`flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 pt-2 md:pt-4 transition-all duration-1000 delay-400 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <Link to="/publishers" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto text-base md:text-lg px-6 md:px-8 py-5 md:py-6 bg-primary text-primary-foreground font-semibold neon-glow hover:neon-glow-strong transition-all duration-300 hover:bg-primary/90">
                Advertise Now
              </Button>
            </Link>
            <Link to="/auth" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-base md:text-lg px-6 md:px-8 py-5 md:py-6 border-primary text-primary bg-transparent hover:bg-primary/10 hover:neon-glow transition-all duration-300">
                Become a Publisher
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-16 md:h-32 bg-gradient-to-t from-background to-transparent"></div>

      {/* Decorative grid lines */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div className="w-full h-full" style={{
        backgroundImage: `
              linear-gradient(to right, hsl(110 100% 55% / 0.1) 1px, transparent 1px),
              linear-gradient(to bottom, hsl(110 100% 55% / 0.1) 1px, transparent 1px)
            `,
        backgroundSize: "30px 30px"
      }} />
      </div>
    </section>;
};