import { useEffect, useMemo, useRef, useState } from "react";
import { AdvertiserSidebar } from "@/components/advertiser/AdvertiserSidebar";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Bell, Globe, Layers, ShieldCheck, BadgeCheck, Loader2, CheckCircle2,
} from "lucide-react";
import {
  fetchApprovedSpaces, type ApprovedAdSpaceLite,
} from "@/lib/inventoryAggregation";
import { CampaignWizard } from "@/components/advertiser/CampaignWizard";
import { RadiusMapPlanner } from "@/components/advertiser/RadiusMapPlanner";
import {
  searchPOIsInRadius, haversineMeters, POI,
  POI_CATEGORY_COLORS, POI_CATEGORY_EMOJI,
} from "@/lib/poiSearch";
import { calculateMediaPlanEstimate, type CampaignType } from "@/lib/mediaPlanPricing";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";


const DEFAULT_CENTER = { lat: 14.5995, lng: 120.9842 };

export default function AdvertiserExplore() {
  const navigate = useNavigate();

  // ------- Radius planner state -------
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [radiusMeters, setRadiusMeters] = useState(1000);
  const [campaignType, setCampaignType] = useState<CampaignType>("OOH");
  const [pois, setPois] = useState<POI[]>([]);
  const [poiLoading, setPoiLoading] = useState(false);
  const [poiError, setPoiError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const reqIdRef = useRef(0);

  // Approved ad_spaces in radius
  const [allSpaces, setAllSpaces] = useState<ApprovedAdSpaceLite[] | null>(null);
  useEffect(() => { fetchApprovedSpaces().then(setAllSpaces); }, []);

  const spacesInRadius = useMemo(() => {
    if (!allSpaces) return [];
    return allSpaces.filter((s: any) => {
      if (s.latitude == null || s.longitude == null) return false;
      return haversineMeters(center.lat, center.lng, s.latitude, s.longitude) <= radiusMeters;
    });
  }, [allSpaces, center.lat, center.lng, radiusMeters]);

  // Debounced Overpass call
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setPoiLoading(true);
    setPoiError(null);
    const myReq = ++reqIdRef.current;
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchPOIsInRadius(center.lat, center.lng, radiusMeters);
        if (myReq !== reqIdRef.current) return;
        setPois(results);
      } catch (e: any) {
        if (myReq !== reqIdRef.current) return;
        setPoiError("Couldn't reach venue database. Try again in a moment.");
        setPois([]);
      } finally {
        if (myReq === reqIdRef.current) setPoiLoading(false);
      }
    }, 800);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [center.lat, center.lng, radiusMeters]);

  const totalVenueCount = pois.length + spacesInRadius.length;
  const estimate = useMemo(
    () => calculateMediaPlanEstimate(totalVenueCount, radiusMeters, campaignType),
    [totalVenueCount, radiusMeters, campaignType],
  );

  const breakdown = useMemo(() => {
    const map: Record<string, number> = {};
    pois.forEach((p) => { map[p.category] = (map[p.category] || 0) + 1; });
    if (spacesInRadius.length) map["TrioTag Listed"] = spacesInRadius.length;
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [pois, spacesInRadius]);

  // ------- Request dialog -------
  const [requestOpen, setRequestOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    campaignName: "",
    preferredStartDate: "",
    budgetConfirmation: "",
    notes: "",
  });

  useEffect(() => {
    if (requestOpen) {
      setForm((f) => ({ ...f, budgetConfirmation: String(estimate.totalEstimate) }));
    }
  }, [requestOpen, estimate.totalEstimate]);

  async function handleSubmitRequest() {
    if (!form.campaignName.trim() || !form.preferredStartDate) {
      toast({ title: "Missing info", description: "Campaign name and start date are required.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("media_plan_requests" as any).insert({
        advertiser_id: user?.id ?? null,
        campaign_name: form.campaignName,
        campaign_type: campaignType,
        center_lat: center.lat,
        center_lng: center.lng,
        radius_meters: radiusMeters,
        venue_count: totalVenueCount,
        estimated_price: estimate.totalEstimate,
        preferred_start_date: form.preferredStartDate,
        budget_confirmation: form.budgetConfirmation ? Number(form.budgetConfirmation) : null,
        notes: form.notes || null,
      });
      if (error) throw error;

      // Fire-and-forget notification email
      supabase.functions.invoke("notify-media-plan-request", {
        body: {
          campaignName: form.campaignName,
          campaignType,
          centerLat: center.lat,
          centerLng: center.lng,
          radiusMeters,
          venueCount: totalVenueCount,
          estimatedPrice: estimate.totalEstimate,
          preferredStartDate: form.preferredStartDate,
          budgetConfirmation: form.budgetConfirmation,
          notes: form.notes,
          requesterEmail: user?.email,
        },
      }).catch(() => {});

      setSubmitted(true);
    } catch (e: any) {
      toast({ title: "Submission failed", description: e?.message ?? "Try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  function saveForLater() {
    const plan = {
      campaignType, center, radiusMeters,
      venueCount: totalVenueCount, estimate, savedAt: new Date().toISOString(),
    };
    const existing = JSON.parse(localStorage.getItem("saved_media_plans") || "[]");
    existing.unshift(plan);
    localStorage.setItem("saved_media_plans", JSON.stringify(existing.slice(0, 10)));
    toast({ title: "Saved", description: "Media plan saved locally on this device." });
  }

  const [wizardOpen, setWizardOpen] = useState(false);



  const tierColor = estimate.tier === "Domination"
    ? "bg-purple-100 text-purple-700 border-purple-300"
    : estimate.tier === "Growth"
    ? "bg-blue-100 text-blue-700 border-blue-300"
    : "bg-green-100 text-green-700 border-green-300";

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <Navigation />
      <div className="flex">
        <AdvertiserSidebar />

        <main className="flex-1 min-w-0">
          <header className="px-6 lg:px-8 pt-6 pb-4 border-b border-gray-100 bg-white">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-[#111827]">Map Your Campaign Area</h1>
                <p className="text-gray-500 mt-1 text-sm">
                  Drop a pin, set your radius, and get an instant media plan estimate for every retail venue in the area.
                </p>
              </div>
              <button className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50">
                <Bell className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </header>

          <div className="px-6 lg:px-8 pt-5">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Map (60%) */}
              <div className="lg:col-span-3 space-y-4">
                <RadiusMapPlanner
                  center={center}
                  radiusMeters={radiusMeters}
                  pois={pois}
                  onCenterChange={setCenter}
                  onRadiusChange={setRadiusMeters}
                />

                {/* Category legend */}
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Category Legend</div>
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                    {Object.entries(POI_CATEGORY_COLORS).map(([cat, color]) => (
                      <div key={cat} className="flex items-center gap-1.5 text-xs text-gray-700">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                        {cat}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Results panel (40%) */}
              <div className="lg:col-span-2">
                <div className="bg-white border border-gray-200 rounded-2xl p-6 lg:sticky lg:top-6 space-y-5">
                  {/* Campaign type */}
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Campaign Type</div>
                    <div className="grid grid-cols-3 gap-2">
                      {(["OOH", "DOOH", "AOOH"] as CampaignType[]).map((t) => (
                        <button
                          key={t}
                          onClick={() => setCampaignType(t)}
                          className={`h-10 rounded-lg border text-sm font-semibold transition ${
                            campaignType === t
                              ? "border-green-500 bg-green-50 text-green-700"
                              : "border-gray-200 text-gray-700 hover:border-green-300"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Venues found */}
                  <div>
                    <div className="flex items-baseline justify-between">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Venues Found</div>
                      {poiLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />}
                    </div>
                    <div className="text-4xl font-bold text-gray-900 mt-1">{totalVenueCount}</div>
                    {poiError && <div className="text-xs text-red-600 mt-1">{poiError}</div>}

                    {poiLoading && pois.length === 0 ? (
                      <div className="mt-3 space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-5 w-40" />
                        <div className="text-xs text-gray-500">Scanning the area...</div>
                      </div>
                    ) : totalVenueCount === 0 ? (
                      <div className="mt-3 text-sm text-gray-500">
                        No venues found. Try a larger radius or different location.
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {breakdown.map(([cat, n]) => (
                            <Badge
                              key={cat}
                              variant="outline"
                              className="text-xs"
                              style={{ borderColor: POI_CATEGORY_COLORS[cat] || "#16a34a" }}
                            >
                              {POI_CATEGORY_EMOJI[cat] || "📍"} {cat} ({n})
                            </Badge>
                          ))}
                        </div>

                        <div className="mt-3 border border-gray-100 rounded-lg overflow-y-auto" style={{ maxHeight: 240 }}>
                          {spacesInRadius.map((s: any) => {
                            const d = haversineMeters(center.lat, center.lng, s.latitude, s.longitude);
                            return (
                              <div key={`s-${s.id}`} className="flex items-center justify-between px-3 py-2 border-b border-gray-50 text-xs">
                                <div className="min-w-0">
                                  <div className="font-semibold text-gray-900 truncate">{s.title}</div>
                                  <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px] mt-0.5">TrioTag Listed</Badge>
                                </div>
                                <div className="text-gray-400 text-[10px] whitespace-nowrap pl-2">{Math.round(d)}m</div>
                              </div>
                            );
                          })}
                          {pois.map((p) => {
                            const d = haversineMeters(center.lat, center.lng, p.lat, p.lng);
                            return (
                              <div key={`p-${p.id}`} className="flex items-center justify-between px-3 py-2 border-b border-gray-50 last:border-0 text-xs">
                                <div className="min-w-0">
                                  <div className="font-semibold text-gray-900 truncate">{p.name}</div>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <span className="w-2 h-2 rounded-full" style={{ background: POI_CATEGORY_COLORS[p.category] || "#6b7280" }} />
                                    <span className="text-gray-500">{p.category}</span>
                                  </div>
                                </div>
                                <div className="text-gray-400 text-[10px] whitespace-nowrap pl-2">{Math.round(d)}m</div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Estimate */}
                  <div className="bg-green-50 border-2 border-green-500 rounded-2xl p-5">
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] font-bold text-green-700 uppercase tracking-wider">Estimated Media Plan</div>
                      <Badge className={`${tierColor} border`}>{estimate.tier}</Badge>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mt-1">
                      ₱{estimate.totalEstimate.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      Coverage: {estimate.radiusKm}km radius · {totalVenueCount} venues · {campaignType}
                    </div>
                    <div className="text-[10px] text-gray-500 mt-2 italic">
                      *Planning estimate. Final pricing confirmed after campaign request. Service begins after payment.
                    </div>

                    <div className="mt-4 space-y-2">
                      <Button
                        onClick={() => { setSubmitted(false); setRequestOpen(true); }}
                        disabled={totalVenueCount === 0}
                        className="w-full bg-green-600 hover:bg-green-500 text-white h-11 text-base font-semibold"
                      >
                        Request This Media Plan
                      </Button>
                      <Button
                        variant="outline"
                        onClick={saveForLater}
                        className="w-full border-green-300 text-green-700 hover:bg-green-50"
                      >
                        Save for Later
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>


          {/* Trust bar */}
          <section className="bg-green-50 border-t border-green-100 px-6 lg:px-8 py-6 mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { Icon: Globe, t: "Nationwide Coverage", d: "Plan campaigns anywhere our partners operate" },
                { Icon: Layers, t: "Multi-Format Inventory", d: "OOH, DOOH, and AOOH placements" },
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
        </main>
      </div>

      <CampaignWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />

      {/* Request dialog */}
      <Dialog open={requestOpen} onOpenChange={(o) => { setRequestOpen(o); if (!o) setSubmitted(false); }}>
        <DialogContent className="max-w-lg">
          {submitted ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Request submitted!</h3>
              <p className="text-sm text-gray-600 mt-2 max-w-sm mx-auto">
                Your media plan request has been submitted. Our team will confirm final pricing and reach out within 24 hours to activate your campaign.
              </p>
              <Button className="mt-5 bg-green-600 hover:bg-green-500 text-white" onClick={() => setRequestOpen(false)}>
                Done
              </Button>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Request Your Media Plan</DialogTitle>
                <DialogDescription>
                  We'll confirm final pricing and reach out within 24 hours.
                </DialogDescription>
              </DialogHeader>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm space-y-1">
                <div className="flex justify-between"><span className="text-gray-600">Type</span><span className="font-semibold">{campaignType}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Radius</span><span className="font-semibold">{estimate.radiusKm}km</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Venues</span><span className="font-semibold">{totalVenueCount}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Estimated</span><span className="font-bold text-green-700">₱{estimate.totalEstimate.toLocaleString()}</span></div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700">Campaign Name *</label>
                  <Input value={form.campaignName} onChange={(e) => setForm({ ...form, campaignName: e.target.value })} placeholder="Summer brand activation" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Preferred Start Date *</label>
                  <Input type="date" value={form.preferredStartDate} onChange={(e) => setForm({ ...form, preferredStartDate: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Budget Confirmation (₱)</label>
                  <Input type="number" value={form.budgetConfirmation} onChange={(e) => setForm({ ...form, budgetConfirmation: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Notes (optional)</label>
                  <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any specific goals or constraints..." />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setRequestOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmitRequest} disabled={submitting} className="bg-green-600 hover:bg-green-500 text-white">
                  {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : "Submit Request — We'll Confirm Pricing & Activate"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
