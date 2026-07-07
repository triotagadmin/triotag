import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format, subDays, eachDayOfInterval } from "date-fns";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, PieChart, Pie, Cell } from "recharts";
import BrandAdvertiserTopBar from "@/components/brand-advertiser/BrandAdvertiserTopBar";

export default function BrandAdvertiserReports() {
  const [companyName, setCompanyName] = useState("My Brand");
  const [totalBudget, setTotalBudget] = useState(0);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [campaignFilter, setCampaignFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [dateFrom, setDateFrom] = useState<Date>(subDays(new Date(), 6));
  const [dateTo, setDateTo] = useState<Date>(new Date());

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const { data: profile } = await supabase
        .from("brand_advertiser_profiles")
        .select("id, company_name")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (!profile) return;
      setCompanyName(profile.company_name || "My Brand");
      const { data: camps } = await supabase
        .from("brand_campaigns")
        .select("*")
        .eq("brand_advertiser_id", profile.id);
      setCampaigns(camps || []);
      setTotalBudget((camps || []).reduce((s, c) => s + Number(c.budget || 0), 0));
    })();
  }, []);

  const chartData = useMemo(
    () => eachDayOfInterval({ start: dateFrom, end: dateTo }).map((d) => ({
      date: format(d, "MMM d"), impressions: 0, clicks: 0, cost: 0,
    })),
    [dateFrom, dateTo]
  );

  const reachPie = [{ name: "Reached", value: 0 }, { name: "Remaining", value: 1 }];
  const clicksPie = [{ name: "Clicked", value: 0 }, { name: "Remaining", value: 1 }];

  return (
    <div className="min-h-screen bg-gray-50">
      <BrandAdvertiserTopBar companyName={companyName} totalBudget={totalBudget} />
      <div className="max-w-7xl mx-auto px-6 py-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Reports</h1>

        <Card className="p-4 bg-white border border-gray-200 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <Input value={companyName} disabled />
            <Select value={campaignFilter} onValueChange={setCampaignFilter}>
              <SelectTrigger><SelectValue placeholder="Campaign" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Campaigns</SelectItem>
                {campaigns.map((c) => <SelectItem key={c.id} value={c.id}>{c.campaign_name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger><SelectValue placeholder="Country" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                <SelectItem value="Philippines">Philippines</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger><SelectValue placeholder="Sort" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="impressions">Impressions</SelectItem>
                <SelectItem value="clicks">Clicks</SelectItem>
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="bg-white justify-start">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {format(dateFrom, "d MMM")} - {format(dateTo, "d MMM")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 bg-white text-gray-900" align="start">
                <Calendar mode="range" selected={{ from: dateFrom, to: dateTo }}
                  onSelect={(r: any) => { if (r?.from) setDateFrom(r.from); if (r?.to) setDateTo(r.to); }} initialFocus />
              </PopoverContent>
            </Popover>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">Update report</Button>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
          <Card className="p-6 bg-blue-600 text-white rounded-xl col-span-1">
            <div className="text-sm opacity-80">Impressions</div>
            <div className="text-3xl font-bold mt-1">0</div>
            <div className="text-sm opacity-80 mt-4">Reach</div>
            <div className="text-2xl font-bold mt-1">0</div>
          </Card>
          <Card className="p-4 bg-white border border-gray-200 flex flex-col items-center">
            <div className="text-xs text-gray-500 mb-1">Reach %</div>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie data={reachPie} dataKey="value" innerRadius={40} outerRadius={60}>
                  <Cell fill="#2563eb" /><Cell fill="#e5e7eb" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </Card>
          <Card className="p-4 bg-white border border-gray-200 flex flex-col items-center">
            <div className="text-xs text-gray-500 mb-1">Clicks %</div>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie data={clicksPie} dataKey="value" innerRadius={40} outerRadius={60}>
                  <Cell fill="#9333ea" /><Cell fill="#e5e7eb" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </Card>
          <Card className="p-6 bg-white border border-gray-200">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">CTR</span><span className="font-semibold">0%</span></div>
              <div className="flex justify-between"><span className="text-gray-500">CPC</span><span className="font-semibold">₱0</span></div>
              <div className="flex justify-between"><span className="text-gray-500">CPM</span><span className="font-semibold">₱0</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Spent</span><span className="font-semibold">₱0</span></div>
            </div>
          </Card>
        </div>

        <Card className="p-6 bg-white border border-gray-200">
          <div className="text-sm font-semibold text-gray-900 mb-4">Performance over time</div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip /><Legend />
                <Line type="monotone" dataKey="impressions" stroke="#2563eb" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="clicks" stroke="#9333ea" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="cost" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
