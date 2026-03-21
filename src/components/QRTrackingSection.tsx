import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { QrCode, Video, MapPin, BarChart3 } from "lucide-react";

const trackingFeatures = [
{
  icon: QrCode,
  title: "QR Code Tracking",
  description: "Every ad placement includes a unique QR code that tracks scans, engagement, and audience interaction in real-time."
},
{
  icon: MapPin,
  title: "Geo-Tagged Verification",
  description: "Each placement is geo-tagged with precise coordinates, ensuring your ads are exactly where they should be."
},
{
  icon: Video,
  title: "Real-Time Video Verification",
  description: "Publishers submit live video proof of ad placement, giving you visual confirmation that your campaign is active."
},
{
  icon: BarChart3,
  title: "Performance Analytics",
  description: "Monitor scan rates, device types, browser data, and geographic distribution of your audience through a live dashboard."
}];


export const QRTrackingSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {if (entry.isIntersecting) setIsVisible(true);},
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="relative py-12 md:py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
      
      {/* Glowing orbs */}
      <div className="absolute top-1/3 right-1/4 w-48 md:w-80 h-48 md:h-80 bg-primary/15 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/3 left-1/4 w-40 md:w-72 h-40 md:h-72 bg-accent/15 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />

      <div className="container mx-auto px-4 relative z-10">
        <div className={`text-center mb-8 md:mb-16 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          


          
          <h2 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-display font-bold mb-4 md:mb-6">
            Brand Campaign<br />Tracking
          </h2>
          <p className="text-sm max-w-3xl mx-auto leading-relaxed px-2 text-white md:text-base">
            We verify every placement using QR codes, geo-tagging, and real-time video verification so advertisers know exactly where their campaigns are displayed.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {trackingFeatures.map((feature, index) =>
          <Card
            key={feature.title}
            className={`group relative overflow-hidden border-primary/20 bg-background/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-500 hover:shadow-[0_0_30px_hsl(var(--primary)/0.3)] ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
            style={{ transitionDelay: `${index * 120}ms` }}>
            
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardContent className="p-4 md:p-6 relative">
                <div className="p-2 md:p-3 rounded-lg bg-primary/10 border border-primary/20 group-hover:bg-primary/20 group-hover:border-primary/40 transition-all duration-300 group-hover:shadow-[0_0_20px_hsl(var(--primary)/0.4)] w-fit mb-3 md:mb-4">
                  <feature.icon className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </div>
                <h3 className="text-sm md:text-lg font-semibold text-foreground mb-1 md:mb-2 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-xs leading-relaxed text-white md:text-base">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </section>);

};