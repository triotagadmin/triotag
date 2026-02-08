import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import venueCafe1 from "@/assets/venue-cafe-1.jpg";
import venueMetroStation from "@/assets/venue-metro-station.jpg";
import venueBathroom from "@/assets/venue-bathroom.jpg";

const AD_UNIT_TYPE_LABELS: Record<string, string> = {
  countertop_display: "Countertop Display",
  table_tent: "Table Tent",
  table_tent_card: "Table Tent Card",
  window_sticker: "Window Sticker",
  tabletop_sticker: "Tabletop Sticker",
  floor_decal: "Floor Decal",
  wall_poster: "Wall Poster",
  digital_screen: "Digital Screen",
  mural_painting: "Mural Painting",
  wheat_paste: "Wheat Paste",
};

interface FeaturedListing {
  id: string;
  title: string;
  category: string;
  image: string;
  status: string;
  adUnits: { type: string; label: string; pricePerWeek?: number; pricePerMonth?: number }[];
  fromDb: boolean;
}

const fallbackLocations: FeaturedListing[] = [
  {
    id: "fallback-1",
    title: "Balay Kalapihan",
    category: "Café",
    image: venueCafe1,
    status: "Available",
    adUnits: [],
    fromDb: false,
  },
  {
    id: "fallback-2",
    title: "Metro Station Plaza",
    category: "Kiosk",
    image: venueMetroStation,
    status: "Booked",
    adUnits: [],
    fromDb: false,
  },
  {
    id: "fallback-3",
    title: "Downtown Bar & Lounge",
    category: "Bar",
    image: venueBathroom,
    status: "Available",
    adUnits: [],
    fromDb: false,
  },
];

export const FeaturedLocations = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [listings, setListings] = useState<FeaturedListing[]>(fallbackLocations);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    const fetchFeaturedListings = async () => {
      try {
        const { data, error } = await supabase
          .from("ad_spaces")
          .select("id, title, location, media_urls, specifications, availability_status")
          .eq("approval_status", "approved")
          .order("created_at", { ascending: false })
          .limit(6);

        if (error) throw error;

        if (data && data.length > 0) {
          const dbListings: FeaturedListing[] = data.map((item) => {
            const specs = item.specifications as any;
            const adUnitsRaw = specs?.ad_units || [];
            const adUnits = adUnitsRaw.map((unit: any) => ({
              type: unit.type,
              label: AD_UNIT_TYPE_LABELS[unit.type] || unit.type?.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
              pricePerWeek: unit.pricePerWeek || 0,
              pricePerMonth: unit.pricePerMonth || 0,
            }));
            const mediaUrls = Array.isArray(item.media_urls) ? item.media_urls : [];
            const image = (mediaUrls[0] as string) || venueCafe1;
            const venueType = specs?.venue_type || specs?.custom_venue_type || "Venue";

            return {
              id: item.id,
              title: item.title,
              category: venueType,
              image,
              status: item.availability_status === "booked" ? "Booked" : "Available",
              adUnits,
              fromDb: true,
            };
          });

          // Pin DB listings first, fill remaining slots with fallbacks
          const remaining = 3 - dbListings.length;
          const combined = remaining > 0
            ? [...dbListings, ...fallbackLocations.slice(0, remaining)]
            : dbListings.slice(0, 3);
          setListings(combined);
        }
      } catch (err) {
        console.error("Error fetching featured listings:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedListings();
  }, []);

  return (
    <section ref={sectionRef} className="py-12 md:py-24 bg-card border-y border-border">
      <div className="container mx-auto px-4 md:px-6">
        <div
          className={`text-center mb-8 md:mb-16 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 md:mb-4 text-foreground">
            Featured <span className="text-primary neon-text-glow">Venues</span>
          </h2>
          <p className="text-sm md:text-xl text-muted-foreground">
            Premium micro ad spaces in high-traffic areas
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {listings.map((location, index) => (
              <Link
                key={location.id}
                to={location.fromDb ? `/venue/${location.id}` : "/publishers?type=venue"}
              >
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
                      alt={location.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60"></div>
                  </div>
                  <CardContent className="p-4 md:p-6 space-y-2 md:space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-sm md:text-lg text-foreground truncate">
                          {location.title}
                        </h3>
                        <p className="text-xs md:text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          {location.category}
                        </p>
                      </div>
                      <Badge
                        variant={
                          location.status === "Available" ? "default" : "secondary"
                        }
                        className={`flex-shrink-0 text-xs ${
                          location.status === "Available"
                            ? "bg-primary text-primary-foreground"
                            : ""
                        }`}
                      >
                        {location.status}
                      </Badge>
                    </div>

                    {/* Ad Units & Pricing for DB listings */}
                    {location.fromDb && location.adUnits.length > 0 && (
                      <div className="pt-2 border-t border-border space-y-2">
                        {location.adUnits.slice(0, 2).map((unit, i) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <Badge variant="outline" className="capitalize text-xs">
                              {unit.label}
                            </Badge>
                            <div className="flex gap-2 text-muted-foreground">
                              {unit.pricePerWeek > 0 && (
                                <span>${unit.pricePerWeek}/wk</span>
                              )}
                              {unit.pricePerMonth > 0 && (
                                <span>${unit.pricePerMonth}/mo</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
