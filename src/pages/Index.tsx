import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { PrintOnDemandSection } from "@/components/PrintOnDemandSection";
import { MicroAdMaterials } from "@/components/MicroAdMaterials";
import { QRTrackingSection } from "@/components/QRTrackingSection";
import { FeaturedLocations } from "@/components/FeaturedLocations";
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
      <MicroAdMaterials />
      <QRTrackingSection />
      <FeaturedLocations />
      <CTABanner />
      <Footer />
    </div>
  );
};

export default Index;