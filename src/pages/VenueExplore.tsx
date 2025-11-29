import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, DollarSign, Calendar, Users } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import campaignNbaImg from "@/assets/campaign-nba-viewing-party.jpg";
import campaignBroadwayImg from "@/assets/campaign-broadway-musical.jpg";
import campaignComicConImg from "@/assets/campaign-comic-con.jpg";

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
  const { toast } = useToast();
  
  const mockCampaigns: Campaign[] = [
    {
      id: "mock-1",
      campaign_name: "NBA Championship Finals Viewing Party",
      campaign_description: "Major sporting event watch party series across multiple cities. Looking for bars, restaurants, and entertainment venues to host official viewing parties with exclusive branded merchandise and promotional giveaways.",
      budget_amount: 42000,
      budget_currency: "USD",
      start_date: "2025-06-01",
      end_date: "2025-06-20",
      location: "New York, Los Angeles, Chicago, Dallas",
      campaign_type: "Sporting Event",
      target_audience: "Sports fans 21-45, basketball enthusiasts, social groups seeking game day experiences",
      creative_assets: {
        images: [campaignNbaImg],
        description: "Dynamic sports action photography and fan engagement imagery"
      },
      advertiser_profiles: {
        company_name: "Premier Sports Marketing"
      }
    },
    {
      id: "mock-2",
      campaign_name: "Broadway Tour: The Modern Musical",
      campaign_description: "National touring production of award-winning Broadway musical. Seeking venue partnerships in metro stations, theaters, and cultural districts to promote ticket sales and show dates across 20 cities.",
      budget_amount: 38000,
      budget_currency: "USD",
      start_date: "2025-08-01",
      end_date: "2025-12-31",
      location: "Boston, Philadelphia, San Francisco, Seattle, Atlanta",
      campaign_type: "Theater & Entertainment",
      target_audience: "Theater enthusiasts 30-65, arts supporters, entertainment seekers, date night crowds",
      creative_assets: {
        images: [campaignBroadwayImg],
        description: "Stunning theatrical production photography and promotional materials"
      },
      advertiser_profiles: {
        company_name: "Broadway Touring Co."
      }
    },
    {
      id: "mock-3",
      campaign_name: "Comic Con International 2025",
      campaign_description: "Premier pop culture convention featuring celebrity guests, exclusive merchandise, cosplay competitions, and entertainment panels. Targeting high-traffic urban venues for maximum fan engagement and ticket sales.",
      budget_amount: 52000,
      budget_currency: "USD",
      start_date: "2025-07-01",
      end_date: "2025-09-15",
      location: "San Diego, New York, Orlando, Las Vegas",
      campaign_type: "Convention & Expo",
      target_audience: "Pop culture fans 16-40, gamers, comic book enthusiasts, cosplayers, collectors",
      creative_assets: {
        images: [campaignComicConImg],
        description: "Vibrant pop culture artwork and celebrity guest announcements"
      },
      advertiser_profiles: {
        company_name: "Pop Culture Events LLC"
      }
    },
    {
      id: "mock-4",
      campaign_name: "Summer Music Festival 2025",
      campaign_description: "Three-day outdoor music festival featuring top international artists across multiple genres. Seeking high-traffic urban locations for promotional campaigns including digital displays, poster placements, and experiential activations.",
      budget_amount: 65000,
      budget_currency: "USD",
      start_date: "2025-05-15",
      end_date: "2025-07-30",
      location: "Austin, Nashville, Portland, Denver",
      campaign_type: "Music Festival",
      target_audience: "Music lovers 18-35, festival enthusiasts, young professionals seeking live entertainment experiences",
      creative_assets: {
        images: [campaignNbaImg],
        description: "Vibrant festival atmosphere and artist lineup promotional materials"
      },
      advertiser_profiles: {
        company_name: "Live Nation Events"
      }
    },
    {
      id: "mock-5",
      campaign_name: "Charity Gala: Black Tie for Change",
      campaign_description: "Annual fundraising gala supporting children's education initiatives. Looking for upscale venues and high-end retail locations to promote ticket sales and corporate sponsorship opportunities with luxury brand positioning.",
      budget_amount: 28000,
      budget_currency: "USD",
      start_date: "2025-09-01",
      end_date: "2025-10-15",
      location: "Manhattan, Beverly Hills, Miami Beach",
      campaign_type: "Charity Event",
      target_audience: "Affluent donors 35-70, corporate executives, philanthropists, luxury lifestyle enthusiasts",
      creative_assets: {
        images: [campaignBroadwayImg],
        description: "Elegant black-tie event photography and impact storytelling visuals"
      },
      advertiser_profiles: {
        company_name: "Children's Future Foundation"
      }
    },
    {
      id: "mock-6",
      campaign_name: "International Food & Wine Expo",
      campaign_description: "Premier culinary showcase featuring celebrity chefs, wine tastings, and gourmet food vendors. Targeting foodie destinations, upscale restaurants, and lifestyle venues for promotional partnerships and ticket distribution.",
      budget_amount: 45000,
      budget_currency: "USD",
      start_date: "2025-10-01",
      end_date: "2025-11-30",
      location: "Napa Valley, Charleston, New Orleans, Chicago",
      campaign_type: "Food & Beverage Event",
      target_audience: "Food enthusiasts 28-55, wine connoisseurs, culinary professionals, affluent foodies",
      creative_assets: {
        images: [campaignComicConImg],
        description: "Mouth-watering culinary photography and chef celebrity imagery"
      },
      advertiser_profiles: {
        company_name: "Epicurean Events Group"
      }
    },
    {
      id: "mock-7",
      campaign_name: "Tech Innovation Summit 2025",
      campaign_description: "Global technology conference bringing together industry leaders, startups, and investors. Seeking tech hubs, coworking spaces, and innovation districts for targeted advertising and conference promotion.",
      budget_amount: 72000,
      budget_currency: "USD",
      start_date: "2025-03-15",
      end_date: "2025-05-30",
      location: "San Francisco, Seattle, Austin, Boston",
      campaign_type: "Conference & Summit",
      target_audience: "Tech professionals 25-50, entrepreneurs, investors, software developers, startup founders",
      creative_assets: {
        images: [campaignNbaImg],
        description: "Cutting-edge technology and innovation showcase visuals"
      },
      advertiser_profiles: {
        company_name: "TechWorld Conference Series"
      }
    },
    {
      id: "mock-8",
      campaign_name: "Marathon Championship Series",
      campaign_description: "Elite marathon racing series with qualifying events leading to championship final. Looking for fitness centers, sports retailers, and high-traffic running routes for athlete recruitment and spectator engagement campaigns.",
      budget_amount: 55000,
      budget_currency: "USD",
      start_date: "2025-04-01",
      end_date: "2025-10-31",
      location: "Boston, Chicago, New York, Los Angeles, Miami",
      campaign_type: "Sporting Event",
      target_audience: "Runners and athletes 20-50, fitness enthusiasts, health-conscious individuals, competitive sports fans",
      creative_assets: {
        images: [campaignBroadwayImg],
        description: "Athletic achievement and marathon action photography"
      },
      advertiser_profiles: {
        company_name: "Elite Running Association"
      }
    },
    {
      id: "mock-9",
      campaign_name: "Holiday Market & Crafts Fair",
      campaign_description: "Multi-city holiday shopping experience featuring local artisans, handmade goods, and seasonal entertainment. Seeking retail districts, community centers, and public spaces for promotional partnerships and event visibility.",
      budget_amount: 32000,
      budget_currency: "USD",
      start_date: "2025-11-01",
      end_date: "2025-12-24",
      location: "Portland, Minneapolis, Burlington, Asheville, Santa Fe",
      campaign_type: "Community Festival",
      target_audience: "Holiday shoppers 25-65, craft enthusiasts, families seeking unique gifts and festive experiences",
      creative_assets: {
        images: [campaignComicConImg],
        description: "Festive holiday market atmosphere and artisan craft photography"
      },
      advertiser_profiles: {
        company_name: "Holiday Markets Co."
      }
    },
    {
      id: "mock-10",
      campaign_name: "Classic Car Show & Auction",
      campaign_description: "Premium automotive exhibition featuring rare vintage vehicles, classic car auctions, and collector networking. Targeting affluent neighborhoods, luxury retail areas, and automotive enthusiast venues for high-end promotional campaigns.",
      budget_amount: 48000,
      budget_currency: "USD",
      start_date: "2025-06-15",
      end_date: "2025-08-30",
      location: "Monterey, Scottsdale, Greenwich, Palm Beach",
      campaign_type: "Auto Show",
      target_audience: "Car collectors 40-75, automotive enthusiasts, luxury lifestyle consumers, high-net-worth individuals",
      creative_assets: {
        images: [campaignNbaImg],
        description: "Stunning classic automobile photography and luxury lifestyle imagery"
      },
      advertiser_profiles: {
        company_name: "Classic Auto Collectors Association"
      }
    }
  ];
  
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [campaignTypeFilter, setCampaignTypeFilter] = useState("all");
  const [budgetFilter, setBudgetFilter] = useState("all");

  useEffect(() => {
    fetchCampaigns();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [campaigns, searchTerm, locationFilter, campaignTypeFilter, budgetFilter]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      
      // Fetch approved campaigns with advertiser profiles
      const { data: campaignsData, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          advertiser_profiles!inner(
            company_name,
            user_id
          )
        `)
        .eq('status', 'approved');

      if (error) throw error;

      // Filter campaigns where advertiser is an admin
      const campaignsWithAdminCheck = await Promise.all(
        (campaignsData || []).map(async (campaign) => {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', campaign.advertiser_profiles.user_id)
            .eq('role', 'admin')
            .single();

          return roleData ? campaign : null;
        })
      );

      const adminCampaigns = campaignsWithAdminCheck.filter((c): c is NonNullable<typeof c> => c !== null) as Campaign[];

      // Combine mock campaigns with real campaigns
      const allCampaigns = [...mockCampaigns, ...adminCampaigns];
      
      setCampaigns(allCampaigns);
      setFilteredCampaigns(allCampaigns);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast({
        title: "Error",
        description: "Failed to load campaigns. Please try again.",
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