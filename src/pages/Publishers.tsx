import { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Globe, Users, MapPin, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Publisher {
  id: string;
  business_name: string;
  publisher_type: "venue" | "digital" | "agent";
  location: string | null;
  verification_status: "pending" | "approved" | "rejected";
  description: string | null;
  agent_role: string | null;
  metrics: any;
}

const Publishers = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [filteredPublishers, setFilteredPublishers] = useState<Publisher[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>(searchParams.get("type") || "all");
  const [locationFilter, setLocationFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    fetchPublishers();
  }, []);

  useEffect(() => {
    const type = searchParams.get("type");
    if (type) {
      setTypeFilter(type);
    }
  }, [searchParams]);

  useEffect(() => {
    applyFilters();
  }, [publishers, searchQuery, typeFilter, locationFilter]);

  const fetchPublishers = async () => {
    try {
      // Fetch all approved publishers (no auth required to view)
      const { data, error } = await supabase
        .from("publisher_profiles")
        .select("*")
        .eq("verification_status", "approved")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPublishers(data || []);
    } catch (error) {
      console.error("Error fetching publishers:", error);
      toast({
        title: "Error",
        description: "Failed to load publishers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePublisherClick = (e: React.MouseEvent, publisherId: string) => {
    if (!isAuthenticated) {
      e.preventDefault();
      toast({
        title: "Authentication Required",
        description: "Please log in or sign up to view publisher details",
      });
      navigate("/auth");
    }
  };

  const applyFilters = () => {
    let filtered = [...publishers];

    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((p) => p.publisher_type === typeFilter);
    }

    if (locationFilter) {
      filtered = filtered.filter((p) =>
        p.location?.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    setFilteredPublishers(filtered);
  };

  const getPublisherIcon = (type: string) => {
    switch (type) {
      case "venue":
        return Building2;
      case "digital":
        return Globe;
      case "agent":
        return Users;
      default:
        return Building2;
    }
  };

  const getPublisherTypeLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1">
        {/* Header Section */}
        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto text-center space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold">Browse Publishers</h1>
              <p className="text-xl text-muted-foreground">
                Discover verified publishers ready to host your ad campaigns
              </p>
            </div>
          </div>
        </section>

        {/* Filters Section */}
        <section className="py-8 border-b">
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search publishers by name, location, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Publisher Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="venue">Venue</SelectItem>
                  <SelectItem value="digital">Digital</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Filter by location"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full md:w-[200px]"
              />
              {(searchQuery || typeFilter !== "all" || locationFilter) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setTypeFilter("all");
                    setLocationFilter("");
                    setSearchParams({});
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* Publishers Grid */}
        <section className="py-12">
          <div className="container mx-auto px-6">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading publishers...</p>
              </div>
            ) : filteredPublishers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No publishers found matching your criteria.</p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <p className="text-muted-foreground">
                    Showing {filteredPublishers.length} {filteredPublishers.length === 1 ? "publisher" : "publishers"}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPublishers.map((publisher) => {
                    const Icon = getPublisherIcon(publisher.publisher_type);
                    return (
                      <Link 
                        key={publisher.id} 
                        to={isAuthenticated ? `/publisher/${publisher.id}` : "#"}
                        onClick={(e) => handlePublisherClick(e, publisher.id)}
                      >
                        <Card className="h-full hover:shadow-lg transition-all cursor-pointer group">
                          <CardHeader>
                            <div className="flex items-start justify-between mb-2">
                              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Icon className="w-6 h-6 text-primary" />
                              </div>
                              <Badge variant="default">
                                Verified
                              </Badge>
                            </div>
                            <CardTitle className="text-xl group-hover:text-primary transition-colors">
                              {publisher.business_name}
                            </CardTitle>
                            <CardDescription>
                              <Badge variant="outline" className="mt-2">
                                {getPublisherTypeLabel(publisher.publisher_type)}
                              </Badge>
                              {publisher.agent_role && (
                                <Badge variant="outline" className="mt-2 ml-2">
                                  {publisher.agent_role}
                                </Badge>
                              )}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {publisher.location && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="w-4 h-4" />
                                <span>{publisher.location}</span>
                              </div>
                            )}
                            {publisher.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {publisher.description}
                              </p>
                            )}
                            {publisher.metrics && (
                              <div className="pt-2 border-t">
                                <p className="text-xs text-muted-foreground">
                                  View available ad spaces →
                                </p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Publishers;
