import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { FeaturedLocations } from "@/components/FeaturedLocations";
import { FeaturedAgents } from "@/components/FeaturedAgents";
import { FeaturedDigitalMedia } from "@/components/FeaturedDigitalMedia";
import { PublisherTypes } from "@/components/PublisherTypes";
import { AdvertiserTypes } from "@/components/AdvertiserTypes";
import { CTABanner } from "@/components/CTABanner";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <Hero />
      <HowItWorks />
      <FeaturedLocations />
      <FeaturedAgents />
      <FeaturedDigitalMedia />
      <AdvertiserTypes />
      <PublisherTypes />
      <CTABanner />
      <Footer />
    </div>
  );
};

export default Index;
