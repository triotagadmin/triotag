import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import heroBackground from "@/assets/hero-background.jpg";
export const Hero = () => {
  return <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <img src={heroBackground} alt="Modern café interior" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-background/60"></div>
      </div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8 border-0 border-chart-1">
          <h1 className="text-6xl font-bold tracking-tight text-secondary bg-[sidebar-primary-foreground] md:text-[sidebar-primary-foreground] bg-chart-5">
            Buy and Sell <span className="text-primary">Micro Ad Space</span>
          </h1>
          
          <p className="text-xl max-w-2xl mx-auto bg-[sidebar-primary-foreground] font-mono font-bold md:text-[sidebar-primary-foreground] text-gray-50 bg-teal-950">
            Connecting advertisers with venues, agencies, and digital publishers in the micro advertising revolution!
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/publishers">
              <Button size="lg" className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all">
                Advertise Now
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all">
                Become a Publisher
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent"></div>
    </section>;
};