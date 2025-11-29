import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Flame } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Navigation } from "@/components/Navigation";

interface Campaign {
  id: string;
  name: string;
  budget: number;
  startDate: string;
  endDate: string;
  impressions: number;
  clicks: number;
  conversions: number;
  activeDates: string[];
  createdAt: string;
}

const HabitTracker = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [newCampaignName, setNewCampaignName] = useState("");
  const [newBudget, setNewBudget] = useState("");
  const [newStartDate, setNewStartDate] = useState("");
  const [newEndDate, setNewEndDate] = useState("");
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const { toast } = useToast();
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const stored = localStorage.getItem("campaigns");
    if (stored) {
      setCampaigns(JSON.parse(stored));
    }

    // PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("campaigns", JSON.stringify(campaigns));
  }, [campaigns]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      toast({
        title: "App Installed!",
        description: "AI Adstreem has been added to your home screen",
      });
    }
    
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const addCampaign = () => {
    if (!newCampaignName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a campaign name",
        variant: "destructive",
      });
      return;
    }

    if (!newBudget || !newStartDate || !newEndDate) {
      toast({
        title: "Error",
        description: "Please fill in all campaign details",
        variant: "destructive",
      });
      return;
    }

    const newCampaign: Campaign = {
      id: Date.now().toString(),
      name: newCampaignName.trim(),
      budget: parseFloat(newBudget),
      startDate: newStartDate,
      endDate: newEndDate,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      activeDates: [],
      createdAt: new Date().toISOString(),
    };

    setCampaigns([...campaigns, newCampaign]);
    setNewCampaignName("");
    setNewBudget("");
    setNewStartDate("");
    setNewEndDate("");
    toast({
      title: "Campaign Added",
      description: "Your ad campaign has been created",
    });
  };

  const deleteCampaign = (id: string) => {
    setCampaigns(campaigns.filter((c) => c.id !== id));
    toast({
      title: "Removed",
      description: "Campaign removed",
    });
  };

  const toggleCampaignActive = (id: string) => {
    setCampaigns(
      campaigns.map((campaign) => {
        if (campaign.id === id) {
          const isActive = campaign.activeDates.includes(today);
          return {
            ...campaign,
            activeDates: isActive
              ? campaign.activeDates.filter((date) => date !== today)
              : [...campaign.activeDates, today],
          };
        }
        return campaign;
      })
    );
  };

  const updateCampaignMetrics = (id: string, field: 'impressions' | 'clicks' | 'conversions', value: number) => {
    setCampaigns(
      campaigns.map((campaign) => {
        if (campaign.id === id) {
          return {
            ...campaign,
            [field]: value,
          };
        }
        return campaign;
      })
    );
  };

  const calculateActiveStreak = (activeDates: string[]) => {
    if (activeDates.length === 0) return 0;

    const sortedDates = [...activeDates].sort().reverse();
    let streak = 0;
    let currentDate = new Date();

    for (const dateStr of sortedDates) {
      const date = new Date(dateStr);
      const diffDays = Math.floor(
        (currentDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === streak) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  const calculateCTR = (clicks: number, impressions: number) => {
    if (impressions === 0) return 0;
    return ((clicks / impressions) * 100).toFixed(2);
  };

  const calculateConversionRate = (conversions: number, clicks: number) => {
    if (clicks === 0) return 0;
    return ((conversions / clicks) * 100).toFixed(2);
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-accent/30 py-8 px-4">
        <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-3">
            AI Adstreem
          </h1>
          <p className="text-xl text-foreground font-medium">
            Choose Your Own Ads, Power Your Experience
          </p>
          <p className="text-muted-foreground mt-2 mb-6">
            Take control of your advertising experience with AI-powered personalization
          </p>
          
          {/* App Store Buttons */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <a 
              href="https://play.google.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block transition-transform hover:scale-105"
            >
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" 
                alt="Get it on Google Play" 
                className="h-14"
              />
            </a>
            <a 
              href="https://apps.apple.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block transition-transform hover:scale-105"
            >
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" 
                alt="Download on the App Store" 
                className="h-14"
              />
            </a>
          </div>
        </div>

        {/* Add Campaign Section */}
        <Card className="p-6 mb-6 bg-card/95 backdrop-blur-xl border-primary/30 shadow-xl shadow-primary/10">
          <h3 className="text-2xl font-bold text-foreground mb-4 text-center">
            Campaign Tracker
          </h3>
          <div className="space-y-3 mb-3">
            <Input
              placeholder="Campaign name..."
              value={newCampaignName}
              onChange={(e) => setNewCampaignName(e.target.value)}
              className="border-accent/40 focus:border-primary"
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                placeholder="Budget ($)"
                value={newBudget}
                onChange={(e) => setNewBudget(e.target.value)}
                className="border-accent/40 focus:border-primary"
              />
              <Input
                type="date"
                placeholder="Start Date"
                value={newStartDate}
                onChange={(e) => setNewStartDate(e.target.value)}
                className="border-accent/40 focus:border-primary"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="date"
                placeholder="End Date"
                value={newEndDate}
                onChange={(e) => setNewEndDate(e.target.value)}
                className="border-accent/40 focus:border-primary"
              />
              <Button onClick={addCampaign} className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Campaign
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Track your advertising campaigns, one day at a time
          </p>
        </Card>

        {/* Campaigns List */}
        {campaigns.length === 0 ? (
          <Card className="p-12 text-center bg-card/95 backdrop-blur-xl border-accent/20">
            <div className="max-w-md mx-auto">
              <p className="text-foreground text-lg font-medium mb-2">
                No campaigns yet
              </p>
              <p className="text-muted-foreground">
                Start tracking your ad campaigns! Add your first campaign above to monitor performance.
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {campaigns.map((campaign) => {
              const isActiveToday = campaign.activeDates.includes(today);
              const streak = calculateActiveStreak(campaign.activeDates);
              const ctr = calculateCTR(campaign.clicks, campaign.impressions);
              const conversionRate = calculateConversionRate(campaign.conversions, campaign.clicks);

              return (
                <Card
                  key={campaign.id}
                  className={`p-6 transition-all bg-card/95 backdrop-blur-xl ${
                    isActiveToday
                      ? "bg-gradient-to-br from-primary/20 to-accent/20 border-primary shadow-xl shadow-primary/20 scale-[1.02]"
                      : "border-accent/20 hover:border-primary/50 hover:shadow-lg hover:scale-[1.01]"
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <Checkbox
                          checked={isActiveToday}
                          onCheckedChange={() => toggleCampaignActive(campaign.id)}
                          className="w-6 h-6"
                        />
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-foreground">
                            {campaign.name}
                          </h3>
                          <div className="flex items-center gap-4 mt-1 text-sm">
                            <span className="text-muted-foreground">
                              ${campaign.budget.toLocaleString()} budget
                            </span>
                            <span className="text-muted-foreground">
                              {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Flame className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium text-primary">
                              {streak} day active streak
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteCampaign(campaign.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Campaign Metrics */}
                    <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border/50">
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Impressions</label>
                        <Input
                          type="number"
                          value={campaign.impressions}
                          onChange={(e) => updateCampaignMetrics(campaign.id, 'impressions', parseInt(e.target.value) || 0)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Clicks</label>
                        <Input
                          type="number"
                          value={campaign.clicks}
                          onChange={(e) => updateCampaignMetrics(campaign.id, 'clicks', parseInt(e.target.value) || 0)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Conversions</label>
                        <Input
                          type="number"
                          value={campaign.conversions}
                          onChange={(e) => updateCampaignMetrics(campaign.id, 'conversions', parseInt(e.target.value) || 0)}
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>

                    {/* Performance Metrics */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="text-center p-2 rounded-lg bg-primary/10 border border-primary/20">
                        <p className="text-lg font-bold text-primary">{ctr}%</p>
                        <p className="text-xs text-muted-foreground">CTR</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-accent/10 border border-accent/20">
                        <p className="text-lg font-bold text-accent">{conversionRate}%</p>
                        <p className="text-xs text-muted-foreground">Conversion Rate</p>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Stats Section */}
        {campaigns.length > 0 && (
          <Card className="mt-8 p-6 bg-gradient-to-br from-card/95 to-primary/5 backdrop-blur-xl border-primary/30 shadow-xl">
            <h3 className="text-xl font-semibold text-primary mb-4">
              Today's Campaign Performance
            </h3>
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center p-4 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-4xl font-bold text-primary">
                  {campaigns.filter((c) => c.activeDates.includes(today)).length}
                </p>
                <p className="text-sm text-muted-foreground font-medium mt-1">Active Today</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-accent/10 border border-accent/20">
                <p className="text-4xl font-bold text-accent">
                  {campaigns.length}
                </p>
                <p className="text-sm text-muted-foreground font-medium mt-1">Total Campaigns</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
                <p className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {campaigns.length > 0 ? Math.round(
                    (campaigns.filter((c) => c.activeDates.includes(today))
                      .length /
                      campaigns.length) *
                      100
                  ) : 0}
                  %
                </p>
                <p className="text-sm text-muted-foreground font-medium mt-1">Active Rate</p>
              </div>
            </div>
          </Card>
        )}

        {/* PWA Install Floating Button */}
        {showInstallPrompt && (
          <Button
            onClick={handleInstallClick}
            className="fixed bottom-6 right-6 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all shadow-2xl shadow-primary/30 z-50 rounded-full h-14 px-6"
          >
            <Plus className="w-5 h-5 mr-2" />
            Install App
          </Button>
        )}
        </div>
      </div>
    </>
  );
};

export default HabitTracker;
