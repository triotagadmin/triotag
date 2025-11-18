import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { FeaturedLocations } from "@/components/FeaturedLocations";
import { CTABanner } from "@/components/CTABanner";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <Hero />
      <HowItWorks />
      <FeaturedLocations />
      <CTABanner />
    </div>
  );
};

export default Index;
