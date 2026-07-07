import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Image as ImageIcon,
  Monitor,
  Volume2,
  MapPin,
  ArrowRight,
  ArrowLeft,
  Building2,
  Search as SearchIcon,
} from "lucide-react";
import BrandAdvertiserTopBar from "@/components/brand-advertiser/BrandAdvertiserTopBar";
import { RadiusMapPlanner } from "@/components/advertiser/RadiusMapPlanner";
import { calculateMediaPlanEstimate } from "@/lib/mediaPlanPricing";

// NOTE: ad_spaces registered before the latitude/longitude migration will have
// null coordinates and won't appear in radius results — this is expected until
// those listings are backfilled with coordinates.

type MediaType = "OOH" | "DOOH" | "AOOH";

const DEFAULT_CENTER = { lat: 14.5995, lng: 120.9842 };

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
    desc: "Out-of-Home print placements across retail and high-traffic locations.",
    icon: ImageIcon,
    border: "border-purple-300",
    bg: "bg-purple-50",
    iconColor: "text-purple-600",
  },
  {
    key: "DOOH",
    title: "DOOH",
    desc: "Digital Out-of-Home screens with dynamic, scheduled creative.",
    icon: Monitor,
    border: "border-cyan-300",
    bg: "bg-cyan-50",
    iconColor: "text-cyan-600",
  },
  {
    key: "AOOH",
    title: "AOOH",
    desc: "Ambient Out-of-Home reaching audiences through unique installations.",
    icon: Volume2,
    border: "border-green-300",
    bg: "bg-green-50",
    iconColor: "text-green-600",
  },
];

// Haversine distance (meters) between two lat/lng points.
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

function priceLabel(row: AdSpaceRow): string {
  const p = row.pricing || {};
  const monthly = p.monthly ?? row.monthly_subscription_fee;
  if (monthly) return `₱${Number(monthly).toLocaleString()} / mo`;
  if (p.weekly) return `₱${Number(p.weekly).toLocaleString()} / wk`;
  if (p.daily) return `₱${Number(p.daily).toLocaleString()} / day`;
  if (p.cpm) return `₱${Number(p.cpm).toLocaleString()} CPM`;
  return "Contact for pricing";
}

function formatMaterialName(key: string): string {
  return key
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatsLabel(row: AdSpaceRow): string {
  const specs = row.specifications || {};
  const materials: string[] = specs.ad_unit_materials || [];
  const units: Record<string, number> | null = specs.units || null;

  const available = materials.length
    ? materials.map(formatMaterialName).join(", ")
    : row.media_type;

  if (!units || Object.keys(units).length === 0) {
    return available;
  }

  const unitParts = Object.entries(units)
    .filter(([, count]) => count > 0)
    .map(([fmt, count]) => `${fmt}: ${count}`);

  return unitParts.length ? `${available} · ${unitParts.join(", ")}` : available;
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

  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [chosenFormat, setChosenFormat] = useState<MediaType | null>(null);
  const [rows, setRows] = useState<AdSpaceRow[]>([]);
  const [loadingRows, setLoadingRows] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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

  // Fetch approved inventory matching the chosen media type. Radius/distance
  // filtering happens client-side via Haversine since public Postgres here has
  // no PostGIS extension enabled.
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
        // Include ad space if its media_type matches, OR if its
        // specifications.units include the chosen format with count > 0.
        const units = (r.specifications && r.specifications.units) || null;
        const unitCount = units ? Number(units[chosenFormat] || 0) : 0;
        return r.media_type === chosenFormat || unitCount > 0;
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

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const continueToCampaign = () => {
    navigate("/brand-advertiser/campaigns", {
      state: {
        openWizard: true,
        adSpaceIds: selectedIds,
        prefill: { format: chosenFormat, radiusMeters },
      },
    });
  };

  const displayBusinessName = (r: AdSpaceRow) =>
    r.publisher_profiles?.is_house_account
      ? "TrioTag"
      : r.publisher_profiles?.business_name || "Retail Partner";

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <BrandAdvertiserTopBar companyName={companyName} totalBudget={0} />
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Inventory</h1>
          <p className="text-sm text-gray-500 mt-1">
            Search real bookable OOH, DOOH, and AOOH inventory near your target area.
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
                <span className="font-semibold text-green-700">₱{estimate.radiusFee.toLocaleString()}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1.5">
                5% coverage starts at ₱200,000 · 100% coverage is ₱3,500,000
              </div>
            </div>
          </div>

          {/* RIGHT: Step-based panel */}
          <div className="lg:col-span-2">
            <Card className="p-5 bg-white border border-gray-200 sticky top-4">
              <div className="mb-4">
                <div className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                  Step {wizardStep} of 3
                </div>
                <h2 className="text-lg font-bold text-gray-900 mt-1">Find Inventory Near You</h2>
              </div>

              {/* STEP 1 — Format */}
              {wizardStep === 1 && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 mb-2">Which format do you want to run?</p>
                  {FORMATS.map((f) => {
                    const Icon = f.icon;
                    const active = chosenFormat === f.key;
                    return (
                      <button
                        key={f.key}
                        type="button"
                        onClick={() => {
                          setChosenFormat(f.key);
                          setSelectedIds([]);
                          setWizardStep(2);
                        }}
                        className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
                          active ? `${f.border} ${f.bg}` : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-lg ${f.bg} flex items-center justify-center shrink-0`}>
                            <Icon className={`w-5 h-5 ${f.iconColor}`} />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-gray-900">{f.title}</div>
                            <div className="text-xs text-gray-600 mt-0.5">{f.desc}</div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* STEP 2 — Matching inventory */}
              {wizardStep === 2 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      className="text-xs text-gray-500 hover:text-gray-800 inline-flex items-center gap-1"
                      onClick={() => setWizardStep(1)}
                    >
                      <ArrowLeft className="w-3 h-3" /> Change format
                    </button>
                    <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
                      {loadingRows ? "…" : `${matches.length} match${matches.length === 1 ? "" : "es"}`}
                    </Badge>
                  </div>

                  <div className="text-xs text-gray-500">
                    Showing approved <strong>{chosenFormat}</strong> inventory within your selected radius.
                  </div>

                  <div className="max-h-[520px] overflow-y-auto -mx-1 px-1 space-y-2">
                    {loadingRows ? (
                      <div className="text-center text-gray-500 py-8 text-sm">Loading…</div>
                    ) : matches.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center bg-gray-50">
                        <SearchIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm font-medium text-gray-700">
                          No approved {chosenFormat} inventory found in this area
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Selecting inventory is optional — you can launch a campaign with just your radius and {chosenFormat} format. Adjust the radius on the map to see more matches.
                        </p>
                      </div>
                    ) : (
                      matches.map(({ row: r, distance }) => {
                        const checked = selectedIds.includes(r.id);
                        return (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => toggleSelect(r.id)}
                            className={`w-full text-left rounded-xl border p-3 flex gap-3 transition-colors ${
                              checked ? "border-green-500 bg-green-50/40" : "border-gray-200 hover:border-gray-300 bg-white"
                            }`}
                          >
                            <Checkbox checked={checked} className="mt-0.5" />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <div className="text-xs text-gray-500 truncate">
                                  {displayBusinessName(r)}
                                </div>
                                <div className="text-[11px] text-green-700 font-medium whitespace-nowrap">
                                  {distanceLabel(distance)}
                                </div>
                              </div>
                              {r.location && (
                                <div className="flex items-center gap-1 text-xs text-gray-900 font-medium">
                                  <MapPin className="w-3 h-3 shrink-0" />
                                  <span className="truncate">{r.location}</span>
                                </div>
                              )}
                              <div className="text-xs text-gray-600 mt-0.5 truncate">
                                {formatsLabel(r)}
                              </div>
                              <div className="text-xs font-medium text-gray-800 mt-1">
                                {priceLabel(r)}
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>

                  <Button
                    onClick={() => setWizardStep(3)}
                    className="w-full bg-green-600 hover:bg-green-500 text-white"
                  >
                    {selectedIds.length === 0
                      ? `Continue without selecting inventory`
                      : `Continue with ${selectedIds.length} selected`}
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                  <p className="text-[11px] text-gray-500 text-center">
                    Selecting inventory is optional. Radius + {chosenFormat} format are all you need to launch.
                  </p>
                </div>
              )}

              {/* STEP 3 — Continue to campaign */}
              {wizardStep === 3 && (
                <div className="space-y-4">
                  <button
                    type="button"
                    className="text-xs text-gray-500 hover:text-gray-800 inline-flex items-center gap-1"
                    onClick={() => setWizardStep(2)}
                  >
                    <ArrowLeft className="w-3 h-3" /> Back
                  </button>
                  <div className="rounded-xl border border-green-200 bg-green-50/60 p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="w-4 h-4 text-green-700" />
                      <div className="text-sm font-semibold text-green-900">
                        {chosenFormat} campaign · {(radiusMeters / 1000).toFixed(radiusMeters < 10000 ? 2 : 1)} km radius
                      </div>
                    </div>
                    <p className="text-xs text-green-800">
                      {selectedIds.length > 0
                        ? `${selectedIds.length} ad space${selectedIds.length === 1 ? "" : "s"} will be attached as reference. You can adjust locations and units in the next step.`
                        : "No inventory attached — that's fine. You'll set your target location count and unit mix in the next step."}
                    </p>
                  </div>
                  <Button
                    onClick={continueToCampaign}
                    className="w-full bg-green-600 hover:bg-green-500 text-white"
                  >
                    Continue to campaign <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
