import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Plus, Building2 } from "lucide-react";
import BrandAdvertiserTopBar from "@/components/brand-advertiser/BrandAdvertiserTopBar";

type MediaType = "OOH" | "DOOH" | "AOOH";

interface AdSpaceRow {
  id: string;
  title: string;
  location: string | null;
  media_type: string;
  pricing: any;
  monthly_subscription_fee: number | null;
  specifications: any;
  publisher_id: string;
  publisher_profiles?: { business_name: string | null; is_house_account: boolean | null } | null;
}

const mediaBadge = (mt: string) => {
  const u = String(mt || "").toUpperCase();
  if (u === "DOOH") return "bg-cyan-100 text-cyan-700 border-cyan-200";
  if (u === "AOOH") return "bg-green-100 text-green-700 border-green-200";
  return "bg-purple-100 text-purple-700 border-purple-200";
};

const priceLabel = (row: AdSpaceRow): string => {
  const p = row.pricing || {};
  const monthly = p.monthly ?? row.monthly_subscription_fee;
  if (monthly) return `₱${Number(monthly).toLocaleString()} / mo`;
  if (p.weekly) return `₱${Number(p.weekly).toLocaleString()} / wk`;
  if (p.daily) return `₱${Number(p.daily).toLocaleString()} / day`;
  if (p.cpm) return `₱${Number(p.cpm).toLocaleString()} CPM`;
  return "Contact for pricing";
};

export default function BrandAdvertiserInventory() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState("My Brand");
  const [rows, setRows] = useState<AdSpaceRow[]>([]);
  const [search, setSearch] = useState("");
  const [mediaFilter, setMediaFilter] = useState<"ALL" | MediaType>("ALL");
  const [sourceFilter, setSourceFilter] = useState<"all" | "house" | "partners">("all");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from("brand_advertiser_profiles")
          .select("company_name")
          .eq("user_id", session.user.id)
          .maybeSingle();
        if (profile?.company_name) setCompanyName(profile.company_name);
      }
      const { data } = await supabase
        .from("ad_spaces")
        .select("id,title,location,media_type,pricing,monthly_subscription_fee,specifications,publisher_id,publisher_profiles(business_name,is_house_account)")
        .eq("approval_status", "approved")
        .order("created_at", { ascending: false });
      setRows((data || []) as any);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const mt = String(r.media_type || "").toUpperCase();
      if (mediaFilter !== "ALL" && mt !== mediaFilter) return false;
      const isHouse = !!r.publisher_profiles?.is_house_account;
      if (sourceFilter === "house" && !isHouse) return false;
      if (sourceFilter === "partners" && isHouse) return false;
      if (!q) return true;
      const biz = (r.publisher_profiles?.business_name || "").toLowerCase();
      return (
        r.title.toLowerCase().includes(q) ||
        (r.location || "").toLowerCase().includes(q) ||
        biz.includes(q)
      );
    });
  }, [rows, search, mediaFilter, sourceFilter]);

  const startCampaign = (adSpaceId: string) => {
    navigate("/brand-advertiser/campaigns", { state: { openWizard: true, adSpaceId } });
  };

  const displayBusinessName = (r: AdSpaceRow) =>
    r.publisher_profiles?.is_house_account ? "TrioTag" : (r.publisher_profiles?.business_name || "Retail Partner");

  return (
    <div className="min-h-screen bg-gray-50">
      <BrandAdvertiserTopBar companyName={companyName} totalBudget={0} />
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Inventory</h1>
          <p className="text-sm text-gray-500 mt-1">
            Browse approved OOH, DOOH, and AOOH inventory from TrioTag and retail media partners.
          </p>
        </div>

        <Card className="p-4 mb-4 bg-white border border-gray-200">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title, location, or business…"
                className="pl-9"
              />
            </div>
            <Tabs value={mediaFilter} onValueChange={(v) => setMediaFilter(v as any)}>
              <TabsList>
                <TabsTrigger value="ALL">All</TabsTrigger>
                <TabsTrigger value="OOH">OOH</TabsTrigger>
                <TabsTrigger value="DOOH">DOOH</TabsTrigger>
                <TabsTrigger value="AOOH">AOOH</TabsTrigger>
              </TabsList>
            </Tabs>
            <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v as any)}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="house">TrioTag</SelectItem>
                <SelectItem value="partners">Retail Partners</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {loading ? (
          <div className="text-center text-gray-500 py-16">Loading inventory…</div>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center bg-white border border-gray-200">
            <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No inventory available yet — check back soon.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((r) => {
              const mt = String(r.media_type || "OOH").toUpperCase();
              const spec = r.specifications || {};
              const specBits: string[] = [];
              if (spec.dimensions) specBits.push(String(spec.dimensions));
              if (spec.resolution) specBits.push(String(spec.resolution));
              if (spec.screen_size) specBits.push(`${spec.screen_size}`);
              if (spec.orientation) specBits.push(String(spec.orientation));
              return (
                <Card key={r.id} className="p-4 bg-white border border-gray-200 flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <div className="text-xs text-gray-500 truncate">{displayBusinessName(r)}</div>
                      <h3 className="font-semibold text-gray-900 truncate">{r.title}</h3>
                    </div>
                    <Badge variant="outline" className={mediaBadge(mt)}>{mt}</Badge>
                  </div>
                  {r.location && (
                    <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{r.location}</span>
                    </div>
                  )}
                  {specBits.length > 0 && (
                    <div className="text-xs text-gray-500 mb-2">{specBits.join(" · ")}</div>
                  )}
                  <div className="text-sm font-medium text-gray-900 mt-auto pt-2">
                    {priceLabel(r)}
                  </div>
                  <Button
                    onClick={() => startCampaign(r.id)}
                    className="mt-3 bg-blue-600 hover:bg-blue-700 text-white"
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Create Campaign
                  </Button>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
