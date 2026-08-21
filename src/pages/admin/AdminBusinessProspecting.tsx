import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Target, Loader2, Search, Download, ExternalLink, Globe, GlobeLock,
  MapPin, Star, Info, History, Users, TrendingUp, Building2, Trash2,
} from "lucide-react";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PlaceRow = {
  google_place_id: string;
  business_name: string;
  category: string | null;
  address: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  phone: string | null;
  google_rating: number | null;
  review_count: number | null;
  website_url: string | null;
  website_status: "listed" | "not_listed";
  latitude: number | null;
  longitude: number | null;
  google_maps_url: string | null;
  business_status: string | null;
  opportunity_score: number;
  details_fetched_at: string;
};

type ProspectRow = PlaceRow & {
  id: string;
  prospect_status: string;
  notes: string | null;
  assigned_to: string | null;
  search_id: string | null;
  saved_by: string | null;
  discovered_at: string;
  saved_at: string;
  created_at: string;
  updated_at: string;
};

type SearchRow = {
  id: string;
  searched_by: string;
  keyword: string;
  location_text: string;
  radius_km: number;
  min_rating: number | null;
  min_reviews: number | null;
  business_type: string | null;
  result_limit: number;
  results_count: number;
  website_gap_count: number;
  created_at: string;
};

const PROSPECT_STATUSES = ["new", "reviewed", "contacted", "qualified", "proposal", "won", "lost"] as const;

const PROSPECT_STATUS_LABEL: Record<string, string> = {
  new: "New",
  reviewed: "Reviewed",
  contacted: "Contacted",
  qualified: "Qualified",
  proposal: "Proposal",
  won: "Won",
  lost: "Lost",
};

const PROSPECT_STATUS_STYLE: Record<string, string> = {
  new: "bg-blue-100 text-blue-700 border border-blue-200",
  reviewed: "bg-gray-100 text-gray-600 border border-gray-200",
  contacted: "bg-yellow-100 text-yellow-700 border border-yellow-300",
  qualified: "bg-purple-100 text-purple-700 border border-purple-200",
  proposal: "bg-cyan-100 text-cyan-700 border border-cyan-200",
  won: "bg-green-100 text-green-700 border border-green-200",
  lost: "bg-red-100 text-red-600 border border-red-200",
};

function WebsiteStatusBadge({ status }: { status: string }) {
  if (status === "listed") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
        <Globe className="w-3 h-3" /> Website Listed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-300">
      <GlobeLock className="w-3 h-3" /> No Website Listed
    </span>
  );
}

function ProspectStatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${PROSPECT_STATUS_STYLE[status] || "bg-gray-100 text-gray-600"}`}>
      {PROSPECT_STATUS_LABEL[status] || status}
    </span>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const cls =
    score >= 70
      ? "bg-green-100 text-green-700 border-green-200"
      : score >= 40
        ? "bg-amber-100 text-amber-800 border-amber-300"
        : "bg-gray-100 text-gray-600 border-gray-200";
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${cls}`}>
      {score}
    </span>
  );
}

function toCsv(rows: ProspectRow[]): string {
  const headers = [
    "Business Name", "Category", "Address", "Phone", "Rating", "Review Count",
    "Website Status", "Website URL", "Opportunity Score", "Google Maps URL",
    "Prospect Status", "Date Discovered", "Date Saved",
  ];
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = rows.map((r) =>
    [
      r.business_name, r.category, r.address, r.phone, r.google_rating, r.review_count,
      r.website_status === "listed" ? "Website Listed" : "No Website Listed",
      r.website_url, r.opportunity_score, r.google_maps_url,
      PROSPECT_STATUS_LABEL[r.prospect_status] || r.prospect_status,
      r.discovered_at, r.saved_at,
    ].map(esc).join(","),
  );
  return [headers.join(","), ...lines].join("\n");
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AdminBusinessProspecting() {
  // Search form
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [radiusKm, setRadiusKm] = useState("5");
  const [minRating, setMinRating] = useState("");
  const [minReviews, setMinReviews] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [limit, setLimit] = useState("20");

  // Search state
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<PlaceRow[] | null>(null);
  const [searchId, setSearchId] = useState<string | null>(null);
  const [resultCached, setResultCached] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [savedPlaceIds, setSavedPlaceIds] = useState<Set<string>>(new Set());
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());

  // Prospects state
  const [prospects, setProspects] = useState<ProspectRow[]>([]);
  const [prospectsLoading, setProspectsLoading] = useState(true);
  const [detail, setDetail] = useState<ProspectRow | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [editStatus, setEditStatus] = useState("new");
  const [editAssigned, setEditAssigned] = useState<string>("unassigned");
  const [savingDetail, setSavingDetail] = useState(false);

  // Filters (Saved Prospects)
  const [fWebsite, setFWebsite] = useState("all");
  const [fStatus, setFStatus] = useState("all");
  const [fCategory, setFCategory] = useState("");
  const [sortBy, setSortBy] = useState("score_desc");

  // History + summary
  const [searches, setSearches] = useState<SearchRow[]>([]);
  const [searchesLoading, setSearchesLoading] = useState(true);
  const [adminNames, setAdminNames] = useState<Record<string, string>>({});
  const [summary, setSummary] = useState({ found: 0, gaps: 0, saved: 0, high: 0 });
  const [reopening, setReopening] = useState<string | null>(null);

  // -------------------------------------------------------------------------
  // Data loading
  // -------------------------------------------------------------------------

  const loadSummary = useCallback(async () => {
    const [found, gaps, saved, high] = await Promise.all([
      supabase.from("prospect_places").select("google_place_id", { count: "exact", head: true }),
      supabase.from("prospect_places").select("google_place_id", { count: "exact", head: true }).eq("website_status", "not_listed"),
      supabase.from("business_prospects").select("id", { count: "exact", head: true }),
      supabase.from("business_prospects").select("id", { count: "exact", head: true }).gte("opportunity_score", 70),
    ]);
    setSummary({
      found: found.count ?? 0,
      gaps: gaps.count ?? 0,
      saved: saved.count ?? 0,
      high: high.count ?? 0,
    });
  }, []);

  const loadProspects = useCallback(async () => {
    setProspectsLoading(true);
    const { data, error } = await supabase
      .from("business_prospects")
      .select("*")
      .order("saved_at", { ascending: false })
      .limit(1000);
    if (error) toast.error(error.message);
    const rows = (data ?? []) as unknown as ProspectRow[];
    setProspects(rows);
    setSavedPlaceIds(new Set(rows.map((r) => r.google_place_id)));
    setProspectsLoading(false);
  }, []);

  const loadSearches = useCallback(async () => {
    setSearchesLoading(true);
    const { data, error } = await supabase
      .from("prospect_searches")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) toast.error(error.message);
    setSearches((data ?? []) as unknown as SearchRow[]);
    setSearchesLoading(false);
  }, []);

  const loadAdminNames = useCallback(async () => {
    const { data } = await supabase.from("admin_profiles").select("user_id, full_name");
    const map: Record<string, string> = {};
    for (const a of data ?? []) map[a.user_id] = a.full_name || "Admin";
    setAdminNames(map);
  }, []);

  useEffect(() => {
    loadSummary();
    loadProspects();
    loadSearches();
    loadAdminNames();
  }, [loadSummary, loadProspects, loadSearches, loadAdminNames]);

  // -------------------------------------------------------------------------
  // Search
  // -------------------------------------------------------------------------

  const runSearch = async (overrides?: {
    keyword: string; location: string; radiusKm: number;
    minRating: number | null; minReviews: number | null;
    businessType: string | null; limit: number;
  }) => {
    const params = overrides ?? {
      keyword: keyword.trim(),
      location: location.trim(),
      radiusKm: Number(radiusKm) || 5,
      minRating: minRating ? Number(minRating) : null,
      minReviews: minReviews ? Number(minReviews) : null,
      businessType: businessType.trim() || null,
      limit: Number(limit) || 20,
    };
    if (!overrides) {
      if (params.keyword.length < 2) { toast.error("Enter a business category or keyword"); return; }
      if (params.location.length < 2) { toast.error("Enter a location"); return; }
    }

    setSearching(true);
    setResults(null);
    setSelected(new Set());
    try {
      const { data, error } = await supabase.functions.invoke("business-prospecting-search", {
        body: {
          keyword: params.keyword,
          location: params.location,
          radiusKm: params.radiusKm,
          minRating: params.minRating,
          minReviews: params.minReviews,
          businessType: params.businessType,
          limit: params.limit,
        },
      });
      if (error) {
        const msg = (data as any)?.error || error.message;
        toast.error(msg);
        return;
      }
      if ((data as any)?.error) {
        toast.error((data as any).error);
        return;
      }
      if (data.status === "ZERO_RESULTS") {
        setResults([]);
        setResultCached(false);
        toast.info("No businesses found for that search on Google Places.");
      } else {
        setResults((data.results ?? []) as PlaceRow[]);
        setSearchId(data.searchId ?? null);
        setResultCached(!!data.cached);
        if (data.cached) toast.info("Showing cached results from a recent identical search (no new Google API call).");
      }
      loadSummary();
      loadSearches();
    } catch (e: any) {
      toast.error(e?.message ?? "Search failed. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  const reopenSearch = async (s: SearchRow) => {
    setReopening(s.id);
    await runSearch({
      keyword: s.keyword,
      location: s.location_text,
      radiusKm: s.radius_km,
      minRating: s.min_rating,
      minReviews: s.min_reviews,
      businessType: s.business_type,
      limit: s.result_limit,
    });
    setReopening(null);
  };

  // -------------------------------------------------------------------------
  // Save prospects
  // -------------------------------------------------------------------------

  const saveProspects = async (places: PlaceRow[]) => {
    if (!places.length) return;
    const { data: { user } } = await supabase.auth.getUser();
    const ids = new Set(savingIds);
    places.forEach((p) => ids.add(p.google_place_id));
    setSavingIds(ids);

    let savedCount = 0;
    let dupes = 0;
    for (const p of places) {
      const { error } = await supabase.from("business_prospects").insert({
        google_place_id: p.google_place_id,
        business_name: p.business_name,
        category: p.category,
        address: p.address,
        city: p.city,
        region: p.region,
        country: p.country,
        phone: p.phone,
        google_rating: p.google_rating,
        review_count: p.review_count,
        website_url: p.website_url,
        website_status: p.website_status,
        latitude: p.latitude,
        longitude: p.longitude,
        google_maps_url: p.google_maps_url,
        opportunity_score: p.opportunity_score,
        search_id: searchId,
        saved_by: user?.id ?? null,
        source: "google_places",
      } as any);
      if (error) {
        if (error.code === "23505") dupes++;
        else toast.error(error.message);
      } else {
        savedCount++;
      }
    }

    const done = new Set(savingIds);
    places.forEach((p) => done.delete(p.google_place_id));
    setSavingIds(done);
    setSelected(new Set());

    if (savedCount) toast.success(`${savedCount} prospect${savedCount > 1 ? "s" : ""} saved`);
    if (dupes) toast.info(`${dupes} already saved — duplicates skipped`);
    loadProspects();
    loadSummary();
  };

  // -------------------------------------------------------------------------
  // Prospect detail
  // -------------------------------------------------------------------------

  const openDetail = (p: ProspectRow) => {
    setDetail(p);
    setEditNotes(p.notes ?? "");
    setEditStatus(p.prospect_status);
    setEditAssigned(p.assigned_to ?? "unassigned");
  };

  const saveDetail = async () => {
    if (!detail) return;
    setSavingDetail(true);
    const { error } = await supabase
      .from("business_prospects")
      .update({
        notes: editNotes || null,
        prospect_status: editStatus,
        assigned_to: editAssigned === "unassigned" ? null : editAssigned,
      } as any)
      .eq("id", detail.id);
    setSavingDetail(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Prospect updated");
    setDetail(null);
    loadProspects();
  };

  const removeProspect = async (p: ProspectRow) => {
    const { error } = await supabase.from("business_prospects").delete().eq("id", p.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Prospect removed");
    setDetail(null);
    loadProspects();
    loadSummary();
  };

  // -------------------------------------------------------------------------
  // Filtering / sorting / export
  // -------------------------------------------------------------------------

  const filteredProspects = useMemo(() => {
    let rows = [...prospects];
    if (fWebsite !== "all") rows = rows.filter((r) => r.website_status === fWebsite);
    if (fStatus !== "all") rows = rows.filter((r) => r.prospect_status === fStatus);
    if (fCategory.trim()) {
      const q = fCategory.trim().toLowerCase();
      rows = rows.filter((r) => (r.category ?? "").toLowerCase().includes(q));
    }
    switch (sortBy) {
      case "score_desc": rows.sort((a, b) => b.opportunity_score - a.opportunity_score); break;
      case "score_asc": rows.sort((a, b) => a.opportunity_score - b.opportunity_score); break;
      case "rating": rows.sort((a, b) => (b.google_rating ?? 0) - (a.google_rating ?? 0)); break;
      case "reviews": rows.sort((a, b) => (b.review_count ?? 0) - (a.review_count ?? 0)); break;
      case "name": rows.sort((a, b) => a.business_name.localeCompare(b.business_name)); break;
      case "discovered": rows.sort((a, b) => b.discovered_at.localeCompare(a.discovered_at)); break;
    }
    return rows;
  }, [prospects, fWebsite, fStatus, fCategory, sortBy]);

  const exportCsv = () => {
    if (!filteredProspects.length) { toast.info("No prospects to export"); return; }
    const csv = toCsv(filteredProspects);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `triotag-prospects-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filteredProspects.length} prospects`);
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const gapResults = results?.filter((r) => r.website_status === "not_listed") ?? [];
  const allChecked = !!results?.length && selected.size === results.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Target className="w-7 h-7 text-green-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Business Prospecting</h1>
            <p className="text-sm text-gray-500">
              Find businesses with website opportunities using Google Places data.
            </p>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Building2 className="w-4 h-4" /> Businesses Found
              </CardTitle>
            </CardHeader>
            <CardContent><div className="text-3xl font-bold">{summary.found}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <GlobeLock className="w-4 h-4" /> Website Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent><div className="text-3xl font-bold text-amber-600">{summary.gaps}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" /> Saved Prospects
              </CardTitle>
            </CardHeader>
            <CardContent><div className="text-3xl font-bold">{summary.saved}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> High Opportunity
              </CardTitle>
            </CardHeader>
            <CardContent><div className="text-3xl font-bold text-green-600">{summary.high}</div></CardContent>
          </Card>
        </div>

        <Tabs defaultValue="search">
          <TabsList className="mb-4">
            <TabsTrigger value="search"><Search className="w-4 h-4 mr-1.5" /> Search</TabsTrigger>
            <TabsTrigger value="prospects"><Users className="w-4 h-4 mr-1.5" /> Saved Prospects</TabsTrigger>
            <TabsTrigger value="history"><History className="w-4 h-4 mr-1.5" /> Search History</TabsTrigger>
          </TabsList>

          {/* ================= SEARCH TAB ================= */}
          <TabsContent value="search">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base">Search Google Places</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label>Business category / keyword</Label>
                    <Input placeholder='e.g. "restaurants"' value={keyword} onChange={(e) => setKeyword(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Location</Label>
                    <Input placeholder='e.g. "Makati City"' value={location} onChange={(e) => setLocation(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Radius (km, max 50)</Label>
                    <Input type="number" min={0.5} max={50} value={radiusKm} onChange={(e) => setRadiusKm(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Min. rating (optional)</Label>
                    <Input type="number" min={0} max={5} step={0.1} placeholder="e.g. 4.0" value={minRating} onChange={(e) => setMinRating(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Min. reviews (optional)</Label>
                    <Input type="number" min={0} placeholder="e.g. 10" value={minReviews} onChange={(e) => setMinReviews(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Business type (optional)</Label>
                    <Input placeholder="e.g. cafe, dental clinic" value={businessType} onChange={(e) => setBusinessType(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Result limit (max 20)</Label>
                    <Input type="number" min={1} max={20} value={limit} onChange={(e) => setLimit(e.target.value)} />
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-5 flex-wrap">
                  <Button onClick={() => runSearch()} disabled={searching}>
                    {searching ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Search className="w-4 h-4 mr-1.5" />}
                    {searching ? "Searching Google Places…" : "Search Google Places"}
                  </Button>
                  <p className="text-xs text-gray-500">
                    Identical searches within 24 hours reuse cached results to limit Google API usage.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Results */}
            {searching && (
              <Card><CardContent className="p-6 space-y-3">
                {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
              </CardContent></Card>
            )}

            {!searching && results && (
              <Card>
                <CardHeader className="flex-row items-center justify-between space-y-0 flex-wrap gap-3">
                  <div>
                    <CardTitle className="text-base">
                      {results.length} businesses found — {gapResults.length} with no website listed on Google
                      {resultCached && <span className="ml-2 text-xs font-normal text-gray-500">(cached results)</span>}
                    </CardTitle>
                    <p className="text-xs text-gray-500 mt-1">
                      "No website listed on Google" indicates a potential website opportunity — it does not confirm
                      that the business has no website.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!selected.size}
                    onClick={() => saveProspects(results.filter((r) => selected.has(r.google_place_id)))}
                  >
                    Save Selected ({selected.size})
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  {results.length === 0 ? (
                    <div className="p-10 text-center text-sm text-gray-500">No businesses matched this search.</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10">
                            <Checkbox
                              checked={allChecked}
                              onCheckedChange={(c) =>
                                setSelected(c ? new Set(results.map((r) => r.google_place_id)) : new Set())
                              }
                            />
                          </TableHead>
                          <TableHead>Business</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Rating</TableHead>
                          <TableHead>Reviews</TableHead>
                          <TableHead>Website Status</TableHead>
                          <TableHead>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger className="inline-flex items-center gap-1">
                                  Opportunity Score <Info className="w-3.5 h-3.5 text-gray-400" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs text-xs">
                                  Deterministic prioritization signal: no website listed (+50), review volume
                                  (up to +20), rating (up to +10), operational status (+5). Capped at 100.
                                  A lead-prioritization heuristic, not a business-quality metric.
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableHead>
                          <TableHead>Google Maps</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {results.map((r) => {
                          const isSaved = savedPlaceIds.has(r.google_place_id);
                          const isSaving = savingIds.has(r.google_place_id);
                          return (
                            <TableRow
                              key={r.google_place_id}
                              className={r.website_status === "not_listed" ? "bg-amber-50/50" : undefined}
                            >
                              <TableCell>
                                <Checkbox
                                  checked={selected.has(r.google_place_id)}
                                  onCheckedChange={(c) => {
                                    const next = new Set(selected);
                                    if (c) next.add(r.google_place_id);
                                    else next.delete(r.google_place_id);
                                    setSelected(next);
                                  }}
                                />
                              </TableCell>
                              <TableCell className="font-medium max-w-[220px] truncate">{r.business_name}</TableCell>
                              <TableCell className="capitalize">{r.category || "—"}</TableCell>
                              <TableCell className="max-w-[200px] truncate">
                                {[r.city, r.region].filter(Boolean).join(", ") || r.address || "—"}
                              </TableCell>
                              <TableCell>
                                {r.google_rating != null ? (
                                  <span className="inline-flex items-center gap-1">
                                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                    {r.google_rating.toFixed(1)}
                                  </span>
                                ) : "—"}
                              </TableCell>
                              <TableCell>{r.review_count ?? "—"}</TableCell>
                              <TableCell><WebsiteStatusBadge status={r.website_status} /></TableCell>
                              <TableCell><ScoreBadge score={r.opportunity_score} /></TableCell>
                              <TableCell>
                                {r.google_maps_url ? (
                                  <a href={r.google_maps_url} target="_blank" rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-green-700 hover:underline text-xs">
                                    <MapPin className="w-3.5 h-3.5" /> Open
                                  </a>
                                ) : "—"}
                              </TableCell>
                              <TableCell>
                                {isSaved ? (
                                  <span className="text-xs font-medium text-green-700">Saved</span>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={isSaving}
                                    onClick={() => saveProspects([r])}
                                  >
                                    {isSaving && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}
                                    Save Prospect
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ================= SAVED PROSPECTS TAB ================= */}
          <TabsContent value="prospects">
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0 flex-wrap gap-3">
                <CardTitle className="text-base">Saved Prospects ({filteredProspects.length})</CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <Select value={fWebsite} onValueChange={setFWebsite}>
                    <SelectTrigger className="w-[170px] h-9"><SelectValue placeholder="Website status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Website Statuses</SelectItem>
                      <SelectItem value="not_listed">No Website Listed</SelectItem>
                      <SelectItem value="listed">Website Listed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={fStatus} onValueChange={setFStatus}>
                    <SelectTrigger className="w-[150px] h-9"><SelectValue placeholder="Prospect status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {PROSPECT_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{PROSPECT_STATUS_LABEL[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    className="w-[150px] h-9"
                    placeholder="Filter category…"
                    value={fCategory}
                    onChange={(e) => setFCategory(e.target.value)}
                  />
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[170px] h-9"><SelectValue placeholder="Sort by" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="score_desc">Score: Highest first</SelectItem>
                      <SelectItem value="score_asc">Score: Lowest first</SelectItem>
                      <SelectItem value="rating">Rating</SelectItem>
                      <SelectItem value="reviews">Review Count</SelectItem>
                      <SelectItem value="name">Business Name</SelectItem>
                      <SelectItem value="discovered">Date Discovered</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={exportCsv}>
                    <Download className="w-4 h-4 mr-1.5" /> Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {prospectsLoading ? (
                  <div className="p-6 space-y-3">
                    {[0, 1, 2].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
                  </div>
                ) : filteredProspects.length === 0 ? (
                  <div className="p-10 text-center text-sm text-gray-500">
                    No saved prospects yet. Run a search and save the businesses you want to track.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Business</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Website Status</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Prospect Status</TableHead>
                        <TableHead>Assigned</TableHead>
                        <TableHead>Saved</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProspects.map((p) => (
                        <TableRow key={p.id} className="cursor-pointer" onClick={() => openDetail(p)}>
                          <TableCell className="font-medium max-w-[220px] truncate">{p.business_name}</TableCell>
                          <TableCell className="capitalize">{p.category || "—"}</TableCell>
                          <TableCell>{p.google_rating != null ? p.google_rating.toFixed(1) : "—"}</TableCell>
                          <TableCell><WebsiteStatusBadge status={p.website_status} /></TableCell>
                          <TableCell><ScoreBadge score={p.opportunity_score} /></TableCell>
                          <TableCell><ProspectStatusBadge status={p.prospect_status} /></TableCell>
                          <TableCell>{p.assigned_to ? (adminNames[p.assigned_to] || "Admin") : "—"}</TableCell>
                          <TableCell>{new Date(p.saved_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ================= SEARCH HISTORY TAB ================= */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Search History</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {searchesLoading ? (
                  <div className="p-6 space-y-3">
                    {[0, 1, 2].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
                  </div>
                ) : searches.length === 0 ? (
                  <div className="p-10 text-center text-sm text-gray-500">No searches yet.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Search Term</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Radius</TableHead>
                        <TableHead>Results</TableHead>
                        <TableHead>Website Opportunities</TableHead>
                        <TableHead>Searched By</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {searches.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="whitespace-nowrap">{new Date(s.created_at).toLocaleString()}</TableCell>
                          <TableCell className="font-medium">{s.keyword}{s.business_type ? ` · ${s.business_type}` : ""}</TableCell>
                          <TableCell>{s.location_text}</TableCell>
                          <TableCell>{s.radius_km} km</TableCell>
                          <TableCell>{s.results_count}</TableCell>
                          <TableCell className="text-amber-700 font-medium">{s.website_gap_count}</TableCell>
                          <TableCell>{adminNames[s.searched_by] || "Admin"}</TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={reopening === s.id}
                              onClick={() => reopenSearch(s)}
                            >
                              {reopening === s.id && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}
                              Reopen
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* ================= PROSPECT DETAIL DIALOG ================= */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 flex-wrap">
              {detail?.business_name}
              {detail && <WebsiteStatusBadge status={detail.website_status} />}
              {detail && <ScoreBadge score={detail.opportunity_score} />}
            </DialogTitle>
            <DialogDescription>
              Prospect details from Google Places. Website status reflects Google data only — it does not confirm
              whether the business operates a website.
            </DialogDescription>
          </DialogHeader>

          {detail && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div><span className="text-gray-500">Category</span><p className="font-medium capitalize">{detail.category || "—"}</p></div>
                <div><span className="text-gray-500">Phone</span><p className="font-medium">{detail.phone || "—"}</p></div>
                <div className="sm:col-span-2"><span className="text-gray-500">Address</span><p className="font-medium">{detail.address || "—"}</p></div>
                <div><span className="text-gray-500">Rating</span><p className="font-medium">{detail.google_rating != null ? `${detail.google_rating.toFixed(1)} / 5` : "—"}</p></div>
                <div><span className="text-gray-500">Review Count</span><p className="font-medium">{detail.review_count ?? "—"}</p></div>
                <div><span className="text-gray-500">Discovered</span><p className="font-medium">{new Date(detail.discovered_at).toLocaleString()}</p></div>
                <div><span className="text-gray-500">Saved</span><p className="font-medium">{new Date(detail.saved_at).toLocaleString()}</p></div>
                <div className="sm:col-span-2">
                  <span className="text-gray-500">Google Place ID</span>
                  <p className="font-mono text-xs break-all">{detail.google_place_id}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {detail.google_maps_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={detail.google_maps_url} target="_blank" rel="noopener noreferrer">
                      <MapPin className="w-4 h-4 mr-1.5" /> Open in Google Maps
                    </a>
                  </Button>
                )}
                {detail.website_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={detail.website_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-1.5" /> Open Listed Website
                    </a>
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Prospect Status</Label>
                  <Select value={editStatus} onValueChange={setEditStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PROSPECT_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{PROSPECT_STATUS_LABEL[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Assigned Admin</Label>
                  <Select value={editAssigned} onValueChange={setEditAssigned}>
                    <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {Object.entries(adminNames).map(([id, name]) => (
                        <SelectItem key={id} value={id}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea
                  rows={4}
                  placeholder="Internal notes about this prospect…"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex-wrap gap-2">
            <Button
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => detail && removeProspect(detail)}
            >
              <Trash2 className="w-4 h-4 mr-1.5" /> Remove
            </Button>
            <Button variant="outline" onClick={() => setDetail(null)}>Close</Button>
            <Button onClick={saveDetail} disabled={savingDetail}>
              {savingDetail && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />} Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
