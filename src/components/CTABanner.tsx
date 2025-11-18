import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export const CTABanner = () => {
  return (
    <section className="py-24 bg-primary text-primary-foreground">
      <div className="container mx-auto px-6 text-center space-y-8">
        <h2 className="text-4xl md:text-5xl font-bold max-w-3xl mx-auto">
          Start advertising in the real world — from any device
        </h2>
        
        <Link to="/auth">
          <Button size="lg" variant="secondary" className="text-lg px-8 py-6 shadow-lg">
            Get Started Now
          </Button>
        </Link>
      </div>
    </section>
  );
};
