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
import { Link, useNavigate } from "react-router-dom";

interface UnifiedListing {
  id: string;
  type: 'venue' | 'agent_service';
  title: string;
  description: string;
  location: string;
  image?: string;
  publisher_name?: string;
  created_at: string;
  venue_type?: string;
  weekly_price?: number;
  monthly_price?: number;
}

const ExploreAll = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [listings, setListings] = useState<UnifiedListing[]>([]);
  const [filteredListings, setFilteredListings] = useState<UnifiedListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");

  useEffect(() => {
    fetchAllListings();
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
        .order('created_at', { ascending: false });

      // Fetch approved agent services (selling listings)
      const { data: servicesData } = await supabase
        .from('agent_services')
        .select(`*, publisher_profiles_public(business_name)`)
        .eq('approval_status', 'approved')
        .order('created_at', { ascending: false });

      // Transform all data into unified format (only selling listings)
      const unifiedListings: UnifiedListing[] = [
        ...(venuesData || []).map(v => ({
          id: v.id,
          type: 'venue' as const,
          title: v.title,
          description: v.description || '',
          location: v.location || 'N/A',
          image: (v.media_urls as any)?.[0],
          publisher_name: (v.publisher_profiles_public as any)?.business_name,
          created_at: v.created_at || '',
          venue_type: (v.specifications as any)?.venue_type || (v.specifications as any)?.type || 'Venue',
          weekly_price: (v.pricing as any)?.weekly,
          monthly_price: (v.pricing as any)?.monthly,
        })),
        ...(servicesData || []).map(s => ({
          id: s.id,
          type: 'agent_service' as const,
          title: s.title,
          description: s.description || '',
          location: s.location || 'N/A',
          image: (s.media_urls as any)?.[0],
          publisher_name: (s.publisher_profiles_public as any)?.business_name,
          created_at: s.created_at || '',
          venue_type: s.service_type || 'Service',
          weekly_price: (s.pricing as any)?.weekly,
          monthly_price: (s.pricing as any)?.monthly,
        }))
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <SelectItem value="venue">Venues</SelectItem>
                  <SelectItem value="agent_service">Agent Services</SelectItem>
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
            <Card 
              key={listing.id} 
              className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => {
                if (listing.type === 'venue') {
                  navigate(`/venue/${listing.id}`);
                } else {
                  toast({
                    title: "Service Details",
                    description: `Viewing ${listing.title}`
                  });
                }
              }}
            >
              {listing.image && (
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
                  {listing.publisher_name && (
                    <Badge variant="outline">{listing.publisher_name}</Badge>
                  )}
                </div>
                <CardTitle className="text-xl">{listing.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {listing.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {listing.location}
                  </div>
                  {(listing.weekly_price || listing.monthly_price) && (
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
                <Button className="w-full mt-4">View Details</Button>
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
