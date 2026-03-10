import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, ChevronLeft, ChevronRight, Building2, X, Loader2 } from "lucide-react";
import ShareButtons from "@/components/ShareButtons";
import { Navigation } from "@/components/Navigation";
import { LocationSearchModal } from "@/components/marketplace/LocationSearchModal";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getCurrencySymbol } from "@/hooks/useCurrencyConversion";
import { User } from "@supabase/supabase-js";

interface MarketplaceListing {
  id: string;
  title: string;
  description: string;
  location: string;
  type: string;
  adUnits: string[];
  image?: string;
  ownerName: string;
  createdAt: string;
  monthlySubscriptionFee?: number;
  weeklyPrice?: number;
  currency?: string;
  branchCount?: number;
}

const AD_UNIT_TYPE_LABELS: Record<string, string> = {
  countertop_display: "Countertop Display",
  table_tent: "Table Tent",
  window_sticker: "Window Sticker",
  tabletop_sticker: "Tabletop Sticker",
  floor_decal: "Floor Decal",
  wall_poster: "Wall Poster",
  digital_screen: "Digital Screen",
  mural_painting: "Mural Painting",
  wheat_paste: "Wheat Paste"
};

const AD_UNIT_MATERIAL_LABELS: Record<string, string> = {
  vinyl_sticker: "Vinyl Sticker",
  table_tent_card: "Table Tent Card",
  acrylic_table_tent: "Acrylic Table Tent",
  coroplast_stand: "Coroplast Stand",
  poster_frame: "Poster Frame",
  wall_decal: "Wall Decal",
};

const VENUE_TYPE_LABELS: Record<string, string> = {
  restaurant: "Restaurant",
  cafe: "Café",
  gym: "Gym/Fitness Center",
  restroom: "Restroom Stall",
  salon: "Salon/Spa",
  bar: "Bar/Lounge",
  hotel: "Hotel",
  coworking: "Co-Working Space",
  guerrilla: "Guerrilla Ad Space",
  other: "Other"
};

const Marketplace = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [filteredListings, setFilteredListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [locationCoords, setLocationCoords] = useState<{lat: number;lng: number;} | null>(null);
  const [locationSearching, setLocationSearching] = useState(false);

  const ITEMS_PER_SLIDE = 6;
  const totalSlides = Math.ceil(filteredListings.length / ITEMS_PER_SLIDE);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });
    fetchAllListings();
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [listings, searchTerm]);

  const handleLocationSearch = async (lat: number, lng: number) => {
    setLocationCoords({ lat, lng });
    setLocationSearching(true);
    try {
      const { data, error } = await supabase.rpc("search_nearby_listings", {
        user_lat: lat,
        user_lng: lng,
        radius_km: 10
      });

      if (error) throw error;

      const locationListings: MarketplaceListing[] = (data || []).
      map((item: any) => {
        // media_urls may come as JSON string from RPC, parse if needed
        let parsedMediaUrls = item.media_urls;
        if (typeof parsedMediaUrls === "string") {
          try {parsedMediaUrls = JSON.parse(parsedMediaUrls);} catch {parsedMediaUrls = [];}
        }

        const specs = typeof item.specifications === "string" ?
        (() => {try {return JSON.parse(item.specifications);} catch {return {};}})() :
        item.specifications || {};
        const adUnitsFromDb = specs?.ad_units || [];
        const adUnitLabels = adUnitsFromDb.map((unit: any) => AD_UNIT_TYPE_LABELS[unit.type] || unit.type);
        const adUnitMaterials: string[] = (specs?.ad_unit_materials || []).map(
          (mat: string) => AD_UNIT_MATERIAL_LABELS[mat] || mat.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())
        );
        const combinedAdUnits = [...adUnitLabels, ...adUnitMaterials];
        const weeklyPrice = adUnitsFromDb[0]?.pricePerWeek || specs?.weekly_lease_price || 0;
        const monthlyPrice = adUnitsFromDb[0]?.pricePerMonth || specs?.monthly_lease_price || 0;
        const currency = adUnitsFromDb[0]?.currency || specs?.lease_currency || specs?.currency || "USD";

        return {
          id: item.id,
          title: item.title,
          description: item.description || "",
          location: item.location || "Not specified",
          type: item.category === "agent" ? item.service_type || "Agent Service" : VENUE_TYPE_LABELS[specs?.venue_type] || specs?.venue_type || specs?.type || "Venue",
          adUnits: combinedAdUnits.length > 0 ? combinedAdUnits : item.category === "agent" ? [item.service_type || "Service"] : ["No ad units specified"],
          image: Array.isArray(parsedMediaUrls) ? parsedMediaUrls[0] : undefined,
          ownerName: item.publisher_business_name || (item.category === "agent" ? "Agent" : "Venue"),
          createdAt: item.created_at || "",
          monthlySubscriptionFee: monthlyPrice || item.monthly_subscription_fee || 0,
          weeklyPrice: weeklyPrice,
          currency: currency
        };
      });

      setFilteredListings(locationListings);
      setCurrentSlide(0);
    } catch (error) {
      console.error("Location search error:", error);
      toast({
        title: "Error",
        description: "Failed to search listings by location.",
        variant: "destructive"
      });
    } finally {
      setLocationSearching(false);
    }
  };

  const clearLocationFilter = () => {
    setLocationCoords(null);
    applyFilters();
  };

  const fetchAllListings = async () => {
    try {
      setLoading(true);

      const { data: venuesData } = await supabase.
      from("ad_spaces").
      select(`*, publisher_profiles_public(business_name, publisher_type)`).
      eq("approval_status", "approved").
      eq("availability_status", "available").
      order("created_at", { ascending: false });

      // Fetch branch counts from both franchise_branches and advertiser_branches
      const listingIds = (venuesData || []).map(v => v.id);
      const [{ data: franchiseBranchData }, { data: advertiserBranchData }] = listingIds.length > 0
        ? await Promise.all([
            supabase.from("franchise_branches").select("franchise_id").in("franchise_id", listingIds),
            supabase.from("advertiser_branches").select("listing_id").in("listing_id", listingIds).eq("is_ad_space_listing", true),
          ])
        : [{ data: [] }, { data: [] }];

      const branchCountMap: Record<string, number> = {};
      (franchiseBranchData || []).forEach((b: any) => {
        branchCountMap[b.franchise_id] = (branchCountMap[b.franchise_id] || 0) + 1;
      });
      (advertiserBranchData || []).forEach((b: any) => {
        branchCountMap[b.listing_id] = (branchCountMap[b.listing_id] || 0) + 1;
      });

      const allListings: MarketplaceListing[] = (venuesData || []).map((v) => {
        const specs = v.specifications as any;
        const adUnitsFromDb = specs?.ad_units || [];
        const adUnitLabels = adUnitsFromDb.map((unit: any) => AD_UNIT_TYPE_LABELS[unit.type] || unit.type);
        
        // Also detect ad_unit_materials from newer registration format
        const adUnitMaterials: string[] = (specs?.ad_unit_materials || []).map(
          (mat: string) => AD_UNIT_MATERIAL_LABELS[mat] || mat.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())
        );
        const combinedAdUnits = [...adUnitLabels, ...adUnitMaterials];

        const weeklyPrice = adUnitsFromDb[0]?.pricePerWeek || specs?.weekly_lease_price || 0;
        const monthlyPrice = adUnitsFromDb[0]?.pricePerMonth || specs?.monthly_lease_price || 0;
        const currency = adUnitsFromDb[0]?.currency || specs?.lease_currency || specs?.currency || "USD";

        return {
          id: v.id,
          title: v.title,
          description: v.description || "",
          location: v.location || "Not specified",
          type: VENUE_TYPE_LABELS[specs?.venue_type] || specs?.venue_type || specs?.type || "Venue",
          adUnits: combinedAdUnits.length > 0 ? combinedAdUnits : ["No ad units specified"],
          image: Array.isArray(v.media_urls) ? (v.media_urls as string[])[0] : undefined,
          ownerName: (v.publisher_profiles_public as any)?.business_name || "Venue",
          createdAt: v.created_at || "",
          monthlySubscriptionFee: monthlyPrice,
          weeklyPrice: weeklyPrice,
          currency: currency,
          branchCount: branchCountMap[v.id] || 0,
        };
      });

      const PINNED_LISTING_ID = "4f9e8cf4-7df9-437a-8fe2-251957b5cafe";
      allListings.sort((a, b) => {
        if (a.id === PINNED_LISTING_ID) return -1;
        if (b.id === PINNED_LISTING_ID) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      setListings(allListings);
      setFilteredListings(allListings);
    } catch (error) {
      console.error("Error fetching listings:", error);
      toast({
        title: "Error",
        description: "Failed to load marketplace listings.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    if (locationCoords) return;

    let filtered = listings;
    if (searchTerm) {
      filtered = filtered.filter(
        (l) =>
        l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredListings(filtered);
    setCurrentSlide(0);
  };

  const handleListingClick = (listing: MarketplaceListing) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to view listing details and make transactions."
      });
      navigate("/auth");
      return;
    }
    navigate(`/venue/${listing.id}`);
  };

  const getCurrentSlideListings = () => {
    const start = currentSlide * ITEMS_PER_SLIDE;
    return filteredListings.slice(start, start + ITEMS_PER_SLIDE);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <p className="text-muted-foreground">Loading marketplace...</p>
      </div>);

  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Navigation />
      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your central hub for activating advertising spaces.
          </p>
          {!user &&
          <p className="text-sm text-muted-foreground mt-2">
              <Button variant="link" onClick={() => navigate("/auth")} className="p-0 h-auto">
                Log in
              </Button>{" "}
              to make transactions
            </p>
          }
        </div>

        {/* Search & Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Search Ad Spaces</CardTitle>
            <CardDescription>Find the perfect advertising space for your campaign</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search ad spaces..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    if (locationCoords) clearLocationFilter();
                  }}
                  className="pl-9" />

              </div>

              <Button
                variant={locationCoords ? "default" : "outline"}
                onClick={() => setLocationModalOpen(true)}
                className="w-full">

                <MapPin className="h-4 w-4 mr-2" />
                Search by Location
              </Button>
            </div>

            {locationCoords &&
            <div className="flex items-center gap-2 mt-4 p-2 rounded-lg bg-primary/10 border border-primary/20">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm text-primary">
                  Showing results within 10 km of ({locationCoords.lat.toFixed(4)},{" "}
                  {locationCoords.lng.toFixed(4)})
                </span>
                <Button
                variant="ghost"
                size="sm"
                onClick={clearLocationFilter}
                className="ml-auto h-6 w-6 p-0">

                  <X className="h-3 w-3" />
                </Button>
              </div>
            }
          </CardContent>
        </Card>

        {/* Location Search Loading */}
        {locationSearching &&
        <div className="flex items-center justify-center py-8 mb-6">
            <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
            <p className="text-muted-foreground">Searching nearby ad spaces...</p>
          </div>
        }

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-muted-foreground">
            Showing {filteredListings.length} {locationCoords ? "nearby" : "approved"} ad spaces
            {totalSlides > 1 && ` • Slide ${currentSlide + 1} of ${totalSlides}`}
          </p>
          <Button variant="outline" onClick={() => navigate("/explore-all")}>
            View All Listings
          </Button>
        </div>

        {/* Carousel Navigation */}
        {totalSlides > 1 &&
        <div className="flex items-center justify-center gap-4 mb-6">
            <Button variant="outline" size="icon" onClick={prevSlide}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex gap-2">
              {Array.from({ length: totalSlides }).map((_, idx) =>
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`w-2 h-2 rounded-full transition-colors ${
              idx === currentSlide ? "bg-primary" : "bg-muted-foreground/30"}`
              } />

            )}
            </div>
            <Button variant="outline" size="icon" onClick={nextSlide}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        }

        {/* Listings Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
          {getCurrentSlideListings().length === 0 ?
          <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">
                {locationCoords ?
              "No ad spaces found within 10 km of this location" :
              "No approved ad spaces found matching your criteria"}
              </p>
            </div> :

          getCurrentSlideListings().map((listing) =>
          <Card
            key={listing.id}
            className="hover:shadow-lg transition-shadow overflow-hidden cursor-pointer"
            onClick={() => handleListingClick(listing)}>

                {listing.image &&
            <div className="relative h-48 w-full overflow-hidden">
                    <img
                src={listing.image}
                alt={listing.title}
                className="w-full h-full object-cover transition-transform hover:scale-105" />

                  </div>
            }
                <CardHeader>
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-green-500/10 text-green-600 border border-green-500/20">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <CardTitle className="text-lg line-clamp-1">{listing.title}</CardTitle>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <Badge variant="secondary" className="capitalize">
                      {listing.type}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {(listing.branchCount ?? 0) > 1 ? `Multi-location (${listing.branchCount})` : "Single Location"}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">{listing.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{(() => { const p = (listing.location || "").split(",").map(s => s.trim()).filter(Boolean); return p.length >= 2 ? p.slice(-2).join(", ") : p[p.length - 1] || "—"; })()}</span>
                  </div>

                  {(listing.weeklyPrice || listing.monthlySubscriptionFee) &&
              <div className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1 space-y-1">
                      {listing.weeklyPrice !== undefined && listing.weeklyPrice > 0 &&
                <div>
                          <span className="font-medium">Weekly:</span> {getCurrencySymbol(listing.currency)}{listing.weeklyPrice}/week
                        </div>
                }
                      {listing.monthlySubscriptionFee !== undefined &&
                listing.monthlySubscriptionFee > 0 &&
                <div>
                            <span className="font-medium">Monthly:</span> {getCurrencySymbol(listing.currency)}
                            {listing.monthlySubscriptionFee}/month
                          </div>
                }
                    </div>
              }

                  {listing.adUnits.length > 0 &&
              <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground mb-2">Ad Units</p>
                      <div className="flex flex-wrap gap-1">
                        {listing.adUnits.slice(0, 3).map((unit) => {
                    const formatAdUnitName = (sku: string) => {
                      return sku.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
                    };
                    return (
                      <Button key={unit} variant="cyber" size="sm" className="text-xs h-7 px-3">
                              {formatAdUnitName(unit)}
                            </Button>);

                  })}
                        {listing.adUnits.length > 3 &&
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7 px-3 border-primary/50 text-primary">

                            +{listing.adUnits.length - 3} more
                          </Button>
                  }
                      </div>
                    </div>
              }

                  <div className="pt-2 border-t">
                    
                    
                  </div>

                  <div className="flex items-center gap-2 mt-4">
                    <Button className="flex-1">
                      {user ? "View Details" : "Log in to View"}
                    </Button>
                    <ShareButtons
                      url={`${window.location.origin}/venue/${listing.id}`}
                      title={listing.title}
                      description={listing.description}
                    />
                  </div>
                </CardContent>
              </Card>
          )
          }
        </div>
      </div>
      <LocationSearchModal
        open={locationModalOpen}
        onOpenChange={setLocationModalOpen}
        onSearch={handleLocationSearch}
        radiusKm={10} />

      <Footer />
    </div>);

};

export default Marketplace;