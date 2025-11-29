import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, DollarSign, Calendar, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Navigation } from "@/components/Navigation";

interface Campaign {
  id: string;
  campaign_name: string;
  campaign_description: string;
  budget_amount: number;
  budget_currency: string;
  start_date: string;
  end_date: string;
  location: string;
  campaign_type: string;
  target_audience: string;
  advertiser_profiles: {
    company_name: string;
  };
}

const VenueExplore = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [campaignTypeFilter, setCampaignTypeFilter] = useState("all");
  const [budgetFilter, setBudgetFilter] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchCampaigns();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [campaigns, searchTerm, locationFilter, campaignTypeFilter, budgetFilter]);

  const fetchCampaigns = async () => {
    try {
      // First, get all admin user IDs
      const { data: adminUsers, error: adminError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      if (adminError) throw adminError;

      const adminUserIds = adminUsers?.map(u => u.user_id) || [];

      if (adminUserIds.length === 0) {
        setCampaigns([]);
        setLoading(false);
        return;
      }

      // Get advertiser profiles for admin users
      const { data: adminAdvertisers, error: advertiserError } = await supabase
        .from("advertiser_profiles")
        .select("id")
        .in("user_id", adminUserIds);

      if (advertiserError) throw advertiserError;

      const adminAdvertiserIds = adminAdvertisers?.map(a => a.id) || [];

      if (adminAdvertiserIds.length === 0) {
        setCampaigns([]);
        setLoading(false);
        return;
      }

      // Fetch campaigns from admin advertisers only
      const { data, error } = await supabase
        .from("campaigns")
        .select(`
          *,
          advertiser_profiles (
            company_name
          )
        `)
        .eq("status", "approved")
        .in("advertiser_id", adminAdvertiserIds)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load campaigns",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = campaigns;

    if (searchTerm) {
      filtered = filtered.filter(
        (c) =>
          c.campaign_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.campaign_description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (locationFilter !== "all") {
      filtered = filtered.filter((c) => c.location === locationFilter);
    }

    if (campaignTypeFilter !== "all") {
      filtered = filtered.filter((c) => c.campaign_type === campaignTypeFilter);
    }

    if (budgetFilter !== "all") {
      filtered = filtered.filter((c) => {
        const budget = c.budget_amount || 0;
        if (budgetFilter === "low") return budget < 1000;
        if (budgetFilter === "medium") return budget >= 1000 && budget < 5000;
        if (budgetFilter === "high") return budget >= 5000;
        return true;
      });
    }

    setFilteredCampaigns(filtered);
  };

  const formatBudget = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(amount);
  };

  const calculateDuration = (start: string, end: string) => {
    if (!start || !end) return "N/A";
    const days = Math.ceil(
      (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)
    );
    return `${days} days`;
  };

  const uniqueLocations = [...new Set(campaigns.map((c) => c.location).filter(Boolean))];
  const uniqueTypes = [...new Set(campaigns.map((c) => c.campaign_type).filter(Boolean))];

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <p className="text-muted-foreground">Loading campaigns...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Navigation />
      <div className="container mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Explore Featured Campaigns</h1>
          <p className="text-xl text-muted-foreground">
            Discover curated campaigns from verified advertisers
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
            <CardDescription>Find campaigns that match your venue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative lg:col-span-2">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search campaigns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {uniqueLocations.map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {loc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={campaignTypeFilter} onValueChange={setCampaignTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Campaign Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {uniqueTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={budgetFilter} onValueChange={setBudgetFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Budget Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Budgets</SelectItem>
                  <SelectItem value="low">Under $1,000</SelectItem>
                  <SelectItem value="medium">$1,000 - $5,000</SelectItem>
                  <SelectItem value="high">$5,000+</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaigns.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">No campaigns found matching your criteria</p>
            </div>
          ) : (
            filteredCampaigns.map((campaign) => (
              <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-lg">{campaign.campaign_name}</CardTitle>
                    {campaign.campaign_type && (
                      <Badge variant="secondary">{campaign.campaign_type}</Badge>
                    )}
                  </div>
                  <CardDescription className="line-clamp-2">
                    {campaign.campaign_description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{campaign.location || "Location not specified"}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <span className="font-semibold">
                      {formatBudget(campaign.budget_amount || 0, campaign.budget_currency)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{calculateDuration(campaign.start_date, campaign.end_date)}</span>
                  </div>

                  {campaign.target_audience && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span className="line-clamp-1">{campaign.target_audience}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-2">Advertiser</p>
                    <p className="text-sm font-medium">
                      {campaign.advertiser_profiles?.company_name || "N/A"}
                    </p>
                  </div>

                  <Button className="w-full mt-4">View Campaign Details</Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default VenueExplore;