import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Plus, Pencil } from "lucide-react";
import { format, subDays } from "date-fns";
import BrandCampaignWizard from "@/components/brand-advertiser/BrandCampaignWizard";
import BrandAdvertiserTopBar from "@/components/brand-advertiser/BrandAdvertiserTopBar";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-100 text-green-700 border-green-200",
  live: "bg-green-100 text-green-700 border-green-200",
  budget_limit: "bg-orange-100 text-orange-700 border-orange-200",
  expired: "bg-gray-100 text-gray-600 border-gray-200",
  pending_review: "bg-yellow-100 text-yellow-700 border-yellow-200",
};

function BrandAdvertiserCampaignsList() {
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("My Brand");
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [creativeFilter, setCreativeFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState<Date>(subDays(new Date(), 30));
  const [dateTo, setDateTo] = useState<Date>(new Date());
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editCampaign, setEditCampaign] = useState<any | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const initialAdSpaceId = (location.state as any)?.adSpaceId ?? null;
  const initialAdSpaceIds = (location.state as any)?.adSpaceIds ?? null;

  useEffect(() => {
    if ((location.state as any)?.openWizard) {
      setWizardOpen(true);
      navigate(location.pathname, { replace: true, state: { adSpaceId: initialAdSpaceId, adSpaceIds: initialAdSpaceIds } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { setLoading(false); return; }
    const { data: profile } = await supabase
      .from("brand_advertiser_profiles")
      .select("id, company_name")
      .eq("user_id", session.user.id)
      .maybeSingle();
    if (!profile) { setLoading(false); return; }
    setProfileId(profile.id);
    setCompanyName(profile.company_name || "My Brand");
    const { data: camps } = await supabase
      .from("brand_campaigns")
      .select("*")
      .eq("brand_advertiser_id", profile.id)
      .order("created_at", { ascending: false });
    setCampaigns(camps || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => campaigns.filter((c) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (creativeFilter !== "all" && c.creative_format !== creativeFilter) return false;
    if (countryFilter !== "all" && !(c.countries || []).includes(countryFilter)) return false;
    return true;
  }), [campaigns, statusFilter, creativeFilter, countryFilter]);

  const totalBudget = filtered.reduce((s, c) => s + Number(c.budget || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <BrandAdvertiserTopBar companyName={companyName} totalBudget={campaigns.reduce((s, c) => s + Number(c.budget || 0), 0)} />
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Campaigns</h1>
          <Button onClick={() => { setEditCampaign(null); setWizardOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-2" /> New Campaign
          </Button>
        </div>

        <Card className="p-4 mb-4 bg-white border border-gray-200">
          <div className="flex flex-wrap gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Live</SelectItem>
                <SelectItem value="pending_review">Pending Review</SelectItem>
                <SelectItem value="budget_limit">Budget Limit</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Select value={creativeFilter} onValueChange={setCreativeFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Creative Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Creatives</SelectItem>
                <SelectItem value="Image">Image</SelectItem>
                <SelectItem value="Video">Video</SelectItem>
                <SelectItem value="Audio">Audio</SelectItem>
              </SelectContent>
            </Select>
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Country" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                <SelectItem value="Philippines">Philippines</SelectItem>
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="bg-white">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {format(dateFrom, "d MMM")} - {format(dateTo, "d MMM, yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 bg-white text-gray-900" align="start">
                <Calendar
                  mode="range"
                  selected={{ from: dateFrom, to: dateTo }}
                  onSelect={(r: any) => { if (r?.from) setDateFrom(r.from); if (r?.to) setDateTo(r.to); }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </Card>

        <Card className="bg-white border border-gray-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Locations</TableHead>
                <TableHead>Creative</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Spend</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={10} className="text-center text-gray-500 py-8">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={10} className="text-center text-gray-500 py-8">No campaigns match filters</TableCell></TableRow>
              ) : (
                filtered.map((c) => {
                  const status = c.status || "pending_review";
                  const locTypes = (c.location_types || []) as string[];
                  const locSummary = c.location_count
                    ? `${c.location_count}${locTypes.length ? ` · ${locTypes.slice(0, 2).join(", ")}${locTypes.length > 2 ? ` +${locTypes.length - 2}` : ""}` : ""}`
                    : "—";
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs">{String(c.id).slice(0, 8)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={STATUS_STYLES[status] || STATUS_STYLES.expired}>
                          {String(status).replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-blue-600">{c.campaign_name}</TableCell>
                      <TableCell className="text-sm text-gray-600">{c.scope_name || "—"}</TableCell>
                      <TableCell className="text-sm text-gray-600">{locSummary}</TableCell>
                      <TableCell className="text-sm text-gray-600">{c.creative_format || "—"}</TableCell>
                      <TableCell>₱{Number(c.budget || 0).toLocaleString()}</TableCell>
                      <TableCell>₱0</TableCell>
                      <TableCell>₱{Number(c.budget || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setEditCampaign(c); setWizardOpen(true); }}
                        >
                          <Pencil className="w-4 h-4 mr-1" /> Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
              {filtered.length > 0 && (
                <TableRow className="bg-gray-50 font-semibold">
                  <TableCell colSpan={6}>Totals</TableCell>
                  <TableCell>₱{totalBudget.toLocaleString()}</TableCell>
                  <TableCell>₱0</TableCell>
                  <TableCell>₱{totalBudget.toLocaleString()}</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {profileId && (
        <BrandCampaignWizard
          open={wizardOpen}
          onOpenChange={(v) => { setWizardOpen(v); if (!v) setEditCampaign(null); }}
          brandAdvertiserId={profileId}
          onCreated={fetchData}
          initialAdSpaceId={editCampaign ? null : initialAdSpaceId}
          initialAdSpaceIds={editCampaign ? null : initialAdSpaceIds}
          editCampaign={editCampaign}
        />
      )}
    </div>
  );
}


import BrandApprovalGate from "@/components/brand-advertiser/BrandApprovalGate";

export default function BrandAdvertiserCampaignsListGated() {
  return (
    <BrandApprovalGate>
      <BrandAdvertiserCampaignsList />
    </BrandApprovalGate>
  );
}
