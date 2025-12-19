import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { PrintOnDemandSection } from "@/components/PrintOnDemandSection";
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
      <AdvertiserTypes />
      <HowItWorks />
      <PrintOnDemandSection />
      <FeaturedLocations />
      <FeaturedAgents />
      <FeaturedDigitalMedia />
      <PublisherTypes />
      <CTABanner />
      <Footer />
    </div>
  );
};

export default Index;
