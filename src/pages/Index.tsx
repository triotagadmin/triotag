import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { FeaturedLocations } from "@/components/FeaturedLocations";
import { PublisherTypes } from "@/components/PublisherTypes";
import { CTABanner } from "@/components/CTABanner";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <Hero />
      <HowItWorks />
      <FeaturedLocations />
      <PublisherTypes />
      <CTABanner />
      <Footer />
    </div>
  );
};

export default Index;
