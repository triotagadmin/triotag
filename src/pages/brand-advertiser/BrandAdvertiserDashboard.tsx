import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Megaphone, CheckCircle2, Wallet, Clock } from "lucide-react";
import { format } from "date-fns";
import BrandCampaignWizard from "@/components/brand-advertiser/BrandCampaignWizard";

export default function BrandAdvertiserDashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [wizardOpen, setWizardOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { setLoading(false); return; }

    let { data: profile } = await supabase
      .from("brand_advertiser_profiles")
      .select("id")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (!profile) {
      const { data: created } = await supabase
        .from("brand_advertiser_profiles")
        .insert({
          user_id: session.user.id,
          contact_email: session.user.email,
          verified: true,
        })
        .select("id")
        .single();
      profile = created;
    }

    if (!profile) { setLoading(false); return; }
    setProfileId(profile.id);

    const { data: camps } = await supabase
      .from("brand_campaigns")
      .select("*")
      .eq("brand_advertiser_id", profile.id)
      .order("created_at", { ascending: false });
    setCampaigns(camps || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const total = campaigns.length;
  const active = campaigns.filter(c => c.status === "active").length;
  const pending = campaigns.filter(c => c.status === "pending_review").length;
  const totalBudget = campaigns.reduce((s, c) => s + Number(c.budget || 0), 0);

  const stats = [
    { label: "Total Campaigns", value: total, icon: Megaphone, color: "text-blue-600 bg-blue-50" },
    { label: "Active Campaigns", value: active, icon: CheckCircle2, color: "text-green-600 bg-green-50" },
    { label: "Total Budget Committed", value: `₱${totalBudget.toLocaleString()}`, icon: Wallet, color: "text-purple-600 bg-purple-50" },
    { label: "Pending Review", value: pending, icon: Clock, color: "text-amber-600 bg-amber-50" },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Brand Advertiser Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Plan, launch, and track programmatic campaigns.</p>
          </div>
          <Button
            onClick={() => setWizardOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" /> New Campaign
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.label} className="border border-gray-200">
                <CardContent className="p-4">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${s.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="text-xs text-gray-500">{s.label}</div>
                  <div className="text-xl font-bold text-gray-900 mt-1">{s.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Campaigns</h2>
        </div>

        {loading ? (
          <div className="text-gray-500 text-sm">Loading...</div>
        ) : campaigns.length === 0 ? (
          <Card className="border-dashed border-2 border-gray-200">
            <CardContent className="py-12 text-center">
              <Megaphone className="w-10 h-10 mx-auto text-gray-300 mb-3" />
              <div className="text-gray-700 font-medium">No campaigns yet</div>
              <p className="text-sm text-gray-500 mt-1 mb-4">Launch your first programmatic campaign in minutes.</p>
              <Button onClick={() => setWizardOpen(true)} className="bg-green-600 hover:bg-green-700 text-white">
                <Plus className="w-4 h-4 mr-2" /> Create Your First Campaign
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {campaigns.map((c) => (
              <Card key={c.id} className="border border-gray-200 hover:border-green-300 transition-colors">
                <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="font-semibold text-gray-900">{c.campaign_name}</div>
                      <Badge
                        variant="outline"
                        className={
                          c.status === "active" ? "bg-green-50 text-green-700 border-green-200" :
                          c.status === "pending_review" ? "bg-amber-50 text-amber-700 border-amber-200" :
                          "bg-gray-50 text-gray-700 border-gray-200"
                        }
                      >
                        {String(c.status).replace("_", " ")}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500">
                      {c.start_date && c.end_date
                        ? `${format(new Date(c.start_date), "MMM d, yyyy")} – ${format(new Date(c.end_date), "MMM d, yyyy")}`
                        : "Dates TBD"}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(c.environments || []).map((env: string) => (
                        <span key={env} className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">{env}</span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Budget</div>
                    <div className="font-bold text-gray-900">₱{Number(c.budget).toLocaleString()}</div>
                  </div>
                  <Button variant="outline" size="sm">View</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {profileId && (
        <BrandCampaignWizard
          open={wizardOpen}
          onOpenChange={setWizardOpen}
          brandAdvertiserId={profileId}
          onCreated={() => { fetchData(); toast({ title: "Campaign submitted", description: "Our team will reach out to confirm activation." }); }}
        />
      )}
    </div>
  );
}
