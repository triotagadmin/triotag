import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarIcon, Plus, Search } from "lucide-react";
import { format, subDays, eachDayOfInterval } from "date-fns";
import { Link } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import BrandCampaignWizard from "@/components/brand-advertiser/BrandCampaignWizard";
import BrandAdvertiserTopBar from "@/components/brand-advertiser/BrandAdvertiserTopBar";

function BrandAdvertiserDashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("My Brand");
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState<Date>(subDays(new Date(), 6));
  const [dateTo, setDateTo] = useState<Date>(new Date());

  const fetchData = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { setLoading(false); return; }

    let { data: profile } = await supabase
      .from("brand_advertiser_profiles")
      .select("id, company_name")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (!profile) {
      const { data: created } = await supabase
        .from("brand_advertiser_profiles")
        .insert({ user_id: session.user.id, contact_email: session.user.email, verified: true })
        .select("id, company_name")
        .single();
      profile = created;
    }
    if (!profile) { setLoading(false); return; }
    setProfileId(profile.id);
    setCompanyName(profile.company_name || session.user.email?.split("@")[0] || "My Brand");

    const { data: camps } = await supabase
      .from("brand_campaigns")
      .select("*")
      .eq("brand_advertiser_id", profile.id)
      .order("created_at", { ascending: false });
    setCampaigns(camps || []);

    const ids = (camps || []).map((c: any) => c.id);
    if (ids.length) {
      const { data: ledger } = await supabase
        .from("campaign_spend_ledger")
        .select("campaign_id, event_type, amount, created_at")
        .in("campaign_id", ids)
        .order("created_at", { ascending: false })
        .limit(5000);
      setSpendEvents(ledger || []);
    } else {
      setSpendEvents([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const totalBudget = campaigns.reduce((s, c) => s + Number(c.budget || 0), 0);

  const inRange = useMemo(
    () => spendEvents.filter((e) => {
      const d = new Date(e.created_at);
      return d >= dateFrom && d <= dateTo;
    }),
    [spendEvents, dateFrom, dateTo]
  );

  // Real delivery data derived from the campaign spend ledger.
  // Click/conversion tracking is not yet recorded, so those stay at zero.
  const impressions = inRange.filter((e) => e.event_type === "win").length;
  const spend = inRange
    .filter((e) => e.event_type === "billed")
    .reduce((s, e) => s + Number(e.amount || 0), 0);
  const clicks = 0;
  const conversions = 0;
  const ecpm = impressions > 0 ? (spend / impressions) * 1000 : 0;
  const ecpc = 0;
  const winRate = 0;
  const ctr = 0;
  const ecpa = 0;

  const chartData = useMemo(() => {
    const days = eachDayOfInterval({ start: dateFrom, end: dateTo });
    return days.map((d) => {
      const key = format(d, "yyyy-MM-dd");
      return {
        date: format(d, "MMM d"),
        impressions: inRange.filter(
          (e) => e.event_type === "win" && format(new Date(e.created_at), "yyyy-MM-dd") === key
        ).length,
        clicks: 0,
      };
    });
  }, [dateFrom, dateTo, inRange]);

  const filteredCampaigns = useMemo(
    () =>
      campaigns.filter((c) =>
        (c.campaign_name || "").toLowerCase().includes(search.toLowerCase())
      ),
    [campaigns, search]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <BrandAdvertiserTopBar companyName={companyName} totalBudget={totalBudget} />

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Overview</h1>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="bg-white">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {format(dateFrom, "d MMM, yyyy")} - {format(dateTo, "d MMM, yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 bg-white text-gray-900" align="end">
                <Calendar
                  mode="range"
                  selected={{ from: dateFrom, to: dateTo }}
                  onSelect={(r: any) => {
                    if (r?.from) setDateFrom(r.from);
                    if (r?.to) setDateTo(r.to);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Button onClick={() => setWizardOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-2" /> New Campaign
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-600 text-white rounded-xl p-6">
            <div className="text-sm opacity-80">Impressions</div>
            <div className="text-4xl font-bold mt-1">{impressions.toLocaleString()}</div>
            <div className="grid grid-cols-2 gap-4 mt-6 text-sm">
              <div>
                <div className="opacity-70">eCPM</div>
                <div className="font-semibold mt-0.5">₱{ecpm.toFixed(2)}</div>
              </div>
              <div>
                <div className="opacity-70">Win rate</div>
                <div className="font-semibold mt-0.5">{winRate.toFixed(2)}%</div>
              </div>
            </div>
          </div>

          <div className="bg-purple-600 text-white rounded-xl p-6">
            <div className="text-sm opacity-80">Clicks</div>
            <div className="text-4xl font-bold mt-1">{clicks.toLocaleString()}</div>
            <div className="grid grid-cols-2 gap-4 mt-6 text-sm">
              <div>
                <div className="opacity-70">eCPC</div>
                <div className="font-semibold mt-0.5">₱{ecpc.toFixed(2)}</div>
              </div>
              <div>
                <div className="opacity-70">CTR</div>
                <div className="font-semibold mt-0.5">{ctr.toFixed(2)}%</div>
              </div>
            </div>
          </div>

          <Card className="p-6 bg-white border border-gray-200">
            <div className="text-sm text-gray-500">Conversions</div>
            <div className="text-4xl font-bold mt-1 text-gray-900">{conversions.toLocaleString()}</div>
            <div className="grid grid-cols-2 gap-4 mt-6 text-sm">
              <div>
                <div className="text-gray-500">eCPA</div>
                <div className="font-semibold mt-0.5 text-gray-900">₱{ecpa.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-gray-500">Win rate</div>
                <div className="font-semibold mt-0.5 text-gray-900">{winRate.toFixed(2)}%</div>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-6 bg-white border border-gray-200 mb-6">
          <div className="text-sm font-semibold text-gray-900 mb-4">Performance</div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="impressions" stroke="#2563eb" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="clicks" stroke="#9333ea" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="bg-white border border-gray-200">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="text-sm font-semibold text-gray-900">Campaigns</div>
            <div className="relative w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search campaigns..."
                className="pl-9 h-9"
              />
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Bids</TableHead>
                <TableHead>Impressions</TableHead>
                <TableHead>Win rate</TableHead>
                <TableHead>Reach</TableHead>
                <TableHead>Clicks</TableHead>
                <TableHead>CTR</TableHead>
                <TableHead>CPM</TableHead>
                <TableHead>Spent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={10} className="text-center text-gray-500 py-8">Loading...</TableCell></TableRow>
              ) : filteredCampaigns.length === 0 ? (
                <TableRow><TableCell colSpan={10} className="text-center text-gray-500 py-8">No campaigns yet</TableCell></TableRow>
              ) : (
                filteredCampaigns.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs">{String(c.id).slice(0, 8)}</TableCell>
                    <TableCell>
                      <Link to="/brand-advertiser/campaigns" className="text-blue-600 hover:underline font-medium">
                        {c.campaign_name}
                      </Link>
                    </TableCell>
                    <TableCell>0</TableCell>
                    <TableCell>0</TableCell>
                    <TableCell>0%</TableCell>
                    <TableCell>0</TableCell>
                    <TableCell>0</TableCell>
                    <TableCell>0%</TableCell>
                    <TableCell>₱0</TableCell>
                    <TableCell>₱0</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
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

import BrandApprovalGate from "@/components/brand-advertiser/BrandApprovalGate";

export default function BrandAdvertiserDashboardGated() {
  return (
    <BrandApprovalGate>
      <BrandAdvertiserDashboard />
    </BrandApprovalGate>
  );
}
