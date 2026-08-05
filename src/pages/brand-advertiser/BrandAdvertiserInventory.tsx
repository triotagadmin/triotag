import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Image as ImageIcon,
  Monitor,
  Volume2,
  ArrowRight,
  ArrowLeft,
  ClipboardList,
  MapPin,
  Search as SearchIcon,
  Check,
  Save,
  Rocket,
  Trash2,
  Lock as LockIcon,
  Unlock as UnlockIcon,
  FolderOpen,
  FileImage,
  Video as VideoIcon,
  Music,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import BrandAdvertiserTopBar from "@/components/brand-advertiser/BrandAdvertiserTopBar";
import { RadiusMapPlanner } from "@/components/advertiser/RadiusMapPlanner";
import { calculateMediaPlanEstimate } from "@/lib/mediaPlanPricing";

const DEFAULT_CENTER = { lat: 14.5995, lng: 120.9842 };

type MediaType = "OOH" | "DOOH" | "AOOH";

interface AdSpaceRow {
  id: string;
  title: string;
  location: string | null;
  media_type: string;
  media_types?: string[] | null;
  pricing: any;
  monthly_subscription_fee: number | null;
  latitude: number | null;
  longitude: number | null;
  specifications: any;
  publisher_profiles?: { business_name: string | null; is_house_account: boolean | null } | null;
}

const FORMATS: {
  key: MediaType;
  title: string;
  desc: string;
  icon: any;
  border: string;
  bg: string;
  iconColor: string;
}[] = [
  {
    key: "OOH",
    title: "OOH",
    desc: "Out-of-Home print placements",
    icon: ImageIcon,
    border: "border-purple-400",
    bg: "bg-purple-50",
    iconColor: "text-purple-600",
  },
  {
    key: "DOOH",
    title: "DOOH",
    desc: "Digital screens with scheduled creative",
    icon: Monitor,
    border: "border-cyan-400",
    bg: "bg-cyan-50",
    iconColor: "text-cyan-600",
  },
  {
    key: "AOOH",
    title: "AOOH",
    desc: "Ambient / audio placements",
    icon: Volume2,
    border: "border-green-400",
    bg: "bg-green-50",
    iconColor: "text-green-600",
  },
];

const SUBTYPES: Record<MediaType, string[]> = {
  OOH: [
    "Table Tents",
    "Floor Stickers",
    "Window Stickers",
    "Wall Posters",
    "Wall Decals",
    "Counter Cards",
    "Hanging Danglers",
    "Standees",
  ],
  DOOH: [
    "Indoor LED Screens",
    "Outdoor LED Billboards",
    "Digital Menu Boards",
    "Elevator Screens",
    "Checkout Counter Screens",
    "Transit Digital Panels",
  ],
  AOOH: [
    "In-Store Audio Spots",
    "Radio Ad Insertions",
    "Ambient Jingles",
    "PA System Announcements",
    "Scent / Sensory Ambient",
  ],
};

// PHP price per unit (per placement / per slot / per month)
const SUBTYPE_PRICES: Record<string, number> = {
  // OOH — per printed unit
  "Table Tents": 150,
  "Floor Stickers": 220,
  "Window Stickers": 180,
  "Wall Posters": 120,
  "Wall Decals": 200,
  "Counter Cards": 130,
  "Hanging Danglers": 110,
  "Standees": 450,
  // DOOH — per screen / month
  "Indoor LED Screens": 3500,
  "Outdoor LED Billboards": 12000,
  "Digital Menu Boards": 2800,
  "Elevator Screens": 2200,
  "Checkout Counter Screens": 1800,
  "Transit Digital Panels": 4200,
  // AOOH — per spot / month
  "In-Store Audio Spots": 900,
  "Radio Ad Insertions": 1500,
  "Ambient Jingles": 700,
  "PA System Announcements": 500,
  "Scent / Sensory Ambient": 2500,
};

const priceFor = (sub: string) => SUBTYPE_PRICES[sub] ?? 0;
const fmtPHP = (n: number) => `₱${n.toLocaleString("en-PH")}`;

const LOCATION_TYPES = [
  "Cafe",
  "Co-working Space",
  "Barber Shop",
  "Salon",
  "Supermarket",
  "Convenience Store",
  "Restaurant",
  "Fast Food",
  "Bar",
  "Nightclub",
  "Gym",
  "Pharmacy",
  "Mall",
  "Clothing Store",
  "Department Store",
] as const;

const LOCATION_TYPE_QUERY: Record<string, { type?: string; keyword?: string }> = {
  "Cafe": { type: "cafe" },
  "Co-working Space": { keyword: "co-working space" },
  "Barber Shop": { keyword: "barber shop" },
  "Salon": { type: "beauty_salon" },
  "Supermarket": { type: "supermarket" },
  "Convenience Store": { type: "convenience_store" },
  "Restaurant": { type: "restaurant" },
  "Fast Food": { type: "meal_takeaway" },
  "Bar": { type: "bar" },
  "Nightclub": { type: "night_club" },
  "Gym": { type: "gym" },
  "Pharmacy": { type: "pharmacy" },
  "Mall": { type: "shopping_mall" },
  "Clothing Store": { type: "clothing_store" },
  "Department Store": { type: "department_store" },
};

interface PlaceMarker {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  verified?: boolean;
}



function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function distanceLabel(m: number): string {
  if (m < 1000) return `${Math.round(m)}m away`;
  return `${(m / 1000).toFixed(m < 10000 ? 2 : 1)}km away`;
}

export default function BrandAdvertiserInventory() {
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState("My Brand");
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [radiusMeters, setRadiusMeters] = useState(1000);
  const [radiusLocked, setRadiusLocked] = useState(false);

  const [chosenFormat, setChosenFormat] = useState<MediaType | null>(null);
  const [unitCounts, setUnitCounts] = useState<Record<MediaType, Record<string, string>>>({
    OOH: {},
    DOOH: {},
    AOOH: {},
  });
  const [rows, setRows] = useState<AdSpaceRow[]>([]);

  const [totalLocations, setTotalLocations] = useState<string>("");
  const [selectedLocationTypes, setSelectedLocationTypes] = useState<Record<string, PlaceMarker[]>>({});
  const [placeResults, setPlaceResults] = useState<Record<string, PlaceMarker[]>>({});
  const [placeLoading, setPlaceLoading] = useState<Record<string, boolean>>({});

  const selectedPlacesTotal = Object.values(selectedLocationTypes).reduce(
    (s, arr) => s + arr.length,
    0,
  );

  const fetchVerifiedAdSpaces = async () => {
    const { data: spaces } = await supabase
      .from("ad_spaces")
      .select("id, latitude, longitude, contact_verified_at")
      .not("latitude", "is", null)
      .not("longitude", "is", null);
    const inRadius = (spaces || []).filter(
      (s: any) =>
        haversineMeters(center.lat, center.lng, Number(s.latitude), Number(s.longitude)) <=
        radiusMeters,
    );
    if (inRadius.length === 0) return [] as { lat: number; lng: number }[];
    const { data: subs } = await supabase
      .from("venue_subscriptions")
      .select("id, ad_space_id, subscription_status")
      .in("ad_space_id", inRadius.map((s: any) => s.id));
    const activeIds = new Set(
      (subs || [])
        .filter((s: any) => s.subscription_status === "active")
        .map((s: any) => s.ad_space_id),
    );
    return inRadius
      .filter((s: any) => s.contact_verified_at != null || activeIds.has(s.id))
      .map((s: any) => ({ lat: Number(s.latitude), lng: Number(s.longitude) }));
  };

  const loadPlacesForCategory = async (category: string) => {
    if (placeResults[category]) return;
    setPlaceLoading((p) => ({ ...p, [category]: true }));
    try {
      const q = LOCATION_TYPE_QUERY[category] || {};
      const [{ data, error }, verifiedPoints] = await Promise.all([
        supabase.functions.invoke("discover-nearby-places", {
          body: { lat: center.lat, lng: center.lng, radiusMeters, ...q },
        }),
        fetchVerifiedAdSpaces(),
      ]);
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const places: PlaceMarker[] = (data?.results ?? [])
        .filter((r: any) => typeof r.lat === "number" && typeof r.lng === "number")
        .map((r: any) => ({
          id: r.placeId,
          name: r.name,
          address: r.address || "",
          lat: r.lat,
          lng: r.lng,
          verified: verifiedPoints.some(
            (v) => haversineMeters(v.lat, v.lng, r.lat, r.lng) <= 60,
          ),
        }));
      setPlaceResults((p) => ({ ...p, [category]: places }));
    } catch (err: any) {
      console.error("[BrandAdvertiserInventory] places fetch failed", err);
      toast({
        title: "Could not load locations",
        description: err?.message || `Failed to fetch ${category} nearby.`,
        variant: "destructive",
      });
      setPlaceResults((p) => ({ ...p, [category]: [] }));
    } finally {
      setPlaceLoading((p) => ({ ...p, [category]: false }));
    }
  };

  const toggleCategory = (t: string, on: boolean) => {
    setSelectedLocationTypes((prev) => {
      const next = { ...prev };
      if (on) delete next[t];
      else next[t] = [];
      return next;
    });
    if (!on) loadPlacesForCategory(t);
  };

  const togglePlace = (t: string, place: PlaceMarker) => {
    setSelectedLocationTypes((prev) => {
      const cur = prev[t] || [];
      const exists = cur.some((p) => p.id === place.id);
      return {
        ...prev,
        [t]: exists ? cur.filter((p) => p.id !== place.id) : [...cur, place],
      };
    });
  };

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const [loadingRows, setLoadingRows] = useState(false);

  // Creative sets (step 3)
  const [creativeSets, setCreativeSets] = useState<any[]>([]);
  const [loadingCreatives, setLoadingCreatives] = useState(false);
  const [chosenCreativeSetId, setChosenCreativeSetId] = useState<string | null>(null);

  interface SavedTarget {
    id: string;
    createdAt: number;
    format: MediaType;
    unitBreakdown: Record<string, number>;
    unitCount: number;
    totalLocations: number;
    locationTypes: Record<string, number>;
    radiusMeters: number;
    center: { lat: number; lng: number };
    creativeSetId?: string | null;
    creativeSetTitle?: string | null;
  }
  const [savedTargets, setSavedTargets] = useState<SavedTarget[]>(() => {
    try {
      const raw = localStorage.getItem("ba_saved_inventory_targets");
      return raw ? (JSON.parse(raw) as SavedTarget[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("ba_saved_inventory_targets", JSON.stringify(savedTargets));
    } catch {}
  }, [savedTargets]);


  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from("brand_advertiser_profiles")
          .select("id, company_name")
          .eq("user_id", session.user.id)
          .maybeSingle();
        if (profile?.company_name) setCompanyName(profile.company_name);
        if (profile?.id) {
          setLoadingCreatives(true);
          const { data: sets } = await supabase
            .from("brand_creative_sets" as any)
            .select("*")
            .eq("brand_advertiser_id", profile.id)
            .order("created_at", { ascending: false });
          setCreativeSets(sets || []);
          setLoadingCreatives(false);
        }
      }
    })();
  }, []);

  useEffect(() => {
    if (!chosenFormat) {
      setRows([]);
      return;
    }
    (async () => {
      setLoadingRows(true);
      const { data } = await supabase
        .from("ad_spaces")
        .select(
          "id,title,location,media_type,media_types,pricing,monthly_subscription_fee,latitude,longitude,specifications,publisher_profiles(business_name,is_house_account)"
        )
        .eq("approval_status", "approved")
        .or("agent_disconnected.is.null,agent_disconnected.eq.false")
        .order("created_at", { ascending: false });
      setRows((data || []) as any);
      setLoadingRows(false);
    })();
  }, [chosenFormat]);

  const matches = useMemo(() => {
    if (!chosenFormat) return [];
    return rows
      .filter((r) => {
        const units = (r.specifications && r.specifications.units) || null;
        const unitCt = units ? Number(units[chosenFormat] || 0) : 0;
        const inArray = Array.isArray(r.media_types) && r.media_types.includes(chosenFormat);
        return inArray || r.media_type === chosenFormat || unitCt > 0;
      })
      .filter((r) => r.latitude != null && r.longitude != null)
      .map((r) => ({
        row: r,
        distance: haversineMeters(center.lat, center.lng, Number(r.latitude), Number(r.longitude)),
      }))
      .filter((m) => m.distance <= radiusMeters)
      .sort((a, b) => a.distance - b.distance);
  }, [rows, chosenFormat, center.lat, center.lng, radiusMeters]);

  const estimate = useMemo(
    () => calculateMediaPlanEstimate([], radiusMeters),
    [radiusMeters]
  );

  const displayBusinessName = (r: AdSpaceRow) =>
    r.publisher_profiles?.is_house_account
      ? "TrioTag"
      : r.publisher_profiles?.business_name || "Retail Partner";

  const totalUnitsForFormat = (fmt: MediaType) =>
    Object.values(unitCounts[fmt]).reduce((sum, v) => sum + (Number(v) || 0), 0);

  const submitRegistry = () => {
    if (!chosenFormat) return;
    const breakdown = unitCounts[chosenFormat];
    const unitBreakdown = Object.fromEntries(
      Object.entries(breakdown)
        .map(([k, v]) => [k, Number(v) || 0])
        .filter(([, n]) => (n as number) > 0),
    ) as Record<string, number>;
    const locationTypes = Object.fromEntries(
      Object.entries(selectedLocationTypes)
        .map(([k, v]) => [k, Number(v) || 0])
        .filter(([, n]) => (n as number) > 0),
    ) as Record<string, number>;
    const chosenSet = creativeSets.find((s) => s.id === chosenCreativeSetId);
    const target: SavedTarget = {
      id: (crypto as any).randomUUID?.() || String(Date.now()),
      createdAt: Date.now(),
      format: chosenFormat,
      unitBreakdown,
      unitCount: totalUnitsForFormat(chosenFormat),
      totalLocations: Number(totalLocations) || 0,
      locationTypes,
      radiusMeters,
      center,
      creativeSetId: chosenCreativeSetId,
      creativeSetTitle: chosenSet?.title || null,
    };
    setSavedTargets((prev) => [target, ...prev]);
    // Reset wizard for a fresh save
    setChosenFormat(null);
    setUnitCounts({ OOH: {}, DOOH: {}, AOOH: {} });
    setSelectedLocationTypes({});
    setTotalLocations("");
    setChosenCreativeSetId(null);
    setRadiusLocked(false);
    setStep(1);
  };

  const launchFromTarget = (t: SavedTarget) => {
    navigate("/brand-advertiser/campaigns", {
      state: {
        openWizard: true,
        adSpaceIds: [],
        prefill: {
          radiusMeters: t.radiusMeters,
          center: t.center,
          format: t.format,
          unitCount: t.unitCount,
          unitBreakdown: t.unitBreakdown,
          totalLocations: t.totalLocations,
          locationTypes: t.locationTypes,
          creativeSetId: t.creativeSetId,
          creativeSetTitle: t.creativeSetTitle,
        },
      },
    });
  };

  const deleteTarget = (id: string) => {
    setSavedTargets((prev) => prev.filter((t) => t.id !== id));
  };


  const selectedFormatMeta = FORMATS.find((f) => f.key === chosenFormat);


  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <BrandAdvertiserTopBar companyName={companyName} totalBudget={0} />
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Campaign Unit Registry</h1>
          <p className="text-sm text-gray-500 mt-1">
            Pick your target area and register your ad format and units for this campaign.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* LEFT: Map + radius planner */}
          <div className="lg:col-span-3 space-y-4">
            <RadiusMapPlanner
              center={center}
              radiusMeters={radiusMeters}
              onCenterChange={(c) => {
                setCenter(c);
                setRadiusLocked(false);
              }}
              onRadiusChange={(r) => {
                setRadiusMeters(r);
                setRadiusLocked(false);
              }}
            />

            <div
              className={`border rounded-xl p-4 transition-colors ${
                radiusLocked ? "bg-green-50 border-green-300" : "bg-white border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Coverage Radius
                  </div>
                  <div className="text-sm text-gray-700">
                    {estimate.radiusPercent}% coverage
                    <span className="text-gray-500">
                      {" "}
                      · {(radiusMeters / 1000).toFixed(radiusMeters < 1000 ? 2 : 1)}km
                    </span>
                  </div>

                  <div className="text-xs text-gray-500 mt-1.5">
                    Lock the radius to save it as a requirement for this inventory target.
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={() => setRadiusLocked((v) => !v)}
                  className={`shrink-0 ${
                    radiusLocked
                      ? "bg-green-600 hover:bg-green-500 text-white"
                      : "bg-white border border-green-500 text-green-700 hover:bg-green-50"
                  }`}
                >
                  {radiusLocked ? (
                    <>
                      <LockIcon className="w-4 h-4 mr-1" /> Radius Locked
                    </>
                  ) : (
                    <>
                      <UnlockIcon className="w-4 h-4 mr-1" /> Lock Radius
                    </>
                  )}
                </Button>
              </div>
            </div>

          </div>

          {/* RIGHT: Registry form */}
          <div className="lg:col-span-2">
            <Card className="p-5 bg-white border border-gray-200 sticky top-4">
              <div className="mb-4 flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-gray-900 leading-tight">Unit Registry</h2>
                  <p className="text-xs text-gray-500">
                    {step === 1
                      ? "Step 1 of 4 — Radius & pin location"
                      : step === 2
                      ? "Step 2 of 4 — Ad locations"
                      : step === 3
                      ? "Step 3 of 4 — Ad format & units"
                      : "Step 4 of 4 — Creative set"}
                  </p>
                </div>
              </div>

              {/* Step indicator */}
              <div className="flex items-center gap-2 mb-4">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="flex-1 flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                        step >= (n as 1 | 2 | 3 | 4)
                          ? "bg-green-600 text-white"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {step > (n as 1 | 2 | 3 | 4) ? <Check className="w-3.5 h-3.5" /> : n}
                    </div>
                    {n < 4 && (
                      <div
                        className={`flex-1 h-1 rounded-full ${
                          step > (n as 1 | 2 | 3 | 4) ? "bg-green-600" : "bg-gray-200"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>

              {step === 1 && (
                <>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-semibold text-gray-900">
                        Radius & pin location
                      </Label>
                      <p className="text-xs text-gray-500 mb-2">
                        Drop the pin on the map and lock the coverage radius. This defines where your campaign runs.
                      </p>
                    </div>

                    <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Pin location</span>
                        <span className="text-xs font-mono text-gray-900">
                          {center.lat.toFixed(4)}, {center.lng.toFixed(4)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Radius</span>
                        <span className="text-sm font-semibold text-green-700">
                          {(radiusMeters / 1000).toFixed(radiusMeters < 1000 ? 2 : 1)} km
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Coverage</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {estimate.radiusPercent}%
                        </span>
                      </div>

                    </div>

                    <div
                      className={`rounded-md border px-3 py-2 flex items-center gap-2 ${
                        radiusLocked
                          ? "bg-green-50 border-green-300 text-green-800"
                          : "bg-amber-50 border-amber-200 text-amber-800"
                      }`}
                    >
                      {radiusLocked ? (
                        <LockIcon className="w-4 h-4 shrink-0" />
                      ) : (
                        <UnlockIcon className="w-4 h-4 shrink-0" />
                      )}
                      <span className="text-xs">
                        {radiusLocked
                          ? "Radius locked — you can proceed to Unit Registry."
                          : "Lock the radius on the map to continue."}
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={() => setStep(2)}
                    disabled={!radiusLocked}
                    className="w-full mt-4 bg-green-600 hover:bg-green-500 text-white"
                  >
                    Next: Unit Registry <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-semibold text-gray-900">
                        Type of ad locations
                      </Label>
                      <p className="text-xs text-gray-500 mb-2">
                        Check a venue type to browse real nearby locations, then pick the
                        specific venues you want.
                      </p>
                      <div className="space-y-1.5">
                        {LOCATION_TYPES.map((t) => {
                          const on = selectedLocationTypes[t] !== undefined;
                          const results = placeResults[t];
                          const loading = !!placeLoading[t];
                          const chosen = selectedLocationTypes[t] || [];
                          return (
                            <div
                              key={t}
                              className={`rounded-md border transition-colors ${
                                on ? "bg-green-50 border-green-300" : "bg-white border-gray-200"
                              }`}
                            >
                              <div className="flex items-center gap-2 px-2 py-1.5">
                                <button
                                  type="button"
                                  onClick={() => toggleCategory(t, on)}
                                  className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                                    on
                                      ? "bg-green-600 border-green-600"
                                      : "bg-white border-gray-400"
                                  }`}
                                  aria-label={`Select ${t}`}
                                >
                                  {on && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                                </button>
                                <Label
                                  className="text-xs text-gray-900 flex-1 min-w-0 truncate cursor-pointer"
                                  onClick={() => toggleCategory(t, on)}
                                >
                                  {t}
                                </Label>
                                {on && chosen.length > 0 && (
                                  <span className="text-xs font-semibold text-green-700">
                                    {chosen.length} selected
                                  </span>
                                )}
                              </div>

                              {on && (
                                <div className="border-t border-green-200 px-2 py-2">
                                  {loading && (
                                    <div className="flex items-center gap-2 text-xs text-gray-500 py-2">
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      Finding {t} nearby...
                                    </div>
                                  )}
                                  {!loading && results && results.length === 0 && (
                                    <p className="text-xs text-gray-500 py-2">
                                      No {t} found in this radius.
                                    </p>
                                  )}
                                  {!loading && results && results.length > 0 && (
                                    <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                                      {results.map((p) => {
                                        const picked = chosen.some((c) => c.id === p.id);
                                        return (
                                          <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => togglePlace(t, p)}
                                            className={`w-full text-left flex items-start gap-2 rounded-md border px-2 py-1.5 ${
                                              picked
                                                ? "border-green-500 bg-white"
                                                : "border-gray-200 bg-white hover:border-gray-300"
                                            }`}
                                          >
                                            <span
                                              className={`w-3.5 h-3.5 mt-0.5 rounded border-2 flex items-center justify-center shrink-0 ${
                                                picked
                                                  ? "bg-green-600 border-green-600"
                                                  : "bg-white border-gray-400"
                                              }`}
                                            >
                                              {picked && (
                                                <Check
                                                  className="w-2.5 h-2.5 text-white"
                                                  strokeWidth={3}
                                                />
                                              )}
                                            </span>
                                            <span className="min-w-0 flex-1">
                                              <span className="flex items-center gap-1.5 flex-wrap">
                                                <span className="text-xs font-medium text-gray-900">
                                                  {p.name}
                                                </span>
                                                {p.verified ? (
                                                  <Badge className="h-4 px-1.5 gap-1 bg-green-100 text-green-700 hover:bg-green-100 border border-green-300 text-[10px]">
                                                    <ShieldCheck className="w-2.5 h-2.5" />
                                                    Verified
                                                  </Badge>
                                                ) : (
                                                  <Badge
                                                    variant="secondary"
                                                    className="h-4 px-1.5 bg-gray-100 text-gray-600 hover:bg-gray-100 border border-gray-200 text-[10px]"
                                                  >
                                                    Unverified
                                                  </Badge>
                                                )}
                                              </span>
                                              <span className="block text-[11px] text-gray-500 truncate">
                                                {p.address}
                                              </span>
                                            </span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>


                    <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 flex items-center justify-between">
                      <span className="text-xs text-gray-600">Total ad locations</span>
                      <span className="text-sm font-semibold text-green-700">
                        {Object.values(selectedLocationTypes).reduce(
                          (s, v) => s + (Number(v) || 0),
                          0,
                        )}
                      </span>
                    </div>

                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                      <ArrowLeft className="w-4 h-4 mr-1" /> Back
                    </Button>
                    <Button
                      onClick={() => {
                        const total = Object.values(selectedLocationTypes).reduce(
                          (s, v) => s + (Number(v) || 0),
                          0,
                        );
                        setTotalLocations(String(total));
                        setStep(3);
                      }}
                      disabled={
                        Object.keys(selectedLocationTypes).length === 0 ||
                        Object.values(selectedLocationTypes).reduce(
                          (s, v) => s + (Number(v) || 0),
                          0,
                        ) === 0
                      }
                      className="flex-[2] bg-green-600 hover:bg-green-500 text-white"
                    >
                      Next: Ad format <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-semibold text-gray-900">Ad format</Label>
                      <p className="text-xs text-gray-500 mb-2">
                        Pick one format and enter units per placement type.
                      </p>
                    </div>

                    {/* Format picker */}
                    <div className="space-y-2">
                      {FORMATS.map((f) => {
                        const Icon = f.icon;
                        const active = chosenFormat === f.key;
                        return (
                          <div
                            key={f.key}
                            className={`w-full rounded-xl border-2 transition-all overflow-hidden ${
                              active
                                ? `${f.border} ${f.bg}`
                                : "border-gray-200 hover:border-gray-300 bg-white"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => setChosenFormat(f.key)}
                              className="w-full text-left p-3 flex items-center gap-3"
                            >
                              <div
                                className={`w-10 h-10 rounded-lg ${f.bg} flex items-center justify-center shrink-0`}
                              >
                                <Icon className={`w-5 h-5 ${f.iconColor}`} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-semibold text-gray-900">{f.title}</div>
                                <div className="text-xs text-gray-500">{f.desc}</div>
                              </div>
                              <div
                                className={`w-4 h-4 rounded-full border-2 ${
                                  active ? "border-green-600 bg-green-600" : "border-gray-300"
                                }`}
                              />
                            </button>

                            {active && (
                              <div className="px-3 pb-3">
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <Label className="text-sm font-semibold text-green-900">
                                      {f.title} units by type
                                    </Label>
                                    <span className="text-xs text-green-700 font-medium">
                                      Total: {totalUnitsForFormat(f.key)} ·{" "}
                                      {fmtPHP(
                                        SUBTYPES[f.key].reduce(
                                          (s, sub) =>
                                            s + priceFor(sub) * (Number(unitCounts[f.key][sub]) || 0),
                                          0,
                                        ),
                                      )}
                                    </span>
                                  </div>
                                  <div className="space-y-1.5 pt-1">
                                    {SUBTYPES[f.key].map((sub) => {
                                      const qty = Number(unitCounts[f.key][sub]) || 0;
                                      const unitPrice = priceFor(sub);
                                      const subtotal = unitPrice * qty;
                                      const priceUnit =
                                        f.key === "OOH" ? "unit" : "screen / mo";
                                      return (
                                        <div
                                          key={sub}
                                          className="flex items-center gap-2 bg-white/60 rounded-md border border-green-200/60 px-2 py-1.5"
                                        >
                                          <div className="flex-1 min-w-0">
                                            <Label
                                              htmlFor={`unit-${f.key}-${sub}`}
                                              className="text-xs text-green-900 truncate block"
                                            >
                                              {sub}
                                            </Label>
                                            <div className="text-[10px] text-green-700/80">
                                              {fmtPHP(unitPrice)} / {priceUnit}
                                              {qty > 0 && (
                                                <>
                                                  {" "}
                                                  ·{" "}
                                                  <span className="font-semibold text-green-800">
                                                    {fmtPHP(subtotal)}
                                                  </span>
                                                </>
                                              )}
                                            </div>
                                          </div>
                                          <Input
                                            id={`unit-${f.key}-${sub}`}
                                            type="number"
                                            min="0"
                                            placeholder="0"
                                            value={unitCounts[f.key][sub] || ""}
                                            onChange={(e) =>
                                              setUnitCounts((prev) => ({
                                                ...prev,
                                                [f.key]: { ...prev[f.key], [sub]: e.target.value },
                                              }))
                                            }
                                            className="h-8 w-20 text-right text-green-900 placeholder:text-green-700/60"
                                          />
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                      <ArrowLeft className="w-4 h-4 mr-1" /> Back
                    </Button>
                    <Button
                      onClick={() => setStep(4)}
                      disabled={!chosenFormat || totalUnitsForFormat(chosenFormat) === 0}
                      className="flex-[2] bg-green-600 hover:bg-green-500 text-white"
                    >
                      Next: Creative set <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </>
              )}

              {step === 4 && (
                <>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-semibold text-gray-900">
                        Select a creative set
                      </Label>
                      <p className="text-xs text-gray-500 mb-2">
                        Pick from creatives uploaded on the{" "}
                        <button
                          type="button"
                          onClick={() => navigate("/brand-advertiser/creatives")}
                          className="text-green-700 font-medium underline hover:text-green-800"
                        >
                          Creatives
                        </button>{" "}
                        page.
                      </p>
                    </div>

                    <div className="max-h-[360px] overflow-y-auto -mx-1 px-1 space-y-2">
                      {loadingCreatives ? (
                        <div className="text-center text-gray-500 py-6 text-sm">Loading…</div>
                      ) : creativeSets.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center bg-gray-50">
                          <FolderOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-xs text-gray-600 mb-3">
                            No creatives folder saved yet. Save one on the Creatives page first.
                          </p>
                          <Button
                            size="sm"
                            onClick={() => {
                              toast({
                                title: "Save a creatives folder first",
                                description:
                                  "You don't have any creatives yet. Save a creatives folder on the Creatives page, then come back to choose it.",
                              });
                              navigate("/brand-advertiser/creatives");
                            }}
                            className="bg-green-600 hover:bg-green-500 text-white"
                          >
                            <FolderOpen className="w-4 h-4 mr-1" /> Choose Creatives
                          </Button>
                        </div>
                      ) : (
                        creativeSets.map((s: any) => {
                          const active = chosenCreativeSetId === s.id;
                          const FmtIcon =
                            s.creative_format === "video"
                              ? VideoIcon
                              : s.creative_format === "audio"
                              ? Music
                              : FileImage;
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => setChosenCreativeSetId(s.id)}
                              className={`w-full text-left rounded-lg border-2 p-3 flex items-center gap-3 transition-all ${
                                active
                                  ? "border-green-500 bg-green-50"
                                  : "border-gray-200 hover:border-gray-300 bg-white"
                              }`}
                            >
                              <div
                                className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                                  active ? "bg-green-100" : "bg-gray-100"
                                }`}
                              >
                                <FmtIcon
                                  className={`w-5 h-5 ${
                                    active ? "text-green-700" : "text-gray-600"
                                  }`}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-gray-900 truncate">
                                  {s.title}
                                </div>
                                <div className="text-xs text-gray-500 capitalize">
                                  {s.creative_format} · {s.creative_count || 0} file
                                  {(s.creative_count || 0) === 1 ? "" : "s"}
                                </div>
                              </div>
                              <div
                                className={`w-4 h-4 rounded-full border-2 shrink-0 ${
                                  active ? "border-green-600 bg-green-600" : "border-gray-300"
                                }`}
                              />
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
                      <ArrowLeft className="w-4 h-4 mr-1" /> Back
                    </Button>
                    <Button
                      onClick={submitRegistry}
                      disabled={!chosenFormat || !radiusLocked || !chosenCreativeSetId}
                      className="flex-[2] bg-green-600 hover:bg-green-500 text-white"
                    >
                      <Save className="w-4 h-4 mr-1" /> Save Inventory Target
                    </Button>
                  </div>
                  <p className="text-[11px] text-gray-500 text-center mt-2">
                    {!radiusLocked
                      ? "Radius must be locked (Step 1)."
                      : !chosenCreativeSetId
                      ? "Select a creative set to save."
                      : "Saved targets appear below and can be launched as campaigns anytime."}
                  </p>
                </>

              )}
            </Card>
          </div>
        </div>

        {/* Pending Campaigns */}
        <div className="mt-8">
          <div className="flex items-end justify-between mb-3">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Pending Campaigns</h2>
              <p className="text-sm text-gray-500">
                Saved targeting presets ready to launch as campaigns.
              </p>
            </div>
            <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
              {savedTargets.length} pending
            </Badge>
          </div>

          {savedTargets.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
              <ClipboardList className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                No pending campaigns yet. Complete the wizard and click{" "}
                <span className="font-semibold text-green-700">Save Inventory Target</span> to add one.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {savedTargets.map((t) => {
                const meta = FORMATS.find((f) => f.key === t.format);
                const Icon = meta?.icon || ClipboardList;
                const locEntries = Object.entries(t.locationTypes);
                const unitEntries = Object.entries(t.unitBreakdown);
                return (
                  <div
                    key={t.id}
                    className="rounded-xl border border-gray-200 bg-white p-4 flex flex-col"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className={`w-9 h-9 rounded-lg ${meta?.bg || "bg-gray-100"} flex items-center justify-center`}
                      >
                        <Icon className={`w-5 h-5 ${meta?.iconColor || "text-gray-600"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-900">
                          {t.format} · {t.unitCount} units
                        </div>
                        <div className="text-[11px] text-gray-500">
                          {new Date(t.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteTarget(t.id)}
                        className="text-gray-400 hover:text-red-600 p-1"
                        aria-label="Delete target"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="text-xs text-gray-700 space-y-2 flex-1">
                      <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                        Campaign Details
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-md bg-green-50 border border-green-100 px-2 py-1.5">
                          <div className="flex items-center gap-1 text-[10px] text-green-700 font-semibold uppercase tracking-wide">
                            <LockIcon className="w-3 h-3" /> Radius
                          </div>
                          <div className="text-sm font-semibold text-green-800">
                            {(t.radiusMeters / 1000).toFixed(t.radiusMeters < 1000 ? 2 : 1)} km
                          </div>
                        </div>
                        <div className="rounded-md bg-gray-50 border border-gray-100 px-2 py-1.5">
                          <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">
                            Locations
                          </div>
                          <div className="text-sm font-semibold text-gray-900">
                            {t.totalLocations}
                          </div>
                        </div>
                        <div className="rounded-md bg-gray-50 border border-gray-100 px-2 py-1.5">
                          <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">
                            Ad Format
                          </div>
                          <div className="text-sm font-semibold text-gray-900">{t.format}</div>
                        </div>
                        <div className="rounded-md bg-gray-50 border border-gray-100 px-2 py-1.5">
                          <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">
                            Total Units
                          </div>
                          <div className="text-sm font-semibold text-gray-900">{t.unitCount}</div>
                        </div>
                      </div>

                      {t.creativeSetTitle && (
                        <div className="rounded-md bg-blue-50 border border-blue-100 px-2 py-1.5 flex items-center gap-1.5">
                          <FolderOpen className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="text-[10px] text-blue-700 font-semibold uppercase tracking-wide">
                              Creative Set
                            </div>
                            <div className="text-xs font-semibold text-blue-900 truncate">
                              {t.creativeSetTitle}
                            </div>
                          </div>
                        </div>
                      )}

                      {locEntries.length > 0 && (
                        <div>
                          <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide mb-1">
                            Ad Location Types
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {locEntries.map(([k, v]) => (
                              <span
                                key={k}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-700"
                              >
                                {k} · {v}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {unitEntries.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">
                              Units by Type
                            </div>
                            <div className="text-[10px] font-semibold text-green-700">
                              Est.{" "}
                              {fmtPHP(
                                unitEntries.reduce(
                                  (s, [k, v]) => s + priceFor(k) * (v as number),
                                  0,
                                ),
                              )}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {unitEntries.map(([k, v]) => (
                              <span
                                key={k}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-green-50 text-green-700 border border-green-100"
                              >
                                {k} · {v} · {fmtPHP(priceFor(k) * (v as number))}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>


                    <Button
                      onClick={() => launchFromTarget(t)}
                      className="w-full mt-3 bg-green-600 hover:bg-green-500 text-white"
                    >
                      <Rocket className="w-4 h-4 mr-1" /> Launch Campaign
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
