import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import heroBackground from "@/assets/hero-background.gif";
export const Hero = () => {
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    setIsVisible(true);
  }, []);
  return <section className="relative min-h-[auto] md:min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* GIF Background */}
      <div className="absolute inset-0 md:block hidden">
        <img alt="Hero background" className="w-full h-full object-cover" src="/lovable-uploads/3d27b193-56c3-487b-88f4-4277c4f12752.jpg" />
      </div>
      {/* Mobile: full image visible */}
      <div className="relative w-full md:hidden">
        <img alt="Hero background" className="w-full h-auto object-contain" src="/lovable-uploads/3d27b193-56c3-487b-88f4-4277c4f12752.jpg" />
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <div className={`w-full px-4 text-center space-y-3 transition-all duration-1000 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <h1 className="text-3xl font-bold tracking-tight text-foreground leading-tight">
              <span className="text-primary neon-text-glow animate-text-glow">Accelerate your sales growth.</span>
            </h1>
            <p style={{
            fontFamily: "'Rajdhani', sans-serif",
            textShadow: '2px 2px 0 #000, 4px 4px 0 rgba(0,0,0,0.8), 6px 6px 0 rgba(0,0,0,0.6), 8px 8px 15px rgba(0,0,0,0.9), 0 0 30px rgba(0,0,0,0.5)',
            letterSpacing: '0.1em'
          }} className="text-sm text-center bg-transparent neon-text-glow animate-text-glow text-sidebar-foreground font-semibold">
              Advertise your business across our micro advertising network.
            </p>
            <div className={`grid grid-cols-2 gap-2 pt-2 transition-all duration-1000 delay-400 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
              <Link to="/auth" className="block">
                <Button size="sm" className="w-full text-[10px] px-2 py-2 h-10 min-h-[44px] bg-primary text-primary-foreground font-semibold neon-glow hover:neon-glow-strong transition-all duration-300 hover:bg-primary/90">
                  Advertise Now
                </Button>
              </Link>
              <Link to="/list-space" className="block">
                <Button size="sm" variant="outline" className="relative overflow-hidden w-full text-[10px] px-2 py-2 h-10 min-h-[44px] border-primary bg-primary hover:bg-primary/90 hover:neon-glow transition-all duration-300 animate-pulse-glow">
                  <span className="absolute inset-0 overflow-hidden rounded-[inherit]"><span className="absolute inset-0 animate-[shimmer_2s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-primary-foreground/30 to-transparent" /></span>
                  <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 font-bold" style={{ textShadow: '0 0 10px rgba(255,215,0,0.8), 0 0 20px rgba(255,215,0,0.5)' }}>Register Ad Space</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10 hidden md:block">
        <div className={`max-w-4xl mx-auto text-center space-y-4 md:space-y-8 transition-all duration-1000 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight text-foreground leading-tight">
            <span className="text-primary neon-text-glow animate-text-glow">The Central Hub for Ambient and Place-Based Advertisements.</span>
          </h1>


          <div className={`flex flex-row items-center justify-center gap-4 pt-4 transition-all duration-1000 delay-400 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <Link to="/auth">
              <Button size="lg" className="relative overflow-hidden text-lg px-8 py-6 min-h-[44px] bg-primary text-primary-foreground font-semibold neon-glow hover:neon-glow-strong transition-all duration-300 hover:bg-primary/90 animate-pulse-glow">
                <span className="absolute inset-0 overflow-hidden rounded-[inherit]"><span className="absolute inset-0 animate-[shimmer_2s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-blue-400/40 to-transparent" /></span>
                <span className="relative z-10">Advertise Now</span>
              </Button>
            </Link>
            <Link to="/list-space">
              <Button size="lg" variant="outline" className="relative overflow-hidden text-lg px-8 py-6 min-h-[44px] border-primary bg-primary hover:bg-primary/90 hover:neon-glow transition-all duration-300 animate-pulse-glow">
                <span className="absolute inset-0 overflow-hidden rounded-[inherit]"><span className="absolute inset-0 animate-[shimmer_2s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-primary-foreground/30 to-transparent" /></span>
                <span className="relative z-10 text-primary-foreground font-bold">Register Ad Space</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-16 md:h-32 bg-gradient-to-t from-background to-transparent pointer-events-none"></div>

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