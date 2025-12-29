import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, DollarSign, ChevronLeft, ChevronRight, Building2, Globe, UserCheck, ShoppingCart, Tag } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";
interface MarketplaceListing {
  id: string;
  title: string;
  description: string;
  budget: number;
  currency: string;
  location: string;
  type: string;
  category: "advertiser" | "venue" | "digital" | "agent";
  listingType: "buying" | "selling";
  adUnits: string[];
  image?: string;
  ownerName: string;
  createdAt: string;
  weeklyPrice?: number;
  monthlyPrice?: number;
}
const AD_UNITS = {
  venue: ["Table tent ads", "Table top sticker", "Window sticker"],
  digital: ["Social media post", "Social media marketing", "Website banner ads", "In-app ads"],
  agent: ["Guerrilla marketing", "Influencer", "Artist", "Agency"]
};
const Marketplace = () => {
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [filteredListings, setFilteredListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [listingTypeFilter, setListingTypeFilter] = useState("all");
  const [currentSlide, setCurrentSlide] = useState(0);
  const ITEMS_PER_SLIDE = 6;
  const totalSlides = Math.ceil(filteredListings.length / ITEMS_PER_SLIDE);
  useEffect(() => {
    // Check auth status
    supabase.auth.getSession().then(({
      data: {
        session
      }
    }) => {
      setUser(session?.user ?? null);
    });
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });
    fetchAllListings();
    return () => subscription.unsubscribe();
  }, []);
  useEffect(() => {
    applyFilters();
  }, [listings, searchTerm, categoryFilter, listingTypeFilter]);
  const fetchAllListings = async () => {
    try {
      setLoading(true);

      // Fetch approved ad spaces (Selling - from venue publishers)
      const {
        data: venuesData
      } = await supabase.from('ad_spaces').select(`*, publisher_profiles_public(business_name, publisher_type)`).eq('approval_status', 'approved').order('created_at', {
        ascending: false
      });

      // Fetch approved agent services (Selling - from agent publishers)
      const {
        data: servicesData
      } = await supabase.from('agent_services').select(`*, publisher_profiles_public(business_name, publisher_type)`).eq('approval_status', 'approved').order('created_at', {
        ascending: false
      });

      // Fetch approved digital publisher profiles for selling listings
      const {
        data: digitalPublishers
      } = await supabase.from('publisher_profiles_public').select('*').eq('publisher_type', 'digital').eq('verification_status', 'approved').order('created_at', {
        ascending: false
      });
      const allListings: MarketplaceListing[] = [];

      // Process venues (Selling)
      (venuesData || []).forEach(v => {
        // Get pricing from ad_units in specifications
        const specs = v.specifications as any;
        const adUnits = specs?.ad_units || [];
        const firstUnit = adUnits[0] || {};
        const weeklyPrice = firstUnit.pricePerWeek || (v.pricing as any)?.weekly || 0;
        const monthlyPrice = firstUnit.pricePerMonth || (v.pricing as any)?.monthly || 0;

        allListings.push({
          id: v.id,
          title: v.title,
          description: v.description || "",
          budget: weeklyPrice || monthlyPrice || 0,
          currency: "USD",
          location: v.location || "Not specified",
          type: specs?.venue_type || specs?.type || "Venue",
          category: "venue",
          listingType: "selling",
          adUnits: AD_UNITS.venue,
          image: Array.isArray(v.media_urls) ? (v.media_urls as string[])[0] : undefined,
          ownerName: (v.publisher_profiles_public as any)?.business_name || "Venue",
          createdAt: v.created_at || "",
          weeklyPrice,
          monthlyPrice
        });
      });

      // Process agent services (Selling)
      (servicesData || []).forEach(s => {
        allListings.push({
          id: s.id,
          title: s.title,
          description: s.description || "",
          budget: (s.pricing as any)?.hourly || (s.pricing as any)?.daily || 0,
          currency: "USD",
          location: s.location || "Not specified",
          type: s.service_type || "Agent Service",
          category: "agent",
          listingType: "selling",
          adUnits: AD_UNITS.agent,
          image: Array.isArray(s.media_urls) ? (s.media_urls as string[])[0] : undefined,
          ownerName: (s.publisher_profiles_public as any)?.business_name || "Agent",
          createdAt: s.created_at || ""
        });
      });

      // Process digital publishers (Selling)
      (digitalPublishers || []).forEach(d => {
        allListings.push({
          id: d.id,
          title: d.business_name,
          description: d.description || "Digital advertising services",
          budget: 0,
          currency: "USD",
          location: d.location || "Online",
          type: "Digital Media",
          category: "digital",
          listingType: "selling",
          adUnits: AD_UNITS.digital,
          image: undefined,
          ownerName: d.business_name,
          createdAt: d.created_at || ""
        });
      });

      // Sort by created date
      allListings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setListings(allListings);
      setFilteredListings(allListings);
    } catch (error) {
      console.error('Error fetching listings:', error);
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
    let filtered = listings;
    if (searchTerm) {
      filtered = filtered.filter(l => l.title.toLowerCase().includes(searchTerm.toLowerCase()) || l.description.toLowerCase().includes(searchTerm.toLowerCase()) || l.location.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (categoryFilter !== "all") {
      filtered = filtered.filter(l => l.category === categoryFilter);
    }
    if (listingTypeFilter !== "all") {
      filtered = filtered.filter(l => l.listingType === listingTypeFilter);
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

    // Navigate to detail page based on listing type
    if (listing.category === "venue") {
      navigate(`/venue/${listing.id}`);
    } else {
      // For now, show a toast for other listing types
      toast({
        title: "Listing Details",
        description: `Viewing ${listing.title}. Payment options: Google Pay, Stripe.`
      });
    }
  };
  const formatBudget = (amount: number, currency: string) => {
    if (amount === 0) return "Contact for pricing";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD"
    }).format(amount);
  };
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "advertiser":
        return ShoppingCart;
      case "venue":
        return Building2;
      case "digital":
        return Globe;
      case "agent":
        return UserCheck;
      default:
        return Tag;
    }
  };
  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case "advertiser":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "venue":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "digital":
        return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      case "agent":
        return "bg-orange-500/10 text-orange-600 border-orange-500/20";
      default:
        return "";
    }
  };
  const getCurrentSlideListings = () => {
    const start = currentSlide * ITEMS_PER_SLIDE;
    return filteredListings.slice(start, start + ITEMS_PER_SLIDE);
  };
  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % totalSlides);
  };
  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + totalSlides) % totalSlides);
  };
  if (loading) {
    return <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <p className="text-muted-foreground">Loading marketplace...</p>
      </div>;
  }
  return <div className="min-h-screen bg-muted/30">
      <Navigation />
      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Micro Ad Space</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Your central hub for activating micro advertising spaces.</p>
          {!user && <p className="text-sm text-muted-foreground mt-2">
              <Button variant="link" onClick={() => navigate("/auth")} className="p-0 h-auto">
                Log in
              </Button>
              {" "}to make transactions
            </p>}
        </div>

        {/* Search & Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
            <CardDescription>Find the perfect advertising opportunity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search listings..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
              </div>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="advertiser">Advertiser</SelectItem>
                  <SelectItem value="venue">Venue</SelectItem>
                  <SelectItem value="digital">Digital</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                </SelectContent>
              </Select>

              <Select value={listingTypeFilter} onValueChange={setListingTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Listing Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Listings</SelectItem>
                  <SelectItem value="buying">Buying</SelectItem>
                  <SelectItem value="selling">Selling</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-muted-foreground">
            Showing {filteredListings.length} approved listings
            {totalSlides > 1 && ` • Slide ${currentSlide + 1} of ${totalSlides}`}
          </p>
          <Button variant="outline" onClick={() => navigate("/explore-all")}>
            View All Listings
          </Button>
        </div>

        {/* Carousel Navigation */}
        {totalSlides > 1 && <div className="flex items-center justify-center gap-4 mb-6">
            <Button variant="outline" size="icon" onClick={prevSlide}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex gap-2">
              {Array.from({
            length: totalSlides
          }).map((_, idx) => <button key={idx} onClick={() => setCurrentSlide(idx)} className={`w-2 h-2 rounded-full transition-colors ${idx === currentSlide ? "bg-primary" : "bg-muted-foreground/30"}`} />)}
            </div>
            <Button variant="outline" size="icon" onClick={nextSlide}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>}

        {/* Listings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {getCurrentSlideListings().length === 0 ? <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">No approved listings found matching your criteria</p>
            </div> : getCurrentSlideListings().map(listing => {
          const CategoryIcon = getCategoryIcon(listing.category);
          return <Card key={`${listing.category}-${listing.id}`} className="hover:shadow-lg transition-shadow overflow-hidden cursor-pointer" onClick={() => handleListingClick(listing)}>
                  {listing.image && <div className="relative h-48 w-full overflow-hidden">
                      <img src={listing.image} alt={listing.title} className="w-full h-full object-cover transition-transform hover:scale-105" />
                    </div>}
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2 gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${getCategoryBadgeColor(listing.category)}`}>
                          <CategoryIcon className="h-4 w-4" />
                        </div>
                        <CardTitle className="text-lg line-clamp-1">{listing.title}</CardTitle>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <Badge variant="secondary" className="capitalize">
                        {listing.type}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {listing.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{listing.location}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-primary" />
                      <span className="font-semibold">
                        {formatBudget(listing.budget, listing.currency)}
                      </span>
                    </div>

                    {listing.category === "venue" && (listing.weeklyPrice || listing.monthlyPrice) ? (
                      <div className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">
                        {listing.weeklyPrice > 0 && (
                          <span><span className="font-medium">Weekly:</span> ${listing.weeklyPrice}/wk</span>
                        )}
                        {listing.weeklyPrice > 0 && listing.monthlyPrice > 0 && " | "}
                        {listing.monthlyPrice > 0 && (
                          <span><span className="font-medium">Monthly:</span> ${listing.monthlyPrice}/mo</span>
                        )}
                      </div>
                    ) : null}

                    {listing.adUnits.length > 0 && <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground mb-2">Ad Units</p>
                        <div className="flex flex-wrap gap-1">
                          {listing.adUnits.slice(0, 3).map(unit => <Badge key={unit} variant="outline" className="text-xs">
                              {unit}
                            </Badge>)}
                          {listing.adUnits.length > 3 && <Badge variant="outline" className="text-xs">
                              +{listing.adUnits.length - 3} more
                            </Badge>}
                        </div>
                      </div>}

                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground mb-1">
                        {listing.listingType === "buying" ? "Advertiser" : "Publisher"}
                      </p>
                      <p className="text-sm font-medium">{listing.ownerName}</p>
                    </div>

                    <Button className="w-full mt-4">
                      {user ? "View Details" : "Log in to View"}
                    </Button>
                  </CardContent>
                </Card>;
        })}
        </div>

      </div>
      <Footer />
    </div>;
};
export default Marketplace;