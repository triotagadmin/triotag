import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdvertiserSidebar } from "@/components/advertiser/AdvertiserSidebar";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Megaphone, Plus, Calendar, DollarSign, Loader2, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { CampaignWizard } from "@/components/advertiser/CampaignWizard";

type Camp = {
  id: string;
  name: string;
  type: "OOH" | "DOOH" | "AOOH";
  status: string;
  start_date?: string | null;
  end_date?: string | null;
  budget?: number | null;
  currency?: string;
};

const statusColor = (s: string) => {
  const v = (s || "").toLowerCase();
  if (["active", "approved", "live", "playing"].includes(v)) return "bg-green-500/20 text-green-400 border-green-500/40";
  if (["pending", "in_review", "submitted"].includes(v)) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/40";
  if (["completed", "ended"].includes(v)) return "bg-blue-500/20 text-blue-400 border-blue-500/40";
  if (["rejected", "cancelled", "failed"].includes(v)) return "bg-red-500/20 text-red-400 border-red-500/40";
  return "bg-zinc-500/20 text-zinc-300 border-zinc-500/40";
};

const typeColor = (t: string) =>
  t === "AOOH"
    ? "bg-green-500/20 text-green-400 border-green-500/40"
    : t === "DOOH"
    ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
    : "bg-purple-500/20 text-purple-300 border-purple-500/40";

export default function AdvertiserCampaigns() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [camps, setCamps] = useState<Camp[]>([]);
  const [tab, setTab] = useState<"all" | "OOH" | "DOOH" | "AOOH">("all");
  const [wizardOpen, setWizardOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const uid = session.user.id;
      const [{ data: c1 }, { data: c2 }] = await Promise.all([
        supabase.from("campaigns").select("id, campaign_name, status, start_date, end_date, budget_amount, budget_currency, campaign_type").eq("advertiser_id", uid),
        supabase.from("aooh_campaigns").select("id, campaign_name, status, start_date, end_date").eq("advertiser_id", uid),
      ]);
      const list: Camp[] = [
        ...((c1 || []) as any[]).map((r) => ({
          id: r.id,
          name: r.campaign_name || "Untitled",
          type: (r.campaign_type === "dooh" ? "DOOH" : "OOH") as Camp["type"],
          status: r.status || "draft",
          start_date: r.start_date,
          end_date: r.end_date,
          budget: r.budget_amount,
          currency: r.budget_currency || "PHP",
        })),
        ...((c2 || []) as any[]).map((r) => ({
          id: r.id,
          name: r.campaign_name || "Untitled",
          type: "AOOH" as const,
          status: r.status || "draft",
          start_date: r.start_date,
          end_date: r.end_date,
        })),
      ];
      setCamps(list);
      setLoading(false);
    })();
  }, []);

  const filtered = tab === "all" ? camps : camps.filter((c) => c.type === tab);
  const total = camps.length;
  const active = camps.filter((c) => ["active", "approved", "live", "playing"].includes((c.status || "").toLowerCase())).length;
  const completed = camps.filter((c) => ["completed", "ended"].includes((c.status || "").toLowerCase())).length;
  const totalSpend = camps.reduce((s, c) => s + (c.budget || 0), 0);

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      <div className="flex">
        <AdvertiserSidebar />
        <main className="flex-1 p-6 max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Megaphone className="w-6 h-6 text-green-400" /> Campaigns
              </h1>
              <p className="text-zinc-400 text-sm mt-1">Manage and monitor all your campaigns</p>
            </div>
            <Button onClick={() => setWizardOpen(true)} className="bg-green-600 hover:bg-green-500 text-white">
              <Plus className="w-4 h-4 mr-1" /> New Campaign
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Total", value: total, icon: Megaphone },
              { label: "Active", value: active, icon: TrendingUp },
              { label: "Completed", value: completed, icon: Calendar },
              { label: "Total Spend", value: `₱${totalSpend.toLocaleString()}`, icon: DollarSign },
            ].map((s) => (
              <Card key={s.label} className="bg-[#0c0c0c] border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
                    <s.icon className="w-3.5 h-3.5" /> {s.label}
                  </div>
                  <div className="text-2xl font-bold text-white">{s.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <TabsList className="bg-[#0c0c0c] border border-white/10">
              {(["all", "OOH", "DOOH", "AOOH"] as const).map((t) => (
                <TabsTrigger key={t} value={t} className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
                  {t === "all" ? "All" : t}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={tab} className="mt-4">
              {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-green-400" /></div>
              ) : filtered.length === 0 ? (
                <Card className="bg-[#0c0c0c] border-white/10">
                  <CardContent className="p-12 text-center">
                    <Megaphone className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
                    <p className="text-zinc-400 mb-4">Start reaching audiences with your first campaign.</p>
                    <Button onClick={() => setWizardOpen(true)} className="bg-green-600 hover:bg-green-500">
                      <Plus className="w-4 h-4 mr-1" /> Create Your First Campaign
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-3">
                  {filtered.map((c) => (
                    <Card key={c.id} className="bg-[#0c0c0c] border-white/10 hover:border-green-500/40 transition">
                      <CardContent className="p-4 flex flex-wrap items-center gap-4 justify-between">
                        <div className="flex-1 min-w-[200px]">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Badge variant="outline" className={typeColor(c.type)}>{c.type}</Badge>
                            <Badge variant="outline" className={statusColor(c.status)}>{c.status}</Badge>
                          </div>
                          <div className="font-semibold text-white">{c.name}</div>
                          <div className="text-xs text-zinc-400 mt-1 flex flex-wrap gap-3">
                            {c.start_date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(c.start_date), "MMM d, yyyy")}
                                {c.end_date && ` – ${format(new Date(c.end_date), "MMM d, yyyy")}`}
                              </span>
                            )}
                            {c.budget != null && (
                              <span className="flex items-center gap-1">
                                <DollarSign className="w-3 h-3" />
                                {c.currency === "USD" ? "$" : "₱"}{Number(c.budget).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-green-500/40 text-green-400 hover:bg-green-500/10"
                          asChild
                        >
                          <Link to={c.type === "AOOH" ? `/advertiser/campaigns/aooh/${c.id}` : `/advertiser-dashboard`}>
                            View {c.type === "AOOH" ? "Report" : "Details"}
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>
      <CampaignWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />
    </div>
  );
}
