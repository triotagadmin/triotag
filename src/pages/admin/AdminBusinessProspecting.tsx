import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { ProspectMap, type ProspectMapMarker } from "@/components/admin/ProspectMap";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Target, Loader2, Search, Download, ExternalLink, Globe, GlobeLock,
  MapPin, Star, History, Building2, Trash2, Timer, AlertTriangle, Check, Phone,
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

type Suggestion = { placeId: string; name: string; address: string; lat: number; lng: number };

// Mirrors the server-side per-admin live-search window in business-prospecting-search.
const MIN_SEARCH_INTERVAL_MS = 15_000;
const RADIUS_PRESETS = [500, 1000, 2000, 5000, 10000];
const DEFAULT_CENTER = { lat: 14.5547, lng: 121.0244 }; // Makati
const LOCATION_EXAMPLES = ["Makati", "BGC", "Quezon City", "Ortigas", "Cebu City"];

const PROSPECT_STATUSES = ["new", "reviewed", "contacted", "qualified", "proposal", "won", "lost"] as const;

const PROSPECT_STATUS_LABEL: Record<string, string> = {
  new: "New", reviewed: "Reviewed", contacted: "Contacted", qualified: "Qualified",
  proposal: "Proposal", won: "Won", lost: "Lost",
};

const radiusLabel = (m: number) => (m >= 1000 ? `${m / 1000}km` : `${m}m`);

function WebsiteStatusBadge({ status }: { status: string }) {
  if (status === "listed") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-100 text-sky-800 border border-sky-300">
        <Globe className="w-3 h-3" /> Website Listed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-400">
      <GlobeLock className="w-3 h-3" /> Website Opportunity
    </span>
  );
}

function ScoreMeter({ score }: { score: number }) {
  const tone = score >= 70 ? "bg-green-600" : score >= 40 ? "bg-amber-500" : "bg-gray-400";
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="h-1.5 w-16 rounded-full bg-gray-200 overflow-hidden">
        <div className={`h-full ${tone}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-semibold text-gray-900">{score} / 100</span>
    </div>
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
  // --- Search controls ---
  const [keyword, setKeyword] = useState("restaurants");
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [radiusMeters, setRadiusMeters] = useState(2000);
  const [locationLabel, setLocationLabel] = useState("Makati");
  const [locationText, setLocationText] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [locLoading, setLocLoading] = useState(false);
  const locDebounceRef = useRef<ReturnType<typeof setTimeout>>();

  // --- Search state ---
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<PlaceRow[] | null>(null);
  const [searchId, setSearchId] = useState<string | null>(null);
  const [resultCached, setResultCached] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"opportunities" | "all" | "saved">("opportunities");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());

  // --- Auto-search scheduling ---
  const [nextSearchAt, setNextSearchAt] = useState<number | null>(null);
  const [nowTick, setNowTick] = useState(Date.now());
  const lastLiveSearchAtRef = useRef(0);
  const queueTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const searchingRef = useRef(false);
  const rerunRef = useRef(false);
  const lastSearchKeyRef = useRef<string>("");

  // --- Prospects ---
  const [prospects, setProspects] = useState<ProspectRow[]>([]);
  const [prospectsLoading, setProspectsLoading] = useState(true);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [editStatus, setEditStatus] = useState("new");
  const [savingDetail, setSavingDetail] = useState(false);

  // --- History ---
  const [searches, setSearches] = useState<SearchRow[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [adminNames, setAdminNames] = useState<Record<string, string>>({});
  const [reopening, setReopening] = useState<string | null>(null);

  const savedPlaceIds = useMemo(
    () => new Set(prospects.map((p) => p.google_place_id)),
    [prospects],
  );

  // -------------------------------------------------------------------------
  // Data loading
  // -------------------------------------------------------------------------

  const loadProspects = useCallback(async () => {
    setProspectsLoading(true);
    const { data, error } = await supabase
      .from("business_prospects")
      .select("*")
      .order("saved_at", { ascending: false })
      .limit(1000);
    if (error) toast.error(error.message);
    setProspects((data ?? []) as unknown as ProspectRow[]);
    setProspectsLoading(false);
  }, []);

  const loadSearches = useCallback(async () => {
    const { data } = await supabase
      .from("prospect_searches").select("*")
      .order("created_at", { ascending: false }).limit(100);
    setSearches((data ?? []) as unknown as SearchRow[]);
  }, []);

  const loadAdminNames = useCallback(async () => {
    const { data } = await supabase.from("admin_profiles").select("user_id, full_name");
    const map: Record<string, string> = {};
    for (const a of data ?? []) map[a.user_id] = a.full_name || "Admin";
    setAdminNames(map);
  }, []);

  useEffect(() => {
    loadProspects();
    loadSearches();
    loadAdminNames();
  }, [loadProspects, loadSearches, loadAdminNames]);

  // -------------------------------------------------------------------------
  // Location search (server-side Google Places — no key in the browser)
  // -------------------------------------------------------------------------

  const onLocationInput = (v: string) => {
    setLocationText(v);
    if (locDebounceRef.current) clearTimeout(locDebounceRef.current);
    if (v.trim().length < 3) { setSuggestions([]); return; }
    locDebounceRef.current = setTimeout(async () => {
      setLocLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("search-places", {
          body: { query: v.trim(), lat: center.lat, lng: center.lng },
        });
        if (error) throw error;
        setSuggestions(((data as any)?.results ?? []) as Suggestion[]);
      } catch {
        setSuggestions([]);
      }
      setLocLoading(false);
    }, 450);
  };

  const pickSuggestion = (s: Suggestion) => {
    setCenter({ lat: Number(s.lat), lng: Number(s.lng) });
    const display = s.address ? `${s.name} — ${s.address}` : s.name;
    setLocationLabel(display);
    setLocationText(display);
    setSuggestions([]);
  };

  // -------------------------------------------------------------------------
  // Search execution
  // -------------------------------------------------------------------------

  const inputsRef = useRef({ keyword, center, radiusMeters, locationLabel });
  useEffect(() => {
    inputsRef.current = { keyword, center, radiusMeters, locationLabel };
  }, [keyword, center, radiusMeters, locationLabel]);

  type SearchParams = {
    keyword: string; location: string; lat?: number; lng?: number;
    radiusKm: number; limit: number;
  };

  const executeSearch = useCallback(async (
    params: SearchParams,
  ): Promise<"ok" | "error" | "rate_limited"> => {
    setSearching(true);
    searchingRef.current = true;
    try {
      const { data, error } = await supabase.functions.invoke("business-prospecting-search", {
        body: {
          keyword: params.keyword,
          location: params.location,
          ...(params.lat != null && params.lng != null ? { lat: params.lat, lng: params.lng } : {}),
          radiusKm: params.radiusKm,
          limit: params.limit,
        },
      });

      // Non-2xx responses carry the real message in the error context.
      let payload: any = data ?? null;
      if (error && error instanceof FunctionsHttpError) {
        try { payload = JSON.parse(await error.context.text()); } catch { /* ignore */ }
      }
      const serverMsg: string = payload?.error ?? "";
      const errMsg = serverMsg || error?.message || "";

      // Rate-limited: realign the local window and requeue instead of failing.
      const retryAfter = payload?.retryAfterSeconds ?? Number(/wait (\d+)s/i.exec(errMsg)?.[1] ?? 0);
      if (payload?.code === "rate_limited" || retryAfter > 0) {
        const waitMs = (Number(retryAfter) + 1) * 1000;
        lastLiveSearchAtRef.current = Date.now() - (MIN_SEARCH_INTERVAL_MS - waitMs);
        return "rate_limited";
      }
      if (error || serverMsg) {
        console.error("[business-prospecting] search failed:", errMsg);
        setSearchError(errMsg || "Unable to search Google Places right now.");
        return "error";
      }

      setSearchError(null);
      if (!payload.cached) lastLiveSearchAtRef.current = Date.now();
      setResults((payload.results ?? []) as PlaceRow[]);
      setSearchId(payload.searchId ?? null);
      setResultCached(!!payload.cached);
      loadSearches();
      return "ok";
    } catch (e: any) {
      console.error("[business-prospecting] search threw:", e);
      setSearchError("Unable to search Google Places right now.");
      return "error";
    } finally {
      setSearching(false);
      searchingRef.current = false;
    }
  }, [loadSearches]);

  const runSearch = useCallback(async (force = false) => {
    const i = inputsRef.current;
    const kw = i.keyword.trim();
    if (kw.length < 2) return;
    // Duplicate-search protection: identical parameters never re-hit the backend.
    const key = [kw, i.center.lat.toFixed(4), i.center.lng.toFixed(4), i.radiusMeters].join("|");
    if (!force && key === lastSearchKeyRef.current) return;
    if (searchingRef.current) { rerunRef.current = true; return; }
    lastSearchKeyRef.current = key;
    const outcome = await executeSearch({
      keyword: kw,
      location: i.locationLabel.trim(),
      lat: i.center.lat,
      lng: i.center.lng,
      radiusKm: i.radiusMeters / 1000,
      limit: 20,
    });
    if (outcome !== "ok") lastSearchKeyRef.current = "";
    if (outcome === "rate_limited" || rerunRef.current) {
      rerunRef.current = false;
      scheduleRef.current();
    }
  }, [executeSearch]);

  // Queue a search respecting the server's per-admin live-search window.
  const schedule = useCallback(() => {
    if (inputsRef.current.keyword.trim().length < 2) return;
    if (queueTimerRef.current) { clearTimeout(queueTimerRef.current); queueTimerRef.current = undefined; }
    const elapsed = Date.now() - lastLiveSearchAtRef.current;
    const wait = lastLiveSearchAtRef.current > 0 ? MIN_SEARCH_INTERVAL_MS - elapsed : 0;
    if (wait > 0) {
      setNextSearchAt(Date.now() + wait);
      queueTimerRef.current = setTimeout(() => {
        queueTimerRef.current = undefined;
        setNextSearchAt(null);
        void runSearch();
      }, wait + 150);
    } else {
      setNextSearchAt(null);
      void runSearch();
    }
  }, [runSearch]);

  const scheduleRef = useRef(schedule);
  useEffect(() => { scheduleRef.current = schedule; }, [schedule]);

  // Debounced auto-search: ~800ms after the location, category, radius or map settles.
  useEffect(() => {
    if (keyword.trim().length < 2) {
      if (queueTimerRef.current) { clearTimeout(queueTimerRef.current); queueTimerRef.current = undefined; }
      setNextSearchAt(null);
      return;
    }
    const t = setTimeout(() => schedule(), 800);
    return () => clearTimeout(t);
  }, [center.lat, center.lng, radiusMeters, keyword, schedule]);

  useEffect(() => {
    if (!nextSearchAt) return;
    const iv = setInterval(() => setNowTick(Date.now()), 500);
    return () => clearInterval(iv);
  }, [nextSearchAt]);

  useEffect(() => () => {
    if (queueTimerRef.current) clearTimeout(queueTimerRef.current);
  }, []);

  const handleMapCenterChange = useCallback((c: { lat: number; lng: number }) => {
    setCenter((prev) =>
      Math.abs(prev.lat - c.lat) < 1e-5 && Math.abs(prev.lng - c.lng) < 1e-5 ? prev : c,
    );
  }, []);

  const reopenSearch = async (s: SearchRow) => {
    setReopening(s.id);
    lastSearchKeyRef.current = "";
    await executeSearch({
      keyword: s.keyword, location: s.location_text,
      radiusKm: s.radius_km, limit: s.result_limit,
    });
    setKeyword(s.keyword);
    setLocationLabel(s.location_text);
    setReopening(null);
    setHistoryOpen(false);
  };

  // -------------------------------------------------------------------------
  // Save prospects
  // -------------------------------------------------------------------------

  const saveProspect = async (p: PlaceRow) => {
    if (savedPlaceIds.has(p.google_place_id)) return;
    setSavingIds((s) => new Set(s).add(p.google_place_id));
    const { data: { user } } = await supabase.auth.getUser();
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
    setSavingIds((s) => { const n = new Set(s); n.delete(p.google_place_id); return n; });

    if (error) {
      // Google Place ID uniqueness prevents duplicates.
      if (error.code === "23505") toast.info("Already saved as a prospect");
      else toast.error(error.message);
    } else {
      toast.success(`${p.business_name} saved as a prospect`);
    }
    await loadProspects();
  };

  const removeProspect = async (id: string) => {
    const { error } = await supabase.from("business_prospects").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Prospect removed");
    setDetailId(null);
    loadProspects();
  };

  // -------------------------------------------------------------------------
  // Derived data
  // -------------------------------------------------------------------------

  const areaResults = results ?? [];
  const opportunities = useMemo(
    () => areaResults.filter((r) => r.website_status === "not_listed"),
    [areaResults],
  );
  const visible: PlaceRow[] = useMemo(() => {
    if (filter === "saved") return prospects as PlaceRow[];
    const rows = filter === "opportunities" ? opportunities : areaResults;
    return [...rows].sort((a, b) => b.opportunity_score - a.opportunity_score);
  }, [filter, areaResults, opportunities, prospects]);

  const markers: ProspectMapMarker[] = useMemo(() => {
    const source = filter === "saved" ? (prospects as PlaceRow[]) : areaResults;
    return source
      .filter((r) => typeof r.latitude === "number" && typeof r.longitude === "number")
      .map((r) => ({
        id: r.google_place_id,
        lat: r.latitude as number,
        lng: r.longitude as number,
        name: r.business_name,
        opportunity: r.website_status === "not_listed",
        saved: savedPlaceIds.has(r.google_place_id),
      }));
  }, [filter, areaResults, prospects, savedPlaceIds]);

  const detailPlace: PlaceRow | null = useMemo(() => {
    if (!detailId) return null;
    return (
      areaResults.find((r) => r.google_place_id === detailId) ??
      (prospects.find((p) => p.google_place_id === detailId) as PlaceRow | undefined) ??
      null
    );
  }, [detailId, areaResults, prospects]);

  const detailProspect = useMemo(
    () => (detailId ? prospects.find((p) => p.google_place_id === detailId) ?? null : null),
    [detailId, prospects],
  );

  useEffect(() => {
    setEditNotes(detailProspect?.notes ?? "");
    setEditStatus(detailProspect?.prospect_status ?? "new");
  }, [detailProspect]);

  const saveDetail = async () => {
    if (!detailProspect) return;
    setSavingDetail(true);
    const { error } = await supabase
      .from("business_prospects")
      .update({ notes: editNotes || null, prospect_status: editStatus } as any)
      .eq("id", detailProspect.id);
    setSavingDetail(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Prospect updated");
    loadProspects();
  };

  const exportCsv = () => {
    if (!prospects.length) { toast.info("No prospects to export"); return; }
    const blob = new Blob([toCsv(prospects)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `triotag-prospects-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${prospects.length} prospects`);
  };

  const openDetail = (id: string) => { setSelectedId(id); setDetailId(id); };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />

      <div className="px-4 lg:px-6 py-4">
        {/* Compact header */}
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <Target className="w-6 h-6 text-green-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">Business Prospecting</h1>
              <p className="text-sm text-gray-700">
                Find businesses with website opportunities using Google Places data.
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="text-gray-900" onClick={() => setHistoryOpen(true)}>
            <History className="w-4 h-4 mr-1.5" /> Search History
          </Button>
        </div>

        {/* Workspace: map (60%) + panel (40%) */}
        <div className="flex flex-col lg:flex-row gap-4 lg:items-start">
          {/* ---------------- MAP ---------------- */}
          <div className="h-[380px] lg:h-[calc(100vh-9rem)] lg:sticky lg:top-4 w-full lg:w-[60%] rounded-xl overflow-hidden border border-gray-300 bg-white shadow-sm relative shrink-0">
            <ProspectMap
              center={center}
              radiusMeters={radiusMeters}
              markers={markers}
              selectedId={selectedId}
              searching={searching}
              onCenterChange={handleMapCenterChange}
              onSelect={openDetail}
            />
          </div>

          {/* ---------------- PANEL ---------------- */}
          <div className="w-full lg:w-[40%] min-w-0 flex flex-col gap-3">

            {/* Controls */}
            <div className="bg-white border border-gray-300 rounded-xl p-4 space-y-3 shadow-sm">
              <div className="space-y-1.5 relative">
                <Label className="text-gray-900 font-semibold text-sm">Search location</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500 z-[1]" />
                  <Input
                    value={locationText}
                    onChange={(e) => onLocationInput(e.target.value)}
                    placeholder="Search location…"
                    className="pl-9 h-10 bg-white text-gray-900 placeholder:text-gray-500 border-gray-300"
                  />
                  {locLoading && <Loader2 className="absolute right-3 top-3 w-4 h-4 text-gray-500 animate-spin" />}
                </div>
                <p className="text-xs text-gray-600">
                  e.g. {LOCATION_EXAMPLES.join(", ")} — or click / drag the map pin.
                </p>
                {suggestions.length > 0 && (
                  <div className="absolute z-[1000] top-full mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {suggestions.map((s) => (
                      <button
                        key={s.placeId}
                        onClick={() => pickSuggestion(s)}
                        className="w-full text-left px-3 py-2 text-sm text-gray-900 hover:bg-gray-100 border-b border-gray-100 last:border-0"
                      >
                        <MapPin className="inline w-3 h-3 mr-1 text-green-700" />
                        <span className="font-medium">{s.name}</span>
                        {s.address && <span className="text-gray-600"> — {s.address}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-gray-900 font-semibold text-sm">Business category</Label>
                <Input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="restaurants, dental clinic, hotel…"
                  className="h-10 bg-white text-gray-900 placeholder:text-gray-500 border-gray-300"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-gray-900 font-semibold text-sm">Radius</Label>
                <div className="flex gap-2 flex-wrap">
                  {RADIUS_PRESETS.map((r) => {
                    const active = radiusMeters === r;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRadiusMeters(r)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${
                          active
                            ? "bg-green-600 border-green-700 text-white shadow"
                            : "bg-white border-gray-300 text-gray-800 hover:bg-gray-100"
                        }`}
                      >
                        {radiusLabel(r)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="text-xs text-gray-700 flex items-center gap-2 flex-wrap">
                {searching ? (
                  <span className="inline-flex items-center gap-1.5 text-gray-800 font-medium">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Searching this area…
                  </span>
                ) : nextSearchAt ? (
                  <span className="inline-flex items-center gap-1.5 text-amber-800 font-semibold">
                    <Timer className="w-3.5 h-3.5" />
                    Next search available in {Math.max(1, Math.ceil((nextSearchAt - nowTick) / 1000))}s
                  </span>
                ) : keyword.trim().length < 2 ? (
                  <span>Enter a business category to start searching automatically.</span>
                ) : (
                  <span>
                    Searches run automatically when you move the map, change the radius or the category.
                    {resultCached && " Showing cached results (no new Google API call)."}
                  </span>
                )}
              </div>
            </div>

            {/* Error */}
            {searchError && (
              <div className="bg-red-50 border border-red-300 rounded-xl p-3 flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
                <div className="text-sm text-red-900 flex-1">
                  <p className="font-semibold">Unable to search Google Places right now.</p>
                  <p className="text-red-800">{searchError}</p>
                </div>
                <Button size="sm" variant="outline" className="border-red-300 text-red-800"
                  onClick={() => { lastSearchKeyRef.current = ""; void runSearch(true); }}>
                  Try Again
                </Button>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white border border-gray-300 rounded-xl px-3 py-2.5 shadow-sm">
                <div className="text-[11px] font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" /> Found
                </div>
                <div className="text-2xl font-bold text-gray-900">{areaResults.length}</div>
              </div>
              <div className="bg-white border border-gray-300 rounded-xl px-3 py-2.5 shadow-sm">
                <div className="text-[11px] font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-1">
                  <GlobeLock className="w-3.5 h-3.5" /> Opportunities
                </div>
                <div className="text-2xl font-bold text-amber-700">{opportunities.length}</div>
              </div>
              <div className="bg-white border border-gray-300 rounded-xl px-3 py-2.5 shadow-sm">
                <div className="text-[11px] font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Saved
                </div>
                <div className="text-2xl font-bold text-green-700">{prospects.length}</div>
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              {([
                ["opportunities", `Website Opportunities (${opportunities.length})`],
                ["all", `All Businesses (${areaResults.length})`],
                ["saved", `Saved (${prospects.length})`],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    filter === key
                      ? "bg-gray-900 border-gray-900 text-white"
                      : "bg-white border-gray-300 text-gray-800 hover:bg-gray-100"
                  }`}
                >
                  {label}
                </button>
              ))}
              {filter === "saved" && (
                <Button variant="outline" size="sm" className="h-8 text-gray-900" onClick={exportCsv}>
                  <Download className="w-3.5 h-3.5 mr-1.5" /> CSV
                </Button>
              )}
            </div>

            {/* Results list */}
            <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2">
              {searching && !results ? (
                [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)
              ) : filter === "saved" && prospectsLoading ? (
                [0, 1, 2].map((i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)
              ) : visible.length === 0 ? (
                <div className="bg-white border border-gray-300 rounded-xl p-8 text-center">
                  <p className="text-sm font-semibold text-gray-900">
                    {filter === "saved"
                      ? "No saved prospects yet."
                      : results === null
                        ? "Set a location and category to start."
                        : "No businesses found in this area."}
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    {filter === "saved"
                      ? "Save businesses from the results list to track them here."
                      : "Try increasing the radius, changing the category, or moving the map."}
                  </p>
                </div>
              ) : (
                visible.map((r) => {
                  const isSaved = savedPlaceIds.has(r.google_place_id);
                  const isSaving = savingIds.has(r.google_place_id);
                  const isSelected = selectedId === r.google_place_id;
                  return (
                    <div
                      key={r.google_place_id}
                      onClick={() => setSelectedId(r.google_place_id)}
                      className={`bg-white rounded-xl border p-3 cursor-pointer transition-shadow ${
                        isSelected ? "border-gray-900 shadow-md" : "border-gray-300 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-gray-900 truncate">{r.business_name}</h3>
                          <p className="text-xs text-gray-700 capitalize">{r.category || "Business"}</p>
                        </div>
                        <div className="text-right shrink-0">
                          {r.google_rating != null && (
                            <div className="inline-flex items-center gap-1 text-xs font-semibold text-gray-900">
                              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                              {r.google_rating.toFixed(1)}
                            </div>
                          )}
                          <div className="text-[11px] text-gray-600">{r.review_count ?? 0} reviews</div>
                        </div>
                      </div>

                      <p className="mt-1.5 text-xs text-gray-700 flex items-start gap-1">
                        <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-gray-500" />
                        <span className="line-clamp-1">
                          {[r.city, r.region].filter(Boolean).join(", ") || r.address || "—"}
                        </span>
                      </p>

                      <div className="mt-2 flex items-center justify-between gap-2 flex-wrap">
                        <div>
                          <WebsiteStatusBadge status={r.website_status} />
                          {r.website_status === "not_listed" && (
                            <p className="text-[11px] text-amber-900 mt-1">No website listed on Google</p>
                          )}
                        </div>
                        <ScoreMeter score={r.opportunity_score} />
                      </div>

                      <div className="mt-2.5 flex items-center gap-2">
                        <Button
                          size="sm" variant="outline" className="h-8 text-gray-900"
                          onClick={(e) => { e.stopPropagation(); openDetail(r.google_place_id); }}
                        >
                          View
                        </Button>
                        {isSaved ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700">
                            <Check className="w-3.5 h-3.5" /> Saved
                          </span>
                        ) : (
                          <Button
                            size="sm" className="h-8 bg-green-600 hover:bg-green-700 text-white"
                            disabled={isSaving}
                            onClick={(e) => { e.stopPropagation(); void saveProspect(r); }}
                          >
                            {isSaving && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}
                            Save Prospect
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- DETAIL DRAWER ---------------- */}
      <Sheet open={!!detailId} onOpenChange={(o) => !o && setDetailId(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto bg-white">
          <SheetHeader>
            <SheetTitle className="text-gray-900">{detailPlace?.business_name}</SheetTitle>
            <SheetDescription className="text-gray-700">
              Google Places data. "No website listed on Google" flags an opportunity — it does not
              confirm the business has no website.
            </SheetDescription>
          </SheetHeader>

          {detailPlace && (
            <div className="mt-4 space-y-4 text-sm">
              <div className="flex items-center gap-2 flex-wrap">
                <WebsiteStatusBadge status={detailPlace.website_status} />
                {detailProspect && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700">
                    <Check className="w-3.5 h-3.5" /> Saved prospect
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div>
                  <span className="text-xs text-gray-600">Category</span>
                  <p className="font-medium text-gray-900 capitalize">{detailPlace.category || "—"}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-600">Phone</span>
                  <p className="font-medium text-gray-900 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-gray-500" />{detailPlace.phone || "—"}
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="text-xs text-gray-600">Address</span>
                  <p className="font-medium text-gray-900">{detailPlace.address || "—"}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-600">Google rating</span>
                  <p className="font-medium text-gray-900">
                    {detailPlace.google_rating != null ? `${detailPlace.google_rating.toFixed(1)} / 5` : "—"}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-gray-600">Reviews</span>
                  <p className="font-medium text-gray-900">{detailPlace.review_count ?? "—"}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-xs text-gray-600">Website</span>
                  <p className="font-medium text-gray-900 break-all">
                    {detailPlace.website_url || "No website listed on Google"}
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="text-xs text-gray-600">Google Place ID</span>
                  <p className="font-mono text-xs text-gray-900 break-all">{detailPlace.google_place_id}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-xs text-gray-600">Opportunity score</span>
                  <div className="mt-1"><ScoreMeter score={detailPlace.opportunity_score} /></div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {detailProspect ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-green-100 text-green-800 border border-green-300">
                    <Check className="w-4 h-4" /> Saved
                  </span>
                ) : (
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    disabled={savingIds.has(detailPlace.google_place_id)}
                    onClick={() => saveProspect(detailPlace)}
                  >
                    {savingIds.has(detailPlace.google_place_id) && (
                      <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                    )}
                    Save Prospect
                  </Button>
                )}
                {detailPlace.google_maps_url && (
                  <Button size="sm" variant="outline" className="text-gray-900" asChild>
                    <a href={detailPlace.google_maps_url} target="_blank" rel="noopener noreferrer">
                      <MapPin className="w-4 h-4 mr-1.5" /> Open Google Maps
                    </a>
                  </Button>
                )}
                {detailPlace.website_url && (
                  <Button size="sm" variant="outline" className="text-gray-900" asChild>
                    <a href={detailPlace.website_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-1.5" /> Open Website
                    </a>
                  </Button>
                )}
              </div>

              {detailProspect && (
                <div className="border-t border-gray-200 pt-4 space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-gray-900 font-semibold">Prospect status</Label>
                    <Select value={editStatus} onValueChange={setEditStatus}>
                      <SelectTrigger className="text-gray-900"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PROSPECT_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>{PROSPECT_STATUS_LABEL[s]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-gray-900 font-semibold">Notes</Label>
                    <Textarea
                      rows={4}
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Internal notes about this prospect…"
                      className="text-gray-900 placeholder:text-gray-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={saveDetail} disabled={savingDetail}>
                      {savingDetail && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />} Save Changes
                    </Button>
                    <Button
                      size="sm" variant="outline"
                      className="text-red-700 border-red-300 hover:bg-red-50"
                      onClick={() => removeProspect(detailProspect.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-1.5" /> Remove
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ---------------- SEARCH HISTORY ---------------- */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Search History</DialogTitle>
          </DialogHeader>
          {searches.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-700">No searches yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-gray-800">Date</TableHead>
                  <TableHead className="text-gray-800">Search Term</TableHead>
                  <TableHead className="text-gray-800">Location</TableHead>
                  <TableHead className="text-gray-800">Radius</TableHead>
                  <TableHead className="text-gray-800">Results</TableHead>
                  <TableHead className="text-gray-800">Opportunities</TableHead>
                  <TableHead className="text-gray-800">Searched By</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {searches.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="whitespace-nowrap text-gray-900">
                      {new Date(s.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-medium text-gray-900">{s.keyword}</TableCell>
                    <TableCell className="text-gray-800 max-w-[220px] truncate">{s.location_text}</TableCell>
                    <TableCell className="text-gray-800">{s.radius_km} km</TableCell>
                    <TableCell className="text-gray-800">{s.results_count}</TableCell>
                    <TableCell className="text-amber-800 font-semibold">{s.website_gap_count}</TableCell>
                    <TableCell className="text-gray-800">{adminNames[s.searched_by] || "Admin"}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline" size="sm" className="text-gray-900"
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
        </DialogContent>
      </Dialog>
    </div>
  );
}
