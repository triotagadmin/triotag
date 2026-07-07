import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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

  const [chosenFormat, setChosenFormat] = useState<MediaType | null>(null);
  const [unitCounts, setUnitCounts] = useState<Record<MediaType, Record<string, string>>>({
    OOH: {},
    DOOH: {},
    AOOH: {},
  });
  const [rows, setRows] = useState<AdSpaceRow[]>([]);

  const [totalLocations, setTotalLocations] = useState<string>("");
  const [selectedLocationTypes, setSelectedLocationTypes] = useState<Record<string, string>>({});

  const [loadingRows, setLoadingRows] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from("brand_advertiser_profiles")
          .select("company_name")
          .eq("user_id", session.user.id)
          .maybeSingle();
        if (profile?.company_name) setCompanyName(profile.company_name);
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
          "id,title,location,media_type,pricing,monthly_subscription_fee,latitude,longitude,specifications,publisher_profiles(business_name,is_house_account)"
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
        return r.media_type === chosenFormat || unitCt > 0;
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
    navigate("/brand-advertiser/campaigns", {
      state: {
        openWizard: true,
        adSpaceIds: matches.map((m) => m.row.id),
        prefill: {
          radiusMeters,
          center,
          format: chosenFormat,
          unitCount: totalUnitsForFormat(chosenFormat),
          unitBreakdown: Object.fromEntries(
            Object.entries(breakdown)
              .map(([k, v]) => [k, Number(v) || 0])
              .filter(([, n]) => (n as number) > 0)
          ),
          totalLocations: Number(totalLocations) || 0,
          locationTypes: Object.fromEntries(
            Object.entries(selectedLocationTypes)
              .map(([k, v]) => [k, Number(v) || 0])
              .filter(([, n]) => (n as number) > 0)
          ),
        },
      },
    });
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
              onCenterChange={setCenter}
              onRadiusChange={setRadiusMeters}
            />

            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Coverage Radius — affects campaign reach pricing
              </div>
              <div className="text-sm text-gray-700">
                {estimate.radiusPercent}% coverage ={" "}
                <span className="font-semibold text-green-700">
                  ₱{estimate.radiusFee.toLocaleString()}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1.5">
                5% coverage starts at ₱200,000 · 100% coverage is ₱3,500,000
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
                <div>
                  <h2 className="text-lg font-bold text-gray-900 leading-tight">Unit Registry</h2>
                  <p className="text-xs text-gray-500">Pick one ad format for this campaign.</p>
                </div>
              </div>

              {/* Location targeting — how many venues + which types */}
              <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50/60 p-3 space-y-3">
                <div>
                  <Label htmlFor="total-locations" className="text-sm font-semibold text-gray-900">
                    How many ad locations / venues?
                  </Label>
                  <p className="text-xs text-gray-500 mb-1.5">
                    Total number of physical spots you want this campaign to run in.
                  </p>
                  <Input
                    id="total-locations"
                    type="number"
                    min="0"
                    placeholder="e.g. 25"
                    value={totalLocations}
                    onChange={(e) => setTotalLocations(e.target.value)}
                    className="h-9 text-gray-900"
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold text-gray-900">
                    Type of ad locations
                  </Label>
                  <p className="text-xs text-gray-500 mb-1.5">
                    Tap the venue types you want, then set how many of each.
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {LOCATION_TYPES.map((t) => {
                      const on = selectedLocationTypes[t] !== undefined;
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() =>
                            setSelectedLocationTypes((prev) => {
                              const next = { ...prev };
                              if (on) delete next[t];
                              else next[t] = "";
                              return next;
                            })
                          }
                          className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                            on
                              ? "bg-green-600 text-white border-green-600"
                              : "bg-white text-gray-700 border-gray-300 hover:border-green-400"
                          }`}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                  {Object.keys(selectedLocationTypes).length > 0 && (
                    <div className="space-y-1.5">
                      {Object.keys(selectedLocationTypes).map((t) => (
                        <div
                          key={t}
                          className="flex items-center gap-2 bg-white rounded-md border border-gray-200 px-2 py-1.5"
                        >
                          <Label
                            htmlFor={`loc-${t}`}
                            className="text-xs text-gray-900 flex-1 min-w-0 truncate"
                          >
                            {t}
                          </Label>
                          <Input
                            id={`loc-${t}`}
                            type="number"
                            min="0"
                            placeholder="0"
                            value={selectedLocationTypes[t]}
                            onChange={(e) =>
                              setSelectedLocationTypes((prev) => ({
                                ...prev,
                                [t]: e.target.value,
                              }))
                            }
                            className="h-8 w-20 text-right text-gray-900"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Format picker — single choice with unit input inside selected card */}
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
                                Total: {totalUnitsForFormat(f.key)}
                              </span>
                            </div>
                            <p className="text-xs text-green-700">
                              Enter how many units you want per {f.title} placement type within your selected radius. Leave blank for types you don't need.
                            </p>
                            <div className="space-y-1.5 pt-1">
                              {SUBTYPES[f.key].map((sub) => (
                                <div
                                  key={sub}
                                  className="flex items-center gap-2 bg-white/60 rounded-md border border-green-200/60 px-2 py-1.5"
                                >
                                  <Label
                                    htmlFor={`unit-${f.key}-${sub}`}
                                    className="text-xs text-green-900 flex-1 min-w-0 truncate"
                                  >
                                    {sub}
                                  </Label>
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
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Inventory in radius for selected format */}
              {chosenFormat && selectedFormatMeta && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Inventory in radius
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-green-50 border-green-200 text-green-700"
                    >
                      {loadingRows
                        ? "…"
                        : `${matches.length} match${matches.length === 1 ? "" : "es"}`}
                    </Badge>
                  </div>
                  <div className="max-h-[280px] overflow-y-auto -mx-1 px-1 space-y-2">
                    {loadingRows ? (
                      <div className="text-center text-gray-500 py-6 text-sm">Loading…</div>
                    ) : matches.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-gray-300 p-4 text-center bg-gray-50">
                        <SearchIcon className="w-6 h-6 text-gray-300 mx-auto mb-1.5" />
                        <p className="text-xs text-gray-600">
                          No approved {chosenFormat} inventory in this radius yet — adjust the
                          map or continue anyway.
                        </p>
                      </div>
                    ) : (
                      matches.map(({ row: r, distance }) => (
                        <div
                          key={r.id}
                          className="rounded-lg border border-gray-200 p-2.5 bg-white"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-xs text-gray-500 truncate">
                              {displayBusinessName(r)}
                            </div>
                            <div className="text-[11px] text-green-700 font-medium whitespace-nowrap">
                              {distanceLabel(distance)}
                            </div>
                          </div>
                          {r.location && (
                            <div className="flex items-center gap-1 text-xs text-gray-900 font-medium mt-0.5">
                              <MapPin className="w-3 h-3 shrink-0" />
                              <span className="truncate">{r.location}</span>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}


              <Button
                onClick={submitRegistry}
                disabled={!chosenFormat}
                className="w-full mt-4 bg-green-600 hover:bg-green-500 text-white"
              >
                Submit &amp; Continue to Campaign <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
              <p className="text-[11px] text-gray-500 text-center mt-2">
                Inventory shown is reference only — you can launch without selecting specific
                spaces.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
