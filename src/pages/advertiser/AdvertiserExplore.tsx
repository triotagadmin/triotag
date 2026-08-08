import { useEffect, useMemo, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent,
} from "@/components/ui/dialog";
import {
  Bell, Globe, Layers, ShieldCheck, BadgeCheck, Loader2, CheckCircle2, AlertTriangle,
  RefreshCw, Package, Clock, Calendar as CalendarIcon, Eye, MapPin,
  Image as ImageIcon, Monitor, Volume2, Truck, ChevronRight, ChevronLeft,
} from "lucide-react";
import { addMonths, format, startOfDay, isBefore } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { RadiusMapPlanner, CATEGORY_STYLES } from "@/components/advertiser/RadiusMapPlanner";
import { getActiveAreaNamesText, isWithinServiceArea } from "@/lib/serviceAreas";
import {
  calculateMediaPlanEstimate,
  MAX_RADIUS_METERS,
  ALL_VARIANTS,
  OOH_VARIANTS,
  DOOH_VARIANTS,
  AOOH_VARIANTS,
  MEDIA_TRUCK_VARIANTS,
  FormatVariant,
} from "@/lib/mediaPlanPricing";
import oohImage from "@/assets/ooh_formats_grid.png.asset.json";
import doohVideo from "@/assets/doohmediakit.mp4.asset.json";
import aoohVideo from "@/assets/supertruckmediakit.mp4.asset.json";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const DEFAULT_CENTER = { lat: 14.5995, lng: 120.9842 };
const MIN_LAUNCH_DATE = startOfDay(addMonths(new Date(), 1));
const TOTAL_STEPS = 3;

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

type AdSpaceRow = {
  id: string;
  title: string;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  media_types: string[] | null;
  publisher_profiles?: { business_name: string | null } | null;
};

interface PlaceMarker {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  category?: string;
  verified?: boolean;
}

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

// Maps a location type onto the marker colour buckets used by RadiusMapPlanner
const LOCATION_TYPE_MARKER_CATEGORY: Record<string, string> = {
  "Cafe": "cafe",
  "Co-working Space": "coworking",
  "Barber Shop": "beauty_salon",
  "Salon": "beauty_salon",
  "Supermarket": "store",
  "Convenience Store": "store",
  "Restaurant": "restaurant",
  "Fast Food": "restaurant",
  "Bar": "night_club",
  "Nightclub": "night_club",
  "Gym": "gym",
  "Pharmacy": "store",
  "Mall": "store",
  "Clothing Store": "store",
  "Department Store": "store",
};



export default function AdvertiserExplore() {
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [radiusMeters, setRadiusMeters] = useState(250);
  const [selectedLocationAddress, setSelectedLocationAddress] = useState("");
  const [withinServiceArea, setWithinServiceArea] = useState(
    isWithinServiceArea(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng),
  );

  // Wizard state
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [chosenFormat, setChosenFormat] = useState<"OOH" | "DOOH" | "AOOH" | "MEDIA_TRUCK" | null>(null);
  const [selections, setSelections] = useState<Record<string, number>>({});
  const [exampleModal, setExampleModal] = useState<{ label: string; image: string; caption: string } | null>(null);

  // Inventory detection
  const [inventory, setInventory] = useState<AdSpaceRow[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setInventoryLoading(true);
      const { data, error } = await supabase
        .from("ad_spaces")
        .select("id,title,location,latitude,longitude,media_types,publisher_profiles(business_name)")
        .eq("approval_status", "approved")
        .eq("availability_status", "available");
      if (cancelled) return;
      if (error) {
        console.error("[AdvertiserExplore] inventory fetch failed", error);
        setInventory([]);
      } else {
        setInventory((data as any) || []);
      }
      setInventoryLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  // ---- Google Places category browsing (ported from BrandAdvertiserInventory) ----
  const [placeResults, setPlaceResults] = useState<Record<string, PlaceMarker[]>>({});
  const [placeLoading, setPlaceLoading] = useState<Record<string, boolean>>({});
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});

  const placesLoading = Object.values(placeLoading).some(Boolean);

  // Reset cached results when the search area changes
  useEffect(() => {
    setPlaceResults({});
  }, [center.lat, center.lng, radiusMeters]);

  const fetchVerifiedPoints = async (): Promise<{ lat: number; lng: number }[]> => {
    const { data: spaces } = await supabase
      .from("ad_spaces")
      .select("id, latitude, longitude, contact_verified_at")
      .not("latitude", "is", null)
      .not("longitude", "is", null);
    const inRadius = (spaces || []).filter(
      (s: any) =>
        haversineMeters(center.lat, center.lng, Number(s.latitude), Number(s.longitude)) <= radiusMeters,
    );
    if (inRadius.length === 0) return [];
    const { data: subs } = await supabase
      .from("venue_subscriptions")
      .select("id, ad_space_id, subscription_status")
      .in("ad_space_id", inRadius.map((s: any) => s.id));
    const activeIds = new Set(
      (subs || []).filter((s: any) => s.subscription_status === "active").map((s: any) => s.ad_space_id),
    );
    return inRadius
      .filter((s: any) => s.contact_verified_at != null || activeIds.has(s.id))
      .map((s: any) => ({ lat: Number(s.latitude), lng: Number(s.longitude) }));
  };

  const loadPlacesForCategory = async (category: string) => {
    if (placeResults[category] || placeLoading[category]) return;
    setPlaceLoading((p) => ({ ...p, [category]: true }));
    try {
      const q = LOCATION_TYPE_QUERY[category] || {};
      const [{ data, error }, verifiedPoints] = await Promise.all([
        supabase.functions.invoke("discover-nearby-places", {
          body: { lat: center.lat, lng: center.lng, radiusMeters, ...q },
        }),
        fetchVerifiedPoints(),
      ]);
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const places: PlaceMarker[] = ((data as any)?.results ?? [])
        .filter((r: any) => typeof r.lat === "number" && typeof r.lng === "number")
        .map((r: any) => ({
          id: r.placeId,
          name: r.name,
          address: r.address || "",
          lat: r.lat,
          lng: r.lng,
          category,
          verified: verifiedPoints.some((v) => haversineMeters(v.lat, v.lng, r.lat, r.lng) <= 60),
        }));
      setPlaceResults((p) => ({ ...p, [category]: places }));
    } catch (err: any) {
      console.error("[AdvertiserExplore] places fetch failed", err);
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

  const toggleCategory = (t: string) => {
    const on = !!openCategories[t];
    setOpenCategories((prev) => ({ ...prev, [t]: !on }));
    if (!on) loadPlacesForCategory(t);
  };

  // Markers shown on the map = every place discovered for the opened categories
  const nearbyPlaces = useMemo(() => {
    const seen = new Set<string>();
    const out: { lat: number; lng: number; name: string; category: string; address?: string }[] = [];
    for (const [cat, list] of Object.entries(placeResults)) {
      if (!openCategories[cat]) continue;
      for (const p of list) {
        if (seen.has(p.id)) continue;
        seen.add(p.id);
        out.push({
          lat: p.lat,
          lng: p.lng,
          name: p.name,
          address: p.address,
          category: LOCATION_TYPE_MARKER_CATEGORY[cat] ?? "other",
        });
      }
    }
    return out;
  }, [placeResults, openCategories]);

  const nearbyInventory = useMemo(() => {
    const list = inventory
      .filter((r) => r.latitude != null && r.longitude != null)
      .map((r) => ({
        ...r,
        distance: haversineMeters(center.lat, center.lng, r.latitude!, r.longitude!),
      }))
      .filter((r) => r.distance <= radiusMeters)
      .sort((a, b) => a.distance - b.distance);
    return list;
  }, [inventory, center.lat, center.lng, radiusMeters]);

  const matchedInventory = useMemo(() => {
    if (!chosenFormat || chosenFormat === "MEDIA_TRUCK") return nearbyInventory;
    return nearbyInventory.filter((r) =>
      (r.media_types ?? []).includes(chosenFormat) || (r as any).media_type === chosenFormat,
    );
  }, [nearbyInventory, chosenFormat]);


  const updateQty = (variantId: string, qty: number) => {
    setSelections((prev) => ({ ...prev, [variantId]: Math.max(0, qty) }));
  };

  const selectionsArray = useMemo(
    () => Object.entries(selections).map(([variantId, quantity]) => ({ variantId, quantity })),
    [selections],
  );

  const estimate = useMemo(
    () => calculateMediaPlanEstimate(selectionsArray, radiusMeters),
    [selectionsArray, radiusMeters],
  );

  const activeSelections = selectionsArray.filter((s) => s.quantity > 0);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    campaignName: "",
    preferredStartDate: "",
    notes: "",
    email: "",
  });

  const canAdvanceStep1 =
    !!selectedLocationAddress && withinServiceArea && radiusMeters >= 250;

  async function handleSubmitRequest() {
    if (!selectedLocationAddress) {
      toast({ title: "Location required", description: "Search and select a location for your campaign before proceeding.", variant: "destructive" });
      return;
    }
    if (!withinServiceArea) {
      toast({ title: "Selected location is outside our service area", description: `TrioTag currently only operates in ${getActiveAreaNamesText()}. Please choose a location within our service area to continue.`, variant: "destructive" });
      return;
    }
    if (radiusMeters < 250) {
      toast({ title: "Minimum coverage required", description: "The minimum campaign radius is 250 m (5% coverage).", variant: "destructive" });
      return;
    }
    if (!form.campaignName.trim() || !form.preferredStartDate) {
      toast({ title: "Missing info", description: "Campaign name and start date are required.", variant: "destructive" });
      return;
    }
    const emailTrimmed = form.email.trim();
    if (!emailTrimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      toast({ title: "Email required", description: "Please enter a valid email so we can confirm your campaign.", variant: "destructive" });
      return;
    }
    if (isBefore(new Date(form.preferredStartDate), MIN_LAUNCH_DATE)) {
      toast({ title: "Start date too soon", description: `Campaigns require at least 1 month lead time. Earliest available date is ${format(MIN_LAUNCH_DATE, "MMMM d, yyyy")}.`, variant: "destructive" });
      return;
    }
    if (activeSelections.length === 0) {
      toast({ title: "Add at least one unit", description: "Select at least one ad format and quantity.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const enriched = activeSelections.map((s) => {
        const v = ALL_VARIANTS.find((vv) => vv.id === s.variantId);
        return { ...s, label: v?.label, price: v?.price, category: v?.category, specs: v?.specs };
      });
      const campaignType = [...new Set(enriched.map((s) => s.category).filter(Boolean))].join(", ");

      const { error } = await supabase
        .from("media_plan_requests" as any)
        .insert({
          advertiser_id: user?.id ?? null,
          campaign_name: form.campaignName,
          campaign_type: campaignType,
          center_lat: center.lat,
          center_lng: center.lng,
          radius_meters: radiusMeters,
          venue_count: nearbyPlaces.length,
          selections: enriched,
          estimated_price: estimate.totalEstimate,
          preferred_start_date: form.preferredStartDate,
          notes: form.notes || null,
          status: "paid",
          requester_email: emailTrimmed,
        });
      if (error) throw error;

      // Fire-and-forget admin email; failures do not block the submission.
      try {
        await supabase.functions.invoke("send-media-plan-request", {
          body: {
            campaignName: form.campaignName,
            campaignType,
            centerLat: center.lat,
            centerLng: center.lng,
            radiusMeters,
            selections: enriched,
            estimatedPrice: estimate.totalEstimate,
            preferredStartDate: form.preferredStartDate,
            notes: form.notes || null,
            requesterEmail: emailTrimmed,
          },
        });
      } catch (mailErr) {
        console.error("[AdvertiserExplore] admin email failed", mailErr);
      }

      setSubmitted(true);
    } catch (e: any) {
      toast({ title: "Submission failed", description: e?.message ?? "Try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  const tierColor = estimate.tier === "Domination"
    ? "bg-purple-100 text-purple-700 border-purple-300"
    : estimate.tier === "Growth"
    ? "bg-blue-100 text-blue-700 border-blue-300"
    : "bg-green-100 text-green-700 border-green-300";

  function renderVariantRow(variant: FormatVariant) {
    const qty = selections[variant.id] || 0;
    const selected = qty > 0;
    return (
      <div
        key={variant.id}
        className={`rounded-xl p-4 transition-colors border ${
          selected ? "border-green-500 bg-green-50/30" : "border-gray-100 hover:border-green-300"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="font-semibold text-gray-900 text-sm">{variant.label}</div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setExampleModal({ label: variant.label, image: variant.exampleImage, caption: variant.exampleCaption });
                }}
                className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full border border-green-400 text-green-600 bg-green-50 hover:bg-green-100"
              >
                <Eye className="w-3 h-3" />
                View Example
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-0.5">
              <span className="text-green-600 font-medium text-xs">₱{variant.price.toLocaleString()} / unit</span>
              {variant.billingType === "monthly" ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2 py-0.5">
                  <RefreshCw className="w-3 h-3" />
                  Monthly Subscription
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-gray-50 text-gray-600 border border-gray-200 rounded-full px-2 py-0.5">
                  <Package className="w-3 h-3" />
                  Per Campaign
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 min-w-[140px]">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={qty === 0 ? "" : qty}
              placeholder="0"
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, "");
                const val = raw === "" ? 0 : Math.min(9999, parseInt(raw, 10));
                updateQty(variant.id, val);
              }}
              className="w-20 h-8 text-right text-sm font-medium text-gray-800 border border-gray-300 rounded-md px-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
            <span className="text-xs text-gray-500 font-medium">units</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {variant.airTime && (
            <span className="text-[11px] bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 text-amber-700 inline-flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <strong className="text-amber-800">Air Time:</strong> {variant.airTime}
            </span>
          )}
          {Object.entries(variant.specs).map(([key, val]) => (
            <span key={key} className="text-[11px] bg-gray-50 border border-gray-200 rounded-full px-2.5 py-1 text-gray-600">
              <strong className="text-gray-800">{key}:</strong> {val}
            </span>
          ))}
        </div>
      </div>
    );
  }

  const formatCategories = [
    { id: "OOH" as const, label: "OOH — Print", icon: <ImageIcon className="w-5 h-5" />, color: "border-purple-300 hover:border-purple-500 hover:bg-purple-50", badge: "bg-purple-100 text-purple-700", desc: "Stickers, table tents, posters, tarpaulins — physical print placed inside venues" },
    { id: "DOOH" as const, label: "DOOH — Digital Screen", icon: <Monitor className="w-5 h-5" />, color: "border-cyan-300 hover:border-cyan-500 hover:bg-cyan-50", badge: "bg-cyan-100 text-cyan-700", desc: "Static or video ads on digital screens inside gyms, salons, clinics, and retail venues" },
    { id: "AOOH" as const, label: "AOOH — In-Store Audio", icon: <Volume2 className="w-5 h-5" />, color: "border-green-300 hover:border-green-500 hover:bg-green-50", badge: "bg-green-100 text-green-700", desc: "Audio spots played through venue speaker systems at point of purchase" },
    { id: "MEDIA_TRUCK" as const, label: "Media Truck", icon: <Truck className="w-5 h-5" />, color: "border-amber-300 hover:border-amber-500 hover:bg-amber-50", badge: "bg-amber-100 text-amber-700", desc: "Mobile LED truck fleet deployed on planned retail and commuter routes" },
  ];

  const stepLabels = ["Location & Coverage", "Ad Format & Quantity", "Campaign Details"];

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <Navigation />
      <div className="flex">
        <main className="flex-1 min-w-0">
          <header className="px-6 lg:px-8 pt-6 pb-4 border-b border-gray-100 bg-white">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-[#111827]">Request a Campaign</h1>
                <p className="text-gray-500 mt-1 text-sm">
                  Pick your coverage area, choose your ad formats, and submit your campaign request.
                </p>
              </div>
              <button className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50">
                <Bell className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </header>

          <div className="px-6 lg:px-8 pt-5">
            {/* Step indicator */}
            <div className="max-w-4xl mx-auto mb-6">
              <div className="text-xs text-gray-500">Step {wizardStep} of {TOTAL_STEPS} — {stepLabels[wizardStep - 1]}</div>
              <div className="flex gap-1 mt-2">
                {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                  <div key={i} className={`h-1.5 flex-1 rounded ${i < wizardStep ? "bg-green-500" : "bg-gray-200"}`} />
                ))}
              </div>
            </div>

            <div className="max-w-4xl mx-auto">
              {/* STEP 1 */}
              {wizardStep === 1 && (
                <div className="space-y-5">
                  <RadiusMapPlanner
                    center={center}
                    radiusMeters={radiusMeters}
                    onCenterChange={setCenter}
                    onRadiusChange={setRadiusMeters}
                    onServiceAreaChange={setWithinServiceArea}
                    onLocationSet={setSelectedLocationAddress}
                    markers={nearbyPlaces}
                    markersLoading={placesLoading}
                  />


                  {/* Nearby locations discovered via Places */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-5">
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                      <div>
                        <h3 className="text-base font-bold text-gray-900">Retail Media Locations in This Area</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {placesLoading
                            ? "Finding nearby locations…"
                            : `${nearbyPlaces.length} location${nearbyPlaces.length === 1 ? "" : "s"} found within ${(radiusMeters / 1000).toFixed(radiusMeters % 1000 === 0 ? 0 : 2)} km`}
                        </p>
                      </div>
                      {placesLoading && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
                    </div>

                    {!placesLoading && nearbyPlaces.length === 0 && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-600">
                        No nearby locations found — try a larger radius.
                      </div>
                    )}

                    {nearbyPlaces.length > 0 && (
                      <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                        {nearbyPlaces.map((p, i) => {
                          const s = CATEGORY_STYLES[p.category] ?? CATEGORY_STYLES.other;
                          return (
                            <div
                              key={`${p.name}-${i}`}
                              className="flex items-start justify-between gap-3 border border-gray-100 hover:border-green-300 rounded-lg px-3 py-2.5"
                            >
                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-gray-900 truncate">{p.name}</div>
                                {p.address && (
                                  <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-1">
                                    <MapPin className="w-3 h-3 shrink-0" />
                                    <span className="truncate">{p.address}</span>
                                  </div>
                                )}
                              </div>
                              <span className="inline-flex items-center gap-1.5 text-xs text-gray-700 shrink-0">
                                <span
                                  className="w-2.5 h-2.5 rounded-full border border-white shadow"
                                  style={{ background: s.color }}
                                />
                                {s.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {!canAdvanceStep1 && (
                    <div className="flex items-start gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>
                        {!selectedLocationAddress
                          ? "Search and select a campaign location to continue."
                          : !withinServiceArea
                          ? `This location is outside our service area. TrioTag currently only operates in ${getActiveAreaNamesText()}.`
                          : "Minimum campaign radius is 250 m (5% coverage)."}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button
                      onClick={() => setWizardStep(2)}
                      disabled={!canAdvanceStep1}
                      className="bg-green-600 hover:bg-green-500 text-white"
                    >
                      Continue <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP 2 */}
              {wizardStep === 2 && (
                <div className="space-y-5">
                  <div id="choose-ad-formats" className="bg-white border border-gray-200 rounded-2xl p-6">
                    <h3 className="text-base font-bold text-gray-900 mb-1">Choose Your Ad Format & Quantity</h3>
                    <p className="text-xs text-gray-500 mb-4">Pick a format channel, then set how many units you need.</p>

                    {!chosenFormat && (
                      <div className="space-y-3">
                        <div className="font-semibold text-gray-900 mb-1">Which format do you want to run?</div>
                        <p className="text-xs text-gray-500 mb-4">You can only book one format type per campaign. Choose the channel that best fits your goals.</p>
                        {formatCategories.map((fmt) => (
                          <button
                            key={fmt.id}
                            onClick={() => { setChosenFormat(fmt.id); setSelections({}); }}
                            className={`w-full text-left border-2 rounded-xl p-4 transition-all flex items-start gap-4 ${fmt.color}`}
                          >
                            <div className={`p-2 rounded-lg ${fmt.badge} shrink-0`}>{fmt.icon}</div>
                            <div>
                              <div className="font-semibold text-gray-900 text-sm">{fmt.label}</div>
                              <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">{fmt.desc}</div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400 ml-auto self-center shrink-0" />
                          </button>
                        ))}
                      </div>
                    )}

                    {chosenFormat && (
                      <div>
                        <div className="flex items-center gap-3 mb-4">
                          <button
                            onClick={() => { setChosenFormat(null); setSelections({}); }}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <Badge className={
                            chosenFormat === "OOH" ? "bg-purple-100 text-purple-700" :
                            chosenFormat === "DOOH" ? "bg-cyan-100 text-cyan-700" :
                            chosenFormat === "AOOH" ? "bg-green-100 text-green-700" :
                            "bg-amber-100 text-amber-700"
                          }>
                            {chosenFormat === "MEDIA_TRUCK" ? "Media Truck" : chosenFormat}
                          </Badge>
                          <span className="text-sm text-gray-600 font-medium">Select your units</span>
                        </div>

                        <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                          {(chosenFormat === "OOH" ? OOH_VARIANTS :
                            chosenFormat === "DOOH" ? DOOH_VARIANTS :
                            chosenFormat === "AOOH" ? AOOH_VARIANTS :
                            MEDIA_TRUCK_VARIANTS
                          ).map(renderVariantRow)}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Running estimate */}
                  {activeSelections.length > 0 && (
                    <div className="bg-green-50 border-2 border-green-500 rounded-2xl p-5">
                      <div className="flex items-center justify-between">
                        <div className="text-[10px] font-bold text-green-700 uppercase tracking-wider">Estimated Ad Campaign Fee</div>
                        <Badge className={`${tierColor} border`}>{estimate.tier}</Badge>
                      </div>
                      <div className="text-3xl font-bold text-gray-900 mt-1">
                        ₱{estimate.totalEstimate.toLocaleString()}
                      </div>
                      <div className="mt-3 space-y-1.5 text-sm">
                        {activeSelections.map((s) => {
                          const v = ALL_VARIANTS.find((vv) => vv.id === s.variantId)!;
                          return (
                            <div key={s.variantId} className="flex justify-between text-gray-700">
                              <span className="truncate pr-2">{v.label} × {s.quantity}</span>
                              <span className="font-medium shrink-0">₱{(v.price * s.quantity).toLocaleString()}</span>
                            </div>
                          );
                        })}
                        <div className="flex justify-between text-gray-700 pt-1.5 border-t border-green-200">
                          <span>Coverage Radius ({estimate.radiusPercent}% of {MAX_RADIUS_METERS / 1000}km)</span>
                          <span className="font-medium">{estimate.radiusKm}km</span>
                        </div>

                      </div>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setWizardStep(1)}>
                      <ChevronLeft className="w-4 h-4 mr-1" /> Back
                    </Button>
                    <Button
                      onClick={() => setWizardStep(3)}
                      disabled={activeSelections.length === 0}
                      className="bg-green-600 hover:bg-green-500 text-white"
                    >
                      Continue <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP 3 */}
              {wizardStep === 3 && !submitted && (
                <div className="space-y-5">
                  <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
                    <div>
                      <h3 className="text-base font-bold text-gray-900">Campaign Details</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Tell us about your campaign and we'll take it from there.</p>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-700">Campaign Name *</label>
                      <Input
                        value={form.campaignName}
                        onChange={(e) => setForm({ ...form, campaignName: e.target.value })}
                        placeholder="Summer brand activation"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-700">Preferred Start Date *</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={`w-full justify-start text-left font-normal ${!form.preferredStartDate ? "text-muted-foreground" : ""}`}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {form.preferredStartDate
                              ? format(new Date(form.preferredStartDate), "PPP")
                              : "Pick your campaign start date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                          <Calendar
                            mode="single"
                            selected={form.preferredStartDate ? new Date(form.preferredStartDate) : undefined}
                            onSelect={(date) => {
                              if (date) setForm({ ...form, preferredStartDate: format(date, "yyyy-MM-dd") });
                            }}
                            disabled={(date) => isBefore(date, MIN_LAUNCH_DATE)}
                            defaultMonth={MIN_LAUNCH_DATE}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <p className="text-[11px] text-gray-500 mt-1.5 inline-flex items-start gap-1">
                        <Clock className="w-3 h-3 mt-0.5 shrink-0" />
                        <span>Earliest available start date: <strong className="text-gray-700">{format(MIN_LAUNCH_DATE, "MMMM d, yyyy")}</strong> — TrioTag requires 1 week or up to 1 month lead time to prepare your campaign.</span>
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-700">Email *</label>
                      <Input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="you@company.com"
                      />
                      <p className="text-[11px] text-gray-500 mt-1">We'll use this email to confirm your campaign.</p>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-700">Notes (optional)</label>
                      <Input
                        value={form.notes}
                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                        placeholder="Any specific goals or constraints..."
                      />
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
                    <div className="text-[10px] font-bold text-green-700 uppercase tracking-wider mb-2">Request Summary</div>
                    <div className="space-y-2 text-sm">
                      {activeSelections.map((s) => {
                        const v = ALL_VARIANTS.find((vv) => vv.id === s.variantId)!;
                        return (
                          <div key={s.variantId} className="flex justify-between text-gray-700">
                            <span className="truncate pr-2">{v.label} × {s.quantity}</span>
                            <span className="font-medium shrink-0">₱{(v.price * s.quantity).toLocaleString()}</span>
                          </div>
                        );
                      })}
                      <div className="flex justify-between text-gray-700 pt-2 border-t border-green-200">
                        <span>Coverage radius</span>
                        <span className="font-medium">{estimate.radiusKm}km ({estimate.radiusPercent}%)</span>
                      </div>
                      <div className="flex justify-between items-center pt-1">
                        <span className="font-bold text-gray-900">Estimated Total</span>
                        <span className="font-bold text-lg text-green-700">₱{estimate.totalEstimate.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setWizardStep(2)} disabled={submitting}>
                      <ChevronLeft className="w-4 h-4 mr-1" /> Back
                    </Button>
                    <Button
                      onClick={handleSubmitRequest}
                      disabled={submitting}
                      className="bg-green-600 hover:bg-green-500 text-white"
                    >
                      {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting…</> : "Submit Request"}
                    </Button>
                  </div>
                </div>
              )}

              {wizardStep === 3 && submitted && (
                <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center max-w-xl mx-auto">
                  <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-7 h-7 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Request submitted!</h3>
                  <p className="text-sm text-gray-600 mt-2 max-w-sm mx-auto">
                    Thanks — our team will review your request and reach out within 1 business day to confirm details and next steps.
                  </p>
                  <Button
                    className="mt-5 bg-green-600 hover:bg-green-500 text-white"
                    onClick={() => {
                      setSubmitted(false);
                      setWizardStep(1);
                      setChosenFormat(null);
                      setSelections({});
                      setForm({ campaignName: "", preferredStartDate: "", notes: "", email: "" });
                    }}
                  >
                    Start a New Request
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Trust bar */}
          <section className="bg-green-50 border-t border-green-100 px-6 lg:px-8 py-6 mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { Icon: Globe, t: "Nationwide Coverage", d: "Plan campaigns anywhere our partners operate" },
                { Icon: Layers, t: "Multi-Format Inventory", d: "OOH, DOOH, AOOH, and Media Truck placements" },
                { Icon: BadgeCheck, t: "Verified Venues", d: "Listings reviewed before activation" },
                { Icon: ShieldCheck, t: "Brand-Safe Placement", d: "Locations pre-vetted for quality" },
              ].map((b) => (
                <div key={b.t} className="flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white border border-green-100 flex items-center justify-center shrink-0">
                    <b.Icon className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-sm">{b.t}</div>
                    <div className="text-xs text-gray-600 mt-0.5">{b.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Customize your campaigns */}
          <section className="px-6 lg:px-8 py-12">
            <div className="max-w-6xl mx-auto text-center mb-8">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">Customize your campaigns</h2>
              <p className="text-gray-600 mt-2">Explore our OOH, DOOH, AOOH, and Media Truck advertising formats.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {[
                { title: "OOH", desc: "Out-of-Home print placements across retail and high-traffic locations.", media: oohImage.url, isVideo: false },
                { title: "DOOH", desc: "Digital Out-of-Home screens with dynamic, scheduled creative.", media: doohVideo.url, isVideo: true },
                { title: "AOOH", desc: "Ambient Out-of-Home reaching audiences through unique installations.", media: aoohVideo.url, isVideo: true },
              ].map((c) => (
                <div
                  key={c.title}
                  onClick={() => {
                    document.getElementById("choose-ad-formats")?.scrollIntoView({ behavior: "smooth", block: "start" });
                    setWizardStep(2);
                    setChosenFormat(null);
                    setSelections({});
                  }}
                  className="rounded-2xl overflow-hidden border border-green-100 bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="aspect-video bg-black">
                    {c.isVideo ? (
                      <video src={c.media} autoPlay muted loop playsInline className="w-full h-full object-cover" />
                    ) : (
                      <img src={c.media} alt={`${c.title} format examples`} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{c.title}</h3>
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Available</Badge>
                    </div>
                    <p className="text-sm text-gray-600">{c.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>

      {/* Example Image Modal */}
      <Dialog open={!!exampleModal} onOpenChange={(open) => { if (!open) setExampleModal(null); }}>
        <DialogContent className="max-w-lg p-0 overflow-hidden">
          {exampleModal && (
            <>
              <div className="relative">
                <img
                  src={exampleModal.image}
                  alt={exampleModal.label}
                  className="w-full object-cover h-64"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80";
                  }}
                />
                <div className="absolute top-3 left-3">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-white/90 text-gray-900 border border-gray-200 shadow-sm">
                    {exampleModal.label}
                  </span>
                </div>
              </div>
              <div className="p-5 space-y-3">
                <h3 className="font-semibold text-gray-900 text-base">{exampleModal.label}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{exampleModal.caption}</p>
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className="text-[11px] text-gray-500">Example placement — actual results may vary by venue</span>
                  <Button size="sm" variant="outline" onClick={() => setExampleModal(null)}>Close</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
