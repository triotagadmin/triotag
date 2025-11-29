import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, DollarSign, Calendar, Users } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import campaignFitnessImg from "@/assets/campaign-fitness-brand.jpg";
import campaignTechImg from "@/assets/campaign-tech-launch.jpg";
import campaignInfluencerImg from "@/assets/campaign-influencer-hiring.jpg";

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
  creative_assets: {
    images?: string[];
    videos?: string[];
    description?: string;
  } | null;
  advertiser_profiles: {
    company_name: string;
  };
}

const VenueExplore = () => {
  const mockCampaigns: Campaign[] = [
    {
      id: "1",
      campaign_name: "Summer Music Festival 2025",
      campaign_description: "Massive 3-day outdoor music festival featuring top international artists across multiple genres. Seeking high-traffic venue partnerships for pre-event promotion and ticket sales activation.",
      budget_amount: 35000,
      budget_currency: "USD",
      start_date: "2025-06-01",
      end_date: "2025-08-15",
      location: "New York, Los Angeles, Chicago",
      campaign_type: "Event Promotion",
      target_audience: "Music lovers 18-35, festival-goers, live entertainment enthusiasts",
      creative_assets: {
        images: [campaignFitnessImg],
        description: "Dynamic festival imagery and artist lineup graphics"
      },
      advertiser_profiles: {
        company_name: "LiveNation Events"
      }
    },
    {
      id: "2",
      campaign_name: "Tech Innovation Conference 2025",
      campaign_description: "Premier technology conference bringing together industry leaders, innovators, and startups. Looking for venue advertising to drive conference registrations and sponsorship visibility.",
      budget_amount: 28000,
      budget_currency: "USD",
      start_date: "2025-07-15",
      end_date: "2025-09-30",
      location: "San Francisco, Seattle, Austin",
      campaign_type: "Event Promotion",
      target_audience: "Tech professionals, entrepreneurs, investors, innovation enthusiasts 25-55",
      creative_assets: {
        images: [campaignTechImg],
        description: "Professional conference branding and speaker highlights"
      },
      advertiser_profiles: {
        company_name: "Summit Conferences Inc"
      }
    },
    {
      id: "3",
      campaign_name: "Food & Wine Festival Tour",
      campaign_description: "Multi-city culinary event series featuring celebrity chefs, wine tastings, and cooking demonstrations. Seeking venue advertising partnerships to maximize local event awareness and ticket sales.",
      budget_amount: 18500,
      budget_currency: "USD",
      start_date: "2025-05-01",
      end_date: "2025-10-31",
      location: "Miami, Boston, Denver, Portland",
      campaign_type: "Event Promotion",
      target_audience: "Foodies, wine enthusiasts, culinary professionals 30-60",
      creative_assets: {
        images: [campaignInfluencerImg],
        description: "Elegant food and beverage event photography"
      },
      advertiser_profiles: {
        company_name: "Epicurean Events Group"
      }
    }
  ];

  const [campaigns] = useState<Campaign[]>(mockCampaigns);
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>(mockCampaigns);
  const [loading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [campaignTypeFilter, setCampaignTypeFilter] = useState("all");
  const [budgetFilter, setBudgetFilter] = useState("all");

  useEffect(() => {
    applyFilters();
  }, [searchTerm, locationFilter, campaignTypeFilter, budgetFilter]);

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
              <Card key={campaign.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                {campaign.creative_assets?.images?.[0] && (
                  <div className="relative h-48 w-full overflow-hidden">
                    <img
                      src={campaign.creative_assets.images[0]}
                      alt={campaign.campaign_name}
                      className="w-full h-full object-cover transition-transform hover:scale-105"
                    />
                  </div>
                )}
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