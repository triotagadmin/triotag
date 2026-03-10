import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, ArrowLeft } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { User } from "@supabase/supabase-js";

interface UnifiedListing {
  id: string;
  type: 'venue' | 'agent_service' | 'franchise';
  title: string;
  description: string;
  location: string;
  image?: string;
  publisher_name?: string;
  created_at: string;
  venue_type?: string;
  weekly_price?: number;
  monthly_price?: number;
  city_count?: { city: string; count: number }[];
}

const ExploreAll = () => {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [listings, setListings] = useState<UnifiedListing[]>([]);
  const [filteredListings, setFilteredListings] = useState<UnifiedListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");

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
  }, [listings, searchTerm, typeFilter, locationFilter]);

  const fetchAllListings = async () => {
    try {
      setLoading(true);

      // Fetch approved venues (selling listings)
      const { data: venuesData } = await supabase
        .from('ad_spaces')
        .select(`*, publisher_profiles_public(business_name)`)
        .eq('approval_status', 'approved')
        .eq('availability_status', 'available')
        .order('created_at', { ascending: false });

      // Fetch approved agent services (selling listings)
      const { data: servicesData } = await supabase
        .from('agent_services')
        .select(`*, publisher_profiles_public(business_name)`)
        .eq('approval_status', 'approved')
        .order('created_at', { ascending: false });

      // Fetch franchise listings with active marketplace status and ad-space-listed branches
      const { data: franchiseData } = await supabase
        .from('advertiser_franchises')
        .select('id, franchise_name, marketplace_status, created_at')
        .eq('marketplace_status', 'active');

      // Fetch branches marked as ad space listings
      const { data: branchData } = await supabase
        .from('advertiser_branches')
        .select('advertiser_franchise_id, city, is_ad_space_listing')
        .eq('is_ad_space_listing', true);

      // Group branches by franchise and city
      const franchiseListings: UnifiedListing[] = (franchiseData || []).map(f => {
        const fBranches = (branchData || []).filter(b => b.advertiser_franchise_id === f.id);
        const cityMap = new Map<string, number>();
        fBranches.forEach(b => {
          const city = b.city || 'Unknown';
          cityMap.set(city, (cityMap.get(city) || 0) + 1);
        });
        const cityCount = Array.from(cityMap.entries()).map(([city, count]) => ({ city, count }));
        return {
          id: f.id,
          type: 'franchise' as const,
          title: f.franchise_name,
          description: cityCount.map(c => `${c.city}: ${c.count} Ad Space${c.count !== 1 ? 's' : ''}`).join(' · ') || 'No locations listed',
          location: cityCount.map(c => c.city).join(', ') || 'N/A',
          created_at: f.created_at,
          venue_type: 'Franchise',
          city_count: cityCount,
        };
      }).filter(f => f.city_count && f.city_count.length > 0);

      // Determine auth state for data stripping
      const { data: { session } } = await supabase.auth.getSession();
      const isAuthenticated = !!session;

      // Transform all data into unified format (only selling listings)
      const unifiedListings: UnifiedListing[] = [
        ...(venuesData || []).map(v => ({
          id: v.id,
          type: 'venue' as const,
          title: v.title,
          description: isAuthenticated ? (v.description || '') : '',
          location: v.location || 'N/A',
          image: isAuthenticated ? (v.media_urls as any)?.[0] : undefined,
          publisher_name: isAuthenticated ? (v.publisher_profiles_public as any)?.business_name : undefined,
          created_at: v.created_at || '',
          venue_type: (v.specifications as any)?.venue_type || (v.specifications as any)?.type || 'Venue',
          weekly_price: isAuthenticated ? (v.pricing as any)?.weekly : undefined,
          monthly_price: isAuthenticated ? (v.pricing as any)?.monthly : undefined,
        })),
        ...(servicesData || []).map(s => ({
          id: s.id,
          type: 'agent_service' as const,
          title: s.title,
          description: isAuthenticated ? (s.description || '') : '',
          location: s.location || 'N/A',
          image: isAuthenticated ? (s.media_urls as any)?.[0] : undefined,
          publisher_name: isAuthenticated ? (s.publisher_profiles_public as any)?.business_name : undefined,
          created_at: s.created_at || '',
          venue_type: s.service_type || 'Service',
          weekly_price: isAuthenticated ? (s.pricing as any)?.weekly : undefined,
          monthly_price: isAuthenticated ? (s.pricing as any)?.monthly : undefined,
        })),
        ...franchiseListings,
      ];

      // Sort by created_at
      unifiedListings.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setListings(unifiedListings);
      setFilteredListings(unifiedListings);
    } catch (error) {
      console.error('Error fetching listings:', error);
      toast({
        title: "Error",
        description: "Failed to load listings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = listings;

    if (searchTerm) {
      filtered = filtered.filter(l =>
        l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter(l => l.type === typeFilter);
    }

    if (locationFilter !== "all") {
      filtered = filtered.filter(l => l.location === locationFilter);
    }

    setFilteredListings(filtered);
  };

  const getTypeBadge = (venueType: string) => {
    return <Badge variant="secondary">{venueType}</Badge>;
  };

  const uniqueLocations = [...new Set(listings.map(l => l.location).filter(Boolean))];

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Navigation />
      <div className="container mx-auto px-6 py-12">
        <div className="mb-8">
          <Link to="/explore" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Featured
          </Link>
          <h1 className="text-4xl font-bold mb-4">All Approved Listings</h1>
          <p className="text-xl text-muted-foreground">
            Browse all venues and agent services
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
            <CardDescription>Find the perfect opportunity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="venue">Ad Spaces</SelectItem>
                  <SelectItem value="agent_service">Agent Services</SelectItem>
                  <SelectItem value="franchise">Franchise Locations</SelectItem>
                </SelectContent>
              </Select>

              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {uniqueLocations.map((loc) => (
                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredListings.map((listing) => (
            <Card key={listing.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {user && listing.image && (
                <div className="aspect-video bg-muted overflow-hidden">
                  <img
                    src={listing.image}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  {getTypeBadge(listing.venue_type || 'Venue')}
                  {user && listing.publisher_name && (
                    <Badge variant="outline">{listing.publisher_name}</Badge>
                  )}
                </div>
                <CardTitle className="text-xl">{listing.title}</CardTitle>
                {user && listing.description && (
                  <CardDescription className="line-clamp-2">
                    {listing.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {(() => { const p = (listing.location || "").split(",").map(s => s.trim()).filter(Boolean); return p.length >= 2 ? p.slice(-2).join(", ") : p[p.length - 1] || "—"; })()}
                  </div>
                  {listing.type === 'franchise' && listing.city_count && listing.city_count.length > 0 && (
                    <div className="pt-2 border-t mt-2 space-y-1">
                      {listing.city_count.map(cc => (
                        <p key={cc.city} className="text-sm">
                          {cc.city}: <span className="text-primary font-medium">{cc.count} Ad Space{cc.count !== 1 ? 's' : ''} Available</span>
                        </p>
                      ))}
                    </div>
                  )}
                  {user && listing.type !== 'franchise' && (listing.weekly_price || listing.monthly_price) && (
                    <div className="pt-2 border-t mt-2 space-y-1">
                      {listing.weekly_price && (
                        <p className="text-sm font-medium">
                          Weekly: <span className="text-primary">${listing.weekly_price}</span>
                        </p>
                      )}
                      {listing.monthly_price && (
                        <p className="text-sm font-medium">
                          Monthly: <span className="text-primary">${listing.monthly_price}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredListings.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No listings found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExploreAll;
