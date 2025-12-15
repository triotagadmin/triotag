import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import venueCafe1 from "@/assets/venue-cafe-1.jpg";
import venueMetroStation from "@/assets/venue-metro-station.jpg";
import venueBathroom from "@/assets/venue-bathroom.jpg";

const locations = [
  {
    name: "Brew & Bean Café",
    category: "Café",
    image: venueCafe1,
    status: "Available",
  },
  {
    name: "Metro Station Plaza",
    category: "Kiosk",
    image: venueMetroStation,
    status: "Booked",
  },
  {
    name: "Downtown Bar & Lounge",
    category: "Bar",
    image: venueBathroom,
    status: "Available",
  },
];

export const FeaturedLocations = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 bg-card border-y border-border">
      <div className="container mx-auto px-6">
        <div
          className={`text-center mb-16 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Featured <span className="text-primary neon-text-glow">Venues</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Premium micro ad spaces in high-traffic areas
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {locations.map((location, index) => (
            <Link key={index} to="/publishers?type=venue">
              <Card
                className={`overflow-hidden border border-border bg-background hover:border-primary/50 transition-all duration-500 cursor-pointer group animate-scale-hover ${
                  isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="aspect-[4/3] overflow-hidden relative">
                  <img
                    src={location.image}
                    alt={location.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60"></div>
                </div>
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-lg text-foreground">
                        {location.name}
                      </h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {location.category}
                      </p>
                    </div>
                    <Badge
                      variant={
                        location.status === "Available" ? "default" : "secondary"
                      }
                      className={
                        location.status === "Available"
                          ? "bg-primary text-primary-foreground"
                          : ""
                      }
                    >
                      {location.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
