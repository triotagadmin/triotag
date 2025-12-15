import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import heroBackground from "@/assets/hero-background.gif";

export const Hero = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* GIF Background */}
      <div className="absolute inset-0">
        <img
          src={heroBackground}
          alt="Hero background"
          className="w-full h-full object-cover"
        />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-background/80"></div>
        {/* Gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div
          className={`max-w-4xl mx-auto text-center space-y-8 transition-all duration-1000 ease-out ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground leading-tight">
            Buy and Sell{" "}
            <span className="text-primary neon-text-glow animate-text-glow">
              Micro Ad Space
            </span>
          </h1>

          <p
            className={`text-lg md:text-xl max-w-2xl mx-auto text-muted-foreground transition-all duration-1000 delay-200 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            Connecting advertisers with venues, agencies, and digital publishers
            in the micro advertising revolution.
          </p>

          <div
            className={`flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 transition-all duration-1000 delay-400 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <Link to="/publishers">
              <Button
                size="lg"
                className="text-lg px-8 py-6 bg-primary text-primary-foreground font-semibold neon-glow hover:neon-glow-strong transition-all duration-300 hover:bg-primary/90"
              >
                Advertise Now
              </Button>
            </Link>
            <Link to="/auth">
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 border-primary text-primary bg-transparent hover:bg-primary/10 hover:neon-glow transition-all duration-300"
              >
                Become a Publisher
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent"></div>

      {/* Decorative grid lines */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(to right, hsl(110 100% 55% / 0.1) 1px, transparent 1px),
              linear-gradient(to bottom, hsl(110 100% 55% / 0.1) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />
      </div>
    </section>
  );
};
