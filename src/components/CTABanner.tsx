import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
export const CTABanner = () => {
  return <section className="py-24 bg-primary text-primary-foreground">
      <div className="container mx-auto px-6 text-center space-y-8">
        <h2 className="text-4xl md:text-5xl font-bold max-w-3xl mx-auto">
          Start advertising from any device!
        </h2>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <div className="text-center">
            <p className="text-sm mb-2 text-primary-foreground/80">For Advertisers</p>
            <Link to="/publishers">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-6 shadow-lg">
                Buy Ad Space
              </Button>
            </Link>
          </div>
          <div className="text-center">
            <p className="text-sm mb-2 text-primary-foreground/80">For Publishers</p>
            <Link to="/auth">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-6 shadow-lg">
                Sell Ad Space
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>;
};