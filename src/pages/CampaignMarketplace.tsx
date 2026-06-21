import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, MapPin, DollarSign, Megaphone, Search } from "lucide-react";

type Campaign = {
  id: string;
  campaign_name: string;
  campaign_type: string | null;
  start_date: string | null;
  end_date: string | null;
  budget_amount: number | null;
  budget_currency: string | null;
  location: string | null;
  campaign_description: string | null;
  created_at: string;
  status: string;
  advertiser_id: string;
  advertiser_profiles?: { company_name: string | null } | null;
};

const TYPE_BADGE: Record<string, string> = {
  ooh: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  dooh: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  aooh: "bg-green-500/20 text-green-400 border-green-500/30",
};

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  approved: "bg-green-500/20 text-green-400 border-green-500/30",
  active: "bg-green-500/20 text-green-400 border-green-500/30",
  inactive: "bg-zinc-500/20 text-zinc-400 border-zinc-500/40",
  rejected: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function CampaignMarketplace() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("campaigns")
        .select("*, advertiser_profiles(company_name)")
        .order("created_at", { ascending: false });
      if (!error && data) setCampaigns(data as any);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    return campaigns.filter((c) => {
      const matchesSearch =
        !search ||
        c.campaign_name?.toLowerCase().includes(search.toLowerCase()) ||
        c.location?.toLowerCase().includes(search.toLowerCase()) ||
        c.advertiser_profiles?.company_name?.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === "all" || c.campaign_type?.toLowerCase().includes(typeFilter);
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [campaigns, search, typeFilter, statusFilter]);

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Megaphone className="w-7 h-7 text-green-500" />
            <h1 className="text-3xl font-bold">All Campaigns (Admin)</h1>
          </div>
          <p className="text-zinc-400">
            Internal advertiser database. New entries flow in from the advertiser funnel.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <div className="relative md:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input
              placeholder="Search by name, location, advertiser…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-zinc-900 border-white/10 text-white"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="bg-zinc-900 border-white/10 text-white">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="ooh">OOH</SelectItem>
              <SelectItem value="dooh">DOOH</SelectItem>
              <SelectItem value="aooh">AOOH</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-zinc-900 border-white/10 text-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-48 bg-zinc-900" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-zinc-500 border border-dashed border-white/10 rounded-xl">
            No campaigns match your filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((c) => {
              const typeKey = (c.campaign_type || "").toLowerCase();
              return (
                <div
                  key={c.id}
                  className="rounded-xl bg-zinc-900 border border-white/10 p-5 hover:border-green-500/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="font-semibold text-white truncate">{c.campaign_name}</h3>
                    <Badge className={`${STATUS_BADGE[c.status] || STATUS_BADGE.pending} border text-[10px]`}>
                      {c.status}
                    </Badge>
                  </div>

                  {c.campaign_type && (
                    <Badge className={`${TYPE_BADGE[typeKey] || "bg-white/10"} border text-[10px] mb-3`}>
                      {c.campaign_type.toUpperCase()}
                    </Badge>
                  )}

                  <div className="space-y-1.5 text-sm text-zinc-300">
                    {c.advertiser_profiles?.company_name && (
                      <div className="text-xs text-zinc-500">
                        by <span className="text-zinc-300">{c.advertiser_profiles.company_name}</span>
                      </div>
                    )}
                    {c.location && (
                      <div className="flex items-center gap-2 text-xs">
                        <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                        <span className="truncate">{c.location}</span>
                      </div>
                    )}
                    {c.budget_amount != null && (
                      <div className="flex items-center gap-2 text-xs">
                        <DollarSign className="w-3.5 h-3.5 text-zinc-500" />
                        <span>
                          {c.budget_currency || "PHP"} {Number(c.budget_amount).toLocaleString()}
                        </span>
                      </div>
                    )}
                    {(c.start_date || c.end_date) && (
                      <div className="flex items-center gap-2 text-xs">
                        <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                        <span>
                          {c.start_date || "—"} → {c.end_date || "—"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-white/5 text-[11px] text-zinc-500">
                    Added {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
